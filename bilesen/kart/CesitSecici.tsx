// "Ne tür bir kart?" (pilot 24 Ekim, P-41): yeni kartın ilk adımı. En başta
// "Basit kart" (yalnız başlık ve zaman), sonra alan alan isimli çeşitler. Seçince
// kart formu o çeşidin parçaları ve zamanıyla açılır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { cesitGruplari } from '@/mantik/cesit';
import { katalog, type KartCesidi } from '@/mantik/katalog';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

type IonAdi = React.ComponentProps<typeof Ionicons>['name'];

export function CesitSecici({
  cesitler,
  onSec,
  oncelikli = [],
}: {
  cesitler: readonly KartCesidi[];
  /** Önce gösterilecek alanlar (programın alanları; P-45). */
  oncelikli?: readonly string[];
  /** null: Basit kart. */
  onSec: (c: KartCesidi | null) => void;
}) {
  const alanlar = katalog().alanlar;
  const gruplar = cesitGruplari(cesitler, [
    ...alanlar.filter((a) => oncelikli.includes(a.anahtar)),
    ...alanlar.filter((a) => !oncelikli.includes(a.anahtar)),
  ]);
  return (
    <View style={stiller.kap}>
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Ne tür bir kart?
      </Yazi>
      <Kutu ikon="create-outline" ad="Basit kart" aciklama="Başlık ve zaman" onPress={() => onSec(null)} />
      {gruplar.map((g) => (
        <View key={g.alan} style={stiller.grup}>
          <Yazi tur="kutuBasligi" accessibilityRole="header">
            {g.ad}
          </Yazi>
          {g.cesitler.map((c) => (
            <Kutu
              key={c.id}
              ikon={(c.ikon as IonAdi | null) ?? 'leaf-outline'}
              ad={c.ad}
              aciklama={c.aciklama}
              onPress={() => onSec(c)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Çeşit satırı: simge, ad, açıklama (Yaşam Tarzım'ın alan ekranında da). */
export function Kutu({
  ikon,
  ad,
  aciklama,
  onPress,
  sag,
}: {
  ikon: IonAdi;
  ad: string;
  aciklama: string;
  onPress: () => void;
  /** Sağdaki kısa yazı (tasarımda "Gizli"). */
  sag?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[ad, aciklama, sag].filter(Boolean).join(', ')}
      style={({ pressed }) => [stiller.kutu, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.simge}>
        <Ionicons name={ikon} size={26} color={renk.ana} />
      </View>
      <View style={stiller.esnek}>
        <Yazi kalinlik="kalin">{ad}</Yazi>
        {!!aciklama && <Yazi tur="ikincil">{aciklama}</Yazi>}
      </View>
      {!!sag && <Yazi tur="etiket">{sag}</Yazi>}
      <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 10 },
  grup: { gap: 8, marginTop: 6 },
  kutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  simge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1, gap: 2 },
});
