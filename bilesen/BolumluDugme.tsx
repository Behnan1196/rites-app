// Bölümlü düğme (`06`): #E6EAEE zemin, seçili parça beyaz + kalın.
// Ajandam'da Gün / Hafta; ileride plan sekmeleri.

import { Pressable, StyleSheet, View } from 'react-native';

import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

export function BolumluDugme<T extends string>({
  secenekler,
  secili,
  onSec,
  erisimEtiketi,
}: {
  secenekler: readonly { deger: T; etiket: string }[];
  secili: T;
  onSec: (deger: T) => void;
  erisimEtiketi: string;
}) {
  return (
    <View style={stiller.kap} accessibilityRole="tablist" accessibilityLabel={erisimEtiketi}>
      {secenekler.map((s) => {
        const seciliMi = s.deger === secili;
        return (
          <Pressable
            key={s.deger}
            onPress={() => onSec(s.deger)}
            accessibilityRole="tab"
            accessibilityState={{ selected: seciliMi }}
            style={[stiller.parca, seciliMi && stiller.secili]}
          >
            <Yazi kalinlik={seciliMi ? 'kalin' : 'normal'} renk={seciliMi ? renk.yazi : renk.ikincil}>
              {s.etiket}
            </Yazi>
          </Pressable>
        );
      })}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: {
    flexDirection: 'row',
    backgroundColor: renk.bolumluZemin,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  parca: {
    flex: 1,
    minHeight: olcu.enAzDokunma + 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secili: {
    backgroundColor: renk.yuzey,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});
