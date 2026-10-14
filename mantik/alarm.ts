// Alarm olarak çalan anımsatıcılar (iOS 26 AlarmKit; Pilot 14 Ekim).
//
// Her (anımsatıcı, saat) için telefonda haftalık tekrarlı bir alarm durur; telefon
// bunu Rites açılmadan da çalar. Ertelenen saat için o güne ait tek seferlik bir
// alarm eklenir. Alarm kimlikleri kararlıdır (aynı girdi → aynı UUID), böylece
// plan her uygulandığında yalnız eksikler eklenir, fazlalar kaldırılır.

import { dakika, gunuKapsarMi, type Animsatici, type AnimsaticiGunleri, type AnimsaticiGunu } from './animsatici';
import { gunEkle, type Gun } from './tarih';

/** Alarmda Ertele hep 5 dakika (ürün sahibi). */
export const ALARM_ERTELEME = 5;
/** Alarmdaki Ertele'ye basıldıktan bu kadar dakika sonra işlenen basış eskimiş sayılır. */
export const ERTELE_GECERLILIK_DK = 10;

export const ALARM_ACIKLAMASI =
  "Kilit ekranında alarm gibi çalar; sessiz modda ve Odak açıkken de duyulur. Durdur ya da Ertele (5 dk) Rites'ı açar.";

export interface PlanliAlarm {
  /** UUID (iOS böyle istiyor). */
  id: string;
  saat: string;
  /** ISO hafta günleri (1 = Pazartesi … 7 = Pazar); boşsa tek seferlik (bugün). */
  haftaGunleri: number[];
  baslik: string;
  animsaticiId: string;
  /** Anımsatıcının kendi saati (kayıt anahtarı). */
  kaynakSaat: string;
  /** Tek seferlik alarmın günü; tekrarlıda null. */
  gun: Gun | null;
}

// ---- Kararlı UUID -------------------------------------------------------------

function fnv1a(metin: string, tohum: number): number {
  let h = (0x811c9dc5 ^ tohum) >>> 0;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Metinden kararlı, UUID biçiminde (sürüm 5 görünümlü) kimlik. */
export function kararliUuid(metin: string): string {
  const hex = [0x1b873593, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f]
    .map((t) => fnv1a(metin, t).toString(16).padStart(8, '0'))
    .join('');
  const surumlu = `${hex.slice(0, 12)}5${hex.slice(13, 16)}${((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)}${hex.slice(17)}`;
  return `${surumlu.slice(0, 8)}-${surumlu.slice(8, 12)}-${surumlu.slice(12, 16)}-${surumlu.slice(16, 20)}-${surumlu.slice(20)}`;
}

export const tekrarliAlarmKimligi = (animsaticiId: string, saat: string) =>
  kararliUuid(`rites-alarm|${animsaticiId}|${saat}`);
export const ertelemeAlarmKimligi = (animsaticiId: string, gun: Gun, saat: string) =>
  kararliUuid(`rites-ertele|${animsaticiId}|${gun}|${saat}`);

// ---- Plan ---------------------------------------------------------------------

/** Rites gün seçimi → ISO hafta günleri. */
export function isoHaftaGunleri(gunler: AnimsaticiGunleri): number[] {
  if (gunler === 'haftaici') return [1, 2, 3, 4, 5];
  if (gunler === 'haftasonu') return [6, 7];
  return [1, 2, 3, 4, 5, 6, 7];
}

/**
 * Telefonda durması gereken alarmlar: alarmlı her anımsatıcının her saati için
 * tekrarlı bir alarm; bugün ertelenmiş ve durdurulmamış saatler için, ertelenen
 * saat henüz gelmediyse, tek seferlik bir alarm.
 */
export function alarmPlani(
  animsaticilar: readonly Animsatici[],
  bugunDurumlari: readonly AnimsaticiGunu[],
  bugunGun: Gun,
  simdi: string,
): PlanliAlarm[] {
  const plan: PlanliAlarm[] = [];
  for (const a of animsaticilar) {
    if (!a.alarm) continue;
    for (const saat of a.saatler) {
      plan.push({
        id: tekrarliAlarmKimligi(a.id, saat),
        saat,
        haftaGunleri: isoHaftaGunleri(a.gunler),
        baslik: a.ad,
        animsaticiId: a.id,
        kaynakSaat: saat,
        gun: null,
      });
      const d = bugunDurumlari.find((g) => g.animsaticiId === a.id && g.saat === saat);
      if (!d?.ertelenenSaat || d.durduruldu || !gunuKapsarMi(a.gunler, bugunGun)) continue;
      if (dakika(d.ertelenenSaat) <= dakika(simdi)) continue;
      plan.push({
        id: ertelemeAlarmKimligi(a.id, bugunGun, saat),
        saat: d.ertelenenSaat,
        haftaGunleri: [],
        baslik: a.ad,
        animsaticiId: a.id,
        kaynakSaat: saat,
        gun: bugunGun,
      });
    }
  }
  return plan;
}

export interface AlarmFarki {
  eklenecek: PlanliAlarm[];
  kaldirilacak: string[];
}

export interface TelefondakiAlarm {
  id: string;
  /** `alarmImzasi` ile aynı biçimde: saat, hafta günleri, başlık. */
  imza: string;
}

/** Alarmın telefondaki hâlini belirleyen her şey; biri değişirse alarm yeniden kurulur. */
export function alarmImzasi(saat: string, haftaGunleri: readonly number[], baslik: string): string {
  return `${saat}|${[...haftaGunleri].sort((a, b) => a - b).join(',')}|${baslik}`;
}

const planImzasi = (p: PlanliAlarm) => alarmImzasi(p.saat, p.haftaGunleri, p.baslik);

/**
 * Telefondaki alarmlarla plan arasındaki fark. Aynı kimlikli alarmın saati,
 * günleri ya da adı değiştiyse (yeniden ertelendi, düzenlendi) kaldırılıp
 * yeniden eklenir.
 */
export function alarmFarki(plan: readonly PlanliAlarm[], telefondakiler: readonly TelefondakiAlarm[]): AlarmFarki {
  const istenen = new Map(plan.map((p) => [p.id, planImzasi(p)]));
  const telefonda = new Map(telefondakiler.map((t) => [t.id, t.imza]));
  return {
    eklenecek: plan.filter((p) => telefonda.get(p.id) !== planImzasi(p)),
    kaldirilacak: telefondakiler.filter((t) => istenen.get(t.id) !== t.imza).map((t) => t.id),
  };
}

// ---- Alarmdaki düğmeler ------------------------------------------------------------

export interface AlarmEslesmesi {
  animsatici: Animsatici;
  /** Anımsatıcının kendi saati. */
  saat: string;
  gun: Gun;
}

/**
 * Alarm kimliğinden hangi anımsatma olduğu. `gun`: düğmeye basıldığı gün; tekrarlı
 * alarm o güne, tek seferlik alarm o güne ya da (gece yarısını geçtiyse) bir önceki
 * güne aittir.
 */
export function alarmiEslestir(alarmId: string, animsaticilar: readonly Animsatici[], gun: Gun): AlarmEslesmesi | null {
  const dun = gunEkle(gun, -1);
  for (const a of animsaticilar) {
    for (const saat of a.saatler) {
      if (tekrarliAlarmKimligi(a.id, saat) === alarmId) return { animsatici: a, saat, gun };
      if (ertelemeAlarmKimligi(a.id, gun, saat) === alarmId) return { animsatici: a, saat, gun };
      if (ertelemeAlarmKimligi(a.id, dun, saat) === alarmId) return { animsatici: a, saat, gun: dun };
    }
  }
  return null;
}

/** Ertele'ye basılış hâlâ geçerli mi (uygulama çok sonra açıldıysa ertelenmez). */
export function erteleGecerliMi(basisMs: number, simdiMs: number): boolean {
  return simdiMs - basisMs <= ERTELE_GECERLILIK_DK * 60_000;
}

/** "SS:dd" → { saat, dakika } */
export function saatParcalari(saat: string): { hour: number; minute: number } {
  const dk = dakika(saat);
  return { hour: Math.floor(dk / 60), minute: dk % 60 };
}
