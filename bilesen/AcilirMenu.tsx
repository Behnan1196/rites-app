// Sağ üstten açılan küçük menü (kart görünümündeki "⋯"). Dışarı dokununca kapanır.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Katman } from './Katman';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

export interface MenuOgesi {
  etiket: string;
  ikon: ComponentProps<typeof Ionicons>['name'];
  tehlike?: boolean;
  onPress: () => void;
}

export function AcilirMenu({
  ust,
  ogeler,
  onKapat,
}: {
  ust: number;
  ogeler: readonly MenuOgesi[];
  onKapat: () => void;
}) {
  return (
    <Katman>
      <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} accessibilityLabel="Menüyü kapat" />
      <View style={[stiller.menu, { top: ust }]} accessibilityViewIsModal>
        {ogeler.map((m, i) => (
          <Pressable
            key={m.etiket}
            onPress={() => {
              onKapat();
              m.onPress();
            }}
            accessibilityRole="menuitem"
            accessibilityLabel={m.etiket}
            style={({ pressed }) => [
              stiller.satir,
              m.tehlike && i > 0 && stiller.ayrac,
              pressed && { backgroundColor: renk.zemin },
            ]}
          >
            <Ionicons name={m.ikon} size={22} color={m.tehlike ? renk.hata : renk.ana} />
            <Yazi renk={m.tehlike ? renk.hata : renk.yazi} style={stiller.esnek}>
              {m.etiket}
            </Yazi>
          </Pressable>
        ))}
      </View>
    </Katman>
  );
}

const stiller = StyleSheet.create({
  menu: {
    position: 'absolute',
    right: olcu.ekranKenari,
    width: 240,
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16 },
  ayrac: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  esnek: { flex: 1 },
});
