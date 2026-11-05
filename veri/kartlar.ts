// Kartlar, bloklar ve günlük kayıtlar: okuma ve (yazma kapısı üzerinden) yazma.
// Kimlik üretici dışarıdan verilir (uygulamada `yeniKimlik`, testte sıralı).

import { adimDurumunuDuzelt, maddeleriDuzelt } from '@/mantik/maddeDuzeltme';
import { htmldenDuz } from '@/mantik/zenginMetin';
import { adimDurumu, adimiDegistir, ilerleme } from '@/mantik/adimlar';
import type { KartIslemi, KayitAraligi } from '@/mantik/bolme';
import { kayitAnahtarlariniEsle } from '@/mantik/bolme';
import {
  bosKayit,
  hatirlatmaCoz,
  hatirlatmaYaz,
  yeniKart,
  type Blok,
  type BlokTuru,
  type Kart,
  type Kayit,
  type SabitAlan,
} from '@/mantik/kart';
import { yeniKartSirasi } from '@/mantik/ajanda';
import { gecerliSes } from '@/mantik/sesler';
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
  alarm_sesi?: string | null;
  seri_say?: number | null;
  cesit?: string | null;
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
  sabitler?: string | null;
  aliskanlik?: number | null;
  olcumlerim?: number | null;
  ajandada?: number | null;
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
  sabit?: number;
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
    alarmSesi: gecerliSes(s.alarm_sesi),
    seriSay: s.seri_say === null || s.seri_say === undefined ? null : s.seri_say === 1,
    cesit: s.cesit ?? null,
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
    ...(s.sabitler ? { sabitler: json<SabitAlan[] | null>(s.sabitler, null) } : {}),
    ...(s.aliskanlik ? { aliskanlik: true } : {}),
    ...(s.olcumlerim ? { olcumlerim: true } : {}),
    ...(s.ajandada === 0 || s.ajandada === 1 ? { ajandada: s.ajandada === 1 } : {}),
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
    ...(s.sabit === 1 ? { sabit: true } : {}),
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
  'baslik, kisa, tarih, tarihsiz, saat, hatirlatma, alarm, alarm_sesi, seri_say, cesit, tekrar, bitis, atlanan, plan_id, kaynak, gelen_kimden, kilitli, yapildi, birakildi, sira, bag, sabitler, aliskanlik, ajandada, olcumlerim';

function kartDegerleri(k: Kart): SqlDeger[] {
  return [
    k.baslik,
    k.kisa,
    k.tarih,
    k.tarihsiz ? 1 : 0,
    k.saat,
    hatirlatmaYaz(k.hatirlatma),
    k.alarm ? 1 : 0,
    gecerliSes(k.alarmSesi),
    k.seriSay === null || k.seriSay === undefined ? null : k.seriSay ? 1 : 0,
    k.cesit ?? null,
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
    k.sabitler ? JSON.stringify(k.sabitler) : null,
    k.aliskanlik ? 1 : 0,
    k.ajandada === null || k.ajandada === undefined ? null : k.ajandada ? 1 : 0,
    k.olcumlerim ? 1 : 0,
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
    const parca = [s.ad, htmldenDuz(s.metin), ...json<string[]>(s.maddeler, [])].filter(Boolean).join(' ');
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
    const degerler: SqlDeger[] = [
      t.tur,
      t.ad,
      t.metin,
      t.birim,
      t.dakika,
      JSON.stringify(t.maddeler),
      t.dosya,
      durum,
      t.sabit ? 1 : 0,
    ];
    if (mevcut.has(t.id)) {
      await y.calistir(
        'UPDATE blok SET sira = ?, tur = ?, ad = ?, metin = ?, birim = ?, dakika = ?, maddeler = ?, dosya = ?, durum = ?, sabit = ? WHERE id = ?',
        [sira, ...degerler, t.id],
      );
      esleme.set(t.id, t.id);
      tutulan.add(t.id);
    } else {
      const id = idUret();
      await y.calistir(
        'INSERT INTO blok (id, kart_id, sira, tur, ad, metin, birim, dakika, maddeler, dosya, durum, sabit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

/** P-36: tekrarlı kartta seri sayılsın mı (kart görünümündeki "Seriyi gösterme / göster"). */
export function kartSeriSayYaz(kapi: Kapi, kartId: string, seriSay: boolean): Promise<void> {
  return kapi.yaz(['kart'], (y) => y.calistir('UPDATE kart SET seri_say = ? WHERE id = ?', [seriSay ? 1 : 0, kartId]));
}

// ---- Verilen kartlar (pilot 29 Ekim, P-62) -------------------------------------------

/** `verilen:` bağlı kartlar ve "Yaptım" denen günleri (eşitleme için). */
export async function verilenYerelKartlar(oku: Okuyucu): Promise<{ id: string; bag: string | null; yapilan: Gun[] }[]> {
  const satirlar = await oku.hepsi<{ id: string; bag: string | null; tarih: string | null }>(
    `SELECT k.id, k.bag, r.tarih FROM kart k
     LEFT JOIN kayit r ON r.kart_id = k.id AND r.yapildi = 1
     WHERE k.bag LIKE 'verilen:%' ORDER BY k.olusturma, k.id, r.tarih`,
  );
  const harita = new Map<string, { id: string; bag: string | null; yapilan: Gun[] }>();
  for (const s of satirlar) {
    const k = harita.get(s.id) ?? { id: s.id, bag: s.bag, yapilan: [] };
    if (s.tarih) k.yapilan.push(s.tarih);
    harita.set(s.id, k);
  }
  return [...harita.values()];
}

/** Verilen kartta alanın değiştirebildikleri: saat ve hatırlatma (bütün günler için). */
export function kartZamaniYaz(
  kapi: Kapi,
  kartId: string,
  z: Pick<Kart, 'saat' | 'hatirlatma' | 'alarm'> & { alarmSesi?: string | null },
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const s = await y.ilk<KartSatiri>(
      `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi, ${ADIM_SUTUNLARI} FROM kart k WHERE k.id = ?`,
      [kartId],
    );
    if (!s) return;
    const k = kartSatirdan(s);
    await kartGuncelleY(
      y,
      { ...k, saat: z.saat, hatirlatma: z.hatirlatma, alarm: z.alarm, alarmSesi: z.alarmSesi ?? k.alarmSesi ?? null },
      simdi,
    );
  });
}

// ---- Görünümde doğrudan düzeltme (pilot 29 Ekim, P-66) -----------------------------
// İçerik kartındır: tekrarlı kartta da bütün günlere uygulanır (soru yok).

/** Başlık ya da açıklama. */
export function kartMetniYaz(
  kapi: Kapi,
  kartId: string,
  d: { baslik?: string; kisa?: string },
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    if (d.baslik !== undefined && d.baslik.trim())
      await y.calistir('UPDATE kart SET baslik = ?, guncelleme = ? WHERE id = ?', [d.baslik.trim(), simdi, kartId]);
    if (d.kisa !== undefined)
      await y.calistir('UPDATE kart SET kisa = ?, guncelleme = ? WHERE id = ?', [d.kisa, simdi, kartId]);
  });
}

/** Bir parçanın içeriği (talimat metni, liste maddeleri, videolar). */
export function blokIcerikYaz(
  kapi: Kapi,
  blokId: string,
  d: { metin?: string; maddeler?: string[]; ad?: string },
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    if (d.metin !== undefined) await y.calistir('UPDATE blok SET metin = ? WHERE id = ?', [d.metin, blokId]);
    if (d.maddeler !== undefined)
      await y.calistir('UPDATE blok SET maddeler = ? WHERE id = ?', [JSON.stringify(d.maddeler), blokId]);
    if (d.ad !== undefined) await y.calistir('UPDATE blok SET ad = ? WHERE id = ?', [d.ad, blokId]);
  });
}

/**
 * P-86: kartın listesinde bir maddeyi yerinde düzelt (`yeni`) ya da sil (null). Adımlar'da
 * işaretler yerinde kalır; silinen adımın işareti de gider.
 */
export function blokMaddesiYaz(kapi: Kapi, blokId: string, i: number, yeni: string | null): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const b = await y.ilk<BlokSatiri>('SELECT * FROM blok WHERE id = ?', [blokId]);
    if (!b) return;
    const eskiler = json<string[]>(b.maddeler, []);
    const maddeler = maddeleriDuzelt(eskiler, i, yeni);
    await y.calistir('UPDATE blok SET maddeler = ? WHERE id = ?', [JSON.stringify(maddeler), blokId]);
    if (b.tur === 'adimlar') {
      const durum = adimDurumunuDuzelt(adimDurumu(json<unknown>(b.durum ?? null, null), eskiler.length), i, yeni);
      await y.calistir('UPDATE blok SET durum = ? WHERE id = ?', [JSON.stringify(durum), blokId]);
    }
  });
}

/**
 * P-72: kart görünümündeki şeritten parça ekleme: boş (ya da fotoğrafı seçilmiş) parça kartın
 * sonuna eklenir. İçerik kartındır (bütün günler).
 */
export function blokEkle(
  kapi: Kapi,
  kartId: string,
  b: {
    id: string;
    tur: BlokTuru;
    ad?: string;
    metin?: string;
    birim?: string;
    dakika?: number | null;
    maddeler?: readonly string[];
    dosya?: string | null;
    sabit?: boolean;
  },
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const son = await y.ilk<{ sira: number | null }>('SELECT MAX(sira) AS sira FROM blok WHERE kart_id = ?', [kartId]);
    await y.calistir(
      'INSERT INTO blok (id, kart_id, sira, tur, ad, metin, birim, dakika, maddeler, dosya, durum, sabit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
      [
        b.id,
        kartId,
        (son?.sira ?? -1) + 1,
        b.tur,
        b.ad ?? '',
        b.metin ?? '',
        b.birim ?? '',
        b.dakika !== undefined ? b.dakika : b.tur === 'sayac' ? 10 : null,
        JSON.stringify(b.maddeler ?? []),
        b.dosya ?? null,
        b.sabit ? 1 : 0,
      ],
    );
  });
}

/** P-77: kart görünümündeki parça ayar sayfası: parçanın bütün alanları (sıra ve kart aynı kalır). */
export function blokYaz(kapi: Kapi, b: BlokTaslagi): Promise<void> {
  return kapi.yaz(['kart'], (y) =>
    y.calistir(
      'UPDATE blok SET tur = ?, ad = ?, metin = ?, birim = ?, dakika = ?, maddeler = ?, dosya = ?, durum = ?, sabit = ? WHERE id = ?',
      [
        b.tur,
        b.ad,
        b.metin,
        b.birim,
        b.dakika,
        JSON.stringify(b.maddeler),
        b.dosya,
        b.tur === 'adimlar' && b.durum ? JSON.stringify(b.durum) : null,
        b.sabit ? 1 : 0,
        b.id,
      ],
    ),
  );
}

// ---- Kart görünümünde öğe menüsü (P-76): sil, sırala, kart açıkken değişebilir ----------

/** Parçayı karttan kaldırır. */
export function blokSil(kapi: Kapi, blokId: string): Promise<void> {
  return kapi.yaz(['kart'], (y) => y.calistir('DELETE FROM blok WHERE id = ?', [blokId]));
}

/** İki parçanın yerini değiştirir (görünümde Yukarı / Aşağı; aynı bölümdeki komşuyla). */
export function bloklarinYeriniDegistir(kapi: Kapi, kartId: string, a: string, b: string): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    const ids = (await y.hepsi<{ id: string }>('SELECT id FROM blok WHERE kart_id = ? ORDER BY sira', [kartId])).map(
      (s) => s.id,
    );
    const i = ids.indexOf(a);
    const j = ids.indexOf(b);
    if (i < 0 || j < 0) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    for (const [sira, id] of ids.entries()) await y.calistir('UPDATE blok SET sira = ? WHERE id = ?', [sira, id]);
  });
}

/** Parça kart açıkken değişebilir mi (`blok.sabit` tersi). */
export function blokSabitYaz(kapi: Kapi, blokId: string, sabit: boolean): Promise<void> {
  return kapi.yaz(['kart'], (y) => y.calistir('UPDATE blok SET sabit = ? WHERE id = ?', [sabit ? 1 : 0, blokId]));
}

/** Kartın görünümde değişmeyen alanları (başlık, açıklama, tarih, saat). */
export function kartSabitleriYaz(kapi: Kapi, kartId: string, sabitler: readonly SabitAlan[]): Promise<void> {
  return kapi.yaz(['kart'], (y) =>
    y.calistir('UPDATE kart SET sabitler = ? WHERE id = ?', [
      sabitler.length ? JSON.stringify(sabitler) : null,
      kartId,
    ]),
  );
}

// ---- Alışkanlıklar (P-78) -------------------------------------------------------------

/** Kartı alışkanlık olarak izle / izlemeyi bırak; ajandada görünmesi varsayılana döner. */
export function aliskanlikYaz(kapi: Kapi, kartId: string, aliskanlik: boolean): Promise<void> {
  return kapi.yaz(['kart'], (y) =>
    y.calistir('UPDATE kart SET aliskanlik = ?, ajandada = NULL WHERE id = ?', [aliskanlik ? 1 : 0, kartId]),
  );
}

/** Alışkanlık ajandada da görünsün mü. */
export function ajandadaYaz(kapi: Kapi, kartId: string, ajandada: boolean): Promise<void> {
  return kapi.yaz(['kart'], (y) => y.calistir('UPDATE kart SET ajandada = ? WHERE id = ?', [ajandada ? 1 : 0, kartId]));
}

// ---- Ölçümlerim (P-91) -------------------------------------------------------------

/** Kişinin Ölçümlerim kartı (tek); yoksa null. */
export async function olcumlerimiOku(oku: Okuyucu): Promise<{ kart: KartOzeti; bloklar: Blok[] } | null> {
  const s = await oku.ilk<{ id: string }>('SELECT id FROM kart WHERE olcumlerim = 1 ORDER BY olusturma LIMIT 1');
  return s ? kartAyrinti(oku, s.id) : null;
}

/** Ölçümlerim'i kurar (her gün, süresiz, ajandada değil); kimliğini döner. Varsa onu döner. */
export async function olcumlerimiKur(kapi: Kapi, oku: Okuyucu, bugunGun: Gun, idUret: KimlikUretici): Promise<string> {
  const var_ = await oku.ilk<{ id: string }>('SELECT id FROM kart WHERE olcumlerim = 1 LIMIT 1');
  if (var_) return var_.id;
  const id = idUret();
  await yeniKartKaydet(
    kapi,
    yeniKart(id, {
      baslik: 'Ölçümlerim',
      tarih: bugunGun,
      tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
      olcumlerim: true,
      ajandada: false,
    }),
    [],
    idUret,
  );
  return id;
}
