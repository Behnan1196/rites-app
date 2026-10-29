// Listeler (G-4; P-58, P-60: önceden Ortak Listeler): yarım kutu; ad ve "N liste" (kişisel +
// paylaşılan). Dokununca Listeler ekranı.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useOturum } from '@/sunucu/oturum';
import { useSorgu } from '@/veri/kancalar';
import { yerelListeleriOku } from '@/veri/yerelListeler';

import { useListeler } from '../listeler/useListeler';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function OrtakListelerKutusu() {
  const oturum = useOturum();
  const { listeler } = useListeler(oturum);
  const yereller = useSorgu(['liste'], (o) => yerelListeleriOku(o), []).veri ?? [];
  const sayi = listeler.length + yereller.length;
  const alt = sayi ? `${sayi} liste` : 'Yapılacaklar, alışveriş';
  return (
    <Pressable
      onPress={() => router.push('/giris/listeler')}
      accessibilityRole="button"
      accessibilityLabel={`Listeler, ${alt}`}
      style={({ pressed }) => [stiller.kutu, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.simge}>
        <Ionicons name="checkbox-outline" size={22} color={kaynakRenk.liste.serit} />
      </View>
      <Yazi tur="kartBasligi">Listeler</Yazi>
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
  simge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: kaynakRenk.liste.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
