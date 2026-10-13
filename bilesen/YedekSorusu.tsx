// Açılışta bir kez: son yedek 7 günden eskiyse "Son yedeğin N gün önce.
// Şimdi yedekleyelim mi?" (`10` madde 10; gece kendiliğinden yedek yok).
// Hiç yedek yoksa ilk açılıştan 7 gün sonra "Henüz yedeğin yok. …".

import { useEffect, useState } from 'react';

import { yedekSorusu } from '@/mantik/yedek';
import { ayarOku, ayarYaz } from '@/veri/ayar';
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
    void (async () => {
      const son = await ayarOku(oku, 'son_yedek');
      let ilk = await ayarOku(oku, 'ilk_acilis');
      if (!ilk) {
        ilk = bugunGun;
        await ayarYaz(kapi, 'ilk_acilis', ilk);
      }
      if (gecerli) setSoru(yedekSorusu(son, ilk, bugunGun));
    })().catch((e: unknown) => console.error('Yedek sorusu okunamadı', e));
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
