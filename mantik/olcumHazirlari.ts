// Günlük ölçümler (pilot 4 Kasım, P-87): bir kartta birden çok ölçüm (su, kahve, enerji, uyku…).
// "+ Ekle → Ölçüm" önce hazırları gösterir; dokununca hemen eklenir. "Kendin kur": Sayarak ·
// Sayı · Puan. Ölçüm parçaları (Sayarak, Ölçüm, Puan) bir kartta birden çok olabilir.

import type { BlokTuru } from './kart';

/** Bir kartta birden çok kez eklenebilen parçalar. */
export const COKLU_PARCALAR: readonly BlokTuru[] = ['adet', 'olcum', 'puan'];

export interface OlcumHaziri {
  /** Düğmedeki ad. */
  ad: string;
  tur: 'adet' | 'olcum' | 'puan';
  birim: string;
  /** Sayarak'ta günlük hedef (`dakika` alanında). */
  hedef: number | null;
  ipucu: string;
}

export const OLCUM_HAZIRLARI: readonly OlcumHaziri[] = [
  { ad: 'Su', tur: 'adet', birim: 'bardak', hedef: 8, ipucu: 'Bardak bardak, hedef 8' },
  { ad: 'Çay', tur: 'adet', birim: 'bardak', hedef: null, ipucu: 'Kaç bardak' },
  { ad: 'Kahve', tur: 'adet', birim: 'fincan', hedef: null, ipucu: 'Kaç fincan' },
  { ad: 'Tuvalet', tur: 'adet', birim: 'kez', hedef: null, ipucu: 'Günde kaç kez' },
  { ad: 'Nefes egzersizi', tur: 'olcum', birim: 'dk', hedef: null, ipucu: 'Kaç dakika' },
  { ad: 'Uyku', tur: 'olcum', birim: 'saat', hedef: null, ipucu: 'Kaç saat uyudun' },
  { ad: 'Kilo', tur: 'olcum', birim: 'kg', hedef: null, ipucu: 'Kaç kilo' },
  { ad: 'Enerji', tur: 'puan', birim: '', hedef: null, ipucu: '1 – 5' },
  { ad: 'Zihin açıklığı', tur: 'puan', birim: '', hedef: null, ipucu: '1 – 5' },
];

/** Kendin kur: üç ölçüm türü. */
export const OLCUM_TURLERI: readonly { tur: 'adet' | 'olcum' | 'puan'; ad: string; aciklama: string }[] = [
  { tur: 'adet', ad: 'Sayarak', aciklama: 'Dokundukça bir artar (bardak, fincan, kez)' },
  { tur: 'olcum', ad: 'Sayı', aciklama: 'Bir değer yazılır (kilo, saat, dakika)' },
  { tur: 'puan', ad: 'Puan', aciklama: '1 ile 5 arasında (enerji, keyif)' },
];

/** Kartta aynı adlı aynı türden ölçüm var mı (hazır ikinci kez önerilmesin). */
export function hazirKarttaMi(h: OlcumHaziri, bloklar: readonly { tur: BlokTuru; ad: string }[]): boolean {
  return bloklar.some((b) => b.tur === h.tur && b.ad.trim().toLocaleLowerCase('tr') === h.ad.toLocaleLowerCase('tr'));
}

// ---- Sıklık (P-91) ---------------------------------------------------------------
// Ölçümlerim'de bir ölçüm her gün ya da haftada bir gün (kilo Pazartesi) girilir. Ölçüm
// parçalarında kullanılmayan `metin` alanında tutulur: "hafta:0" (Pzt) … "hafta:6" (Paz).

const SIKLIK = /^hafta:([0-6])$/;

/** Haftalık ölçümün günü (0 = Pzt … 6 = Paz); her günse null. */
export function olcumGunu(b: { metin: string }): number | null {
  const m = SIKLIK.exec(b.metin.trim());
  return m ? Number(m[1]) : null;
}

export function siklikYaz(gun: number | null): string {
  return gun === null ? '' : `hafta:${gun}`;
}

/** Ölçüm bu gün girilir mi: her gün ya da haftanın o günü; o gün değeri varsa yine görünür. */
export function olcumGunuMu(b: { metin: string }, haftaninGunu: number, degerVar = false): boolean {
  const g = olcumGunu(b);
  return g === null || g === haftaninGunu || degerVar;
}
