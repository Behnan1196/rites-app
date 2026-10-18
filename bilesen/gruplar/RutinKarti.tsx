// Grup ekranında bir birlikte rutin: ad, hedef, bu hafta kim kaç kez; Katıl ya da
// Ayrıl; kuran için Düzenle.

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { haftaDurumu, hedefMetni, katildimMi, type Rutin } from '@/mantik/rutin';
import type { Gun } from '@/mantik/tarih';

import { Dugme } from '../Dugme';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function RutinKarti({
  rutin,
  ben,
  bugunGun,
  ad,
  onKatil,
  onAyril,
  onDuzenle,
}: {
  rutin: Rutin;
  ben: string;
  bugunGun: Gun;
  ad: (id: string) => string;
  onKatil: () => void;
  onAyril: () => void;
  onDuzenle: () => void;
}) {
  const katildim = katildimMi(rutin, ben);
  const durum = haftaDurumu(rutin, ben, bugunGun);
  return (
    <View style={stiller.kart}>
      <View style={stiller.ust}>
        <Ionicons name="repeat-outline" size={22} color={kaynakRenk.grup.serit} />
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi">{rutin.ad}</Yazi>
          <Yazi kalinlik="kalin" renk={kaynakRenk.grup.yazi}>
            {`${hedefMetni(rutin.hedef)} · bu hafta`}
          </Yazi>
        </View>
        {rutin.kuran === ben && <Dugme tur="yazi" etiket="Düzenle" onPress={onDuzenle} />}
      </View>
      {durum.length === 0 ? (
        <Yazi tur="ikincil">Henüz katılan yok.</Yazi>
      ) : (
        <View style={stiller.kisiler}>
          {durum.map((d) => (
            <View
              key={d.kullanici}
              style={[stiller.kisi, d.tamam && stiller.kisiTamam]}
              accessible
              accessibilityLabel={`${ad(d.kullanici)}: bu hafta ${d.sayi} / ${rutin.hedef}${d.tamam ? ', hedef tamam' : ''}`}
            >
              <Yazi kalinlik="kalin" renk={d.tamam ? renk.yuzey : renk.yazi}>
                {`${ad(d.kullanici)} ${d.sayi}/${rutin.hedef}${d.tamam ? ' ✓' : ''}`}
              </Yazi>
            </View>
          ))}
        </View>
      )}
      {katildim ? (
        <Dugme tur="yazi" etiket="Rutinden ayrıl" onPress={onAyril} />
      ) : (
        <Dugme etiket="Katıl" onPress={onKatil} />
      )}
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
    gap: 12,
  },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  esnek: { flex: 1, gap: 2 },
  kisiler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kisi: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: kaynakRenk.grup.zemin,
  },
  kisiTamam: { backgroundColor: kaynakRenk.grup.serit },
});
