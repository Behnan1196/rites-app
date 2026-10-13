// Açılışta bir kez: son yedek 7 günden eskiyse "Son yedeğin N gün önce.
// Şimdi yedekleyelim mi?" (`10` madde 10; gece kendiliğinden yedek yok).

import { useEffect, useState } from 'react';

import { yedekSorusu } from '@/mantik/yedek';
import { ayarOku } from '@/veri/ayar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';
import { yedekAl } from '@/veri/yedekDosyasi';

import { Katman } from './Katman';
import { useKisaMesaj } from './KisaMesaj';
import { OnayKutusu } from './OnayKutusu';

export function YedekSorusu() {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [soru, setSoru] = useState<string | null>(null);

  useEffect(() => {
    let gecerli = true;
    void ayarOku(oku, 'son_yedek').then((son) => {
      if (gecerli) setSoru(yedekSorusu(son, bugunGun));
    });
    return () => {
      gecerli = false;
    };
    // Yalnız açılışta bir kez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!soru) return null;
  return (
    <Katman>
      <OnayKutusu
        baslik={soru}
        secenekler={[
          {
            etiket: 'Şimdi yedekle',
            tur: 'ana',
            onPress: () => {
              setSoru(null);
              yedekAl(oku, kapi).catch((e: unknown) => {
                console.error('Yedek alınamadı', e);
                kisaMesaj('Yedek alınamadı. Yeniden dene.');
              });
            },
          },
          { etiket: 'Sonra', tur: 'yazi', onPress: () => setSoru(null) },
        ]}
      />
    </Katman>
  );
}
