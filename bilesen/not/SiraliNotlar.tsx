// Notlar ekranındaki liste (N-1): her notun solunda tutamaç; tutup sürükleyerek
// sıra değişir. Ekran okuyucuda tutamacın "Yukarı taşı / Aşağı taşı" eylemleri var.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { yerDegistir } from '@/mantik/giris';
import type { Not } from '@/veri/notlar';

import { renk } from '../tema';
import { YapiskanNot } from './YapiskanNot';

const ARALIK = 10;

interface Ozellikler {
  notlar: readonly Not[];
  onAc: (not: Not) => void;
  onSira: (kimlikler: string[]) => void;
  /** Sürükleme başlayınca true, bitince false (ekran kaydırması durdurulsun diye). */
  onSurukleme: (aktif: boolean) => void;
}

export function SiraliNotlar({ notlar, onAc, onSira, onSurukleme }: Ozellikler) {
  const veritabaniSirasi = notlar.map((n) => n.id);
  // Sürükleme sırasında ve bırakıldıktan sonra veritabanı yetişene kadar gösterilen sıra.
  const [yerelSira, setYerelSira] = useState<string[] | null>(null);
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [ceviri] = useState(() => new Animated.Value(0));

  const yerelGecerli =
    yerelSira !== null &&
    yerelSira.length === veritabaniSirasi.length &&
    yerelSira.every((id) => veritabaniSirasi.includes(id)) &&
    (suruklenen !== null || yerelSira.join() !== veritabaniSirasi.join());
  const sira = yerelGecerli ? yerelSira : veritabaniSirasi;
  const notMap = new Map(notlar.map((n) => [n.id, n]));

  // Sürükleme hesabı ekran çizimine bağlı değil; bu yüzden ref'lerde tutulur.
  const yukseklikler = useRef(new Map<string, number>());
  const iz = useRef({ sira: [] as string[], kayma: 0 });

  const islemler = {
    basla(id: string) {
      iz.current = { sira: [...sira], kayma: 0 };
      ceviri.setValue(0);
      setYerelSira(iz.current.sira);
      setSuruklenen(id);
      onSurukleme(true);
    },
    hareket(id: string, dy: number) {
      const t = iz.current;
      const i = t.sira.indexOf(id);
      const ofset = dy - t.kayma;
      const sonraki = t.sira[i + 1];
      const onceki = t.sira[i - 1];
      const h = (k: string) => (yukseklikler.current.get(k) ?? 60) + ARALIK;
      if (sonraki && ofset > h(sonraki) / 2) {
        t.sira = yerDegistir(t.sira, i, i + 1);
        t.kayma += h(sonraki);
        setYerelSira(t.sira);
      } else if (onceki && ofset < -h(onceki) / 2) {
        t.sira = yerDegistir(t.sira, i, i - 1);
        t.kayma -= h(onceki);
        setYerelSira(t.sira);
      }
      ceviri.setValue(dy - t.kayma);
    },
    bitir() {
      Animated.spring(ceviri, { toValue: 0, useNativeDriver: false, bounciness: 0, speed: 20 }).start();
      setSuruklenen(null);
      onSurukleme(false);
      onSira(iz.current.sira);
    },
    tasi(id: string, yon: -1 | 1) {
      const i = sira.indexOf(id);
      const yeni = yerDegistir(sira, i, i + yon);
      setYerelSira(yeni);
      onSira(yeni);
    },
  };
  const islemRef = useRef(islemler);
  useLayoutEffect(() => {
    islemRef.current = islemler;
  });

  return (
    <View style={stiller.liste}>
      {sira.map((id, i) => {
        const not = notMap.get(id);
        if (!not) return null;
        const aktif = suruklenen === id;
        return (
          <Animated.View
            key={id}
            onLayout={(e) => yukseklikler.current.set(id, e.nativeEvent.layout.height)}
            style={[aktif && stiller.aktif, aktif && { transform: [{ translateY: ceviri }] }]}
          >
            <YapiskanNot
              not={not}
              onPress={() => onAc(not)}
              sol={
                <Tutamac
                  id={id}
                  islemRef={islemRef}
                  ilk={i === 0}
                  son={i === sira.length - 1}
                />
              }
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

type Islemler = {
  basla(id: string): void;
  hareket(id: string, dy: number): void;
  bitir(): void;
  tasi(id: string, yon: -1 | 1): void;
};

function Tutamac({
  id,
  islemRef,
  ilk,
  son,
}: {
  id: string;
  islemRef: React.RefObject<Islemler>;
  ilk: boolean;
  son: boolean;
}) {
  // İşleyiciler ref'i yalnız dokunma olaylarında okur, çizim sırasında değil.
  const surukleme = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => islemRef.current.basla(id),
        onPanResponderMove: (_e, g) => islemRef.current.hareket(id, g.dy),
        onPanResponderRelease: () => islemRef.current.bitir(),
        onPanResponderTerminate: () => islemRef.current.bitir(),
      }),
    [id, islemRef],
  );
  const eylemler = [
    ...(ilk ? [] : [{ name: 'yukari', label: 'Yukarı taşı' }]),
    ...(son ? [] : [{ name: 'asagi', label: 'Aşağı taşı' }]),
  ];
  return (
    <View
      {...surukleme.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Sırasını değiştir"
      accessibilityActions={eylemler}
      onAccessibilityAction={(e) => islemRef.current.tasi(id, e.nativeEvent.actionName === 'yukari' ? -1 : 1)}
      style={stiller.tutamac}
    >
      <Ionicons name="reorder-three-outline" size={30} color={renk.vurguYazi} />
    </View>
  );
}

const stiller = StyleSheet.create({
  liste: { gap: ARALIK },
  aktif: { zIndex: 10, opacity: 0.95 },
  tutamac: { width: 52, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 56 },
});
