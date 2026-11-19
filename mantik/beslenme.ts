// Beslenme planı (pilot 19 Kasım, P-134; çizim: "Rites Koçum ekranları" · Beslenme satırı).
// Diyetisyenin planı bir kartın `beslenme` parçasıdır: `blok.metin` planın JSON'u (haftanın
// günlerine göre öğünler, tarifler, alışveriş malzemeleri). Kişinin o günkü durumu kayıtta:
// `degerler[blok.id]` = {"<öğün>": {"d": "yedi"} | {"d": "farkli", "ne": "…", "m": "az"|"normal"|"cok"}};
// tabağın fotoğrafı `fotolar["<blok>:<öğün>"]`. Hesap yok: makro değil, besin değişimleri.
// Bütün öğünler işaretlenince kart Yaptım olur; biri geri alınınca kalkar.

import type { Kayit } from './kart';
import { haftaGunu, type Gun } from './tarih';

export interface Ogun {
  id: string;
  /** Kahvaltı · Öğle · Ara öğün · Akşam */
  ad: string;
  saat: string | null;
  /** Tek satır: "Izgara tavuk, bulgur pilavı, salata" */
  icerik: string;
  miktarlar: { ad: string; miktar: string }[];
  /** "3 et", "2 ekmek" */
  degisimler: string[];
  /** Aynı değişimlerdeki başka seçenekler (tek dokunuşla "bunu yedim"). */
  secenekler: string[];
  not: string;
  /** Tarifin kimliği. */
  tarif: string | null;
}

export interface Tarif {
  id: string;
  ad: string;
  sure: string;
  degisim: string;
  malzemeler: string[];
  yapilis: string[];
}

export interface BeslenmePlani {
  /** 7 gün (Pzt … Paz) ya da 1 (her gün aynı). */
  gunler: Ogun[][];
  tarifler: Tarif[];
  /** Haftanın alışverişi. */
  alisveris: string[];
}

export type Miktar = 'az' | 'normal' | 'cok';
export const MIKTARLAR: readonly { m: Miktar; ad: string }[] = [
  { m: 'az', ad: 'Az' },
  { m: 'normal', ad: 'Normal' },
  { m: 'cok', ad: 'Çok' },
];

export type OgunDurumu = { d: 'yedi' } | { d: 'farkli'; ne: string; m: Miktar };

const BOS_PLAN: BeslenmePlani = { gunler: [], tarifler: [], alisveris: [] };

function json(s: string | undefined): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

export function planOku(metin: string): BeslenmePlani {
  const v = json(metin) as Partial<BeslenmePlani> | null;
  if (!v || typeof v !== 'object') return BOS_PLAN;
  return {
    gunler: Array.isArray(v.gunler) ? v.gunler : [],
    tarifler: Array.isArray(v.tarifler) ? v.tarifler : [],
    alisveris: Array.isArray(v.alisveris) ? v.alisveris : [],
  };
}

export function planYaz(p: BeslenmePlani): string {
  return JSON.stringify(p);
}

/** O günün öğünleri (7 günlük planda haftanın gününe göre). */
export function gununOgunleri(p: BeslenmePlani, gun: Gun): Ogun[] {
  if (p.gunler.length === 0) return [];
  if (p.gunler.length === 1) return p.gunler[0] ?? [];
  return p.gunler[haftaGunu(gun) % p.gunler.length] ?? [];
}

export function durumlariOku(k: Pick<Kayit, 'degerler'>, blokId: string): Record<string, OgunDurumu> {
  const v = json(k.degerler[blokId]);
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, OgunDurumu>) : {};
}

export function fotoAnahtari(blokId: string, ogunId: string): string {
  return `${blokId}:${ogunId}`;
}

/**
 * Öğünün durumunu yazar (null: geri alınır). Günün bütün öğünleri işaretlenince Yaptım olur,
 * işaretli olmayan öğün kalınca (önceden hepsi işaretliyse) kalkar.
 */
export function ogunYaz(
  k: Kayit,
  blokId: string,
  ogunler: readonly Pick<Ogun, 'id'>[],
  ogunId: string,
  durum: OgunDurumu | null,
): Kayit {
  const eski = durumlariOku(k, blokId);
  const yeni = { ...eski };
  if (durum) yeni[ogunId] = durum;
  else delete yeni[ogunId];
  const hepsi = (d: Record<string, OgunDurumu>) => ogunler.length > 0 && ogunler.every((o) => !!d[o.id]);
  const sonuc: Kayit = { ...k, degerler: { ...k.degerler, [blokId]: JSON.stringify(yeni) } };
  if (!hepsi(eski) && hepsi(yeni)) sonuc.yapildi = true;
  else if (hepsi(eski) && !hepsi(yeni)) sonuc.yapildi = false;
  return sonuc;
}

/** "Yedim" · "Farklı: lahmacun (çok)" */
export function durumMetni(d: OgunDurumu | undefined): string {
  if (!d) return '';
  if (d.d === 'yedi') return 'Yedim';
  const m = MIKTARLAR.find((x) => x.m === d.m);
  return `Farklı: ${d.ne}${m && d.m !== 'normal' ? ` (${m.ad.toLocaleLowerCase('tr')})` : ''}`;
}

/** Günün sıradaki öğünü: işaretlenmemiş ilk öğün. */
export function siradakiOgun(ogunler: readonly Ogun[], durumlar: Record<string, OgunDurumu>): Ogun | null {
  return ogunler.find((o) => !durumlar[o.id]) ?? null;
}
