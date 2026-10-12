// Ekranların veriyi okuması için kancalar. Veri değişince kendiliğinden tazelenir.

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ayarOku, type AyarAnahtari, type Ayarlar } from './ayar';
import type { Okuyucu } from './kapi';
import type { Konu } from './yayin';
import { useVeri } from './VeriSaglayici';

export type SorguSonucu<T> = { yukleniyor: true; veri: undefined } | { yukleniyor: false; veri: T };

/**
 * `sorgu`yu çalıştırır; `konular`dan biri değişince yeniden çalıştırır.
 * `bagimliliklar` değişince de yeniden çalışır (useEffect gibi).
 */
export function useSorgu<T>(
  konular: readonly Konu[],
  sorgu: (oku: Okuyucu) => Promise<T>,
  bagimliliklar: readonly unknown[] = [],
): SorguSonucu<T> {
  const { oku, yayin } = useVeri();
  const [sonuc, setSonuc] = useState<SorguSonucu<T>>({ yukleniyor: true, veri: undefined });

  // En son sorgu fonksiyonunu tut; abonelik her çizimde yenilenmesin.
  const sorguRef = useRef(sorgu);
  useLayoutEffect(() => {
    sorguRef.current = sorgu;
  });

  const konuAnahtari = konular.join(',');
  useEffect(() => {
    let gecerli = true;
    let sonNo = 0;
    const calistir = () => {
      const no = ++sonNo;
      sorguRef.current(oku).then(
        (veri) => {
          // Ekran kapandıysa ya da daha yeni bir sorgu başladıysa sonucu atla.
          if (gecerli && no === sonNo) setSonuc({ yukleniyor: false, veri });
        },
        (e: unknown) => console.error('Sorgu hatası', e),
      );
    };
    calistir();
    const bitir = yayin.abone(konuAnahtari.split(',') as Konu[], calistir);
    return () => {
      gecerli = false;
      bitir();
    };
    // Bağımlılıklar çağıranın verdiği listeyle birlikte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oku, yayin, konuAnahtari, ...bagimliliklar]);

  return sonuc;
}

export function useAyar<K extends AyarAnahtari>(anahtar: K): SorguSonucu<Ayarlar[K] | null> {
  return useSorgu(['ayar'], (oku) => ayarOku(oku, anahtar), [anahtar]);
}
