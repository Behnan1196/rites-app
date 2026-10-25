// Dijital zamanlayıcının çarkı (P-42): telefonun saat uygulamasındaki gibi yukarı /
// aşağı kaydırılan sayılar; ortadaki bant seçili değer. Bir sayıya dokunmak da onu
// seçer. Yeni yerel modül yok: ScrollView'un adım adım durmasıyla (snapToInterval).
// Ekran okuyucuda "ayarlanabilir" öğedir (yukarı / aşağı kaydırınca bir artar / azalır).

import { useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { renk } from '../tema';
import { Yazi } from '../Yazi';

const SATIR = 52;

const iki = (n: number) => String(n).padStart(2, '0');

export function Cark({
  deger,
  adet,
  onDegis,
  etiket,
  birim,
}: {
  deger: number;
  /** 0 … adet − 1 */
  adet: number;
  onDegis: (n: number) => void;
  etiket: string;
  birim: string;
}) {
  const kaydirici = useRef<ScrollView>(null);
  const son = useRef(deger);

  // Değer dışarıdan değişince (ör. 60 dk seçilince saniye 0) çark da döner.
  useEffect(() => {
    if (deger === son.current) return;
    son.current = deger;
    kaydirici.current?.scrollTo({ y: deger * SATIR, animated: true });
  }, [deger]);

  const sinirla = (n: number) => Math.min(adet - 1, Math.max(0, n));
  const sec = (n: number) => {
    const i = sinirla(n);
    if (i === son.current) return;
    son.current = i;
    onDegis(i);
  };
  const durdu = (e: NativeSyntheticEvent<NativeScrollEvent>) => sec(Math.round(e.nativeEvent.contentOffset.y / SATIR));

  return (
    <View
      style={stiller.kap}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiket}
      accessibilityValue={{ text: `${deger} ${birim}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const n = sinirla(deger + (e.nativeEvent.actionName === 'increment' ? 1 : -1));
        sec(n);
        kaydirici.current?.scrollTo({ y: n * SATIR, animated: false });
      }}
    >
      <View pointerEvents="none" style={stiller.bant} />
      <ScrollView
        ref={kaydirici}
        showsVerticalScrollIndicator={false}
        snapToInterval={SATIR}
        decelerationRate="fast"
        nestedScrollEnabled
        onLayout={() => kaydirici.current?.scrollTo({ y: son.current * SATIR, animated: false })}
        onMomentumScrollEnd={durdu}
        onScrollEndDrag={durdu}
        contentContainerStyle={stiller.ic}
      >
        {Array.from({ length: adet }, (_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              sec(i);
              kaydirici.current?.scrollTo({ y: i * SATIR, animated: true });
            }}
            importantForAccessibility="no"
            style={stiller.satir}
          >
            <Yazi kalinlik="kalin" style={[stiller.rakam, i !== deger && stiller.soluk]}>
              {iki(i)}
            </Yazi>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { height: SATIR * 3, width: 92 },
  ic: { paddingVertical: SATIR },
  bant: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SATIR,
    height: SATIR,
    borderRadius: 12,
    backgroundColor: renk.anaAcik,
  },
  satir: { height: SATIR, alignItems: 'center', justifyContent: 'center' },
  rakam: { fontSize: 38, lineHeight: 46, color: renk.yazi, fontVariant: ['tabular-nums'] },
  soluk: { color: renk.soluk, fontSize: 30, lineHeight: 38 },
});
