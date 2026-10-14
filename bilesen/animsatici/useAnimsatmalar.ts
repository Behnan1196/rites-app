// Bugünün anımsatmaları ve durumları; dakikada bir tazelenir.

import { useMemo } from 'react';

import { ertelemeAlarmKimligi, tekrarliAlarmKimligi } from '@/mantik/alarm';
import { bugununAnimsatmalari, erteleSaati, type Animsatma } from '@/mantik/animsatici';
import { alarmiSustur } from '@/veri/alarmlar';
import { animsaticilariOku, durdur, ertele, gunDurumlari } from '@/veri/animsaticilar';
import { useSorgu } from '@/veri/kancalar';
import { useBugun } from '@/veri/useBugun';
import { useSimdi } from '@/veri/useSimdi';
import { useVeri } from '@/veri/VeriSaglayici';

export function useAnimsatmalar() {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const simdi = useSimdi();
  const veri = useSorgu(
    ['animsatici'],
    async (oku) => ({ animsaticilar: await animsaticilariOku(oku), durumlar: await gunDurumlari(oku, bugunGun) }),
    [bugunGun],
  );
  const animsatmalar = useMemo(
    () => (veri.veri ? bugununAnimsatmalari(veri.veri.animsaticilar, veri.veri.durumlar, bugunGun, simdi) : []),
    [veri.veri, bugunGun, simdi],
  );
  // Alarm olarak çalıyorsa önce susturulur.
  const sustur = async (m: Animsatma) => {
    if (!m.animsatici.alarm) return;
    await alarmiSustur(tekrarliAlarmKimligi(m.animsatici.id, m.saat));
    await alarmiSustur(ertelemeAlarmKimligi(m.animsatici.id, bugunGun, m.saat));
  };
  return {
    yukleniyor: veri.yukleniyor,
    animsaticilar: veri.veri?.animsaticilar ?? [],
    animsatmalar,
    durdur: async (m: Animsatma) => {
      await sustur(m);
      await durdur(kapi, m.animsatici.id, bugunGun, m.saat);
    },
    ertele: async (m: Animsatma) => {
      await sustur(m);
      await ertele(kapi, m.animsatici.id, bugunGun, m.saat, erteleSaati(m.gosterilen, simdi, m.animsatici.erteleDk));
    },
  };
}
