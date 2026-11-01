// Sayarak parçası (P-39; P-81 su sayacı): günün sayısı kayıtta. Hedefi olan sayaçta hedefe
// ulaşınca kart kendiliğinden Yaptım olur; hedefin altına inince Yaptım kalkar (yalnız hedef
// sınırı geçilince; kişinin elle verdiği Yaptım başka zaman değişmez).

import type { Kayit } from './kart';

/** Simgeli sayaç (bardaklar) en çok bu kadar hedefte; daha büyük hedefte − / + düğmeleri. */
export const SIMGELI_EN_COK = 12;

export function adetDegeri(kayit: Pick<Kayit, 'degerler'>, blokId: string): number {
  return Math.max(0, Number(kayit.degerler[blokId] ?? 0) || 0);
}

/** Günün sayısını `yeni` yapar; hedef sınırı geçilirse Yaptım'ı da değiştirir. */
export function adetYaz(kayit: Kayit, blokId: string, yeni: number, hedef: number | null): Kayit {
  const eski = adetDegeri(kayit, blokId);
  const sayi = Math.max(0, Math.round(yeni));
  const sonuc: Kayit = { ...kayit, degerler: { ...kayit.degerler, [blokId]: String(sayi) } };
  if (hedef && hedef > 0) {
    if (eski < hedef && sayi >= hedef) sonuc.yapildi = true;
    else if (eski >= hedef && sayi < hedef) sonuc.yapildi = false;
  }
  return sonuc;
}

/** Simgeye dokunuş: i. simge (0'dan) doluysa ve son doluysa bir azalır; değilse i + 1 olur. */
export function simgeDokunusu(sayi: number, i: number): number {
  return sayi === i + 1 ? i : i + 1;
}
