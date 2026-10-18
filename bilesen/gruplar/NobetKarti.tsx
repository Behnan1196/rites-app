// Grup ekranında bir nöbet: ad, günler, sıradaki beş gün ve kimde olduğu
// (yapıldıysa ✓ ve yapan). Kuran için Düzenle.

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { kisaGoreliTarih } from '@/mantik/ajanda';
import { nobetGunleriMetni, yaklasanSira, type Nobet } from '@/mantik/nobet';
import { gunKisa, type Gun } from '@/mantik/tarih';

import { Dugme } from '../Dugme';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function NobetKarti({
  nobet,
  ben,
  bugunGun,
  ad,
  onDuzenle,
}: {
  nobet: Nobet;
  ben: string;
  bugunGun: Gun;
  ad: (id: string) => string;
  onDuzenle: () => void;
}) {
  const sira = yaklasanSira(nobet, bugunGun, 5);
  const gunMetni = (g: Gun) => {
    const k = kisaGoreliTarih(g, bugunGun);
    return k === 'Bugün' || k === 'Yarın' ? k : `${gunKisa(g)} ${k}`;
  };
  return (
    <View style={stiller.kart}>
      <View style={stiller.ust}>
        <Ionicons name="swap-horizontal-outline" size={22} color={kaynakRenk.grup.serit} />
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi">{nobet.ad}</Yazi>
          <Yazi kalinlik="kalin" renk={kaynakRenk.grup.yazi}>
            {`${nobetGunleriMetni(nobet.gunler)} · sırayla`}
          </Yazi>
        </View>
        {nobet.kuran === ben && <Dugme tur="yazi" etiket="Düzenle" onPress={onDuzenle} />}
      </View>
      <View style={stiller.liste}>
        {sira.map((s, i) => {
          const kimAdi = ad(s.kim);
          const yapti = s.yapan ? (s.yapan === s.kim ? ' ✓' : ` ✓ (${ad(s.yapan)})`) : '';
          return (
            <View key={s.gun} style={[stiller.satir, i > 0 && stiller.cizgili]}>
              <Yazi tur="ikincil" style={stiller.gun}>
                {gunMetni(s.gun)}
              </Yazi>
              <Yazi kalinlik={s.kim === ben ? 'kalin' : undefined} renk={s.kim === ben ? renk.ana : renk.yazi}>
                {`${kimAdi}${yapti}`}
              </Yazi>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.grup.serit,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 10,
  },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  esnek: { flex: 1, gap: 2 },
  liste: { gap: 0 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  gun: { width: 92 },
});
