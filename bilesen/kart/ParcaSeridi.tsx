// Kartın altındaki parça şeridi (pilot 29 Ekim, P-68): "+ Karta ekle" yerine hafif koyu
// zeminli bir şeritte ikonlar: kartta olmayan Açıklama · Liste · Fotoğraf · Video; uzmanda öbür
// parçalar için "Daha". Basınca parça kartın içine eklenir; eklenen ikon şeritten kalkar.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SeritOgesi } from '@/mantik/parcaSecimi';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { BLOK_TURLERI } from './blokTurleri';

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

function ogeBilgisi(o: SeritOgesi): { ad: string; ikon: IkonAdi } {
  if (o === 'aciklama') return { ad: 'Açıklama', ikon: 'reader-outline' };
  return { ad: BLOK_TURLERI[o].ad, ikon: BLOK_TURLERI[o].ikon };
}

export function ParcaSeridi({
  ogeler,
  daha,
  onSec,
  onDaha,
}: {
  ogeler: readonly SeritOgesi[];
  daha: boolean;
  onSec: (o: SeritOgesi) => void;
  onDaha: () => void;
}) {
  if (ogeler.length === 0 && !daha) return null;
  const dugme = (anahtar: string, ad: string, ikon: IkonAdi, onPress: () => void, ipucu: string) => (
    <Pressable
      key={anahtar}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ipucu}
      style={({ pressed }) => [stiller.dugme, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={ikon} size={24} color={renk.ana} />
      <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {ad}
      </Yazi>
    </Pressable>
  );
  return (
    <View style={stiller.serit} accessibilityRole="toolbar" accessibilityLabel="Karta ekle">
      {ogeler.map((o) => {
        const b = ogeBilgisi(o);
        return dugme(o, b.ad, b.ikon, () => onSec(o), `${b.ad} ekle`);
      })}
      {daha && dugme('daha', 'Daha', 'ellipsis-horizontal', onDaha, 'Daha fazla parça')}
    </View>
  );
}

const stiller = StyleSheet.create({
  serit: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: renk.bolumluZemin,
    borderRadius: olcu.kose.kart,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  dugme: {
    flexGrow: 1,
    flexBasis: 64,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
});
