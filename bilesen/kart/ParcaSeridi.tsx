// Kartın altındaki parça şeridi (pilot 29 Ekim, P-68): "+ Karta ekle" yerine hafif koyu
// zeminli bir şeritte ikonlar: kartta olmayan Açıklama · Liste · Fotoğraf · Video; uzmanda öbür
// parçalar için "Daha". Basınca parça kartın içine eklenir; eklenen ikon şeritten kalkar.
// P-83 (1 Kasım): şerit sabit değil; kartın sonundaki "+ Ekle"ye dokununca açılır. Hatırlatma
// zaman satırının sayfasında.

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
  onKapat,
}: {
  ogeler: readonly SeritOgesi[];
  daha: boolean;
  onSec: (o: SeritOgesi) => void;
  onDaha: () => void;
  /** P-84: "+ Ekle" ile açılan şerit kapanır. */
  onKapat?: () => void;
}) {
  if (ogeler.length === 0 && !daha) return null;
  const dugme = (
    anahtar: string,
    ad: string,
    ikon: IkonAdi,
    onPress: () => void,
    ipucu: string,
    secenek: { ayarli?: boolean; izin?: boolean } = {},
  ) => {
    const izin = secenek.izin ?? true;
    const r = secenek.ayarli && izin ? renk.ana : renk.ikincil;
    return (
      <Pressable
        key={anahtar}
        onPress={onPress}
        disabled={!izin}
        accessibilityRole={izin ? 'button' : 'text'}
        accessibilityLabel={izin ? ipucu : `${ipucu}, değiştirilemez`}
        style={({ pressed }) => [stiller.dugme, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name={izin ? ikon : 'lock-closed-outline'} size={22} color={izin ? renk.ana : renk.soluk} />
        <Yazi
          tur="etiket"
          kalinlik="kalin"
          renk={r}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          maxFontSizeMultiplier={1.2}
          style={stiller.ad}
        >
          {ad}
        </Yazi>
      </Pressable>
    );
  };
  return (
    <View style={stiller.serit} accessibilityRole="toolbar" accessibilityLabel="Karta ekle">
      {ogeler.map((o) => {
        const b = ogeBilgisi(o);
        return dugme(o, b.ad, b.ikon, () => onSec(o), `${b.ad} ekle`);
      })}
      {daha && dugme('daha', 'Daha', 'ellipsis-horizontal', onDaha, 'Daha fazla parça')}
      {onKapat && dugme('kapat', 'Kapat', 'close', onKapat, 'Kapat, bir şey ekleme')}
    </View>
  );
}

const stiller = StyleSheet.create({
  // P-72: tek satır; ikon sayısı artınca yazı küçülür (en çok 6: Hatırlatma … Daha).
  serit: {
    flexDirection: 'row',
    backgroundColor: renk.bolumluZemin,
    borderRadius: olcu.kose.kart,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  dugme: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 1,
  },
  ad: { fontSize: 12, lineHeight: 16 },
});
