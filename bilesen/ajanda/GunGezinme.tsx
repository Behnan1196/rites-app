// Gün başlığı, ‹ › gezinme, "↩ Bugüne dön" (A-2) ve hafta şeridi (A-2b).

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { gunKisa, uzunTarih, type Gun } from '@/mantik/tarih';

import { renk } from '../tema';
import { Yazi } from '../Yazi';

/** Başlık, ‹ › ve "↩ Bugüne dön". Gün görünümünde gün, Hafta görünümünde hafta adımlar. */
export function GunGezinme({
  baslik,
  oncekiEtiket,
  sonrakiEtiket,
  uzakta,
  onOnceki,
  onSonraki,
  onBugun,
}: {
  baslik: string;
  oncekiEtiket: string;
  sonrakiEtiket: string;
  /** Gün'de seçili gün ≠ bugün; Hafta'da hafta bugünü içermiyor (`05` §8). */
  uzakta: boolean;
  onOnceki: () => void;
  onSonraki: () => void;
  onBugun: () => void;
}) {
  return (
    <View style={stiller.kap}>
      <View style={stiller.satir}>
        <OkDugmesi yon="geri" etiket={oncekiEtiket} onPress={onOnceki} />
        <Yazi tur="bolumBasligi" style={stiller.baslik} accessibilityRole="header" accessibilityLiveRegion="polite">
          {baslik}
        </Yazi>
        <OkDugmesi yon="ileri" etiket={sonrakiEtiket} onPress={onSonraki} />
      </View>
      {uzakta && (
        <Pressable onPress={onBugun} accessibilityRole="button" style={stiller.bugune} hitSlop={6}>
          <Yazi kalinlik="kalin" renk={renk.ana}>
            ↩ Bugüne dön
          </Yazi>
        </Pressable>
      )}
    </View>
  );
}

function OkDugmesi({ yon, etiket, onPress }: { yon: 'geri' | 'ileri'; etiket: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      style={({ pressed }) => [stiller.ok, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={yon === 'geri' ? 'chevron-back' : 'chevron-forward'} size={26} color={renk.ana} />
    </Pressable>
  );
}

export function HaftaSeridi({
  gunler,
  secili,
  bugunGun,
  onSec,
}: {
  gunler: readonly Gun[];
  secili: Gun;
  bugunGun: Gun;
  onSec: (gun: Gun) => void;
}) {
  return (
    <View style={stiller.serit} accessibilityRole="tablist" accessibilityLabel="Hafta şeridi">
      {gunler.map((g) => {
        const seciliMi = g === secili;
        const bugunMu = g === bugunGun;
        const yaziRengi = seciliMi ? renk.yuzey : renk.yazi;
        return (
          <Pressable
            key={g}
            onPress={() => onSec(g)}
            accessibilityRole="tab"
            accessibilityState={{ selected: seciliMi }}
            accessibilityLabel={`${uzunTarih(g)}${bugunMu ? ', bugün' : ''}`}
            style={[stiller.gun, bugunMu && stiller.bugun, seciliMi && stiller.secili]}
          >
            <Yazi tur="etiket" renk={seciliMi ? renk.anaKoyuUstuYazi : renk.ikincil} maxFontSizeMultiplier={1.2}>
              {gunKisa(g)}
            </Yazi>
            <Yazi kalinlik="kalin" renk={yaziRengi} style={stiller.numara} maxFontSizeMultiplier={1.2}>
              {Number(g.slice(8))}
            </Yazi>
          </Pressable>
        );
      })}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  baslik: { flex: 1, textAlign: 'center' },
  ok: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bugune: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  serit: { flexDirection: 'row', gap: 5 },
  gun: {
    flex: 1,
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bugun: { borderColor: renk.ana },
  secili: { backgroundColor: renk.ana, borderColor: renk.ana },
  numara: { fontSize: 22, lineHeight: 28 },
});
