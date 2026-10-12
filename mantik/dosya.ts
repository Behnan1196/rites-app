// Dosya türü yardımcıları.

const SES_UZANTILARI = ['m4a', 'mp3', 'aac', 'wav', 'caf', 'ogg', 'oga', 'opus', 'flac', '3gp', 'amr'];

/** Ses dosyası mı? (uzantıya göre; adres sorgu/çapa içerse de) */
export function sesDosyasiMi(yol: string): boolean {
  const temiz = yol.split(/[?#]/)[0] ?? '';
  const uzanti = temiz.includes('.') ? temiz.split('.').pop()!.toLowerCase() : '';
  return SES_UZANTILARI.includes(uzanti);
}
