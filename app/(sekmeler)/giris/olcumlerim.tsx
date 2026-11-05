// Ölçümlerim ekranı (pilot 5 Kasım, P-91, P-92): Giriş'teki küçük kutudan açılır. Gün seçimi,
// o günün ölçümleri, "+ Ölçüm" · "Gidişat" · "Düzenle".

import { EkranKabi } from '@/bilesen/EkranKabi';
import { OlcumlerimIcerigi } from '@/bilesen/giris/OlcumlerimKutusu';

export default function Olcumlerim() {
  return (
    <EkranKabi geri="Giriş" baslik="Ölçümlerim">
      <OlcumlerimIcerigi />
    </EkranKabi>
  );
}
