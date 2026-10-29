// Verilen kart (pilot 29 Ekim, P-62), alan tarafı: kart görünümünde saat ve hatırlatma
// sayfası (içerik verenin; saat ve hatırlatma alanın) ve "Bırak" sorusu.

import { useState } from 'react';

import { gecerliHatirlatma, type Kart } from '@/mantik/kart';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { kartlariSil, kartZamaniYaz } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { ZamanSayfasi, type Zamanlama } from '../kart/Zamanlama';
import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu } from '../OnayKutusu';
import { useKartVerme } from './KartVerme';

/** Saat ya da hatırlatma; kapatınca kaydedilir. */
export function VerilenZamanSayfasi({
  kart,
  bolum,
  onKapat,
}: {
  kart: Kart;
  bolum: 'tarih' | 'hatirlatma';
  onKapat: () => void;
}) {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [z, setZ] = useState<Zamanlama>({
    tarih: kart.tarih ?? bugunGun,
    saat: kart.saat,
    hatirlatma: kart.hatirlatma,
    alarm: kart.alarm,
    alarmSesi: kart.alarmSesi ?? null,
    tekrar: kart.tekrar,
  });
  const kapat = () => {
    const hatirlatma = gecerliHatirlatma(z.hatirlatma, z.saat);
    void kartZamaniYaz(kapi, kart.id, {
      saat: z.saat,
      hatirlatma,
      alarm: !!(hatirlatma && z.alarm),
      alarmSesi: z.alarm ? (z.alarmSesi ?? null) : null,
    }).catch((e: unknown) => {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    });
    onKapat();
  };
  return (
    <ZamanSayfasi
      gorunur
      bolum={bolum}
      kalip
      onKapat={kapat}
      deger={z}
      bugunGun={bugunGun}
      onTarihSec={setZ}
      onDegis={setZ}
    />
  );
}

/** "Bırak": kart ajandadan kalkar, veren görür. */
export function BirakSorusu({
  kart,
  verilenId,
  onKapat,
  onBirakildi,
}: {
  kart: Kart;
  verilenId: string;
  onKapat: () => void;
  onBirakildi: () => void;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { birak } = useKartVerme();
  const evet = async () => {
    onKapat();
    try {
      await birak(verilenId);
      await kartlariSil(kapi, [kart.id]);
      kisaMesaj(`Bırakıldı: ${kart.baslik}`);
      onBirakildi();
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };
  return (
    <Katman>
      <OnayKutusu
        baslik={`${kart.baslik} bırakılsın mı?`}
        aciklama={`Kart ajandandan kalkar. ${kart.gelenKimden || 'Veren'} bıraktığını görür.`}
        secenekler={[
          { etiket: 'Bırak', tur: 'tehlike', onPress: () => void evet() },
          { etiket: 'Vazgeç', tur: 'yazi', onPress: onKapat },
        ]}
      />
    </Katman>
  );
}
