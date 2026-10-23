// Kaydırmalı sayı tekerleği (zamanlayıcı süresi; pilot 23 Ekim). Yerel bir
// seçici kitaplığı eklenmedi (yeni derleme gerekmesin): dikey ScrollView, satır
// yüksekliğine oturur. Ortadaki satır seçilidir. Ekran okuyucuda "ayarlanabilir"
// öğedir: yukarı / aşağı kaydırınca bir artar / azalır.

import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { renk } from '../tema';
import { Yazi } from '../Yazi';

const SATIR = 44;
const GORUNEN = 3;

export function Tekerlek({
  deger,
  adet,
  birim,
  onDegis,
  erisimEtiketi,
}: {
  deger: number;
  /** 0 … adet-1. */
  adet: number;
  /** Seçili satırın yanındaki kısa birim ("sa", "dk", "sn"). */
  birim: string;
  onDegis: (deger: number) => void;
  erisimEtiketi: string;
}) {
  const ref = useRef<ScrollView>(null);
  /** Kaydırmayla bildirilen son değer: dışarıdan gelen değer bundan farklıysa kaydırılır. */
  const sonBildirilen = useRef(deger);
  const bekleme = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (deger === sonBildirilen.current) return;
    sonBildirilen.current = deger;
    ref.current?.scrollTo({ y: deger * SATIR, animated: true });
  }, [deger]);

  useEffect(
    () => () => {
      if (bekleme.current) clearTimeout(bekleme.current);
    },
    [],
  );

  const yerles = (y: number) => {
    const i = Math.min(adet - 1, Math.max(0, Math.round(y / SATIR)));
    if (i !== sonBildirilen.current) {
      sonBildirilen.current = i;
      onDegis(i);
    }
  };
  // Web'de ve bazı durumlarda momentum olayı gelmez; kaydırma durunca yerleşir.
  const kaydirildi = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (bekleme.current) clearTimeout(bekleme.current);
    bekleme.current = setTimeout(() => {
      yerles(y);
      if (Math.abs(y - Math.round(y / SATIR) * SATIR) > 1)
        ref.current?.scrollTo({ y: Math.round(y / SATIR) * SATIR, animated: true });
    }, 140);
  };

  const ayarla = (fark: number) => {
    const yeni = (deger + fark + adet) % adet;
    sonBildirilen.current = yeni;
    ref.current?.scrollTo({ y: yeni * SATIR, animated: false });
    onDegis(yeni);
  };

  return (
    <View
      style={stiller.kap}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={erisimEtiketi}
      accessibilityValue={{ text: `${deger} ${birim}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => ayarla(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <View pointerEvents="none" style={stiller.secimBandi} />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={SATIR}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: deger * SATIR }}
        contentContainerStyle={stiller.icerik}
        onScroll={kaydirildi}
        onMomentumScrollEnd={(e) => yerles(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
        nestedScrollEnabled
      >
        {Array.from({ length: adet }, (_, i) => (
          <View key={i} style={stiller.satir}>
            <Yazi
              kalinlik={i === deger ? 'kalin' : 'normal'}
              renk={i === deger ? renk.yazi : renk.soluk}
              style={stiller.sayi}
            >
              {String(i).padStart(2, '0')}
            </Yazi>
          </View>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={stiller.birim}>
        <Yazi kalinlik="kalin" renk={renk.ikincil}>
          {birim}
        </Yazi>
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { flex: 1, height: SATIR * GORUNEN, overflow: 'hidden' },
  icerik: { paddingVertical: SATIR * ((GORUNEN - 1) / 2) },
  satir: { height: SATIR, alignItems: 'center', justifyContent: 'center', paddingRight: 28 },
  sayi: { fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  secimBandi: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SATIR * ((GORUNEN - 1) / 2),
    height: SATIR,
    borderRadius: 12,
    backgroundColor: renk.anaAcik,
  },
  birim: {
    position: 'absolute',
    right: 10,
    top: SATIR * ((GORUNEN - 1) / 2),
    height: SATIR,
    justifyContent: 'center',
  },
});
