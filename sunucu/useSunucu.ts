// Sunucudan okunan veri: ekran öne gelince ve uygulama öne dönünce tazelenir.
// Bağlantı yoksa `hata` doludur; ekran "Şu an bağlanamıyor" der.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export function useSunucu<T>(yukle: (() => Promise<T>) | null, anahtar: string) {
  const [durum, setDurum] = useState<{ veri: T | null; hata: boolean; yukleniyor: boolean }>({
    veri: null,
    hata: false,
    yukleniyor: !!yukle,
  });
  const yukleRef = useRef(yukle);
  useEffect(() => {
    yukleRef.current = yukle;
  });
  const sira = useRef(0);

  const yenile = useCallback(async () => {
    const f = yukleRef.current;
    if (!f) return;
    const no = ++sira.current;
    try {
      const veri = await f();
      if (no === sira.current) setDurum({ veri, hata: false, yukleniyor: false });
    } catch (e) {
      console.warn('Sunucudan okunamadı', e);
      if (no === sira.current) setDurum((d) => ({ ...d, hata: true, yukleniyor: false }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void yenile();
    }, [yenile, anahtar]), // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    return () => a.remove();
  }, [yenile]);

  return { ...durum, yenile };
}
