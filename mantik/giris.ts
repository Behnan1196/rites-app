// Giriş ekranı için saf yardımcılar.

import type { Kart } from './kart';

/**
 * Bugün sırada (G-8): bugün görünen, yapılmamış kartlardan saati şimdiden
 * sonra olan ilki; yoksa listedeki ilk yapılmamış. `kartlar` günün sırasıyla
 * (saat sırası, saatsizler sonda) verilir. `kalan`: bu karttan başka kaç yapılmamış iş var.
 */
export function siradaki<T extends Kart>(
  kartlar: readonly T[],
  yapilanlar: ReadonlySet<string>,
  simdiSaat: string,
): { kart: T; kalan: number } | null {
  const acik = kartlar.filter((k) => !yapilanlar.has(k.id));
  const kart = acik.find((k) => k.saat !== null && k.saat > simdiSaat) ?? acik[0];
  return kart ? { kart, kalan: acik.length - 1 } : null;
}

/** "Bugün 4 iş daha var" / "Bugünün son işi" */
export function kalanIsMetni(kalan: number): string {
  return kalan > 0 ? `Bugün ${kalan} iş daha var` : 'Bugünün son işi';
}

/** Bir öğeyi listede başka bir yere taşır (sürükleyerek sıralama). */
export function yerDegistir<T>(liste: readonly T[], nereden: number, nereye: number): T[] {
  const sonuc = [...liste];
  const [oge] = sonuc.splice(nereden, 1);
  if (oge === undefined) return [...liste];
  sonuc.splice(Math.max(0, Math.min(nereye, sonuc.length)), 0, oge);
  return sonuc;
}

/** Notlar açıkken Giriş'te görünen en yeni notlar (G-2). */
export function enYeniNotlar<T extends { olusturma: string }>(notlar: readonly T[], adet = 2): T[] {
  return [...notlar].sort((a, b) => b.olusturma.localeCompare(a.olusturma)).slice(0, adet);
}
