import { StyleSheet, View } from 'react-native';

import { basHarf } from '@/mantik/metin';

import { renk } from './tema';
import { Yazi } from './Yazi';

/** Baş harfli yuvarlak. Boyut pt cinsinden. */
export function Avatar({ ad, boyut = 44 }: { ad: string; boyut?: number }) {
  return (
    <View
      style={[stiller.kap, { width: boyut, height: boyut, borderRadius: boyut / 2 }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Yazi
        kalinlik="kalin"
        renk={renk.yuzey}
        style={{ fontSize: Math.round(boyut * 0.45), lineHeight: Math.round(boyut * 0.6) }}
        allowFontScaling={false}
      >
        {basHarf(ad)}
      </Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: {
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
