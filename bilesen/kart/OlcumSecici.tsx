// "+ Ekle → Ölçüm" (pilot 4 Kasım, P-87): önce hazır ölçümler (Su, Kahve, Enerji, Uyku…;
// dokununca hemen eklenir, kartta olan görünmez), altında "Kendin kur": Sayarak · Sayı · Puan.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { BlokTuru } from '@/mantik/kart';
import { hazirKarttaMi, OLCUM_HAZIRLARI, OLCUM_TURLERI, type OlcumHaziri } from '@/mantik/olcumHazirlari';

import { AltSayfa } from '../AltSayfa';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { BLOK_TURLERI } from './blokTurleri';

export function OlcumSecici({
  gorunur,
  mevcut,
  onHazir,
  onTur,
  onKapat,
}: {
  gorunur: boolean;
  mevcut: readonly { tur: BlokTuru; ad: string }[];
  onHazir: (h: OlcumHaziri) => void;
  onTur: (tur: 'adet' | 'olcum' | 'puan') => void;
  onKapat: () => void;
}) {
  const hazirlar = OLCUM_HAZIRLARI.filter((h) => !hazirKarttaMi(h, mevcut));
  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Ölçüm ekle" solVazgec>
      {hazirlar.length > 0 && (
        <>
          <Yazi kalinlik="kalin">Hazır</Yazi>
          <View style={stiller.izgara}>
            {hazirlar.map((h) => (
              <Pressable
                key={h.ad}
                onPress={() => onHazir(h)}
                accessibilityRole="button"
                accessibilityLabel={`${h.ad} ekle, ${h.ipucu}`}
                style={({ pressed }) => [stiller.hazir, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name={BLOK_TURLERI[h.tur].ikon} size={20} color={renk.vurguYazi} />
                <View style={stiller.esnek}>
                  <Yazi kalinlik="kalin" numberOfLines={1}>
                    {h.ad}
                  </Yazi>
                  <Yazi tur="etiket" numberOfLines={1}>
                    {h.ipucu}
                  </Yazi>
                </View>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Yazi kalinlik="kalin">Kendin kur</Yazi>
      {OLCUM_TURLERI.map((t) => (
        <Pressable
          key={t.tur}
          onPress={() => onTur(t.tur)}
          accessibilityRole="button"
          accessibilityLabel={`${t.ad}: ${t.aciklama}`}
          style={({ pressed }) => [stiller.tur, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name={BLOK_TURLERI[t.tur].ikon} size={22} color={renk.ana} />
          <View style={stiller.esnek}>
            <Yazi kalinlik="kalin">{t.ad}</Yazi>
            <Yazi tur="ikincil">{t.aciklama}</Yazi>
          </View>
          <Ionicons name="chevron-forward" size={18} color={renk.soluk} />
        </Pressable>
      ))}
      <Yazi tur="ikincil">Bir kartta istediğin kadar ölçüm olur. Gidişatı kartın ⋯ menüsünde.</Yazi>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hazir: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  tur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  esnek: { flex: 1, gap: 2 },
});
