// İçerik kataloğu (pilot 20 Ekim): alanlar, öneri kartları ve öneri programları.
// Sunucudaki katalogdan indirilir (bir uzman yeniledikçe), telefonda saklanır;
// yoksa uygulamayla gelen içerik kullanılır (`hazirIcerik.ts`). İndirme tek
// yönlüdür: sunucuya kişinin verisi gitmez. Kişinin kendi kopyaları (programlarına
// eklediği öneri, ajandasındaki kart) katalog değişince etkilenmez.
//
// Uzman için yazım kuralları `docs/icerik.md`de. Katalogdaki her öğe burada
// denetlenir; bozuk öğe atlanır, geri kalanı kullanılır.

import { ALANLAR, HAZIR_CESITLER, type EtkinlikBlogu } from './hazirIcerik';
import {
  hatirlatmaCoz,
  hatirlatmaYaz,
  ICERIK_BLOKLARI,
  KAYIT_BLOKLARI,
  type BlokTuru,
  type Hatirlatma,
  type Tekrar,
} from './kart';
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
  const olcumcu = (x: BlokTuru) => x === 'olcum' || x === 'adet' || x === 'puan';
  if (t.length && t.every((x) => olcumcu(x) || x === 'talimat')) return t.some(olcumcu) ? 'Ölçüm' : 'Bilgi';
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
  /** P-65: kart görünümünde değiştirilemez. */
  sabit?: boolean;
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
  /** P-81: kartla gelen hatırlatma ("23:00'te yat": 22:30'da); yoksa null. */
  hatirlatma?: Hatirlatma | null;
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

/**
 * İsimli kart çeşidi (pilot 24 Ekim, P-41): boş bir kalıp. Kişi "Ne tür bir kart?"
 * sorusunda seçer; kart formu bu parçalar ve zamanla açılır, kişi içini doldurur.
 * Çeşitler alan alan tasarlanır (ilk: Beslenme); tasarımcı Ayarlar → Kart
 * çeşitleri'nden yayınlar, sunucudaki katalogdan herkese iner.
 */
export interface KartCesidi {
  id: string;
  /** Alanın anahtarı (beslenme…). */
  alan: string;
  ad: string;
  ikon: string | null;
  /** Seçim ekranında adın altında. */
  aciklama: string;
  /** Kartın ilk başlığı; boşsa kişi yazar. */
  baslik: string;
  /** Başlık boşken alanın ipucu ("Örneğin: Mercimek çorbası"). */
  baslikIpucu: string;
  saat: string | null;
  /** null = tek seferlik. */
  tekrar: Tekrar | null;
  bloklar: KatalogBlogu[];
  /** Tekrarlıda seri (art arda günler) sayılsın mı (P-49); null: kural (`mantik/karakter`). */
  seri: boolean | null;
}

export interface Katalog {
  alanlar: KatalogAlan[];
  kartlar: KatalogKart[];
  programlar: KatalogProgram[];
  cesitler: KartCesidi[];
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

/** Tek bir çeşit satırı (sunucu ya da telefon biçimi); bozuksa null. */
export function cesitCoz(x: unknown): KartCesidi | null {
  const c = nesne(x);
  if (!c) return null;
  const id = metin(c.id);
  const ad = metin(c.ad);
  const alan = metin(c.alan);
  if (!id || !ad || !alan) return null;
  return {
    id,
    alan,
    ad,
    ikon: metin(c.ikon) || null,
    aciklama: metin(c.aciklama),
    baslik: metin(c.baslik),
    baslikIpucu: metin(c.baslik_ipucu ?? c.baslikIpucu),
    saat: saatCoz(c.saat),
    tekrar: c.tekrar === null || c.tekrar === undefined ? null : tekrarCoz(c.tekrar),
    bloklar: (Array.isArray(c.bloklar) ? c.bloklar : []).map(blokCoz).filter((b): b is KatalogBlogu => !!b),
    seri: typeof c.seri === 'boolean' ? c.seri : null,
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
      // Sunucuda metin ('ozel|0|22:30'); telefonda saklı katalogda nesne olabilir.
      hatirlatma: hatirlatmaCoz(
        typeof c.hatirlatma === 'string'
          ? c.hatirlatma
          : c.hatirlatma && typeof c.hatirlatma === 'object'
            ? hatirlatmaYaz(c.hatirlatma as Hatirlatma)
            : null,
      ),
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
  // Çeşitler sonradan geldi (P-41): eski katalogda ya da sunucuda tablo yoksa uygulamayla gelenler.
  const cesitler: KartCesidi[] = [];
  if (Array.isArray(k.cesitler)) {
    for (const x of dizi(k.cesitler)) {
      const c = cesitCoz(x);
      if (c && !cesitler.some((y) => y.id === c.id)) cesitler.push(c);
    }
  } else cesitler.push(...gomuluKatalog().cesitler);
  return { alanlar, kartlar, programlar, cesitler };
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
      // Bağlantı yok (`09`); kişi kendi videosunu ekler. P-81: yönerge kartın açıklamasında.
      return [bos('video')];
    case 'olcum':
      return [{ ...bos('olcum'), ad: b.ad, birim: b.birim }];
    case 'talimat':
      return [{ ...bos('talimat'), metin: b.metin }];
    case 'gunnot':
      return [{ ...bos('gunnot'), metin: b.soru ?? '' }];
    case 'adet':
      return [{ ...bos('adet'), ad: b.ad, birim: b.birim, dakika: b.hedef ?? null }];
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
        const bloklar = e.bloklar.flatMap(etkinlikBloklari);
        return {
          id: e.id,
          alanlar: [a.anahtar],
          baslik: e.baslik,
          kisa: e.kisa ?? '',
          saat: e.saat,
          hatirlatma: e.hatirlatma ?? null,
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
    cesitler: HAZIR_CESITLER.map((c) => ({
      ...c,
      tekrar: c.tekrar ? { ...c.tekrar, gunler: c.tekrar.gunler ? [...c.tekrar.gunler] : null } : null,
      bloklar: c.bloklar.map((b) => ({ ...b, maddeler: [...b.maddeler] })),
    })),
  };
  return gomulu;
}

// ---- Şu anki katalog -------------------------------------------------------------------------

let etkin: Katalog | null = null;

/** İndirilen (ya da telefonda saklı) katalog; null verilirse uygulamayla gelen kullanılır. */
export function katalogAyarla(k: Katalog | null): void {
  etkin = k;
}

let sonHam: Katalog | null = null;
let sonSade: Katalog | null = null;

/** Şu anki katalog, kişiye gösterildiği gibi (P-79: `sadeKatalog`). */
export function katalog(): Katalog {
  const ham = etkin ?? gomuluKatalog();
  if (ham !== sonHam || !sonSade) {
    sonHam = ham;
    sonSade = sadeKatalog(ham);
  }
  return sonSade;
}

/**
 * Rites önerilerinin sade hali (pilot 31 Ekim, P-79; 1 Kasım, P-81), sunucudaki içerik ne olursa:
 * - Açıklaması boş kartta talimat parçası açıklamaya taşınır (normal kullanıcı açıklama kullanır).
 * - Tek kartlı öneri programı gösterilmez (program kişinin kartlarından sonra kurulur; öneriler
 *   tek tek ajandaya alınır, süresiz).
 */
export function sadeKatalog(k: Katalog): Katalog {
  const kartlar = k.kartlar.map((c): KatalogKart => {
    const talimat = !c.kisa.trim() ? c.bloklar.find((b) => b.tur === 'talimat' && b.metin.trim()) : undefined;
    if (!talimat) return c;
    return { ...c, kisa: talimat.metin, bloklar: c.bloklar.filter((b) => b !== talimat) };
  });
  const kartVar = new Set(kartlar.map((c) => c.id));
  return {
    ...k,
    kartlar,
    programlar: k.programlar.filter((p) => p.kartlar.filter((x) => kartVar.has(x.kart)).length > 1),
  };
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
