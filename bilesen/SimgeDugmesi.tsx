// Başlık yanındaki 48 pt yuvarlak simge düğmesi (Ajandam: ara, takvim).

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { renk } from './tema';

export function SimgeDugmesi({
  ikon,
  etiket,
  onPress,
  secili = false,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  etiket: string;
  onPress: () => void;
  secili?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      accessibilityState={{ selected: secili }}
      style={({ pressed }) => [stiller.dugme, secili && stiller.secili, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={ikon} size={24} color={secili ? renk.yuzey : renk.ana} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  dugme: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secili: { backgroundColor: renk.ana, borderColor: renk.ana },
});
