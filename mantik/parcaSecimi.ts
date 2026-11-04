// Karta eklenebilecek parçalar (pilot 29 Ekim, P-67): her parça karta bir kez eklenir;
// kartta olan "Karta ekle" listesinde görünmez. Liste ile proje adımları aynı parça sayılır
// (adımlar listenin bir biçimi). Önceden eklenmiş çift parçalar kartta kalır.

import { ARAC_BLOKLARI, ICERIK_BLOKLARI, KAYIT_BLOKLARI, type BlokTuru } from './kart';
import { COKLU_PARCALAR } from './olcumHazirlari';

/** Normal kullanıcının parçaları (P-51); açıklama talimatın yerine geçer. */
export const NORMAL_BLOKLAR: readonly BlokTuru[] = ['liste', 'foto', 'video'];

function esi(t: BlokTuru): BlokTuru {
  return t === 'adimlar' || t === 'bilgi' || t === 'listebag' ? 'liste' : t;
}

export function secilebilirParcalar({
  uzman,
  haric = [],
  mevcut = [],
}: {
  uzman: boolean;
  haric?: readonly BlokTuru[];
  mevcut?: readonly BlokTuru[];
}): { gorunen: BlokTuru[]; kayit: BlokTuru[] } {
  const kartta = new Set(mevcut.map(esi));
  // P-51: tek Liste; "Proje adımları" ayrı seçenek değil.
  // P-83: Bilgi listesi ve Listelerimden de Liste'nin biçimleri.
  // P-87: ölçüm parçaları (Sayarak, Ölçüm, Puan) bir kartta birden çok olur.
  const goster = (t: BlokTuru) => !haric.includes(t) && esi(t) === t && (!kartta.has(t) || COKLU_PARCALAR.includes(t));
  if (!uzman) return { gorunen: NORMAL_BLOKLAR.filter(goster), kayit: [] };
  return {
    gorunen: [...ICERIK_BLOKLARI, ...ARAC_BLOKLARI].filter(goster),
    kayit: KAYIT_BLOKLARI.filter((t) => !ARAC_BLOKLARI.includes(t) && goster(t)),
  };
}

/** Eklenecek parça kaldı mı ("+ Karta ekle" düğmesi için). */
export function eklenecekParcaVarMi(a: Parameters<typeof secilebilirParcalar>[0]): boolean {
  const s = secilebilirParcalar(a);
  return s.gorunen.length + s.kayit.length > 0;
}

/** P-68: kartın altındaki şeritte doğrudan duran parçalar (açıklama ayrıca). */
/** P-87: şeritteki "Ölçüm" hazır ölçümleri ve Sayarak · Sayı · Puan'ı açar; hep durur. */
export const SERIT_PARCALARI: readonly BlokTuru[] = ['liste', 'foto', 'video', 'olcum'];

export type SeritOgesi = 'aciklama' | BlokTuru;

/**
 * P-68: kartın altındaki ikon şeridi: kartta olmayan Açıklama · Liste · Fotoğraf · Video; uzmanda
 * kalan öbür parçalar için "Daha".
 */
export function seritOgeleri({
  aciklamaVar,
  aciklamaOlur = true,
  uzman,
  haric = [],
  mevcut = [],
}: {
  aciklamaVar: boolean;
  /** Çeşit tasarımında açıklama yerine başlık ipucu var. */
  aciklamaOlur?: boolean;
  uzman: boolean;
  haric?: readonly BlokTuru[];
  mevcut?: readonly BlokTuru[];
}): { ogeler: SeritOgesi[]; daha: boolean } {
  const kartta = new Set(mevcut.map(esi));
  const ogeler: SeritOgesi[] = [];
  if (aciklamaOlur && !aciklamaVar) ogeler.push('aciklama');
  for (const t of SERIT_PARCALARI)
    if (!haric.includes(t) && (!kartta.has(t) || COKLU_PARCALAR.includes(t))) ogeler.push(t);
  // Daha: şeritte olmayan öbür parçalar (ölçüm türleri şeritteki Ölçüm'de).
  const s = secilebilirParcalar({ uzman, haric, mevcut: [...mevcut, ...SERIT_PARCALARI] });
  const daha = uzman && [...s.gorunen, ...s.kayit].some((t) => !COKLU_PARCALAR.includes(t));
  return { ogeler, daha };
}
