// Ücretsiz sınır göstergesi (GR-3): "Eklediğin kişiler (ücretsiz) 3 / 5", beş bölmeli
// çubuk ve açıklama. Pilot kararıyla (14 Ekim) Gruplar'dan Ayarlar → Üyelik'e taşındı.

import { StyleSheet, View } from 'react-native';

import { kalanKisiMetni, SINIR_ACIKLAMASI, UCRETSIZ_SINIR } from '@/mantik/kisiler';

import { renk } from '../tema';
import { Yazi } from '../Yazi';

export function UcretsizSinir({ ekledigim }: { ekledigim: number }) {
  return (
    <View style={stiller.kap}>
      <View style={stiller.satir}>
        <Yazi tur="ikincil">Eklediğin kişiler (ücretsiz)</Yazi>
        <Yazi kalinlik="kalin">{`${ekledigim} / ${UCRETSIZ_SINIR}`}</Yazi>
      </View>
      <View style={stiller.cubuklar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: UCRETSIZ_SINIR }, (_, i) => (
          <View key={i} style={[stiller.cubuk, { backgroundColor: i < ekledigim ? renk.ana : renk.cizgi }]} />
        ))}
      </View>
      <Yazi tur="ikincil">{`${kalanKisiMetni(ekledigim)} ${SINIR_ACIKLAMASI}`}</Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 10 },
  satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cubuklar: { flexDirection: 'row', gap: 8 },
  cubuk: { flex: 1, height: 10, borderRadius: 5 },
});
