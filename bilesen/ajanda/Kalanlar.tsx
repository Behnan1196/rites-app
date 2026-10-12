// Geçmişten kalanlar kutusu (A-7, `05` §5): yalnız bugünün Gün görünümünde,
// kartların üstünde. Bugüne al / Bırak / Hepsini bugüne al.

import { Pressable, StyleSheet, View } from 'react-native';

import { kacGunOnce, kalanlarBasligi } from '@/mantik/kalanlar';
import type { Kart } from '@/mantik/kart';
import type { Gun } from '@/mantik/tarih';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function Kalanlar({
  liste,
  bugunGun,
  onBuguneAl,
  onBirak,
}: {
  liste: readonly Kart[];
  bugunGun: Gun;
  onBuguneAl: (kartlar: readonly Kart[]) => void;
  onBirak: (kart: Kart) => void;
}) {
  if (liste.length === 0) return null;
  return (
    <View style={stiller.kutu}>
      <Yazi tur="bolumBasligi" renk={renk.vurguYazi} accessibilityRole="header">
        {kalanlarBasligi(liste, bugunGun)}
      </Yazi>
      {liste.map((k) => (
        <View key={k.id} style={stiller.satir}>
          <View style={stiller.esnek}>
            <Yazi kalinlik="kalin" numberOfLines={2}>
              {k.baslik}
            </Yazi>
            <Yazi tur="ikincil">{kacGunOnce(k.tarih!, bugunGun)}</Yazi>
          </View>
          <Pressable
            onPress={() => onBuguneAl([k])}
            accessibilityRole="button"
            accessibilityLabel={`${k.baslik}: bugüne al`}
            style={({ pressed }) => [stiller.al, pressed && { opacity: 0.8 }]}
          >
            <Yazi kalinlik="kalin" renk={renk.yuzey}>
              Bugüne al
            </Yazi>
          </Pressable>
          <Pressable
            onPress={() => onBirak(k)}
            accessibilityRole="button"
            accessibilityLabel={`${k.baslik}: bırak`}
            style={stiller.birak}
            hitSlop={4}
          >
            <Yazi renk={renk.ikincil}>Bırak</Yazi>
          </Pressable>
        </View>
      ))}
      {liste.length > 1 && (
        <Pressable
          onPress={() => onBuguneAl(liste)}
          accessibilityRole="button"
          style={({ pressed }) => [stiller.hepsi, pressed && { opacity: 0.8 }]}
        >
          <Yazi kalinlik="kalin" renk={renk.ana}>
            Hepsini bugüne al
          </Yazi>
        </Pressable>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    backgroundColor: renk.vurguAcik2,
    borderWidth: 1,
    borderColor: renk.vurguCizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 4,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: renk.vurguCizgi,
  },
  esnek: { flex: 1 },
  al: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  birak: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  hepsi: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: renk.ana,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});
