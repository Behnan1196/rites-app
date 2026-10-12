// Takvim (A-3, `05` §8): alttan ay takvimi; günün altında (süzülmüş) kart sayısı.
// Güne dokununca sayfa kapanır ve o günün Gün görünümü açılır.

import type { Gun } from '@/mantik/tarih';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

export function TakvimSayfasi({
  gorunur,
  acilis,
  secili,
  bugunGun,
  sayi,
  onSec,
  onKapat,
}: {
  gorunur: boolean;
  /** Her açılışta artar; takvim seçili günün ayından başlasın. */
  acilis: number;
  secili: Gun;
  bugunGun: Gun;
  sayi: (gun: Gun) => number;
  onSec: (gun: Gun) => void;
  onKapat: () => void;
}) {
  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Takvim"
      solEylem={{ etiket: 'Bugün', onPress: () => onSec(bugunGun), renk: renk.vurguYazi }}
      sagKapat="Kapat"
    >
      <AyTakvimi key={acilis} secili={secili} bugunGun={bugunGun} onSec={onSec} sayi={sayi} />
      <Yazi tur="ikincil">Günün altındaki sayı, o gündeki kart sayısı. Bir güne dokun, o güne gidersin.</Yazi>
    </AltSayfa>
  );
}
