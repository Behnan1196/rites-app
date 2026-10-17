// Gün başlığı, ‹ › gezinme, bugüne dönüş (A-2) ve hafta şeridi (A-2b).
// Pilot 17 Ekim: başlıkta yalnız tarih ("17 Ekim Cumartesi"; Bugün/Dün/Yarın yok);
// bugün değilse başlığın yanında küçük "bugüne dön" simgesi; yazılar küçüldü.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { gunKisa, uzunTarih, type Gun } from '@/mantik/tarih';

import { renk } from '../tema';
import { Yazi } from '../Yazi';

/** Başlık, ‹ › ve bugüne dön simgesi. Gün görünümünde gün, Hafta görünümünde hafta adımlar. */
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
    <View style={stiller.satir}>
      <OkDugmesi yon="geri" etiket={oncekiEtiket} onPress={onOnceki} />
      <View style={stiller.orta}>
        <Yazi tur="kartBasligi" style={stiller.baslik} accessibilityRole="header" accessibilityLiveRegion="polite">
          {baslik}
        </Yazi>
        {uzakta && (
          <Pressable
            onPress={onBugun}
            accessibilityRole="button"
            accessibilityLabel="Bugüne dön"
            hitSlop={8}
            style={({ pressed }) => [stiller.bugune, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="arrow-undo" size={18} color={renk.ana} />
          </Pressable>
        )}
      </View>
      <OkDugmesi yon="ileri" etiket={sonrakiEtiket} onPress={onSonraki} />
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
      <Ionicons name={yon === 'geri' ? 'chevron-back' : 'chevron-forward'} size={22} color={renk.ana} />
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
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  baslik: { textAlign: 'center', flexShrink: 1 },
  ok: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bugune: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serit: { flexDirection: 'row', gap: 5 },
  gun: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bugun: { borderColor: renk.ana },
  secili: { backgroundColor: renk.ana, borderColor: renk.ana },
  numara: { fontSize: 18, lineHeight: 22 },
});
