// Dikte (söyleneni yazıya çevirme) için saf yardımcılar (pilot 21 Ekim).

/** Önceki metnin sonuna yeni parçayı bir boşlukla ekler. */
export function birlestir(onceki: string, yeni: string): string {
  const a = onceki.trimEnd();
  const b = yeni.trim();
  if (!b) return onceki;
  return a ? `${a} ${b}` : b;
}

/**
 * Yeni ara sonuç öncekinin devamı mı (aynı başlangıç), yoksa duraklamadan sonra
 * baştan başlayan yeni bir parça mı. Büyük-küçük harf ve noktalama sayılmaz.
 */
export function baslangicTutar(onceki: string, yeni: string): boolean {
  const k = (t: string) =>
    t
      .toLocaleLowerCase('tr')
      .replace(/[^\p{L}\p{N} ]/gu, '')
      .trim();
  const a = k(onceki);
  const b = k(yeni);
  const n = Math.min(a.length, b.length, 12);
  return n === 0 || a.slice(0, n) === b.slice(0, n);
}
