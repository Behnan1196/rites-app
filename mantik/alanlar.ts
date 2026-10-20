// Alanlar (pilot 20 Ekim): hazır alanlar içerik kataloğundan gelir (`katalog.ts`;
// uzman yeniledikçe indirilir, yoksa uygulamayla gelen dokuz alan); kişi kendi
// alanlarını da ekler (telefonda `alan_durumu`nda durur, `ozelAlanlariAyarla` ile
// buraya gelir). Anahtarlar sabittir; katalogdan kalkan alan kişinin etiketlerinde
// adıyla kalır.

import { ALANLAR } from './hazirIcerik';
import { katalog } from './katalog';

/** Hazır alanın anahtarı ya da kişinin eklediği alanın `ozel-…` anahtarı. */
export type AlanAnahtari = string;

export interface Alan {
  anahtar: AlanAnahtari;
  ad: string;
  aciklama: string;
  /** Ionicons simge adı; null = yaprak. */
  ikon: string | null;
}

/** Katalogdaki (hazır) alanların anahtarları, sırasıyla. */
export function hazirAlanAnahtarlari(): AlanAnahtari[] {
  return katalog().alanlar.map((a) => a.anahtar);
}

// ---- Kişinin kendi alanları --------------------------------------------------

export interface OzelAlan {
  anahtar: AlanAnahtari;
  ad: string;
  aciklama: string;
}

let ozelAlanlar: readonly OzelAlan[] = [];

/** Veritabanından okununca çağrılır; `alanBul` / `alanAdi` / `tumAlanlar` bunları da bilir. */
export function ozelAlanlariAyarla(liste: readonly OzelAlan[]): void {
  ozelAlanlar = liste;
}

export const OZEL_ONEK = 'ozel-';

export function ozelMi(anahtar: AlanAnahtari): boolean {
  return anahtar.startsWith(OZEL_ONEK);
}

function ozeldenAlan(o: OzelAlan): Alan {
  return { anahtar: o.anahtar, ad: o.ad, aciklama: o.aciklama, ikon: null };
}

function katalogdan(): Alan[] {
  return katalog().alanlar.map((a) => ({ anahtar: a.anahtar, ad: a.ad, aciklama: a.aciklama, ikon: a.ikon }));
}

/** Hazır alanlar (katalogdan), ardından kişinin eklediği alanlar. */
export function tumAlanlar(): Alan[] {
  return [...katalogdan(), ...ozelAlanlar.map(ozeldenAlan)];
}

/** Katalogda, kişinin alanlarında ya da (katalogdan kalkmışsa) uygulamayla gelenlerde arar. */
export function alanBul(anahtar: string): Alan | undefined {
  const hazir = katalogdan().find((a) => a.anahtar === anahtar);
  if (hazir) return hazir;
  const o = ozelAlanlar.find((a) => a.anahtar === anahtar);
  if (o) return ozeldenAlan(o);
  const eski = ALANLAR.find((a) => a.anahtar === anahtar);
  return eski ? { anahtar: eski.anahtar, ad: eski.ad, aciklama: eski.aciklama, ikon: eski.ikon } : undefined;
}

export function alanAdiHatasi(ad: string, varOlanlar: readonly Pick<Alan, 'ad'>[]): string | null {
  const t = ad.trim();
  if (!t) return 'Alana bir ad ver.';
  if (varOlanlar.some((a) => a.ad.toLocaleLowerCase('tr') === t.toLocaleLowerCase('tr')))
    return 'Bu adla bir alan var.';
  return null;
}

export function alanAdi(anahtar: string): string {
  return alanBul(anahtar)?.ad ?? '';
}

/** Yeni kişide Yaşam Tarzım'da açık mı (katalog söyler; kişinin eklediği alan açık). */
export function varsayilanAcikMi(anahtar: AlanAnahtari): boolean {
  return katalog().alanlar.find((a) => a.anahtar === anahtar)?.varsayilanAcik ?? true;
}

/** Alan puanının sözleri (1–5). */
export const PUAN_SOZLERI = ['', 'Çok zayıf', 'Zayıf', 'Orta', 'İyi', 'Çok iyi'] as const;
