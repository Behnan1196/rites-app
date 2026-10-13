// Oturum yokken çevrimiçi bölümlerin yerinde: kısa açıklama ve "E-postanla devam et".

import { StyleSheet, View } from 'react-native';

import type { Oturum } from '@/sunucu/oturum';

import { Dugme } from '../Dugme';
import { Bolum } from '../Secim';
import { Yazi } from '../Yazi';
import { useOturumAc } from './OturumSayfasi';

export function OturumGerekli({ oturum, aciklama }: { oturum: Oturum; aciklama: string }) {
  const oturumAc = useOturumAc();
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
        <Dugme etiket="E-postanla devam et" onPress={oturumAc} />
      </View>
    </Bolum>
  );
}

const stiller = StyleSheet.create({ kap: { gap: 12 } });
