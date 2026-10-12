// Geçmişten kalanlar (`05` §5, A-7). Kartlar kendiliğinden taşınmaz.

import type { Kart } from './kart';
import { gunEkle, gunFarki, type Gun } from './tarih';

/** Kaç gün geriye bakılır (bugün hariç). */
export const KALAN_GUN_SINIRI = 7;

/**
 * Tek seferlik, tarihi olan, kilitsiz, yapılmamış, bırakılmamış ve tarihi son
 * 7 gün içinde (bugün hariç) olan kartlar; eskiden yeniye (aynı günde saate göre).
 */
export function kalanlar(kartlar: readonly Kart[], bugunGun: Gun): Kart[] {
  const enEski = gunEkle(bugunGun, -KALAN_GUN_SINIRI);
  return kartlar
    .filter(
      (k) =>
        k.tekrar === null &&
        !k.tarihsiz &&
        k.tarih !== null &&
        !k.kilitli &&
        !k.yapildi &&
        !k.birakildi &&
        k.tarih >= enEski &&
        k.tarih < bugunGun,
    )
    .sort((a, b) => {
      const t = (a.tarih ?? '').localeCompare(b.tarih ?? '');
      if (t !== 0) return t;
      // Saatsizler aynı günün sonunda.
      return (a.saat ?? '99:99').localeCompare(b.saat ?? '99:99');
    });
}

/** "Dünden kalanlar" (hepsi dünse) ya da "Geçmişten kalanlar". */
export function kalanlarBasligi(liste: readonly Kart[], bugunGun: Gun): string {
  const dun = gunEkle(bugunGun, -1);
  return liste.length > 0 && liste.every((k) => k.tarih === dun) ? 'Dünden kalanlar' : 'Geçmişten kalanlar';
}

/** Satırdaki zaman: "Dün" ya da "3 gün önce". */
export function kacGunOnce(gun: Gun, bugunGun: Gun): string {
  const fark = gunFarki(gun, bugunGun);
  return fark === 1 ? 'Dün' : `${fark} gün önce`;
}

/** Bugüne al: `tarih = bugün`. */
export function buguneAl(kart: Kart, bugunGun: Gun): Kart {
  return { ...kart, tarih: bugunGun };
}

/** Bırak: geçmişte yapılmamış olarak kalır, bir daha sorulmaz. */
export function birak(kart: Kart): Kart {
  return { ...kart, birakildi: true };
}
