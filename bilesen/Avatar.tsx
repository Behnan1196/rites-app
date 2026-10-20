import { Image, StyleSheet, View } from 'react-native';

import { basHarf } from '@/mantik/metin';
import { useAyar } from '@/veri/kancalar';

import { renk } from './tema';
import { Yazi } from './Yazi';

/**
 * Kişinin avatarı: profil fotoğrafı varsa o (telefonda; pilot 20 Ekim), yoksa baş
 * harfli yuvarlak. `foto` verilirse kayıtlı fotoğraf yerine o gösterilir
 * (düzenlerken; null = fotoğrafsız). Boyut pt cinsinden.
 */
export function Avatar({ ad, boyut = 44, foto }: { ad: string; boyut?: number; foto?: string | null }) {
  const kayitli = useAyar('avatar').veri ?? null;
  const yol = foto === undefined ? kayitli : foto;
  const daire = { width: boyut, height: boyut, borderRadius: boyut / 2 };
  return (
    <View style={[stiller.kap, daire]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {yol ? (
        <Image source={{ uri: yol }} style={daire} resizeMode="cover" />
      ) : (
        <Yazi
          kalinlik="kalin"
          renk={renk.yuzey}
          style={{ fontSize: Math.round(boyut * 0.45), lineHeight: Math.round(boyut * 0.6) }}
          allowFontScaling={false}
        >
          {basHarf(ad)}
        </Yazi>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: {
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
