// "+ Karta ekle" ızgarası (K-6). P-36 (sade) / P-39: iki soru: "Kartta ne görünsün?"
// (talimat, video, liste…, zamanlayıcı, kronometre) ve "Ne kaydedilsin?" (ölçüm, sayarak,
// puan, günün notu / soru, gelişim fotoğrafı). P-67: kartta olan parça listede yok (her parça bir kez).

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { type BlokTuru } from '@/mantik/kart';
import { secilebilirParcalar } from '@/mantik/parcaSecimi';

import { AltSayfa } from '../AltSayfa';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { BLOK_TURLERI } from './blokTurleri';

export function BlokSecici({
  gorunur,
  onKapat,
  onSec,
  haric = [],
  mevcut = [],
  uzman = false,
}: {
  gorunur: boolean;
  onKapat: () => void;
  onSec: (tur: BlokTuru) => void;
  /** Gösterilmeyecek türler (çeşit tasarımında telefondaki fotoğraf / dosya; P-41). */
  haric?: readonly BlokTuru[];
  /** P-67: kartta zaten olan parçalar (yeniden eklenmez). */
  mevcut?: readonly BlokTuru[];
  /** P-51: normal kullanıcı yalnız Liste · Fotoğraf · Video görür; uzman hepsini. */
  uzman?: boolean;
}) {
  const { gorunen, kayit } = secilebilirParcalar({ uzman, haric, mevcut });
  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Karta ekle" sagKapat="Kapat">
      {uzman ? (
        <>
          {gorunen.length > 0 && <Izgara baslik="Kartta ne görünsün?" turler={gorunen} onSec={onSec} />}
          {kayit.length > 0 && <Izgara baslik="Ne kaydedilsin?" turler={kayit} onSec={onSec} />}
        </>
      ) : (
        <Izgara baslik="" turler={gorunen} onSec={onSec} />
      )}
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
      {!!baslik && (
        <Yazi tur="kutuBasligi" accessibilityRole="header">
          {baslik}
        </Yazi>
      )}
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
  kayitKutusu: {
    backgroundColor: renk.vurguAcik2,
    borderColor: renk.vurguCizgi,
  },
  ad: { fontSize: 15, lineHeight: 19, textAlign: 'center' },
});
