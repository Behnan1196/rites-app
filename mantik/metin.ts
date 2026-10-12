// Türkçe metin yardımcıları. Saf fonksiyonlar; arayüzden bağımsız.
//
// JavaScript'in toUpperCase / toLowerCase'i Türkçe i/ı ayrımını bilmez
// ("i".toUpperCase() → "I"). Telefonun yerel ayarına güvenmek yerine
// dönüşümü kendimiz yapıyoruz.

/** Türkçe büyük harf: "bugün sırada" → "BUGÜN SIRADA", "iş" → "İŞ". */
export function trBuyuk(metin: string): string {
  return metin.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}

/** Türkçe küçük harf: "İŞ" → "iş", "IŞIK" → "ışık". */
export function trKucuk(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

/** Ad en çok bu kadar karakter olabilir (giriş alanında sınır). */
export const AD_EN_UZUN = 40;

/** Baştaki/sondaki boşlukları atar, aradaki çoklu boşlukları teke indirir. */
export function adTemizle(ad: string): string {
  return ad.replace(/\s+/g, ' ').trim();
}

/** Ad kaydedilebilir mi? Değilse kullanıcıya gösterilecek kısa mesaj. */
export function adHatasi(ad: string): string | null {
  return adTemizle(ad) === '' ? 'Önce adını yaz.' : null;
}

/** Avatar için baş harf: "ayşe" → "A", "ilknur" → "İ". Boş adda boş metin. */
export function basHarf(ad: string): string {
  const ilk = Array.from(adTemizle(ad))[0];
  return ilk ? trBuyuk(ilk) : '';
}
