import { EkranKabi } from '@/bilesen/EkranKabi';
import { AnimsaticilarKutusu } from '@/bilesen/giris/AnimsaticilarKutusu';
import { BugunSirada } from '@/bilesen/giris/BugunSirada';
import { DevamEdenler } from '@/bilesen/giris/DevamEdenler';
import { GununSorusu } from '@/bilesen/giris/GununSorusu';
import { HizliNot } from '@/bilesen/giris/HizliNot';

// Giriş: selam ve tarih yok; ekran Hızlı Not ile başlar. Kutuların açılıp
// kapanması ve sırası 8. görevde; öteki kutular kendi görevlerinde gelecek.
export default function Giris() {
  return (
    <EkranKabi>
      <HizliNot />
      <BugunSirada />
      <AnimsaticilarKutusu />
      <DevamEdenler />
      <GununSorusu />
    </EkranKabi>
  );
}
