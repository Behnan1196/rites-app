// Kütüphanem (L-1 … L-4, `03` → kutuphane). Kartın kayıtsız bir kopyası etiketlerle
// (alanlar, tür) saklanır; bulunur, bugüne yeniden eklenir, paylaşılır, bir programa
// eklenir. Programlar kendi tablolarında durur ve Kütüphanem'de de görünür (pilot 20 Ekim).

import { htmldenDuz } from './zenginMetin';
import { alanAdi, type AlanAnahtari } from './alanlar';
import { TURLER, type EtiketTuru, type KatalogBlogu } from './katalog';
import { tekrarMetni } from './gorunurluk';
import {
  gecerliHatirlatma,
  yeniKart,
  type Blok,
  type BlokTuru,
  type Hatirlatma,
  type Kart,
  type SabitAlan,
  type Tekrar,
} from './kart';
import { trKucuk } from './metin';
import type { KartPaketi } from './paylasim';
import type { Gun } from './tarih';

export { TURLER, turMu, turTahmini, type EtiketTuru } from './katalog';

export type KayitTuru = 'kart';

/** Kartın bloğu, kayıtsız (katalogla aynı biçim). */
export type KutuphaneBlogu = KatalogBlogu;

export interface KartIcerigi {
  baslik: string;
  kisa: string;
  saat: string | null;
  hatirlatma: Hatirlatma | null;
  tekrar: Tekrar | null;
  bloklar: KutuphaneBlogu[];
  /** P-65: kart görünümünde değiştirilemeyen alanlar. */
  sabitler?: SabitAlan[];
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

export type KutuphaneKaydi = Ortak & { tur: 'kart'; icerik: KartIcerigi };

export const KENDIM = 'Kendim';

type BlokBenzeri = Pick<Blok, 'tur' | 'ad' | 'metin' | 'birim' | 'dakika' | 'maddeler'> & {
  dosya?: string | null;
  sabit?: boolean;
};

function blokKopyasi(b: BlokBenzeri): KutuphaneBlogu {
  return {
    tur: b.tur,
    ad: b.ad,
    metin: b.metin,
    birim: b.birim,
    dakika: b.dakika,
    maddeler: [...b.maddeler],
    dosya: b.dosya ?? null,
    ...(b.sabit ? { sabit: true } : {}),
  };
}

/** Kartın kayıtsız kopyası (tarih, yapıldı, değerler gitmez). */
export function kartIcerigi(
  kart: Pick<Kart, 'baslik' | 'kisa' | 'saat' | 'hatirlatma' | 'tekrar' | 'sabitler'>,
  bloklar: readonly BlokBenzeri[],
): KartIcerigi {
  return {
    baslik: kart.baslik,
    kisa: kart.kisa,
    saat: kart.saat,
    hatirlatma: kart.hatirlatma,
    tekrar: kart.tekrar ? { ...kart.tekrar, gunler: kart.tekrar.gunler ? [...kart.tekrar.gunler] : null } : null,
    bloklar: bloklar.map(blokKopyasi),
    ...(kart.sabitler?.length ? { sabitler: [...kart.sabitler] } : {}),
  };
}

/** Gelenler'den gelen paket → içerik. */
export function paketIcerigi(p: KartPaketi): KartIcerigi {
  return {
    baslik: p.baslik,
    kisa: p.kisa,
    saat: p.saat,
    hatirlatma: null,
    tekrar: p.tekrar,
    bloklar: p.bloklar.map(blokKopyasi),
  };
}

/** "Kendim" ya da Gelenler'den eklenmiş kartta "Gönderen: Elif". */
export function kaynakMetni(kart: Pick<Kart, 'kaynak' | 'gelenKimden'>): string {
  return kart.kaynak === 'gelen' && kart.gelenKimden ? `Gönderen: ${kart.gelenKimden}` : KENDIM;
}

/** "Hareket · Zihin · Egzersiz" */
export function etiketMetni(k: Pick<KutuphaneKaydi, 'alanlar' | 'etiketTur'>): string {
  return [...k.alanlar.map(alanAdi), k.etiketTur].join(' · ');
}

/** Listede ikinci satır: kaynak. */
export function kayitAltMetni(k: KutuphaneKaydi): string {
  return k.kaynak;
}

export function kutuphaneSayiMetni(adet: number): string {
  return `${adet} kayıt`;
}

function aranan(k: KutuphaneKaydi): string {
  const kartlar = [k.icerik];
  const parcalar = [
    k.baslik,
    etiketMetni(k),
    ...kartlar.flatMap((c) => [
      c.baslik,
      htmldenDuz(c.kisa),
      ...c.bloklar.flatMap((b) => [b.ad, htmldenDuz(b.metin), ...b.maddeler]),
    ]),
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
    (k) =>
      (!s.alan || k.alanlar.includes(s.alan)) && (!s.tur || k.etiketTur === s.tur) && (!q || aranan(k).includes(q)),
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
  'Kaydettiğin kart henüz yok. Bir kartı açıp ⋯ menüsünden "Kütüphaneye kaydet" dediğinde burada durur; ajandaya koymadan açıp düzeltebilirsin.';
export const SUZGECTE_YOK = 'Bu süzgeçle kayıt yok.';

/** Ayrıntıda blok satırı: "Liste: Malzemeler", "Talimat". */
const BLOK_ADI: Record<BlokTuru, string> = {
  talimat: 'Talimat',
  video: 'Video',
  liste: 'Liste',
  adimlar: 'Proje adımları',
  foto: 'Fotoğraf',
  dosya: 'Dosya',
  sayac: 'Zamanlayıcı',
  kronometre: 'Kronometre',
  olcum: 'Ölçüm',
  adet: 'Sayarak',
  puan: 'Puan',
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
export function kutuphanedenKart(
  c: KartIcerigi,
  bugunGun: Gun,
  kimlik: () => string,
  sira = Date.now(),
): { kart: Kart; bloklar: YeniBlok[] } {
  return {
    kart: yeniKart(kimlik(), {
      baslik: c.baslik,
      kisa: c.kisa,
      tarih: bugunGun,
      saat: c.saat,
      hatirlatma: gecerliHatirlatma(c.hatirlatma, c.saat),
      tekrar: c.tekrar ? { ...c.tekrar, gunler: c.tekrar.gunler ? [...c.tekrar.gunler] : null } : null,
      sira,
      sabitler: c.sabitler?.length ? [...c.sabitler] : null,
    }),
    bloklar: c.bloklar.map((b) => ({ ...blokKopyasi(b), id: kimlik() })),
  };
}

/** Kütüphanedeki kartı paylaşmak için paket (dosyalar gitmez; etiketler gider). */
export function kayitPaketi(k: KutuphaneKaydi): KartPaketi {
  const c = k.icerik;
  return {
    surum: 1,
    baslik: c.baslik,
    kisa: c.kisa,
    saat: c.saat,
    tekrar: c.tekrar,
    bloklar: c.bloklar
      .filter((b) => b.tur !== 'foto' && b.tur !== 'dosya')
      .map((b) => ({
        tur: b.tur,
        ad: b.ad,
        metin: b.metin,
        birim: b.birim,
        dakika: b.dakika,
        maddeler: [...b.maddeler],
        ...(b.sabit ? { sabit: true } : {}),
      })),
    alanlar: [...k.alanlar],
    etiketTur: k.etiketTur,
    sabitler: [...(c.sabitler ?? [])],
  };
}
