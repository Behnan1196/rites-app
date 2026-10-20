// Kartlar, bloklar ve günlük kayıtlar: okuma ve (yazma kapısı üzerinden) yazma.
// Kimlik üretici dışarıdan verilir (uygulamada `yeniKimlik`, testte sıralı).

import { adimDurumu, adimiDegistir, ilerleme } from '@/mantik/adimlar';
import type { KartIslemi, KayitAraligi } from '@/mantik/bolme';
import { kayitAnahtarlariniEsle } from '@/mantik/bolme';
import { bosKayit, hatirlatmaCoz, hatirlatmaYaz, type Blok, type BlokTuru, type Kart, type Kayit } from '@/mantik/kart';
import { yeniKartSirasi } from '@/mantik/ajanda';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu, SqlDeger, Yazici } from './kapi';

export type KimlikUretici = () => string;

/** Formdaki blok: kimliği karttaki bloğunki ya da formda yeni üretilmiş geçici kimlik. */
export type BlokTaslagi = Omit<Blok, 'kartId' | 'sira'>;

export interface KartOzeti extends Kart {
  blokSayisi: number;
  /** "Proje adımları" bloğu varsa ilerlemesi. */
  adimlar?: { yapilan: number; toplam: number } | null;
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
  bag?: string | null;
  blok_sayisi?: number;
  adim_maddeler?: string | null;
  adim_durum?: string | null;
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
  durum?: string | null;
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

/** Kartın (ilk) "Proje adımları" bloğunun maddeleri ve durumu: ajandada "3 / 7" için. */
const ADIM_SUTUNLARI = `(SELECT b.maddeler FROM blok b WHERE b.kart_id = k.id AND b.tur = 'adimlar' ORDER BY b.sira LIMIT 1) AS adim_maddeler,
  (SELECT b.durum FROM blok b WHERE b.kart_id = k.id AND b.tur = 'adimlar' ORDER BY b.sira LIMIT 1) AS adim_durum`;

export function kartSatirdan(s: KartSatiri): KartOzeti {
  return {
    id: s.id,
    baslik: s.baslik,
    kisa: s.kisa,
    tarih: s.tarih,
    tarihsiz: s.tarihsiz === 1,
    saat: s.saat,
    hatirlatma: hatirlatmaCoz(s.hatirlatma),
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
    bag: s.bag ?? null,
    blokSayisi: s.blok_sayisi ?? 0,
    adimlar: s.adim_maddeler
      ? ilerleme(adimDurumu(json<unknown>(s.adim_durum ?? null, null), json<string[]>(s.adim_maddeler, []).length))
      : null,
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
    ...(s.tur === 'adimlar'
      ? { durum: adimDurumu(json<unknown>(s.durum ?? null, null), json<string[]>(s.maddeler, []).length) }
      : {}),
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
  'baslik, kisa, tarih, tarihsiz, saat, hatirlatma, alarm, tekrar, bitis, atlanan, plan_id, kaynak, gelen_kimden, kilitli, yapildi, birakildi, sira, bag';

function kartDegerleri(k: Kart): SqlDeger[] {
  return [
    k.baslik,
    k.kisa,
    k.tarih,
    k.tarihsiz ? 1 : 0,
    k.saat,
    hatirlatmaYaz(k.hatirlatma),
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
    k.bag,
  ];
}

function aralikKosulu(aralik: KayitAraligi): { sql: string; params: SqlDeger[] } {
  if (aralik.tur === 'hepsi') return { sql: '', params: [] };
  if (aralik.tur === 'tek') return { sql: ' AND tarih = ?', params: [aralik.gun] };
  return { sql: ' AND tarih >= ?', params: [aralik.gun] };
}

// ---- Okuma -------------------------------------------------------------------

/** Bütün kartlar ve blok sayıları. Kişisel ajanda ölçeğinde süzme bellekte yapılır. */
export async function tumKartlar(oku: Okuyucu): Promise<KartOzeti[]> {
  const satirlar = await oku.hepsi<KartSatiri>(
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi, ${ADIM_SUTUNLARI} FROM kart k`,
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
  const satirlar = await oku.hepsi<{ kart_id: string }>('SELECT kart_id FROM kayit WHERE tarih = ? AND yapildi = 1', [
    gun,
  ]);
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
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi, ${ADIM_SUTUNLARI} FROM kart k WHERE k.id = ?`,
    [id],
  );
  if (!satir) return null;
  const bloklar = await oku.hepsi<BlokSatiri>('SELECT * FROM blok WHERE kart_id = ? ORDER BY sira', [id]);
  return { kart: kartSatirdan(satir), bloklar: bloklar.map(blokSatirdan) };
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
    `INSERT INTO kart (id, ${KART_ALANLARI}, olusturma, guncelleme) VALUES (?, ${KART_ALANLARI.split(',')
      .map(() => '?')
      .join(', ')}, ?, ?)`,
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
    const durum = t.tur === 'adimlar' && t.durum ? JSON.stringify(t.durum) : null;
    const degerler: SqlDeger[] = [t.tur, t.ad, t.metin, t.birim, t.dakika, JSON.stringify(t.maddeler), t.dosya, durum];
    if (mevcut.has(t.id)) {
      await y.calistir(
        'UPDATE blok SET sira = ?, tur = ?, ad = ?, metin = ?, birim = ?, dakika = ?, maddeler = ?, dosya = ?, durum = ? WHERE id = ?',
        [sira, ...degerler, t.id],
      );
      esleme.set(t.id, t.id);
      tutulan.add(t.id);
    } else {
      const id = idUret();
      await y.calistir(
        'INSERT INTO blok (id, kart_id, sira, tur, ad, metin, birim, dakika, maddeler, dosya, durum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
    [
      k.kartId,
      k.tarih,
      k.yapildi ? 1 : 0,
      JSON.stringify(k.degerler),
      JSON.stringify(k.isaretler),
      JSON.stringify(k.fotolar),
    ],
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

/**
 * Yeni kart ve blokları. Kartın sırası burada verilir (`yeniKartSirasi`):
 * saatsizse en sona, saatliyse saatlilerin arasına saatine göre.
 */
export function yeniKartKaydet(
  kapi: Kapi,
  kart: Kart,
  bloklar: readonly BlokTaslagi[],
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const mevcut = await y.hepsi<{ sira: number; saat: string | null }>('SELECT sira, saat FROM kart');
    await kartEkleY(y, { ...kart, sira: yeniKartSirasi(mevcut, kart.saat) }, simdi);
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
              esleme
                ? kayitAnahtarlariniEsle(kayit, islem.hedefKartId, esleme)
                : { ...kayit, kartId: islem.hedefKartId },
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
export function kayitDegistir(kapi: Kapi, kartId: string, gun: Gun, degistir: (kayit: Kayit) => Kayit): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const satir = await y.ilk<KayitSatiri>('SELECT * FROM kayit WHERE kart_id = ? AND tarih = ?', [kartId, gun]);
    const eski = satir ? kayitSatirdan(satir) : bosKayit(kartId, gun);
    await kayitYazY(y, { ...degistir(eski), kartId, tarih: gun });
    await kisaYoluEsitleY(y, kartId);
  });
}

/**
 * "Proje adımları": bir adımı işaretler / işaretini kaldırır (kalıcı; güne bağlı değil).
 * Bütün adımlar bitince o günün kaydı yapıldı olur, tekrarlı kartın dizisi o gün
 * biter; bir adım geri alınınca ikisi de geri döner.
 */
export function adimiIsaretle(kapi: Kapi, blokId: string, i: number, yapildi: boolean, gun: Gun): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const b = await y.ilk<BlokSatiri>('SELECT * FROM blok WHERE id = ?', [blokId]);
    if (!b) return;
    const k = await y.ilk<KartSatiri>('SELECT * FROM kart WHERE id = ?', [b.kart_id]);
    if (!k) return;
    const kart = kartSatirdan(k);
    const eski = adimDurumu(json<unknown>(b.durum ?? null, null), json<string[]>(b.maddeler, []).length);
    const { durum, etki } = adimiDegistir(eski, i, yapildi, gun, kart);
    await y.calistir('UPDATE blok SET durum = ? WHERE id = ?', [JSON.stringify(durum), blokId]);
    if (!etki) return;
    if (etki.bitis !== undefined) await y.calistir('UPDATE kart SET bitis = ? WHERE id = ?', [etki.bitis, kart.id]);
    const satir = await y.ilk<KayitSatiri>('SELECT * FROM kayit WHERE kart_id = ? AND tarih = ?', [kart.id, etki.gun]);
    const kayit = satir ? kayitSatirdan(satir) : bosKayit(kart.id, etki.gun);
    await kayitYazY(y, { ...kayit, yapildi: etki.tur === 'bitti' });
    await kisaYoluEsitleY(y, kart.id);
  });
}

/** Ajandada sürükleyerek sıralama: tek kartın yeni sırası ya da (eşit komşularda) hepsi. */
export function siralariYaz(kapi: Kapi, siralar: ReadonlyMap<string, number>): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    for (const [id, sira] of siralar) await y.calistir('UPDATE kart SET sira = ? WHERE id = ?', [sira, id]);
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

// ---- Grup etkinliklerine bağlı kartlar (pilot 18 Ekim) ------------------------------

/** Bağı olan kartlar (grup etkinliğinden gelenler): eşitleme için. */
export function bagliKartlar(oku: Okuyucu): Promise<{ id: string; bag: string | null; tarih: string | null }[]> {
  return oku.hepsi('SELECT id, bag, tarih FROM kart WHERE bag IS NOT NULL');
}

/** Bağı verilen kartı (varsa) bulur. */
export async function bagliKart(oku: Okuyucu, bag: string): Promise<string | null> {
  return (await oku.ilk<{ id: string }>('SELECT id FROM kart WHERE bag = ?', [bag]))?.id ?? null;
}

/** Kartları kayıtları ve bloklarıyla siler. */
export function kartlariSil(kapi: Kapi, kimlikler: readonly string[]): Promise<void> {
  if (kimlikler.length === 0) return Promise.resolve();
  return kapi.yaz(['kart'], async (y) => {
    for (const id of kimlikler) {
      await y.calistir('DELETE FROM kayit WHERE kart_id = ?', [id]);
      await y.calistir('DELETE FROM blok WHERE kart_id = ?', [id]);
      await y.calistir('DELETE FROM kart WHERE id = ?', [id]);
    }
  });
}

/** Tekrarlı kartın dizisini dün bitirir ve bağını koparır (geçmiş kayıtları kalır). */
export function bagiBitir(kapi: Kapi, kimlikler: readonly string[], dun: Gun): Promise<void> {
  if (kimlikler.length === 0) return Promise.resolve();
  return kapi.yaz(['kart'], async (y) => {
    for (const id of kimlikler) await y.calistir('UPDATE kart SET bitis = ?, bag = NULL WHERE id = ?', [dun, id]);
  });
}

/** Grup işlerine bağlı kartlar ve yapıldı mı (tek seferlik kartın kısa yolu). */
export async function isKartlari(oku: Okuyucu): Promise<{ id: string; bag: string | null; yapildi: boolean }[]> {
  const satirlar = await oku.hepsi<{ id: string; bag: string | null; yapildi: number }>(
    "SELECT id, bag, yapildi FROM kart WHERE bag LIKE 'is:%'",
  );
  return satirlar.map((s) => ({ ...s, yapildi: s.yapildi === 1 }));
}
