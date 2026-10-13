// Bir listenin maddeleri: ekran öne gelince, uygulama öne dönünce ve listede
// biri değişiklik yapınca (Realtime) tazelenir. Değişiklikler önce ekranda
// görünür, sonra sunucuya yazılır; olmazsa sunucudaki hâline dönülür.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { maddeleriSirala, type Madde } from '@/mantik/listeler';
import type { Gun } from '@/mantik/tarih';
import { maddeDegistir, maddeEkle, maddeleriDinle, maddeleriOku, maddeSil } from '@/sunucu/listeler';

import { useBanaVerilenler } from './BanaVerilenler';

type Degisiklik = Partial<{ yapildi: boolean; kime: string | null; tarih: Gun | null }>;

export function useMaddeler(liste: string, ben: string | null) {
  const [maddeler, setMaddeler] = useState<Madde[] | null>(null);
  const [hata, setHata] = useState(false);
  const sira = useRef(0);
  const verilenler = useBanaVerilenler();
  const verilenleriYenile = verilenler.yenile;

  const yenile = useCallback(async () => {
    if (!ben) return;
    const no = ++sira.current;
    try {
      const m = await maddeleriOku(liste);
      if (no === sira.current) {
        setMaddeler(maddeleriSirala(m));
        setHata(false);
      }
    } catch (e) {
      console.warn('Maddeler okunamadı', e);
      if (no === sira.current) setHata(true);
    }
  }, [liste, ben]);

  useFocusEffect(
    useCallback(() => {
      void yenile();
    }, [yenile]),
  );

  useEffect(() => {
    if (!ben) return;
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    const kapat = maddeleriDinle(`liste-${liste}-${Math.random().toString(36).slice(2)}`, `liste=eq.${liste}`, () => void yenile());
    return () => {
      a.remove();
      kapat();
    };
  }, [liste, ben, yenile]);

  /** Sunucu işini yapar; olmazsa false döner. Her durumda sunucudan yeniden okunur. */
  const yaz = useCallback(
    async (is: () => Promise<unknown>) => {
      sira.current++; // yoldaki okuma bu değişikliği ezmesin
      let ok = true;
      try {
        await is();
      } catch (e) {
        console.warn(e);
        ok = false;
      }
      void yenile();
      void verilenleriYenile();
      return ok;
    },
    [yenile, verilenleriYenile],
  );

  const ekle = useCallback(
    (metin: string) => {
      if (!ben) return Promise.resolve(false);
      return yaz(async () => {
        const m = await maddeEkle(liste, ben, metin);
        setMaddeler((ms) => maddeleriSirala([...(ms ?? []).filter((x) => x.id !== m.id), m]));
      });
    },
    [liste, ben, yaz],
  );

  const degistir = useCallback(
    (id: string, d: Degisiklik) => {
      setMaddeler((ms) => ms?.map((m) => (m.id === id ? { ...m, ...d } : m)) ?? null);
      return yaz(() => maddeDegistir(id, d));
    },
    [yaz],
  );

  const sil = useCallback(
    (id: string) => {
      setMaddeler((ms) => ms?.filter((m) => m.id !== id) ?? null);
      return yaz(() => maddeSil(id));
    },
    [yaz],
  );

  return { maddeler, hata, yenile, ekle, degistir, sil };
}
