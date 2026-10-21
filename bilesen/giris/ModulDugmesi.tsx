// Giriş kutularının başlığının solundaki simge düğmesi (pilot 21 Ekim): kutunun
// modülünü açar (Notlar, Ajandam, Gelenler, Anımsatıcılar, Yaşam Tarzım). Her kutuda
// aynı yerde, aynı biçimde.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { renk } from '../tema';

export function ModulDugmesi({
  simge,
  etiket,
  onPress,
  koyu = false,
  zemin,
}: {
  simge: ReactNode;
  /** Ekran okuyucu için: "Notlar'ı aç". */
  etiket: string;
  onPress: () => void;
  /** Koyu zeminli kutuda (Bugün sırada). */
  koyu?: boolean;
  /** Simgenin arka rengi (varsayılan açık ana renk). */
  zemin?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      hitSlop={6}
      style={({ pressed }) => [
        stiller.dugme,
        { backgroundColor: zemin ?? (koyu ? 'rgba(255,255,255,0.18)' : renk.anaAcik) },
        pressed && { opacity: 0.7 },
      ]}
    >
      {simge}
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  dugme: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
