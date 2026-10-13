// Bugünün anımsatmaları ve durumları; dakikada bir tazelenir.

import { useMemo } from 'react';

import { bugununAnimsatmalari, erteleSaati, type Animsatma } from '@/mantik/animsatici';
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
  return {
    yukleniyor: veri.yukleniyor,
    animsaticilar: veri.veri?.animsaticilar ?? [],
    animsatmalar,
    durdur: (m: Animsatma) => durdur(kapi, m.animsatici.id, bugunGun, m.saat),
    ertele: (m: Animsatma) =>
      ertele(kapi, m.animsatici.id, bugunGun, m.saat, erteleSaati(m.gosterilen, simdi, m.animsatici.erteleDk)),
  };
}
