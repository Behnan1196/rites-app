// İçerik kataloğu (pilot 20 Ekim): alanlar, öneri kartları ve öneri programları.
// Sunucudaki katalogdan indirilir (bir uzman yeniledikçe), telefonda saklanır;
// yoksa uygulamayla gelen içerik kullanılır (`hazirIcerik.ts`). İndirme tek
// yönlüdür: sunucuya kişinin verisi gitmez. Kişinin kendi kopyaları (programlarına
// eklediği öneri, ajandasındaki kart) katalog değişince etkilenmez.
//
// Uzman için yazım kuralları `docs/icerik.md`de. Katalogdaki her öğe burada
// denetlenir; bozuk öğe atlanır, geri kalanı kullanılır.

import { ALANLAR, type EtkinlikBlogu } from './hazirIcerik';
import { ICERIK_BLOKLARI, KAYIT_BLOKLARI, type BlokTuru, type Tekrar } from './kart';
import { GUN_KISA, type GunKisa } from './tarih';

// ---- Etiket türleri (Kütüphanem) ------------------------------------------------

export const TURLER = ['Tarif', 'Egzersiz', 'Bilgi', 'Ölçüm', 'Rutin', 'Diğer'] as const;
export type EtiketTuru = (typeof TURLER)[number];

export function turMu(t: unknown): t is EtiketTuru {
  return typeof t === 'string' && (TURLER as readonly string[]).includes(t);
}

/** Tahmini tür (L-1): liste + talimat → Tarif; video → Egzersiz; yalnız ölçüm/talimat → Ölçüm/Bilgi. */
export function turTahmini(bloklar: readonly { tur: BlokTuru }[]): EtiketTuru {
  const t = bloklar.map((b) => b.tur);
  if (t.includes('liste') && t.includes('talimat')) return 'Tarif';
  if (t.includes('video')) return 'Egzersiz';
  if (t.length && t.every((x) => x === 'olcum' || x === 'talimat')) return t.includes('olcum') ? 'Ölçüm' : 'Bilgi';
  return 'Diğer';
}

// ---- Türler -------------------------------------------------------------------------

/** Kartın bloğu, kayıtsız (kütüphane ve katalog biçimi). */
export interface KatalogBlogu {
  tur: BlokTuru;
  ad: string;
  metin: string;
  birim: string;
  dakika: number | null;
  maddeler: string[];
  /** Telefondaki fotoğraf / dosya (katalogda hep null). */
  dosya: string | null;
}

export interface KatalogAlan {
  anahtar: string;
  ad: string;
  aciklama: string;
  /** Ionicons simge adı; yoksa yaprak. */
  ikon: string | null;
  /** Yeni kişide Yaşam Tarzım'da açık mı. */
  varsayilanAcik: boolean;
}

export interface KatalogKart {
  id: string;
  alanlar: string[];
  baslik: string;
  kisa: string;
  saat: string | null;
  tekrar: Tekrar | null;
  bloklar: KatalogBlogu[];
  tur: EtiketTuru;
}

export interface KatalogProgram {
  id: string;
  alanlar: string[];
  ad: string;
  aciklama: string;
  /** Gün; null = süresiz. */
  sure: number | null;
  /** Kartın kimliği ve programın kaçıncı günü (0 = 1. gün). */
  kartlar: { kart: string; gun: number }[];
}

export interface Katalog {
  alanlar: KatalogAlan[];
  kartlar: KatalogKart[];
  programlar: KatalogProgram[];
}

// ---- Denetim ---------------------------------------------------------------------------

const BLOK_TURLERI: readonly string[] = [...ICERIK_BLOKLARI, ...KAYIT_BLOKLARI];
const DESENLER = ['hergun', 'haftaici', 'haftasonu'] as const;

type Ham = Record<string, unknown>;
const nesne = (x: unknown): Ham | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Ham) : null);
const metin = (x: unknown, varsayilan = ''): string => (typeof x === 'string' ? x.trim() : varsayilan);
const sayiMi = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const metinler = (x: unknown): string[] =>
  Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string' && v.trim() !== '').map((v) => v.trim()) : [];
const sira = (x: Ham) => (sayiMi(x.sira) ? x.sira : 0);
const aktifMi = (x: Ham) => x.aktif !== false;

function saatCoz(x: unknown): string | null {
  return typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x) ? x : null;
}

export function tekrarCoz(x: unknown): Tekrar | null {
  const t = nesne(x);
  if (!t) return null;
  const desen = (DESENLER as readonly unknown[]).includes(t.desen) ? (t.desen as Tekrar['desen']) : null;
  const gunler = metinler(t.gunler).filter((g): g is GunKisa => (GUN_KISA as readonly string[]).includes(g));
  const gunSayisi = sayiMi(t.gunSayisi) && t.gunSayisi > 0 ? Math.round(t.gunSayisi) : null;
  if (!desen && gunler.length === 0) return { gunSayisi, gunler: null, desen: 'hergun' };
  return { gunSayisi, gunler: desen ? null : GUN_KISA.filter((g) => gunler.includes(g)), desen };
}

export function blokCoz(x: unknown): KatalogBlogu | null {
  const b = nesne(x);
  if (!b || !BLOK_TURLERI.includes(b.tur as string)) return null;
  const tur = b.tur as BlokTuru;
  return {
    tur,
    ad: metin(b.ad),
    metin: metin(b.metin),
    birim: metin(b.birim),
    dakika: sayiMi(b.dakika) && b.dakika > 0 ? Math.round(b.dakika) : tur === 'sayac' ? 10 : null,
    maddeler: metinler(b.maddeler),
    dosya: null,
  };
}

/**
 * Sunucudan (ya da telefondan) gelen ham katalog → denetlenmiş katalog. Pasif
 * (`aktif: false`) ve bozuk öğeler atlanır; programın bilinmeyen kartları atlanır.
 * Hiç alan yoksa katalog geçersizdir (null).
 */
export function katalogCoz(ham: unknown): Katalog | null {
  const k = nesne(ham);
  if (!k) return null;
  const dizi = (x: unknown): Ham[] =>
    (Array.isArray(x) ? x.map(nesne).filter((v): v is Ham => !!v && aktifMi(v)) : []).sort((a, b) => sira(a) - sira(b));

  const alanlar: KatalogAlan[] = [];
  for (const a of dizi(k.alanlar)) {
    const anahtar = metin(a.anahtar);
    const ad = metin(a.ad);
    if (!anahtar || !ad || anahtar.startsWith('ozel-') || alanlar.some((x) => x.anahtar === anahtar)) continue;
    alanlar.push({
      anahtar,
      ad,
      aciklama: metin(a.aciklama),
      ikon: metin(a.ikon) || null,
      varsayilanAcik: (a.varsayilan_acik ?? a.varsayilanAcik) !== false,
    });
  }
  if (alanlar.length === 0) return null;

  const kartlar: KatalogKart[] = [];
  for (const c of dizi(k.kartlar)) {
    const id = metin(c.id);
    const baslik = metin(c.baslik);
    if (!id || !baslik || kartlar.some((x) => x.id === id)) continue;
    const bloklar = (Array.isArray(c.bloklar) ? c.bloklar : []).map(blokCoz).filter((b): b is KatalogBlogu => !!b);
    kartlar.push({
      id,
      alanlar: metinler(c.alanlar),
      baslik,
      kisa: metin(c.kisa),
      saat: saatCoz(c.saat),
      tekrar: c.tekrar === null || c.tekrar === undefined ? null : tekrarCoz(c.tekrar),
      bloklar,
      tur: turMu(c.tur) ? c.tur : turTahmini(bloklar),
    });
  }

  const programlar: KatalogProgram[] = [];
  for (const p of dizi(k.programlar)) {
    const id = metin(p.id);
    const ad = metin(p.ad);
    if (!id || !ad || programlar.some((x) => x.id === id)) continue;
    const pk = (Array.isArray(p.kartlar) ? p.kartlar : [])
      .map(nesne)
      .filter((x): x is Ham => !!x)
      .map((x) => ({ kart: metin(x.kart), gun: sayiMi(x.gun) && x.gun >= 0 ? Math.round(x.gun) : 0 }))
      .filter((x) => kartlar.some((c) => c.id === x.kart));
    if (pk.length === 0) continue;
    programlar.push({
      id,
      alanlar: metinler(p.alanlar),
      ad,
      aciklama: metin(p.aciklama),
      sure: sayiMi(p.sure) && p.sure > 0 ? Math.round(p.sure) : null,
      kartlar: pk,
    });
  }
  return { alanlar, kartlar, programlar };
}

// ---- Uygulamayla gelen katalog ------------------------------------------------------------

function etkinlikBloklari(b: EtkinlikBlogu): KatalogBlogu[] {
  const bos = (tur: BlokTuru): KatalogBlogu => ({
    tur,
    ad: '',
    metin: '',
    birim: '',
    dakika: null,
    maddeler: [],
    dosya: null,
  });
  switch (b.tur) {
    case 'sayac':
      return [{ ...bos('sayac'), dakika: b.dakika }];
    case 'video':
      // Bağlantı yok (`09`); kişi Düzenle'den yapıştırır.
      return [bos('video'), { ...bos('talimat'), metin: VIDEO_TALIMATI }];
    case 'olcum':
      return [{ ...bos('olcum'), ad: b.ad, birim: b.birim }];
    case 'talimat':
      return [{ ...bos('talimat'), metin: b.metin }];
    case 'gunnot':
      return [bos('gunnot')];
  }
}

export const VIDEO_TALIMATI = 'Videoyu açıp birlikte uygula.';

let gomulu: Katalog | null = null;

/** Uygulamayla gelen içerik, katalog biçiminde. */
export function gomuluKatalog(): Katalog {
  if (gomulu) return gomulu;
  gomulu = {
    alanlar: ALANLAR.map((a) => ({
      anahtar: a.anahtar,
      ad: a.ad,
      aciklama: a.aciklama,
      ikon: a.ikon,
      varsayilanAcik: a.anahtar !== 'ogrenme',
    })),
    kartlar: ALANLAR.flatMap((a) =>
      a.etkinlikler.map((e) => {
        const bloklar = etkinlikBloklari(e.blok);
        return {
          id: e.id,
          alanlar: [a.anahtar],
          baslik: e.baslik,
          kisa: '',
          saat: e.saat,
          tekrar: { ...e.tekrar, gunler: e.tekrar.gunler ? [...e.tekrar.gunler] : null },
          bloklar,
          tur: e.tur ?? turTahmini(bloklar),
        };
      }),
    ),
    programlar: ALANLAR.flatMap((a) =>
      a.paketler.map((p) => ({
        id: p.id,
        alanlar: [a.anahtar],
        ad: p.ad,
        aciklama: p.aciklama,
        sure: p.hafta * 7,
        kartlar: p.etkinlikler.map((kart) => ({ kart, gun: 0 })),
      })),
    ),
  };
  return gomulu;
}

// ---- Şu anki katalog -------------------------------------------------------------------------

let etkin: Katalog | null = null;

/** İndirilen (ya da telefonda saklı) katalog; null verilirse uygulamayla gelen kullanılır. */
export function katalogAyarla(k: Katalog | null): void {
  etkin = k;
}

export function katalog(): Katalog {
  return etkin ?? gomuluKatalog();
}

/** İki katalog aynı mı (indirilen yeni mi diye). */
export function ayniKatalog(a: Katalog, b: Katalog): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Katalog en çok bu kadar saatte bir indirilir. */
export const KATALOG_ARALIGI_SAAT = 6;

export function katalogDenensinMi(sonDeneme: string | null, simdi: Date = new Date()): boolean {
  if (!sonDeneme) return true;
  const t = Date.parse(sonDeneme);
  return !Number.isFinite(t) || simdi.getTime() - t >= KATALOG_ARALIGI_SAAT * 3600_000;
}
