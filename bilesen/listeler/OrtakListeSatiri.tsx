// Ortak liste satırı: ad, kimlerle, kişi sayısı, kalan madde. Giriş → Ortak Listeler
// ve Gruplar sekmesi kullanır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AdBulucu } from '@/mantik/gruplar';
import { kalanMetni, kimlerleMetni, kisiSayisiMetni, type OrtakListe } from '@/mantik/listeler';

import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function OrtakListeSatiri({
  liste,
  ben,
  ad,
  onPress,
}: {
  liste: OrtakListe;
  ben: string;
  ad: AdBulucu;
  onPress: () => void;
}) {
  const alt = `${kimlerleMetni(liste, ben, ad)} · ${kisiSayisiMetni(liste)}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${liste.ad}, ${alt}, ${kalanMetni(liste.kalan)}`}
      style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.esnek}>
        <Yazi tur="kartBasligi">{liste.ad}</Yazi>
        <Yazi tur="ikincil">{alt}</Yazi>
      </View>
      <Yazi tur="ikincil" kalinlik="kalin" renk={kaynakRenk.liste.yazi}>
        {kalanMetni(liste.kalan)}
      </Yazi>
      <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.liste.serit,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 14,
    minHeight: 72,
  },
  esnek: { flex: 1 },
});
