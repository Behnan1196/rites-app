// Bana tarihle verilen ortak liste maddeleri (`05` §9): ajandada sanal kart.
// Uygulama boyunca tek kaynak: oturum açılınca, uygulama öne dönünce, Ajandam
// öne gelince ve listede bir değişiklik olunca (Realtime) tazelenir.
// İşaretleme önce ekranda, sonra sunucuda yapılır; olmazsa geri alınır.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { BanaVerilen } from '@/mantik/listeler';
import { banaVerilenleriOku, maddeDegistir, maddeleriDinle } from '@/sunucu/listeler';
import { useOturum } from '@/sunucu/oturum';

interface Deger {
  maddeler: readonly BanaVerilen[];
  yenile: () => Promise<void>;
  /** Maddeyi işaretler; olmazsa false döner. */
  isaretle: (id: string, yapildi: boolean) => Promise<boolean>;
}

const BOS: readonly BanaVerilen[] = [];
const Baglam = createContext<Deger>({ maddeler: BOS, yenile: async () => undefined, isaretle: async () => false });

export function BanaVerilenlerSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const [maddeler, setMaddeler] = useState<readonly BanaVerilen[]>(BOS);
  const sira = useRef(0);

  const yenile = useCallback(async () => {
    if (!ben) return;
    const no = ++sira.current;
    try {
      const m = await banaVerilenleriOku();
      if (no === sira.current) setMaddeler(m);
    } catch (e) {
      console.warn('Bana verilen maddeler okunamadı', e);
    }
  }, [ben]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setMaddeler(BOS); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    const kapat = maddeleriDinle(`bana-${ben}`, null, () => void yenile());
    return () => {
      a.remove();
      kapat();
    };
  }, [ben, yenile]);

  const isaretle = useCallback(
    async (id: string, yapildi: boolean) => {
      sira.current++; // yoldaki okuma bu değişikliği ezmesin
      setMaddeler((ms) => ms.map((m) => (m.id === id ? { ...m, yapildi } : m)));
      try {
        await maddeDegistir(id, { yapildi });
        return true;
      } catch (e) {
        console.warn(e);
        setMaddeler((ms) => ms.map((m) => (m.id === id ? { ...m, yapildi: !yapildi } : m)));
        return false;
      }
    },
    [],
  );

  const deger = useMemo(() => ({ maddeler, yenile, isaretle }), [maddeler, yenile, isaretle]);
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useBanaVerilenler(): Deger {
  return useContext(Baglam);
}
