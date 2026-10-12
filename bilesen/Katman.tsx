// Üst katman: alttan sayfalar ve onay kutuları, uygulamanın en üstünde
// (alt menü dahil her şeyin önünde) bu katmanda çizilir.
//
// React Native'in Modal bileşeni kullanılmaz: Expo Go'da (SDK 57) Modal
// görünmeden açık kalıp bütün dokunuşları yutabildi. Katman sıradan bir
// görünüm olduğu için içi boşken hiçbir dokunuşu engellemez.
//
// Not: Katmana konan içerik kök düzende çizilir; bu yüzden içerik, kökte
// sağlanan bağlamları (veri, güvenli alan) kullanabilir, bir ekranın kendi
// bağlamlarını kullanamaz. Gereken değerler özellik (prop) olarak verilir.

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

interface KatmanIslemleri {
  ayarla(id: string, icerik: ReactNode | null): void;
}

const KatmanBaglami = createContext<KatmanIslemleri | null>(null);

export function KatmanSaglayici({ children }: { children: ReactNode }) {
  const [katmanlar, setKatmanlar] = useState<ReadonlyMap<string, ReactNode>>(new Map());

  const ayarla = useCallback((id: string, icerik: ReactNode | null) => {
    setKatmanlar((eski) => {
      if (icerik === null && !eski.has(id)) return eski;
      const yeni = new Map(eski);
      if (icerik === null) yeni.delete(id);
      else yeni.set(id, icerik);
      return yeni;
    });
  }, []);

  const islemler = useMemo(() => ({ ayarla }), [ayarla]);

  return (
    <KatmanBaglami.Provider value={islemler}>
      {children}
      {katmanlar.size > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {[...katmanlar].map(([id, icerik]) => (
            <Fragment key={id}>{icerik}</Fragment>
          ))}
        </View>
      )}
    </KatmanBaglami.Provider>
  );
}

/** İçeriğini üst katmanda çizer. Kendisi bulunduğu yerde hiçbir şey çizmez. */
export function Katman({ children }: { children: ReactNode }) {
  const baglam = useContext(KatmanBaglami);
  if (!baglam) throw new Error('Katman, KatmanSaglayici içinde kullanılmalı.');
  const { ayarla } = baglam;
  const id = useId();

  // Her çizimde içeriği güncelle.
  useLayoutEffect(() => {
    ayarla(id, children);
  });
  // Kaldırılınca katmandan çıkar.
  useEffect(() => () => ayarla(id, null), [ayarla, id]);

  return null;
}
