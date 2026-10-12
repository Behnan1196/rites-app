// Açık sarı yapışkan not görünümü (N-3, `06` Not renkleri).

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Not } from '@/veri/notlar';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function YapiskanNot({ not, onPress, sol }: { not: Not; onPress: () => void; sol?: ReactNode }) {
  return (
    <View style={stiller.not}>
      {sol}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${not.sesli ? 'Sesli not' : 'Not'}: ${not.metin}`}
        accessibilityHint="Düzenle, sil ya da ajandana al"
        style={({ pressed }) => [stiller.govde, pressed && { opacity: 0.7 }]}
      >
        {not.sesli && (
          <View style={stiller.oynat}>
            <Ionicons name="play" size={16} color={renk.yuzey} />
          </View>
        )}
        <Yazi numberOfLines={3} style={stiller.metin}>
          {not.metin}
        </Yazi>
      </Pressable>
    </View>
  );
}

const stiller = StyleSheet.create({
  not: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renk.notZemin,
    borderWidth: 1,
    borderColor: renk.notCizgi,
    borderRadius: olcu.kose.dugme,
    minHeight: 56,
    shadowColor: '#8A7A1F',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  govde: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  oynat: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: renk.vurguYazi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metin: { flex: 1 },
});
