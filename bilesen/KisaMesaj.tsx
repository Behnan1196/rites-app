// Başarılı işlemlerden sonra altta 2–3 saniyelik kısa mesaj (`05` §12).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

const SURE_MS = 2800;

const KisaMesajBaglami = createContext<((metin: string) => void) | null>(null);

export function KisaMesajSaglayici({ children }: { children: ReactNode }) {
  const kenar = useSafeAreaInsets();
  const [mesaj, setMesaj] = useState<{ metin: string; no: number } | null>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goster = useCallback((metin: string) => {
    setMesaj((eski) => ({ metin, no: (eski?.no ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!mesaj) return;
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => setMesaj(null), SURE_MS);
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, [mesaj]);

  const deger = useMemo(() => goster, [goster]);

  return (
    <KisaMesajBaglami.Provider value={deger}>
      {children}
      {mesaj && (
        <View
          pointerEvents="none"
          style={[stiller.kap, { bottom: kenar.bottom + olcu.altMenuYukseklik + 24 }]}
        >
          <View style={stiller.mesaj} accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Yazi renk={renk.yuzey} kalinlik="yariKalin" style={stiller.yazi}>
              {mesaj.metin}
            </Yazi>
          </View>
        </View>
      )}
    </KisaMesajBaglami.Provider>
  );
}

/** `kisaMesaj("Bugünün ajandasına alındı")` */
export function useKisaMesaj(): (metin: string) => void {
  const goster = useContext(KisaMesajBaglami);
  if (!goster) throw new Error('useKisaMesaj, KisaMesajSaglayici içinde kullanılmalı.');
  return goster;
}

const stiller = StyleSheet.create({
  kap: { position: 'absolute', left: olcu.ekranKenari, right: olcu.ekranKenari, alignItems: 'center', zIndex: 50 },
  mesaj: {
    backgroundColor: renk.yazi,
    borderRadius: olcu.kose.dugme,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  yazi: { textAlign: 'center' },
});
