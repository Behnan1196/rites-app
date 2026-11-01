// Kartın listesinde bir maddeyi yerinde düzeltme ya da silme (pilot 1 Kasım, P-86).
// Düzeltmede sıra değişmez, işaretler yerinde kalır; silmede o maddenin işareti de gider.

import type { AdimDurumu } from './adimlar';

/** `yeni` null: madde silinir. */
export function maddeleriDuzelt(maddeler: readonly string[], i: number, yeni: string | null): string[] {
  if (i < 0 || i >= maddeler.length) return [...maddeler];
  if (yeni === null) return maddeler.filter((_, j) => j !== i);
  const t = yeni.trim();
  if (!t) return [...maddeler];
  return maddeler.map((m, j) => (j === i ? t : m));
}

/** Adımlar: silinen adımın yapıldığı gün de gider; kalanların hepsi yapılmışsa bitiş korunur. */
export function adimDurumunuDuzelt(d: AdimDurumu, i: number, yeni: string | null): AdimDurumu {
  if (yeni !== null) return d;
  return { ...d, yapilan: d.yapilan.filter((_, j) => j !== i) };
}

/** Günlük listenin bir gündeki işaretleri: silinen maddenin işareti çıkar. */
export function isaretleriDuzelt(isaretler: readonly boolean[], i: number, yeni: string | null): boolean[] {
  return yeni === null ? isaretler.filter((_, j) => j !== i) : [...isaretler];
}
