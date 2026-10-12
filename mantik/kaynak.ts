// Kartın kaynağı (PL-4, A-5, `05` §8): süzme, renk şeridi ve etiket.
// Kaynak: ortak liste maddesi → liste; koç → koç; gelen → gelen; plan → plan;
// diğerleri → kendi kartı (şeritsiz).

import type { Kart } from './kart';

/** 'kendim' · 'gelen' · 'liste' · 'plan:<id>' · 'koc:<ad>' */
export type KaynakAnahtari = string;

export type KaynakTuru = 'kendim' | 'plan' | 'koc' | 'gelen' | 'liste';

export const TUMU = 'tumu';

/** Ortak liste maddesinden gelen sanal kart (10. görev) bu alanı taşır. */
export type KaynakliKart = Kart & { listeAdi?: string | null };

export function kaynakAnahtari(k: KaynakliKart): KaynakAnahtari {
  if (k.listeAdi) return 'liste';
  if (k.kaynak === 'koc') return `koc:${k.gelenKimden ?? ''}`;
  if (k.kaynak === 'gelen') return 'gelen';
  if (k.planId) return `plan:${k.planId}`;
  return 'kendim';
}

export function kaynakTuru(anahtar: KaynakAnahtari): KaynakTuru {
  if (anahtar.startsWith('plan:')) return 'plan';
  if (anahtar.startsWith('koc:')) return 'koc';
  if (anahtar === 'gelen' || anahtar === 'liste') return anahtar;
  return 'kendim';
}

/** Süzme çipindeki ad: "Kendi kartlarım", "Gelenlerden", "Ortak listeler", plan adı, "Ayşe Hanım (koç)". */
export function kaynakAdi(anahtar: KaynakAnahtari, planAdlari: ReadonlyMap<string, string>): string {
  switch (kaynakTuru(anahtar)) {
    case 'plan':
      return planAdlari.get(anahtar.slice(5)) ?? 'Plan';
    case 'koc':
      return `${anahtar.slice(4)} (koç)`;
    case 'gelen':
      return 'Gelenlerden';
    case 'liste':
      return 'Ortak listeler';
    default:
      return 'Kendi kartlarım';
  }
}

/** Kart satırındaki etiket metni; kendi kartında yok. */
export function kaynakEtiketi(k: KaynakliKart, planAdlari: ReadonlyMap<string, string>): string | null {
  const anahtar = kaynakAnahtari(k);
  switch (kaynakTuru(anahtar)) {
    case 'plan':
      return kaynakAdi(anahtar, planAdlari);
    case 'koc':
      return k.gelenKimden ?? 'Koç';
    case 'gelen':
      return `Gelen: ${k.gelenKimden ?? ''}`.trim();
    case 'liste':
      return `Liste: ${k.listeAdi}`;
    default:
      return null;
  }
}

/** Süzme çipleri: önce "Kendi kartlarım", sonra kartı olan öteki kaynaklar (ilk görülme sırasıyla). */
export function kaynaklar(kartlar: readonly KaynakliKart[]): KaynakAnahtari[] {
  const sonuc: KaynakAnahtari[] = ['kendim'];
  for (const k of kartlar) {
    const a = kaynakAnahtari(k);
    if (!sonuc.includes(a)) sonuc.push(a);
  }
  return sonuc;
}

export function suz<T extends KaynakliKart>(kartlar: readonly T[], filtre: KaynakAnahtari): T[] {
  return filtre === TUMU ? [...kartlar] : kartlar.filter((k) => kaynakAnahtari(k) === filtre);
}
