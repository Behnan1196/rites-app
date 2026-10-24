// İçerik kataloğunu sunucudan indirir (pilot 20 Ekim). Oturum gerekmez; yalnız
// okunur, sunucuya kişinin hiçbir verisi gitmez. Döner: ham katalog (denetimi
// `katalogCoz` yapar); sunucu ayarı yoksa null.

import { sunucu } from './istemci';

export const CESIT_SUTUNLARI = 'id, alan, ad, ikon, aciklama, baslik, baslik_ipucu, saat, tekrar, bloklar, sira, aktif';

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
  // Çeşitler (P-41): tablo henüz kurulmadıysa katalog yine iner, çeşitler uygulamayla gelenlerdir.
  const cesitler = await s.from('icerik_cesit').select(CESIT_SUTUNLARI);
  return {
    alanlar: alanlar.data,
    kartlar: kartlar.data,
    programlar: programlar.data,
    ...(cesitler.error ? {} : { cesitler: cesitler.data }),
  };
}
