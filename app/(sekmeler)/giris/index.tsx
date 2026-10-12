import { EkranKabi } from '@/bilesen/EkranKabi';
import { BugunSirada } from '@/bilesen/giris/BugunSirada';
import { HizliNot } from '@/bilesen/giris/HizliNot';

// Giriş: selam ve tarih yok; ekran Hızlı Not ile başlar. Kutuların açılıp
// kapanması ve sırası 8. görevde; öteki kutular kendi görevlerinde gelecek.
export default function Giris() {
  return (
    <EkranKabi>
      <HizliNot />
      <BugunSirada />
    </EkranKabi>
  );
}
