// "+ Blok ekle" ızgarası (K-6): İÇERİK ve KAYIT blokları.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ICERIK_BLOKLARI, KAYIT_BLOKLARI, type BlokTuru } from '@/mantik/kart';

import { AltSayfa } from '../AltSayfa';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { BLOK_TURLERI } from './blokTurleri';

export function BlokSecici({
  gorunur,
  onKapat,
  onSec,
}: {
  gorunur: boolean;
  onKapat: () => void;
  onSec: (tur: BlokTuru) => void;
}) {
  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Blok ekle" sagKapat="Kapat">
      <Izgara baslik="İçerik" turler={ICERIK_BLOKLARI} onSec={onSec} />
      <Izgara baslik="Kayıt" turler={KAYIT_BLOKLARI} onSec={onSec} />
    </AltSayfa>
  );
}

function Izgara({
  baslik,
  turler,
  onSec,
}: {
  baslik: string;
  turler: readonly BlokTuru[];
  onSec: (tur: BlokTuru) => void;
}) {
  return (
    <View style={stiller.bolum}>
      <Yazi tur="kutuBasligi" accessibilityRole="header">
        {baslik}
      </Yazi>
      <View style={stiller.izgara}>
        {turler.map((tur) => {
          const t = BLOK_TURLERI[tur];
          return (
            <Pressable
              key={tur}
              onPress={() => onSec(tur)}
              accessibilityRole="button"
              accessibilityLabel={`${t.ad} ekle`}
              style={({ pressed }) => [stiller.kutu, t.kayit && stiller.kayitKutusu, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={t.ikon} size={28} color={t.kayit ? renk.vurguYazi : renk.ana} />
              <Yazi kalinlik="kalin" style={stiller.ad} maxFontSizeMultiplier={1.3}>
                {t.ad}
              </Yazi>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  bolum: { gap: 10 },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kutu: {
    width: '31.8%',
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 6,
  },
  kayitKutusu: { backgroundColor: renk.vurguAcik2, borderColor: renk.vurguCizgi },
  ad: { fontSize: 15, lineHeight: 19, textAlign: 'center' },
});

