// Anımsatıcılar (AN-1, AN-3, AN-4; `05` §7) ve yerel bildirim planı (`10` → Expo Go kararları).
//
// Anımsatıcı kart değildir: günde bir ya da birkaç kez çalan saatli uyarıdır.
// Yalnız bugünün durumu (durduruldu / ertelendi) tutulur; geçmiş günler tutulmaz.

import { gorunurMu } from './gorunurluk';
import type { HatirlatmaSecimi, Kart } from './kart';
import { gunEkle, haftaGunu, type Gun } from './tarih';

export type AnimsaticiGunleri = 'hergun' | 'haftaici' | 'haftasonu';

export interface Animsatici {
  id: string;
  ad: string;
  /** "SS:dd", sıralı. */
  saatler: string[];
  gunler: AnimsaticiGunleri;
  sesli: boolean;
  erteleDk: number;
  /** Alarm olarak çalar (iOS 26 AlarmKit); bildirim gönderilmez. */
  alarm: boolean;
}

/** Bugünkü bir saatin durumu (`animsatici_gun`). */
export interface AnimsaticiGunu {
  animsaticiId: string;
  /** Anımsatıcının kendi saati. */
  saat: string;
  durduruldu: boolean;
  ertelenenSaat: string | null;
}

export const ERTELEME_SECENEKLERI = [5, 10, 15] as const;
export const VARSAYILAN_ERTELEME = 10;
/** Durdurulmayan anımsatma, erteleme arayla en çok bu kadar kez daha çalar (`08` açık soru 1). */
export const YENIDEN_CALMA = 3;
/** Aynı anda planlı bildirim üst sınırı (`10`: iOS sınırı 64, pay bırakılır). */
export const BILDIRIM_SINIRI = 60;
/** Kaç günlük pencere planlanır (bugün dahil). */
export const PLAN_GUNU = 3;

export const GUN_SECENEKLERI: readonly [AnimsaticiGunleri, string][] = [
  ['hergun', 'Her gün'],
  ['haftaici', 'Hafta içi'],
  ['haftasonu', 'Hafta sonu'],
];

export const HAZIR_SAATLER = {
  ikiKez: ['09:00', '21:00'],
  ucKez: ['08:00', '14:00', '20:00'],
} as const;

export const ANIMSATICI_BILGI =
  "Günde bir ya da birkaç kez çalan uyarılar için. Randevu ya da tek seferlik iş için Ajandam'a kart ekle.";
export const ANIMSATICI_ACIKLAMA = 'Saatinde çalar. Durdurmazsan birkaç dakika arayla yeniden çalar.';
export const ANIMSATICI_GIZLILIK =
  'Anımsatıcıların yalnız bu telefonda durur, kimseyle paylaşılmaz. Geçmiş günler tutulmaz.';

// ---- Saat aritmetiği ---------------------------------------------------------

export function dakika(saat: string): number {
  const [s, d] = saat.split(':').map(Number);
  return (s ?? 0) * 60 + (d ?? 0);
}

export function saatMetni(dk: number): string {
  const d = ((dk % 1440) + 1440) % 1440;
  return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`;
}

export function saatGecerliMi(saat: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(saat);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

export function saatleriSirala(saatler: readonly string[]): string[] {
  return [...new Set(saatler)].sort();
}

// ---- Günler ve metinler ------------------------------------------------------

export function gunuKapsarMi(gunler: AnimsaticiGunleri, gun: Gun): boolean {
  const hg = haftaGunu(gun);
  if (gunler === 'haftaici') return hg <= 4;
  if (gunler === 'haftasonu') return hg >= 5;
  return true;
}

export function gunlerMetni(gunler: AnimsaticiGunleri): string {
  return GUN_SECENEKLERI.find(([k]) => k === gunler)?.[1] ?? 'Her gün';
}

/** "Her gün · Sesli · erteleme 10 dk" / "Her gün · Alarm · erteleme 5 dk" */
export function animsaticiMeta(a: Pick<Animsatici, 'gunler' | 'sesli' | 'erteleDk' | 'alarm'>): string {
  const tur = a.alarm ? 'Alarm' : a.sesli ? 'Sesli' : 'Sessiz';
  return `${gunlerMetni(a.gunler)} · ${tur} · erteleme ${a.erteleDk} dk`;
}

export function erteleMetni(dk: number): string {
  return `${dk} dk ertele`;
}

/** Kaydetmeden önce: ad ve en az bir saat (AN-1). */
export function formHatasi(ad: string, saatler: readonly string[]): string | null {
  if (ad.trim() === '') return 'Neyi anımsatalım? Bir ad yaz.';
  if (saatler.length === 0) return 'En az bir saat ekle.';
  return null;
}

// ---- Bugün (`05` §7) ---------------------------------------------------------

export type AnimsatmaDurumu = 'sirada' | 'ertelendi' | 'caliyor' | 'durduruldu' | 'gecti';

export const DURUM_METNI: Record<AnimsatmaDurumu, string> = {
  sirada: 'Sırada',
  ertelendi: 'Ertelendi',
  caliyor: 'Şimdi çalıyor',
  durduruldu: 'Durduruldu',
  gecti: 'Geçti',
};

export interface Animsatma {
  animsatici: Animsatici;
  /** Kendi saati (kayıt anahtarı). */
  saat: string;
  /** Ertelendiyse ertelenen saat, değilse kendi saati. */
  gosterilen: string;
  durum: AnimsatmaDurumu;
}

export function animsatmaDurumu(
  a: Pick<Animsatici, 'erteleDk'>,
  gosterilen: string,
  ertelendi: boolean,
  durduruldu: boolean,
  simdi: string,
): AnimsatmaDurumu {
  if (durduruldu) return 'durduruldu';
  if (dakika(gosterilen) > dakika(simdi)) return ertelendi ? 'ertelendi' : 'sirada';
  if (dakika(simdi) - dakika(gosterilen) <= YENIDEN_CALMA * a.erteleDk) return 'caliyor';
  return 'gecti';
}

/** Bugünün anımsatmaları, gösterilen saate göre sıralı. */
export function bugununAnimsatmalari(
  animsaticilar: readonly Animsatici[],
  gunDurumlari: readonly AnimsaticiGunu[],
  bugunGun: Gun,
  simdi: string,
): Animsatma[] {
  const sonuc: Animsatma[] = [];
  for (const a of animsaticilar) {
    if (!gunuKapsarMi(a.gunler, bugunGun)) continue;
    for (const saat of a.saatler) {
      const d = gunDurumlari.find((g) => g.animsaticiId === a.id && g.saat === saat);
      const gosterilen = d?.ertelenenSaat ?? saat;
      sonuc.push({
        animsatici: a,
        saat,
        gosterilen,
        durum: animsatmaDurumu(a, gosterilen, !!d?.ertelenenSaat, !!d?.durduruldu, simdi),
      });
    }
  }
  return sonuc.sort((x, y) => x.gosterilen.localeCompare(y.gosterilen) || x.animsatici.ad.localeCompare(y.animsatici.ad));
}

/** "Ertele": ertelenen saat = max(gösterilen, şimdi) + erteleme (gün içinde kalır). */
export function erteleSaati(gosterilen: string, simdi: string, erteleDk: number): string {
  return saatMetni(Math.min(1439, Math.max(dakika(gosterilen), dakika(simdi)) + erteleDk));
}

/** "(08:00 idi)" — ertelenmiş satırda kendi saati. */
export function idiMetni(m: Animsatma): string {
  return m.gosterilen !== m.saat ? `(${m.saat} idi)` : '';
}

export interface GirisOzeti {
  calan: Animsatma | null;
  siradaki: Animsatma | null;
  /** Sırada + ertelenmiş sayısı. */
  kalan: number;
}

export function girisOzeti(animsatmalar: readonly Animsatma[]): GirisOzeti {
  const bekleyen = animsatmalar.filter((m) => m.durum === 'sirada' || m.durum === 'ertelendi');
  return {
    calan: animsatmalar.find((m) => m.durum === 'caliyor') ?? null,
    siradaki: bekleyen[0] ?? null,
    kalan: bekleyen.length,
  };
}

/** "bugün 2 kez daha" / "bugün bitti" */
export function kalanMetni(kalan: number): string {
  return kalan > 0 ? `bugün ${kalan} kez daha` : 'bugün bitti';
}

// ---- Bildirim planı ----------------------------------------------------------

export type BildirimVerisi =
  | { tur: 'animsatici'; animsaticiId: string; gun: Gun; saat: string }
  | { tur: 'kart'; kartId: string; gun: Gun };

export interface PlanliBildirim {
  /** Kararlı kimlik: aynı bildirim yeniden planlanınca aynı kalır. */
  id: string;
  gun: Gun;
  /** Çalacağı saat "SS:dd" (`gun` içinde). */
  saat: string;
  baslik: string;
  govde: string;
  sesli: boolean;
  /** Durdur / Ertele düğmeleri için; kart hatırlatmasında yok. */
  erteleDk: number | null;
  veri: BildirimVerisi;
}

/** Gün sınırını aşan dakikayı (gece yarısından sonrası, öncesi) güne çevirir. */
function anaGoreKonum(gun: Gun, dk: number): { gun: Gun; saat: string } {
  const gunFark = Math.floor(dk / 1440);
  return { gun: gunEkle(gun, gunFark), saat: saatMetni(dk) };
}

export const HATIRLATMA_ONCE: Record<HatirlatmaSecimi, number> = { saatinde: 0, '15dk': 15, '1sa': 60 };
const HATIRLATMA_GOVDESI: Record<HatirlatmaSecimi, string> = {
  saatinde: 'Şimdi',
  '15dk': '15 dk sonra',
  '1sa': '1 saat sonra',
};

/** Kartın o günkü hatırlatmasının zamanı (önce çalan hatırlatma bir önceki güne düşebilir). */
export function hatirlatmaZamani(gun: Gun, saat: string, h: HatirlatmaSecimi): { gun: Gun; saat: string } {
  return anaGoreKonum(gun, dakika(saat) - HATIRLATMA_ONCE[h]);
}

export interface PlanGirdisi {
  animsaticilar: readonly Animsatici[];
  /** Yalnız bugünün durumları. */
  gunDurumlari: readonly AnimsaticiGunu[];
  kartlar: readonly Kart[];
  /** Bugün yapıldı işaretli kartlar (bugünkü hatırlatmaları çalmaz). */
  bugunYapilanlar: ReadonlySet<string>;
  bugunGun: Gun;
  /** Şu an "SS:dd"; bundan önceki bildirimler planlanmaz. */
  simdi: string;
  gunSayisi?: number;
  sinir?: number;
  /** Alarm olarak çalan anımsatıcılar ve kartlar (kimlik); bunlara bildirim planlanmaz. */
  alarmlaCalanlar?: ReadonlySet<string>;
}

/**
 * Önümüzdeki günlerin bildirimleri, yakından uzağa; en çok `sinir` tane.
 * Her anımsatma saati, durdurulmazsa yeniden çalacağı 3 kez dahil 4 bildirimdir.
 * Durdurulan saatin bildirimleri planlanmaz; ertelenen saat ertelenen saatten çalar.
 */
export function bildirimPlani({
  animsaticilar,
  gunDurumlari,
  kartlar,
  bugunYapilanlar,
  bugunGun,
  simdi,
  gunSayisi = PLAN_GUNU,
  sinir = BILDIRIM_SINIRI,
  alarmlaCalanlar,
}: PlanGirdisi): PlanliBildirim[] {
  const simdiAnahtar = `${bugunGun} ${simdi}`;
  const liste: PlanliBildirim[] = [];

  for (let i = 0; i < gunSayisi; i++) {
    const gun = gunEkle(bugunGun, i);

    for (const a of animsaticilar) {
      if (!gunuKapsarMi(a.gunler, gun) || alarmlaCalanlar?.has(a.id)) continue;
      for (const saat of a.saatler) {
        const d = i === 0 ? gunDurumlari.find((g) => g.animsaticiId === a.id && g.saat === saat) : undefined;
        if (d?.durduruldu) continue;
        const bas = dakika(d?.ertelenenSaat ?? saat);
        for (let k = 0; k <= YENIDEN_CALMA; k++) {
          const yer = anaGoreKonum(gun, bas + k * a.erteleDk);
          liste.push({
            id: `a_${a.id}_${gun}_${saat.replace(':', '')}_${k}`,
            gun: yer.gun,
            saat: yer.saat,
            baslik: a.ad,
            govde: saatMetni(bas),
            sesli: a.sesli,
            erteleDk: a.erteleDk,
            veri: { tur: 'animsatici', animsaticiId: a.id, gun, saat },
          });
        }
      }
    }

    for (const k of kartlar) {
      if (!k.saat || !k.hatirlatma || !gorunurMu(k, gun, bugunGun)) continue;
      if (i === 0 && bugunYapilanlar.has(k.id)) continue;
      if (!k.tekrar && k.yapildi) continue;
      if (alarmlaCalanlar?.has(k.id)) continue;
      const yer = hatirlatmaZamani(gun, k.saat, k.hatirlatma);
      liste.push({
        id: `k_${k.id}_${gun}`,
        gun: yer.gun,
        saat: yer.saat,
        baslik: k.baslik,
        govde: `${HATIRLATMA_GOVDESI[k.hatirlatma]} · ${k.saat}`,
        sesli: true,
        erteleDk: null,
        veri: { tur: 'kart', kartId: k.id, gun },
      });
    }
  }

  return liste
    .filter((b) => `${b.gun} ${b.saat}` > simdiAnahtar)
    .sort((x, y) => `${x.gun} ${x.saat}`.localeCompare(`${y.gun} ${y.saat}`) || x.id.localeCompare(y.id))
    .slice(0, sinir);
}

/** Bir anımsatma saatinin (durdur / ertele ile iptal edilecek) bildirim kimlikleri. */
export function saatinBildirimleri(animsaticiId: string, gun: Gun, saat: string): string[] {
  return Array.from({ length: YENIDEN_CALMA + 1 }, (_, k) => `a_${animsaticiId}_${gun}_${saat.replace(':', '')}_${k}`);
}
