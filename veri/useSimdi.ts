// Şu anki saat ("SS:dd"); dakikada bir ve uygulama ön plana dönünce tazelenir.
// `useSimdiMs` aynı anı milisaniye olarak verir (kalan süre hesapları için).

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

function saatMetni(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function useSimdiMs(): number {
  const [an, setAn] = useState(() => Date.now());
  useEffect(() => {
    let zamanlayici: ReturnType<typeof setTimeout>;
    const kur = () => {
      const d = new Date();
      zamanlayici = setTimeout(() => {
        setAn(Date.now());
        kur();
      }, (60 - d.getSeconds()) * 1000 + 50);
    };
    kur();
    const abonelik = AppState.addEventListener('change', (durum) => {
      if (durum === 'active') setAn(Date.now());
    });
    return () => {
      clearTimeout(zamanlayici);
      abonelik.remove();
    };
  }, []);
  return an;
}

export function useSimdi(): string {
  return saatMetni(useSimdiMs());
}
