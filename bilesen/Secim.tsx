// Küçük seçim parçaları: seçenek hapı, aç/kapa düğmesi, artı-eksi sayaç.

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

/** Seçilince dolan hap düğme ("4 hafta", "Pzt", "Her gün"). */
export function SecenekHapi({
  etiket,
  secili,
  onPress,
  altEtiket,
  style,
  erisimEtiketi,
}: {
  etiket: string;
  secili: boolean;
  onPress: () => void;
  altEtiket?: string;
  style?: StyleProp<ViewStyle>;
  erisimEtiketi?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
      accessibilityLabel={erisimEtiketi ?? (altEtiket ? `${etiket} ${altEtiket}` : etiket)}
      style={({ pressed }) => [
        stiller.hap,
        secili ? stiller.hapSecili : stiller.hapBos,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Yazi kalinlik="kalin" renk={secili ? renk.yuzey : renk.yazi}>
        {etiket}
      </Yazi>
      {!!altEtiket && (
        <Yazi tur="etiket" renk={secili ? renk.anaKoyuUstuYazi : renk.ikincil}>
          {altEtiket}
        </Yazi>
      )}
    </Pressable>
  );
}

/** 60×36 aç/kapa düğmesi (`06`). */
export function AcKapa({
  acik,
  onDegis,
  etiket,
}: {
  acik: boolean;
  onDegis: (acik: boolean) => void;
  etiket: string;
}) {
  return (
    <Pressable
      onPress={() => onDegis(!acik)}
      accessibilityRole="switch"
      accessibilityState={{ checked: acik }}
      accessibilityLabel={etiket}
      hitSlop={6}
      style={[stiller.anahtar, { backgroundColor: acik ? renk.ana : renk.pasif }]}
    >
      <View style={[stiller.top, { alignSelf: acik ? 'flex-end' : 'flex-start' }]} />
    </Pressable>
  );
}

/** − sayı + */
export function ArtiEksi({
  deger,
  onEksi,
  onArti,
  eksiEtiket,
  artiEtiket,
  bos = false,
}: {
  deger: string;
  onEksi: () => void;
  onArti: () => void;
  eksiEtiket: string;
  artiEtiket: string;
  /** Değer geçerli değilse (ör. süresiz) soluk göster. */
  bos?: boolean;
}) {
  return (
    <View style={stiller.artiEksi}>
      <Pressable onPress={onEksi} accessibilityRole="button" accessibilityLabel={eksiEtiket} style={stiller.yuvarlak}>
        <Yazi tur="bolumBasligi">−</Yazi>
      </Pressable>
      <Yazi tur="bolumBasligi" renk={bos ? renk.soluk : renk.yazi} style={[stiller.sayi, bos && stiller.sayiBos]}>
        {deger}
      </Yazi>
      <Pressable onPress={onArti} accessibilityRole="button" accessibilityLabel={artiEtiket} style={stiller.yuvarlak}>
        <Yazi tur="bolumBasligi">+</Yazi>
      </Pressable>
    </View>
  );
}

/** Beyaz, çerçeveli bölüm kutusu. */
export function Bolum({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[stiller.bolum, style]}>{children}</View>;
}

const stiller = StyleSheet.create({
  hap: {
    minHeight: 48,
    borderRadius: olcu.kose.hap,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hapBos: { backgroundColor: renk.yuzey, borderColor: renk.cizgi },
  hapSecili: { backgroundColor: renk.ana, borderColor: renk.ana },
  anahtar: { width: 60, height: 36, borderRadius: 18, padding: 3, justifyContent: 'center' },
  top: { width: 30, height: 30, borderRadius: 15, backgroundColor: renk.yuzey },
  artiEksi: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  yuvarlak: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sayi: { minWidth: 44, textAlign: 'center' },
  sayiBos: { fontSize: 16 },
  bolum: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
});
