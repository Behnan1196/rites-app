// Şu anki saat ("SS:dd"); dakikada bir ve uygulama ön plana dönünce tazelenir.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function simdiSaat(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function useSimdi(): string {
  const [saat, setSaat] = useState(simdiSaat);
  useEffect(() => {
    let zamanlayici: ReturnType<typeof setTimeout>;
    const kur = () => {
      const d = new Date();
      zamanlayici = setTimeout(() => {
        setSaat(simdiSaat());
        kur();
      }, (60 - d.getSeconds()) * 1000 + 50);
    };
    kur();
    const abonelik = AppState.addEventListener('change', (durum) => {
      if (durum === 'active') setSaat(simdiSaat());
    });
    return () => {
      clearTimeout(zamanlayici);
      abonelik.remove();
    };
  }, []);
  return saat;
}
