// Ortak Listeler (G-4): yarım kutu; ad ve "N liste". Dokununca Ortak Listeler ekranı.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useOturum } from '@/sunucu/oturum';

import { useListeler } from '../listeler/useListeler';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function OrtakListelerKutusu() {
  const oturum = useOturum();
  const { listeler } = useListeler(oturum);
  const alt = listeler.length ? `${listeler.length} liste` : 'Başkalarıyla tuttuğun listeler';
  return (
    <Pressable
      onPress={() => router.push('/giris/listeler')}
      accessibilityRole="button"
      accessibilityLabel={`Ortak Listeler, ${alt}`}
      style={({ pressed }) => [stiller.kutu, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.simge}>
        <Ionicons name="checkbox-outline" size={22} color={kaynakRenk.liste.serit} />
      </View>
      <Yazi tur="kartBasligi">Ortak Listeler</Yazi>
      <Yazi tur="ikincil">{alt}</Yazi>
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    flex: 1,
    gap: 6,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    minHeight: 120,
  },
  simge: { width: 40, height: 40, borderRadius: 20, backgroundColor: kaynakRenk.liste.zemin, alignItems: 'center', justifyContent: 'center' },
});
