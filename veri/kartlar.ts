// Kartlar, bloklar ve günlük kayıtlar: okuma ve (yazma kapısı üzerinden) yazma.
// Kimlik üretici dışarıdan verilir (uygulamada `yeniKimlik`, testte sıralı).

import type { KartIslemi, KayitAraligi } from '@/mantik/bolme';
import { kayitAnahtarlariniEsle } from '@/mantik/bolme';
import { bosKayit, type Blok, type BlokTuru, type Kart, type Kayit } from '@/mantik/kart';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu, SqlDeger, Yazici } from './kapi';

export type KimlikUretici = () => string;

/** Formdaki blok: kimliği karttaki bloğunki ya da formda yeni üretilmiş geçici kimlik. */
export type BlokTaslagi = Omit<Blok, 'kartId' | 'sira'>;

export interface KartOzeti extends Kart {
  blokSayisi: number;
}

// ---- Satır dönüşümleri -------------------------------------------------------

interface KartSatiri {
  id: string;
  baslik: string;
  kisa: string;
  tarih: string | null;
  tarihsiz: number;
  saat: string | null;
  hatirlatma: string | null;
  alarm: number | null;
  tekrar: string | null;
  bitis: string | null;
  atlanan: string;
  plan_id: string | null;
  kaynak: string;
  gelen_kimden: string | null;
  kilitli: number;
  yapildi: number;
  birakildi: number;
  sira: number;
  blok_sayisi?: number;
}

interface BlokSatiri {
  id: string;
  kart_id: string;
  sira: number;
  tur: string;
  ad: string;
  metin: string;
  birim: string;
  dakika: number | null;
  maddeler: string;
  dosya: string | null;
}

interface KayitSatiri {
  kart_id: string;
  tarih: string;
  yapildi: number;
  degerler: string;
  isaretler: string;
  fotolar: string;
}

function json<T>(metin: string | null, varsayilan: T): T {
  if (metin === null) return varsayilan;
  try {
    return JSON.parse(metin) as T;
  } catch {
    return varsayilan;
  }
}

export function kartSatirdan(s: KartSatiri): KartOzeti {
  return {
    id: s.id,
    baslik: s.baslik,
    kisa: s.kisa,
    tarih: s.tarih,
    tarihsiz: s.tarihsiz === 1,
    saat: s.saat,
    hatirlatma: s.hatirlatma as Kart['hatirlatma'],
    alarm: s.alarm === 1,
    tekrar: json(s.tekrar, null),
    bitis: s.bitis,
    atlanan: json<Gun[]>(s.atlanan, []),
    planId: s.plan_id,
    kaynak: s.kaynak as Kart['kaynak'],
    gelenKimden: s.gelen_kimden,
    kilitli: s.kilitli === 1,
    yapildi: s.yapildi === 1,
    birakildi: s.birakildi === 1,
    sira: s.sira,
    blokSayisi: s.blok_sayisi ?? 0,
  };
}

function blokSatirdan(s: BlokSatiri): Blok {
  return {
    id: s.id,
    kartId: s.kart_id,
    sira: s.sira,
    tur: s.tur as BlokTuru,
    ad: s.ad,
    metin: s.metin,
    birim: s.birim,
    dakika: s.dakika,
    maddeler: json<string[]>(s.maddeler, []),
    dosya: s.dosya,
  };
}

function kayitSatirdan(s: KayitSatiri): Kayit {
  return {
    kartId: s.kart_id,
    tarih: s.tarih,
    yapildi: s.yapildi === 1,
    degerler: json(s.degerler, {}),
    isaretler: json(s.isaretler, {}),
    fotolar: json(s.fotolar, {}),
  };
}

const KART_ALANLARI =
  'baslik, kisa, tarih, tarihsiz, saat, hatirlatma, alarm, tekrar, bitis, atlanan, plan_id, kaynak, gelen_kimden, kilitli, yapildi, birakildi, sira';

function kartDegerleri(k: Kart): SqlDeger[] {
  return [
    k.baslik,
    k.kisa,
    k.tarih,
    k.tarihsiz ? 1 : 0,
    k.saat,
    k.hatirlatma,
    k.alarm ? 1 : 0,
    k.tekrar ? JSON.stringify(k.tekrar) : null,
    k.bitis,
    JSON.stringify(k.atlanan),
    k.planId,
    k.kaynak,
    k.gelenKimden,
    k.kilitli ? 1 : 0,
    k.yapildi ? 1 : 0,
    k.birakildi ? 1 : 0,
    k.sira,
  ];
}

function aralikKosulu(aralik: KayitAraligi): { sql: string; params: SqlDeger[] } {
  if (aralik.tur === 'hepsi') return { sql: '', params: [] };
  if (aralik.tur === 'tek') return { sql: ' AND tarih = ?', params: [aralik.gun] };
  return { sql: ' AND tarih >= ?', params: [aralik.gun] };
}

// ---- Okuma -------------------------------------------------------------------

/** Bütün kartlar ve blok sayıları. Kişisel ajanda ölçeğinde süzme bellekte yapılır. */
/** Biten planların kartları ajandada görünmez (`08` açık soru 3). */
export async function tumKartlar(oku: Okuyucu): Promise<KartOzeti[]> {
  const satirlar = await oku.hepsi<KartSatiri>(
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi FROM kart k
     WHERE k.plan_id IS NULL OR k.plan_id NOT IN (SELECT id FROM plan WHERE durum = 'bitti')`,
  );
  return satirlar.map(kartSatirdan);
}

/** Planlara bağlı bütün kartlar (Yaşam Tarzım ve Devam edenler ilerlemesi için). */
export async function planliKartlar(oku: Okuyucu): Promise<KartOzeti[]> {
  const satirlar = await oku.hepsi<KartSatiri>(
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi FROM kart k
     WHERE k.plan_id IS NOT NULL ORDER BY k.sira`,
  );
  return satirlar.map(kartSatirdan);
}

/** Bir planın bütün kartları (plan bitmiş olsa da). */
export async function planKartlari(oku: Okuyucu, planId: string): Promise<KartOzeti[]> {
  const satirlar = await oku.hepsi<KartSatiri>(
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi FROM kart k
     WHERE k.plan_id = ? ORDER BY k.sira`,
    [planId],
  );
  return satirlar.map(kartSatirdan);
}

/** Arama için her kartın blok metni (ad, talimat, liste maddeleri): kart → metin. */
export async function blokMetinleri(oku: Okuyucu): Promise<Map<string, string>> {
  const satirlar = await oku.hepsi<Pick<BlokSatiri, 'kart_id' | 'ad' | 'metin' | 'maddeler'>>(
    'SELECT kart_id, ad, metin, maddeler FROM blok ORDER BY kart_id, sira',
  );
  const sonuc = new Map<string, string>();
  for (const s of satirlar) {
    const parca = [s.ad, s.metin, ...json<string[]>(s.maddeler, [])].filter(Boolean).join(' ');
    const onceki = sonuc.get(s.kart_id);
    sonuc.set(s.kart_id, onceki ? `${onceki} ${parca}` : parca);
  }
  return sonuc;
}

/** O gün yapıldı işaretli kartların kimlikleri. */
export async function gunYapilanlari(oku: Okuyucu, gun: Gun): Promise<Set<string>> {
  const satirlar = await oku.hepsi<{ kart_id: string }>(
    'SELECT kart_id FROM kayit WHERE tarih = ? AND yapildi = 1',
    [gun],
  );
  return new Set(satirlar.map((s) => s.kart_id));
}

/** Birden çok günün yapılanları: gün → kart kimlikleri. */
export async function gunlerinYapilanlari(oku: Okuyucu, ilk: Gun, son: Gun): Promise<Map<Gun, Set<string>>> {
  const satirlar = await oku.hepsi<{ kart_id: string; tarih: string }>(
    'SELECT kart_id, tarih FROM kayit WHERE tarih >= ? AND tarih <= ? AND yapildi = 1',
    [ilk, son],
  );
  const sonuc = new Map<Gun, Set<string>>();
  for (const s of satirlar) {
    const kume = sonuc.get(s.tarih) ?? new Set<string>();
    kume.add(s.kart_id);
    sonuc.set(s.tarih, kume);
  }
  return sonuc;
}

export async function kartAyrinti(oku: Okuyucu, id: string): Promise<{ kart: KartOzeti; bloklar: Blok[] } | null> {
  const satir = await oku.ilk<KartSatiri>(
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi FROM kart k WHERE k.id = ?`,
    [id],
  );
  if (!satir) return null;
  const bloklar = await oku.hepsi<BlokSatiri>('SELECT * FROM blok WHERE kart_id = ? ORDER BY sira', [id]);
  return { kart: kartSatirdan(satir), bloklar: bloklar.map(blokSatirdan) };
}

/** Plan ekranı Gelişim için: plandaki kartların ölçüm blokları ve bütün kayıtları. */
export async function planKayitlari(oku: Okuyucu, planId: string): Promise<{ olcumler: Blok[]; kayitlar: Kayit[] }> {
  const bloklar = await oku.hepsi<BlokSatiri>(
    `SELECT b.* FROM blok b JOIN kart k ON k.id = b.kart_id WHERE k.plan_id = ? AND b.tur = 'olcum' ORDER BY k.sira, b.sira`,
    [planId],
  );
  const kayitlar = await oku.hepsi<KayitSatiri>(
    'SELECT r.* FROM kayit r JOIN kart k ON k.id = r.kart_id WHERE k.plan_id = ? ORDER BY r.tarih',
    [planId],
  );
  return { olcumler: bloklar.map(blokSatirdan), kayitlar: kayitlar.map(kayitSatirdan) };
}

/** Kartın bütün kayıtları, tarihe göre. */
export async function kartKayitlari(oku: Okuyucu, kartId: string): Promise<Kayit[]> {
  const satirlar = await oku.hepsi<KayitSatiri>('SELECT * FROM kayit WHERE kart_id = ? ORDER BY tarih', [kartId]);
  return satirlar.map(kayitSatirdan);
}

export async function kayitVarMi(oku: Okuyucu, kartId: string): Promise<boolean> {
  const satir = await oku.ilk<{ n: number }>('SELECT COUNT(*) AS n FROM kayit WHERE kart_id = ?', [kartId]);
  return (satir?.n ?? 0) > 0;
}

// ---- Yazma yardımcıları (yazma işleminin içinde) ------------------------------

/** Yazma işleminin içinde kart ekler (başka veri modülleri de kullanır). */
export async function kartEkleY(y: Yazici, k: Kart, simdi: string) {
  await y.calistir(
    `INSERT INTO kart (id, ${KART_ALANLARI}, olusturma, guncelleme) VALUES (?, ${KART_ALANLARI.split(',').map(() => '?').join(', ')}, ?, ?)`,
    [k.id, ...kartDegerleri(k), simdi, simdi],
  );
}

async function kartGuncelleY(y: Yazici, k: Kart, simdi: string) {
  // Tek seferlik kartın günü değiştiyse kaydı da yeni güne taşınır.
  if (k.tekrar === null && k.tarih !== null) {
    const eski = await y.ilk<{ tarih: string | null }>('SELECT tarih FROM kart WHERE id = ?', [k.id]);
    if (eski?.tarih && eski.tarih !== k.tarih) {
      await y.calistir('DELETE FROM kayit WHERE kart_id = ? AND tarih = ?', [k.id, k.tarih]);
      await y.calistir('UPDATE kayit SET tarih = ? WHERE kart_id = ? AND tarih = ?', [k.tarih, k.id, eski.tarih]);
    }
  }
  const atamalar = KART_ALANLARI.split(',')
    .map((a) => `${a.trim()} = ?`)
    .join(', ');
  await y.calistir(`UPDATE kart SET ${atamalar}, guncelleme = ? WHERE id = ?`, [...kartDegerleri(k), simdi, k.id]);
}

/**
 * Formdaki blokları karta yazar. Kartta zaten olan bloklar güncellenir,
 * yenileri yeni kimlikle eklenir, formdan çıkarılanlar silinir.
 * Döner: form kimliği → karttaki kimlik (kayıt taşırken anahtar çevirmek için).
 */
export async function bloklariYazY(
  y: Yazici,
  kartId: string,
  taslaklar: readonly BlokTaslagi[],
  idUret: KimlikUretici,
): Promise<Map<string, string>> {
  const mevcut = new Set(
    (await y.hepsi<{ id: string }>('SELECT id FROM blok WHERE kart_id = ?', [kartId])).map((s) => s.id),
  );
  const esleme = new Map<string, string>();
  const tutulan = new Set<string>();
  for (const [sira, t] of taslaklar.entries()) {
    const degerler: SqlDeger[] = [t.tur, t.ad, t.metin, t.birim, t.dakika, JSON.stringify(t.maddeler), t.dosya];
    if (mevcut.has(t.id)) {
      await y.calistir(
        'UPDATE blok SET sira = ?, tur = ?, ad = ?, metin = ?, birim = ?, dakika = ?, maddeler = ?, dosya = ? WHERE id = ?',
        [sira, ...degerler, t.id],
      );
      esleme.set(t.id, t.id);
      tutulan.add(t.id);
    } else {
      const id = idUret();
      await y.calistir(
        'INSERT INTO blok (id, kart_id, sira, tur, ad, metin, birim, dakika, maddeler, dosya) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, kartId, sira, ...degerler],
      );
      esleme.set(t.id, id);
    }
  }
  for (const id of mevcut) {
    if (!tutulan.has(id)) await y.calistir('DELETE FROM blok WHERE id = ?', [id]);
  }
  return esleme;
}

async function kayitYazY(y: Yazici, k: Kayit) {
  await y.calistir(
    `INSERT INTO kayit (kart_id, tarih, yapildi, degerler, isaretler, fotolar) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (kart_id, tarih) DO UPDATE SET
       yapildi = excluded.yapildi, degerler = excluded.degerler,
       isaretler = excluded.isaretler, fotolar = excluded.fotolar`,
    [k.kartId, k.tarih, k.yapildi ? 1 : 0, JSON.stringify(k.degerler), JSON.stringify(k.isaretler), JSON.stringify(k.fotolar)],
  );
}

/** Tek seferlik kartın `yapildi` kısa yolunu kendi günündeki kayda göre eşitler. */
async function kisaYoluEsitleY(y: Yazici, kartId: string) {
  await y.calistir(
    `UPDATE kart SET yapildi = COALESCE(
       (SELECT r.yapildi FROM kayit r WHERE r.kart_id = kart.id AND r.tarih = kart.tarih), 0)
     WHERE id = ? AND tekrar IS NULL`,
    [kartId],
  );
}

// ---- Yazma -------------------------------------------------------------------

/** Yeni kart ve blokları. */
export function yeniKartKaydet(
  kapi: Kapi,
  kart: Kart,
  bloklar: readonly BlokTaslagi[],
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    await kartEkleY(y, kart, simdi);
    await bloklariYazY(y, kart.id, bloklar, idUret);
  });
}

/**
 * Düzenleme / silme sonucundaki işlemleri (`mantik/bolme`) tek yazma işleminde uygular.
 * `bloklar`: düzenleme formundaki bloklar (`bloklariYaz` için).
 */
export function islemleriUygula(
  kapi: Kapi,
  islemler: readonly KartIslemi[],
  bloklar: readonly BlokTaslagi[],
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const eslemeler = new Map<string, Map<string, string>>();
    for (const islem of islemler) {
      switch (islem.tur) {
        case 'kartGuncelle':
          await kartGuncelleY(y, islem.kart, simdi);
          break;
        case 'kartEkle':
          await kartEkleY(y, islem.kart, simdi);
          break;
        case 'bloklariYaz':
          eslemeler.set(islem.kartId, await bloklariYazY(y, islem.kartId, bloklar, idUret));
          break;
        case 'kayitTasi': {
          const kosul = aralikKosulu(islem.aralik);
          const satirlar = await y.hepsi<KayitSatiri>(`SELECT * FROM kayit WHERE kart_id = ?${kosul.sql}`, [
            islem.kaynakKartId,
            ...kosul.params,
          ]);
          const esleme = eslemeler.get(islem.hedefKartId);
          for (const satir of satirlar) {
            const kayit = kayitSatirdan(satir);
            await kayitYazY(
              y,
              esleme ? kayitAnahtarlariniEsle(kayit, islem.hedefKartId, esleme) : { ...kayit, kartId: islem.hedefKartId },
            );
          }
          await y.calistir(`DELETE FROM kayit WHERE kart_id = ?${kosul.sql}`, [islem.kaynakKartId, ...kosul.params]);
          await kisaYoluEsitleY(y, islem.hedefKartId);
          break;
        }
        case 'kayitSil': {
          const kosul = aralikKosulu(islem.aralik);
          await y.calistir(`DELETE FROM kayit WHERE kart_id = ?${kosul.sql}`, [islem.kartId, ...kosul.params]);
          break;
        }
        case 'kartSil':
          await y.calistir('DELETE FROM kayit WHERE kart_id = ?', [islem.kartId]);
          await y.calistir('DELETE FROM blok WHERE kart_id = ?', [islem.kartId]);
          await y.calistir('DELETE FROM kart WHERE id = ?', [islem.kartId]);
          break;
      }
    }
  });
}

/** Kartın o günkü kaydını değiştirir (yoksa boş kayıttan başlar). */
export function kayitDegistir(
  kapi: Kapi,
  kartId: string,
  gun: Gun,
  degistir: (kayit: Kayit) => Kayit,
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const satir = await y.ilk<KayitSatiri>('SELECT * FROM kayit WHERE kart_id = ? AND tarih = ?', [kartId, gun]);
    const eski = satir ? kayitSatirdan(satir) : bosKayit(kartId, gun);
    await kayitYazY(y, { ...degistir(eski), kartId, tarih: gun });
    await kisaYoluEsitleY(y, kartId);
  });
}

/** Ajandadaki işaret kutusu ve "Yaptım" / "Geri al": o günün kaydına yazar (`05` §2). */
export function isaretle(kapi: Kapi, kartId: string, gun: Gun, yapildi: boolean): Promise<void> {
  return kayitDegistir(kapi, kartId, gun, (k) => ({ ...k, yapildi }));
}

/** Geçmişten kalanları bugüne al (`05` §5): `tarih = bugün`. */
export function kartlariBuguneAl(
  kapi: Kapi,
  kartlar: readonly Kart[],
  bugunGun: Gun,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    for (const k of kartlar) await kartGuncelleY(y, { ...k, tarih: bugunGun }, simdi);
  });
}

/** Geçmişten kalanı bırak: geçmişte yapılmamış olarak kalır. */
export function kartiBirak(kapi: Kapi, kartId: string): Promise<void> {
  return kapi.yaz(['kart'], (y) => y.calistir('UPDATE kart SET birakildi = 1 WHERE id = ?', [kartId]));
}
