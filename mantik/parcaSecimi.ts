// Karta eklenebilecek parçalar (pilot 29 Ekim, P-67): her parça karta bir kez eklenir;
// kartta olan "Karta ekle" listesinde görünmez. Liste ile proje adımları aynı parça sayılır
// (adımlar listenin bir biçimi). Önceden eklenmiş çift parçalar kartta kalır.

import {
  ARAC_BLOKLARI,
  ICERIK_BLOKLARI,
  KAYIT_BLOKLARI,
  type BlokTuru,
} from "./kart";

/** Normal kullanıcının parçaları (P-51); açıklama talimatın yerine geçer. */
export const NORMAL_BLOKLAR: readonly BlokTuru[] = ["liste", "foto", "video"];

function esi(t: BlokTuru): BlokTuru {
  return t === "adimlar" ? "liste" : t;
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
  const goster = (t: BlokTuru) =>
    !haric.includes(t) && t !== "adimlar" && !kartta.has(t);
  if (!uzman) return { gorunen: NORMAL_BLOKLAR.filter(goster), kayit: [] };
  return {
    gorunen: [...ICERIK_BLOKLARI, ...ARAC_BLOKLARI].filter(goster),
    kayit: KAYIT_BLOKLARI.filter(
      (t) => !ARAC_BLOKLARI.includes(t) && goster(t),
    ),
  };
}

/** Eklenecek parça kaldı mı ("+ Karta ekle" düğmesi için). */
export function eklenecekParcaVarMi(
  a: Parameters<typeof secilebilirParcalar>[0],
): boolean {
  const s = secilebilirParcalar(a);
  return s.gorunen.length + s.kayit.length > 0;
}
