// Ajandam Gün görünümündeki kart listesi: karta uzun basıp sürükleyerek sıra
// değişir (pilot 17 Ekim; tutamaç yer kaplamasın diye). Notlar'daki
// `SiraliNotlar` ile aynı hesap; sürükleme tutamaçtan değil uzun basmadan başlar.
// Ekran okuyucuda kartın "Yukarı taşı / Aşağı taşı" eylemleri var.

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, StyleSheet, type AccessibilityActionEvent } from 'react-native';

import { siraDegisikligi } from '@/mantik/ajanda';
import { yerDegistir } from '@/mantik/giris';

const ARALIK = 12;

export interface SurukleIslemleri {
  onUzunBas: () => void;
  onBirak: () => void;
  eylemler: { name: string; label: string }[];
  onEylem: (e: AccessibilityActionEvent) => void;
}

interface Ozellikler<T extends { id: string; sira: number }> {
  kartlar: readonly T[];
  satir: (kart: T, surukle: SurukleIslemleri) => ReactNode;
  /** Değişen kartların yeni sıra değerleri. */
  onSiralar: (siralar: Map<string, number>) => void;
  /** Sürükleme başlayınca true, bitince false (ekran kaydırması durdurulsun diye). */
  onSurukleme: (aktif: boolean) => void;
}

type Islemler = {
  basla(id: string): void;
  birakBas(id: string): void;
  panBasla(): void;
  hareket(id: string, dy: number): void;
  bitir(): void;
  tasi(id: string, yon: -1 | 1): void;
};

export function SiraliKartlar<T extends { id: string; sira: number }>({
  kartlar,
  satir,
  onSiralar,
  onSurukleme,
}: Ozellikler<T>) {
  const veritabaniSirasi = kartlar.map((k) => k.id);
  const [yerelSira, setYerelSira] = useState<string[] | null>(null);
  const [suruklenen, setSuruklenen] = useState<string | null>(null);
  const [ceviri] = useState(() => new Animated.Value(0));

  const yerelGecerli =
    yerelSira !== null &&
    yerelSira.length === veritabaniSirasi.length &&
    yerelSira.every((id) => veritabaniSirasi.includes(id)) &&
    (suruklenen !== null || yerelSira.join() !== veritabaniSirasi.join());
  const sira = yerelGecerli ? yerelSira : veritabaniSirasi;
  const kartMap = new Map(kartlar.map((k) => [k.id, k]));

  const yukseklikler = useRef(new Map<string, number>());
  const iz = useRef({ sira: [] as string[], kayma: 0, aktif: null as string | null, pan: false });

  const yaz = (yeniSira: readonly string[], id: string) => {
    const dizi = yeniSira.map((k) => kartMap.get(k)).filter((k): k is T => !!k);
    const degisen = siraDegisikligi(dizi, id);
    if (degisen.size) onSiralar(degisen);
  };

  const islemler: Islemler = {
    basla(id) {
      iz.current = { sira: [...sira], kayma: 0, aktif: id, pan: false };
      ceviri.setValue(0);
      setYerelSira(iz.current.sira);
      setSuruklenen(id);
      onSurukleme(true);
    },
    birakBas(id) {
      // Parmak kaldırıldı ya da sürükleme kartın dokunuşunu devraldı; devralmadıysa biter.
      setTimeout(() => {
        if (iz.current.aktif === id && !iz.current.pan) islemRef.current.bitir();
      }, 0);
    },
    panBasla() {
      iz.current.pan = true;
    },
    hareket(id, dy) {
      const t = iz.current;
      const i = t.sira.indexOf(id);
      const ofset = dy - t.kayma;
      const sonraki = t.sira[i + 1];
      const onceki = t.sira[i - 1];
      const h = (k: string) => (yukseklikler.current.get(k) ?? 72) + ARALIK;
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
      const t = iz.current;
      if (!t.aktif) return;
      const id = t.aktif;
      t.aktif = null;
      t.pan = false;
      Animated.spring(ceviri, { toValue: 0, useNativeDriver: false, bounciness: 0, speed: 20 }).start();
      setSuruklenen(null);
      onSurukleme(false);
      yaz(t.sira, id);
    },
    tasi(id, yon) {
      const i = sira.indexOf(id);
      const yeni = yerDegistir(sira, i, i + yon);
      setYerelSira(yeni);
      yaz(yeni, id);
    },
  };
  const islemRef = useRef(islemler);
  useLayoutEffect(() => {
    islemRef.current = islemler;
  });

  return (
    <Animated.View style={stiller.liste}>
      {/* İşleyiciler ref'leri yalnız dokunma olaylarında okur, çizim sırasında değil. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {sira.map((id, i) => {
        const kart = kartMap.get(id);
        if (!kart) return null;
        return (
          <Satir
            key={id}
            id={id}
            aktif={suruklenen === id}
            ceviri={ceviri}
            islemRef={islemRef}
            izRef={iz}
            onYukseklik={(h) => yukseklikler.current.set(id, h)}
          >
            {satir(kart, {
              onUzunBas: () => islemRef.current.basla(id),
              onBirak: () => islemRef.current.birakBas(id),
              eylemler: [
                ...(i === 0 ? [] : [{ name: 'yukari', label: 'Yukarı taşı' }]),
                ...(i === sira.length - 1 ? [] : [{ name: 'asagi', label: 'Aşağı taşı' }]),
              ],
              onEylem: (e) => {
                const ad = e.nativeEvent.actionName;
                if (ad === 'yukari' || ad === 'asagi') islemRef.current.tasi(id, ad === 'yukari' ? -1 : 1);
              },
            })}
          </Satir>
        );
      })}
    </Animated.View>
  );
}

function Satir({
  id,
  aktif,
  ceviri,
  islemRef,
  izRef,
  onYukseklik,
  children,
}: {
  id: string;
  aktif: boolean;
  ceviri: Animated.Value;
  islemRef: React.RefObject<Islemler>;
  izRef: React.RefObject<{ aktif: string | null }>;
  onYukseklik: (h: number) => void;
  children: ReactNode;
}) {
  // Yalnız uzun basılmış kart, parmak kıpırdayınca dokunuşu devralır.
  const surukleme = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => izRef.current.aktif === id,
        onMoveShouldSetPanResponder: () => izRef.current.aktif === id,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => islemRef.current.panBasla(),
        onPanResponderMove: (_e, g) => islemRef.current.hareket(id, g.dy),
        onPanResponderRelease: () => islemRef.current.bitir(),
        onPanResponderTerminate: () => islemRef.current.bitir(),
      }),
    [id, islemRef, izRef],
  );
  return (
    <Animated.View
      {...surukleme.panHandlers}
      onLayout={(e) => onYukseklik(e.nativeEvent.layout.height)}
      style={[aktif && stiller.aktif, aktif && { transform: [{ translateY: ceviri }, { scale: 1.02 }] }]}
    >
      {children}
    </Animated.View>
  );
}

const stiller = StyleSheet.create({
  liste: { gap: ARALIK },
  aktif: {
    zIndex: 10,
    opacity: 0.97,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
