// "+ Karta ekle" ızgarası (K-6). P-36 (sade) / P-39: iki soru: "Kartta ne görünsün?"
// (talimat, video, liste…, zamanlayıcı, kronometre) ve "Ne kaydedilsin?" (ölçüm, sayarak,
// puan, günün notu / soru, gelişim fotoğrafı).

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ARAC_BLOKLARI, ICERIK_BLOKLARI, KAYIT_BLOKLARI, type BlokTuru } from '@/mantik/kart';

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
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Karta ekle" sagKapat="Kapat">
      <Izgara baslik="Kartta ne görünsün?" turler={[...ICERIK_BLOKLARI, ...ARAC_BLOKLARI]} onSec={onSec} />
      <Izgara
        baslik="Ne kaydedilsin?"
        turler={KAYIT_BLOKLARI.filter((t) => !ARAC_BLOKLARI.includes(t))}
        onSec={onSec}
      />
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
