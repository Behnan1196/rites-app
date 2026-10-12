// "Bugün" telefonun yerel günüdür; gece yarısı geçince ve uygulama ön plana
// dönünce tazelenir (`07` Zaman ve tarih).

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { bugun, type Gun } from '@/mantik/tarih';

function geceYarisinaKalanMs(): number {
  const simdi = new Date();
  const yarin = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() + 1, 0, 0, 1);
  return yarin.getTime() - simdi.getTime();
}

export function useBugun(): Gun {
  const [gun, setGun] = useState(() => bugun());

  useEffect(() => {
    let zamanlayici: ReturnType<typeof setTimeout>;
    const kur = () => {
      zamanlayici = setTimeout(() => {
        setGun(bugun());
        kur();
      }, geceYarisinaKalanMs());
    };
    kur();
    const abonelik = AppState.addEventListener('change', (durum) => {
      if (durum === 'active') setGun(bugun());
    });
    return () => {
      clearTimeout(zamanlayici);
      abonelik.remove();
    };
  }, []);

  return gun;
}
