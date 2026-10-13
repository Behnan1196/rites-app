// Kütüphanem (L-1 … L-4, `03` → kutuphane). Kart ya da planın kayıtsız bir kopyası
// etiketlerle (alanlar, tür) saklanır; bulunur, bugüne yeniden eklenir, paylaşılır.
// Plan kaydı bir kopyadır; plan sürmeye devam eder (11. görev kararı).

import { alanAdi, type AlanAnahtari } from './alanlar';
import { tekrarMetni } from './gorunurluk';
import { yeniKart, type Blok, type BlokTuru, type HatirlatmaSecimi, type Kart, type Tekrar } from './kart';
import { trKucuk } from './metin';
import type { KartPaketi } from './paylasim';
import type { GununSorusu, Plan } from './plan';
import { gunEkle, gunFarki, type Gun } from './tarih';

export const TURLER = ['Tarif', 'Egzersiz', 'Bilgi', 'Ölçüm', 'Rutin', 'Diğer'] as const;
export type EtiketTuru = (typeof TURLER)[number];

export type KayitTuru = 'kart' | 'plan';

export interface KutuphaneBlogu {
  tur: BlokTuru;
  ad: string;
  metin: string;
  birim: string;
  dakika: number | null;
  maddeler: string[];
  /** Telefondaki fotoğraf / dosya (yalnız bu telefonda). */
  dosya: string | null;
}

export interface KartIcerigi {
  baslik: string;
  kisa: string;
  saat: string | null;
  hatirlatma: HatirlatmaSecimi | null;
  tekrar: Tekrar | null;
  bloklar: KutuphaneBlogu[];
}

export interface PlanKarti extends KartIcerigi {
  /** Planın başlangıcından kaç gün sonra; tarihsiz adımda null. */
  gun: number | null;
}

export interface PlanIcerigi {
  ad: string;
  alan: AlanAnahtari;
  neden: string;
  hedef: string;
  /** Planın gün olarak uzunluğu (bitiş - başlangıç); bitişsizse null. */
  sure: number | null;
  gununSorusu: GununSorusu | null;
  kartlar: PlanKarti[];
}

interface Ortak {
  id: string;
  baslik: string;
  alanlar: AlanAnahtari[];
  etiketTur: EtiketTuru;
  /** "Kendim" · "Gönderen: Elif" */
  kaynak: string;
  paylasilabilir: boolean;
  olusturma: string;
}

export type KutuphaneKaydi = (Ortak & { tur: 'kart'; icerik: KartIcerigi }) | (Ortak & { tur: 'plan'; icerik: PlanIcerigi });

export const KENDIM = 'Kendim';

type BlokBenzeri = Pick<Blok, 'tur' | 'ad' | 'metin' | 'birim' | 'dakika' | 'maddeler'> & { dosya?: string | null };

function blokKopyasi(b: BlokBenzeri): KutuphaneBlogu {
  return { tur: b.tur, ad: b.ad, metin: b.metin, birim: b.birim, dakika: b.dakika, maddeler: [...b.maddeler], dosya: b.dosya ?? null };
}

/** Kartın kayıtsız kopyası (tarih, yapıldı, değerler gitmez). */
export function kartIcerigi(kart: Pick<Kart, 'baslik' | 'kisa' | 'saat' | 'hatirlatma' | 'tekrar'>, bloklar: readonly BlokBenzeri[]): KartIcerigi {
  return {
    baslik: kart.baslik,
    kisa: kart.kisa,
    saat: kart.saat,
    hatirlatma: kart.hatirlatma,
    tekrar: kart.tekrar ? { ...kart.tekrar, gunler: kart.tekrar.gunler ? [...kart.tekrar.gunler] : null } : null,
    bloklar: bloklar.map(blokKopyasi),
  };
}

/** Gelenler'den gelen paket → içerik. */
export function paketIcerigi(p: KartPaketi): KartIcerigi {
  return { baslik: p.baslik, kisa: p.kisa, saat: p.saat, hatirlatma: null, tekrar: p.tekrar, bloklar: p.bloklar.map(blokKopyasi) };
}

/** Tahmini tür (L-1): liste + talimat → Tarif; video → Egzersiz; yalnız ölçüm/talimat → Ölçüm/Bilgi. */
export function turTahmini(bloklar: readonly { tur: BlokTuru }[]): EtiketTuru {
  const t = bloklar.map((b) => b.tur);
  if (t.includes('liste') && t.includes('talimat')) return 'Tarif';
  if (t.includes('video')) return 'Egzersiz';
  if (t.length && t.every((x) => x === 'olcum' || x === 'talimat')) return t.includes('olcum') ? 'Ölçüm' : 'Bilgi';
  return 'Diğer';
}

/** "Kendim" ya da Gelenler'den eklenmiş kartta "Gönderen: Elif". */
export function kaynakMetni(kart: Pick<Kart, 'kaynak' | 'gelenKimden'>): string {
  return kart.kaynak === 'gelen' && kart.gelenKimden ? `Gönderen: ${kart.gelenKimden}` : KENDIM;
}

/** "Hareket · Zihin · Egzersiz" */
export function etiketMetni(k: Pick<KutuphaneKaydi, 'alanlar' | 'etiketTur'>): string {
  return [...k.alanlar.map(alanAdi), k.etiketTur].join(' · ');
}

/** Listede ikinci satır: kaynak; planda "Plan · 28 gün · 4 kart". */
export function kayitAltMetni(k: KutuphaneKaydi): string {
  if (k.tur === 'kart') return k.kaynak;
  const p = k.icerik;
  return ['Plan', p.sure !== null ? `${p.sure} gün` : null, `${p.kartlar.length} kart`].filter(Boolean).join(' · ');
}

export function kutuphaneSayiMetni(adet: number): string {
  return `${adet} kayıt`;
}

function aranan(k: KutuphaneKaydi): string {
  const kartlar = k.tur === 'kart' ? [k.icerik] : k.icerik.kartlar;
  const parcalar = [
    k.baslik,
    etiketMetni(k),
    k.tur === 'plan' ? `${k.icerik.neden} ${k.icerik.hedef}` : '',
    ...kartlar.flatMap((c) => [c.baslik, c.kisa, ...c.bloklar.flatMap((b) => [b.ad, b.metin, ...b.maddeler])]),
  ];
  return trKucuk(parcalar.join(' '));
}

export interface KutuphaneSuzgeci {
  sorgu: string;
  alan: AlanAnahtari | null;
  tur: EtiketTuru | null;
}

/** Arama (başlık, etiketler, içerik; Türkçe harfler doğru), alan ve tür süzgeci. */
export function kutuphaneSuz(kayitlar: readonly KutuphaneKaydi[], s: KutuphaneSuzgeci): KutuphaneKaydi[] {
  const q = trKucuk(s.sorgu.trim());
  return kayitlar.filter(
    (k) => (!s.alan || k.alanlar.includes(s.alan)) && (!s.tur || k.etiketTur === s.tur) && (!q || aranan(k).includes(q)),
  );
}

/** Süzgeç çipleri: yalnız kayıtlarda geçen alanlar ve türler (sabit sırayla). */
export function suzgecSecenekleri(
  kayitlar: readonly KutuphaneKaydi[],
  tumAlanlar: readonly AlanAnahtari[],
): { alanlar: AlanAnahtari[]; turler: EtiketTuru[] } {
  const a = new Set(kayitlar.flatMap((k) => k.alanlar));
  const t = new Set(kayitlar.map((k) => k.etiketTur));
  return { alanlar: tumAlanlar.filter((x) => a.has(x)), turler: TURLER.filter((x) => t.has(x)) };
}

export const BOS_KUTUPHANE =
  'Henüz kütüphanende kayıt yok. Bir kartı açıp "Kütüphaneye kaydet" dediğinde burada durur.';
export const SUZGECTE_YOK = 'Bu süzgeçle kayıt yok.';

/** Ayrıntıda blok satırı: "Liste: Malzemeler", "Talimat". */
const BLOK_ADI: Record<BlokTuru, string> = {
  talimat: 'Talimat',
  video: 'Video',
  liste: 'Liste',
  foto: 'Fotoğraf',
  dosya: 'Dosya',
  sayac: 'Zamanlayıcı',
  olcum: 'Ölçüm',
  gunnot: 'Günün notu',
  gelfoto: 'Gelişim fotoğrafı',
};

export function blokBasligi(b: Pick<KutuphaneBlogu, 'tur' | 'ad'>): string {
  return BLOK_ADI[b.tur] + (b.ad ? `: ${b.ad}` : '');
}

/** Kart içeriğinin meta satırı: "07:30 · Her gün". */
export function icerikMetaMetni(c: Pick<KartIcerigi, 'saat' | 'tekrar'>): string {
  return [c.saat, c.tekrar ? tekrarMetni(c.tekrar) : null].filter(Boolean).join(' · ');
}

// ---- Yeniden kullanmak ------------------------------------------------------------

export type YeniBlok = KutuphaneBlogu & { id: string };

/**
 * "Bugün Ajandama ekle" (L-2): düzenlenebilir kopya; saat ve tekrar korunur,
 * dizi bugün başlar (11. görev kararı).
 */
export function kutuphanedenKart(c: KartIcerigi, bugunGun: Gun, kimlik: () => string, sira = Date.now()): { kart: Kart; bloklar: YeniBlok[] } {
  return {
    kart: yeniKart(kimlik(), {
      baslik: c.baslik,
      kisa: c.kisa,
      tarih: bugunGun,
      saat: c.saat,
      hatirlatma: c.saat ? c.hatirlatma : null,
      tekrar: c.tekrar ? { ...c.tekrar, gunler: c.tekrar.gunler ? [...c.tekrar.gunler] : null } : null,
      sira,
    }),
    bloklar: c.bloklar.map((b) => ({ ...blokKopyasi(b), id: kimlik() })),
  };
}

/** Planın kayıtsız kopyası (L-3): kartlar, planın başlangıcına göre günleriyle. */
export function planIcerigi(plan: Plan, kartlar: readonly { kart: Kart; bloklar: readonly BlokBenzeri[] }[]): PlanIcerigi {
  return {
    ad: plan.ad,
    alan: plan.alan,
    neden: plan.neden,
    hedef: plan.hedef,
    sure: plan.bitis ? gunFarki(plan.baslangic, plan.bitis) : null,
    gununSorusu: plan.gununSorusu ? { ...plan.gununSorusu } : null,
    kartlar: [...kartlar]
      .sort((a, b) => a.kart.sira - b.kart.sira)
      .map(({ kart, bloklar }) => ({
        ...kartIcerigi(kart, bloklar),
        gun: kart.tarihsiz || !kart.tarih ? null : Math.max(0, gunFarki(plan.baslangic, kart.tarih)),
      })),
  };
}

export interface YenidenBaslatma {
  plan: Plan;
  duzenliler: { kart: Kart; bloklar: YeniBlok[] }[];
  adimlar: Kart[];
}

/** "Planı yeniden başlat" (L-3): bugünden başlayan yeni plan; kartların günleri kayar. */
export function planiYenidenBaslat(
  p: PlanIcerigi,
  bugunGun: Gun,
  baslangicPuani: number,
  kimlik: () => string,
): YenidenBaslatma {
  const planId = kimlik();
  const bitis = p.sure !== null ? gunEkle(bugunGun, p.sure) : null;
  const plan: Plan = {
    id: planId,
    ad: p.ad,
    alan: p.alan,
    kaynak: 'kendim',
    neden: p.neden,
    hedef: p.hedef,
    baslangic: bugunGun,
    bitis,
    baslangicPuani,
    gununSorusu: p.gununSorusu ? { ...p.gununSorusu } : null,
    durum: 'etkin',
  };
  const duzenliler: YenidenBaslatma['duzenliler'] = [];
  const adimlar: Kart[] = [];
  p.kartlar.forEach((c, i) => {
    const kart = yeniKart(kimlik(), {
      baslik: c.baslik,
      kisa: c.kisa,
      tarih: c.gun === null ? null : gunEkle(bugunGun, c.gun),
      tarihsiz: c.gun === null,
      saat: c.saat,
      hatirlatma: c.saat ? c.hatirlatma : null,
      tekrar: c.tekrar ? { ...c.tekrar, gunler: c.tekrar.gunler ? [...c.tekrar.gunler] : null } : null,
      bitis: c.tekrar ? bitis : null,
      planId,
      sira: i,
    });
    if (c.tekrar || c.bloklar.length > 0) duzenliler.push({ kart, bloklar: c.bloklar.map((b) => ({ ...blokKopyasi(b), id: kimlik() })) });
    else adimlar.push(kart);
  });
  return { plan, duzenliler, adimlar };
}

/** Plan ayrıntısındaki kart satırı: "Sabah yürüyüşü · Her gün · 07:30" / "Adım: …". */
export function planKartiMetni(c: PlanKarti): string {
  if (c.tekrar) return [c.baslik, tekrarMetni(c.tekrar), c.saat].filter(Boolean).join(' · ');
  return `Adım: ${c.baslik}`;
}

/** Kütüphanedeki kartı paylaşmak için paket (dosyalar gitmez; etiketler gider). */
export function kayitPaketi(k: KutuphaneKaydi & { tur: 'kart' }): KartPaketi {
  const c = k.icerik;
  return {
    surum: 1,
    baslik: c.baslik,
    kisa: c.kisa,
    saat: c.saat,
    tekrar: c.tekrar,
    bloklar: c.bloklar
      .filter((b) => b.tur !== 'foto' && b.tur !== 'dosya')
      .map((b) => ({ tur: b.tur, ad: b.ad, metin: b.metin, birim: b.birim, dakika: b.dakika, maddeler: [...b.maddeler] })),
    alanlar: [...k.alanlar],
    etiketTur: k.etiketTur,
  };
}

export function turMu(t: unknown): t is EtiketTuru {
  return typeof t === 'string' && (TURLER as readonly string[]).includes(t);
}
