// Üst satırdaki 44 pt yuvarlak simge düğmesi (Ajandam: ara, süz, görünüm, takvim).
// `secili`: dolu (ör. süzgeç açık); `dolu`: hep dolu, ana eylem (Ajandam'daki ＋;
// P-34); `rozet`: köşede küçük sayı.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { renk } from './tema';
import { Yazi } from './Yazi';

export function SimgeDugmesi({
  ikon,
  etiket,
  onPress,
  secili = false,
  dolu = false,
  rozet,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  etiket: string;
  onPress: () => void;
  secili?: boolean;
  dolu?: boolean;
  rozet?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      accessibilityState={dolu ? undefined : { selected: secili }}
      style={({ pressed }) => [stiller.dugme, (secili || dolu) && stiller.secili, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={ikon} size={dolu ? 26 : 22} color={secili || dolu ? renk.yuzey : renk.ana} />
      {!!rozet && (
        <View style={stiller.rozet}>
          <Yazi tur="etiket" kalinlik="kalin" renk={renk.yuzey} style={stiller.rozetYazi} maxFontSizeMultiplier={1.2}>
            {String(rozet)}
          </Yazi>
        </View>
      )}
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  dugme: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secili: { backgroundColor: renk.ana, borderColor: renk.ana },
  rozet: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: renk.vurgu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rozetYazi: { fontSize: 12, lineHeight: 16 },
});
