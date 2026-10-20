// İçerik kataloğunu sunucudan indirir (pilot 20 Ekim). Oturum gerekmez; yalnız
// okunur, sunucuya kişinin hiçbir verisi gitmez. Döner: ham katalog (denetimi
// `katalogCoz` yapar); sunucu ayarı yoksa null.

import { sunucu } from './istemci';

export async function katalogIndir(): Promise<unknown | null> {
  const s = sunucu;
  if (!s) return null;
  const [alanlar, kartlar, programlar] = await Promise.all([
    s.from('icerik_alan').select('anahtar, ad, aciklama, ikon, varsayilan_acik, sira'),
    s.from('icerik_kart').select('id, alanlar, baslik, kisa, saat, tekrar, bloklar, tur, sira'),
    s.from('icerik_program').select('id, alanlar, ad, aciklama, sure, kartlar, sira'),
  ]);
  const hata = alanlar.error ?? kartlar.error ?? programlar.error;
  if (hata) throw new Error(hata.message);
  return { alanlar: alanlar.data, kartlar: kartlar.data, programlar: programlar.data };
}
