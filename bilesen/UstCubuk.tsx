// Ekranların üst satırı (pilot kararı, 14 Ekim): "Rites" yazısı yok. Solda ekran
// başlığı ya da "‹ Geri", sağda ekranın simge düğmeleri ve avatar (→ Profil).
// Ayrı bir marka satırı kalmadığı için kartlara daha çok yer kalır.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAyar } from '@/veri/kancalar';

import { Avatar } from './Avatar';
import { useProfil } from './Profil';
import { olcu } from './tema';

export function UstCubuk({ sol, sag }: { sol?: ReactNode; sag?: ReactNode }) {
  const { profiliAc } = useProfil();
  const ad = useAyar('ad').veri ?? '';

  return (
    <View style={stiller.cubuk}>
      <View style={stiller.sol}>{sol}</View>
      <View style={stiller.sag}>
        {sag}
        <Pressable
          onPress={profiliAc}
          accessibilityRole="button"
          accessibilityLabel={`Profil, ${ad}`}
          hitSlop={8}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
        >
          <Avatar ad={ad} />
        </Pressable>
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  cubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: olcu.ekranKenari,
    paddingVertical: 6,
    gap: 10,
    minHeight: 56,
  },
  sol: { flex: 1, minWidth: 0 },
  sag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
