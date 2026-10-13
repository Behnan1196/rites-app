// Gruplar ve ortak listeler için küçük parçalar.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { kisiBasHarf } from '@/mantik/kisiler';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

/** Açık zeminli baş harf yuvarlağı ("A", "GA"). */
export function KisiAvatari({ ad, boyut = 44, vurgu = false }: { ad: string; boyut?: number; vurgu?: boolean }) {
  return (
    <View
      style={[
        stiller.avatar,
        { width: boyut, height: boyut, borderRadius: boyut / 2, backgroundColor: vurgu ? renk.vurguAcik : renk.anaAcik },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Yazi kalinlik="kalin" renk={vurgu ? renk.vurguYazi : renk.ana}>
        {kisiBasHarf(ad)}
      </Yazi>
    </View>
  );
}

/** Köşeli işaret kutusu (liste ve adımlarda 26–28, `06`). */
export function IsaretKutusu({ secili }: { secili: boolean }) {
  return (
    <View style={[stiller.kutu, secili && stiller.kutuDolu]}>
      {secili && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
    </View>
  );
}

/** Çoklu seçim satırı: işaret kutusu, avatar, ad. */
export function SecimSatiri({
  ad,
  altYazi,
  secili,
  onPress,
  cizgili,
}: {
  ad: string;
  altYazi?: string;
  secili: boolean;
  onPress: () => void;
  cizgili?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: secili }}
      accessibilityLabel={ad}
      style={({ pressed }) => [stiller.secim, cizgili && stiller.cizgili, pressed && { opacity: 0.7 }]}
    >
      <IsaretKutusu secili={secili} />
      <KisiAvatari ad={ad} boyut={40} />
      <View style={stiller.esnek}>
        <Yazi kalinlik="kalin">{ad}</Yazi>
        {!!altYazi && <Yazi tur="ikincil">{altYazi}</Yazi>}
      </View>
    </Pressable>
  );
}

/** Beyaz, çerçeveli liste kutusu (satırlar arası ince çizgi çağıranda). */
export function ListeKutusu({ children }: { children: React.ReactNode }) {
  return <View style={stiller.listeKutusu}>{children}</View>;
}

export const parcaStilleri = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 64 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  esnek: { flex: 1 },
});

const stiller = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  kutu: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: renk.soluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  secim: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 56 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  esnek: { flex: 1 },
  listeKutusu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
  },
});
