// Oturum yokken çevrimiçi bölümlerin yerinde: kısa açıklama ve "E-postanla devam et".
// Alttan açılan sayfada (üst katman, oturum sağlayıcısının dışında) `oturumAc`
// özellik olarak verilir (pilot 19 Ekim: Paylaş'ta çöküyordu).

import { StyleSheet, View } from 'react-native';

import type { Oturum } from '@/sunucu/oturum';

import { Dugme } from '../Dugme';
import { Bolum } from '../Secim';
import { Yazi } from '../Yazi';
import { useOturumAcBelki } from './OturumSayfasi';

export function OturumGerekli({
  oturum,
  aciklama,
  oturumAc: verilen,
}: {
  oturum: Oturum;
  aciklama: string;
  oturumAc?: () => void;
}) {
  const baglamdan = useOturumAcBelki();
  const oturumAc = verilen ?? baglamdan;
  if (oturum.durum === 'ayarsiz') {
    return (
      <Bolum>
        <Yazi tur="ikincil">Şu an bağlanamıyor. Biraz sonra yeniden dene.</Yazi>
      </Bolum>
    );
  }
  return (
    <Bolum>
      <View style={stiller.kap}>
        <Yazi tur="ikincil">{aciklama}</Yazi>
        {oturumAc ? (
          <Dugme etiket="E-postanla devam et" onPress={oturumAc} />
        ) : (
          <Yazi tur="ikincil">Gruplar sekmesinden e-postanla devam edebilirsin.</Yazi>
        )}
      </View>
    </Bolum>
  );
}

const stiller = StyleSheet.create({ kap: { gap: 12 } });
