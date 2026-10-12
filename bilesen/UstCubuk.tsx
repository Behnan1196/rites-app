import { Pressable, StyleSheet, View } from 'react-native';

import { useAyar } from '@/veri/kancalar';

import { Avatar } from './Avatar';
import { useProfil } from './Profil';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

/** Ana ekranların üst çubuğu: solda "Rites", sağda ad ve avatar (→ Profil). */
export function UstCubuk() {
  const { profiliAc } = useProfil();
  const ad = useAyar('ad').veri ?? '';

  return (
    <View style={stiller.cubuk}>
      <Yazi
        kalinlik="kalin"
        renk={renk.ana}
        style={stiller.marka}
        accessibilityRole="header"
        maxFontSizeMultiplier={1.4}
      >
        Rites
      </Yazi>
      <Pressable
        onPress={profiliAc}
        accessibilityRole="button"
        accessibilityLabel={`Profil, ${ad}`}
        hitSlop={8}
        style={({ pressed }) => [stiller.kisi, pressed && { opacity: 0.7 }]}
      >
        <Yazi style={stiller.ad} numberOfLines={1} maxFontSizeMultiplier={1.4}>
          {ad}
        </Yazi>
        <Avatar ad={ad} />
      </Pressable>
    </View>
  );
}

const stiller = StyleSheet.create({
  cubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: olcu.ekranKenari,
    paddingVertical: 10,
    gap: 16,
  },
  marka: { fontSize: 28, lineHeight: 34 },
  kisi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: olcu.enAzDokunma,
    flexShrink: 1,
  },
  ad: { flexShrink: 1 },
});
