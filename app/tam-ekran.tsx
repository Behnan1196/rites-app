// Tam ekran (pilot 13 Kasım, P-124): kartın videosu ya da tablosu tek başına; telefon yan
// çevrilince yatay döner (uygulamanın geri kalanı dik kalır; yön `app/_layout.tsx`'te ekran
// başına). Video ve tablo parçasının başlığındaki ⤢ düğmesiyle açılır; sol üstteki × kapatır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabloParcasi } from '@/bilesen/kart/TabloParcasi';
import { VideolarGorunumu } from '@/bilesen/kart/Videolar';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { parcaDegisir } from '@/mantik/gorunumDegisimi';
import { blokVideolari } from '@/mantik/video';
import { useSorgu } from '@/veri/kancalar';
import { blokIcerikYaz, kartAyrinti } from '@/veri/kartlar';
import { useVeri } from '@/veri/VeriSaglayici';

/** Videonun altındaki seçici ve başlık için ayrılan yükseklik. */
const VIDEO_PAYI = 96;

export default function TamEkran() {
  const { kartId, blokId } = useLocalSearchParams<{ kartId: string; blokId: string }>();
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const kenar = useSafeAreaInsets();
  const [alan, setAlan] = useState({ w: 0, h: 0 });
  const veri = useSorgu(['kart'], (o) => kartAyrinti(o, kartId), [kartId]);
  const kart = veri.veri?.kart;
  const blok = veri.veri?.bloklar.find((b) => b.id === blokId);
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const video = blok?.tur === 'video';

  // Video ekrana sığsın: genişlik, yüksekliğe göre 16:9'u aşmaz.
  const videoGenisligi = alan.w ? Math.min(alan.w, Math.max(160, (alan.h - VIDEO_PAYI) * (16 / 9))) : undefined;

  return (
    <View
      style={[
        stiller.kap,
        video ? stiller.koyu : stiller.acik,
        { paddingTop: kenar.top, paddingLeft: kenar.left, paddingRight: kenar.right },
      ]}
    >
      <View style={stiller.ust}>
        <Pressable
          onPress={kapat}
          accessibilityRole="button"
          accessibilityLabel="Tam ekranı kapat"
          hitSlop={8}
          style={({ pressed }) => [stiller.kapat, video && stiller.kapatKoyu, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={24} color={video ? '#fff' : renk.ana} />
        </Pressable>
        <Yazi kalinlik="kalin" numberOfLines={1} renk={video ? '#fff' : renk.yazi} style={stiller.esnek}>
          {kart?.baslik ?? ''}
        </Yazi>
      </View>
      {!veri.yukleniyor && (!kart || !blok) && (
        <Yazi tur="ikincil" style={stiller.bos}>
          Bu parça artık yok.
        </Yazi>
      )}
      {kart && blok && video && (
        <View
          style={[stiller.esnek, stiller.ortala, { paddingBottom: kenar.bottom }]}
          onLayout={(e) => setAlan({ w: e.nativeEvent.layout.width - 24, h: e.nativeEvent.layout.height })}
        >
          {!!videoGenisligi && (
            <View style={{ width: videoGenisligi }}>
              <VideolarGorunumu videolar={blokVideolari(blok)} />
            </View>
          )}
        </View>
      )}
      {kart && blok && blok.tur === 'tablo' && (
        <ScrollView contentContainerStyle={[stiller.tablo, { paddingBottom: kenar.bottom + 16 }]}>
          <TabloParcasi
            blok={blok}
            onDegis={
              parcaDegisir(kart, blok)
                ? (t) =>
                    void blokIcerikYaz(kapi, blok.id, t).catch((e: unknown) => {
                      console.error('Kaydedilemedi', e);
                      kisaMesaj('Kaydedilemedi. Yeniden dene.');
                    })
                : undefined
            }
          />
        </ScrollView>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { flex: 1 },
  koyu: { backgroundColor: '#000' },
  acik: { backgroundColor: renk.yuzey },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, minHeight: 52 },
  kapat: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renk.zemin,
  },
  kapatKoyu: { backgroundColor: 'rgba(255,255,255,0.15)' },
  esnek: { flex: 1 },
  ortala: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  tablo: { padding: 12 },
  bos: { padding: 16 },
});
