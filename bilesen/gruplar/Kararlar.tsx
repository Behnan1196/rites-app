// Kararlar / oylamalar (pilot 18 Ekim): uygulama boyunca tek kaynak. Oturum
// açılınca, uygulama öne dönünce ve grup ekranı öne gelince okunur. Oy önce
// ekranda, sonra sunucuda değişir; olmazsa geri alınır. Gün kararında kurulan
// buluşmanın kartı kuranın ajandasına girer.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { bulusmaKarti } from '@/mantik/bulusma';
import type { Karar } from '@/mantik/karar';
import { kararKur, kararlariOku, kararOyla, kararSil, kararVer, type KararTanimi } from '@/sunucu/karar';
import { useOturum } from '@/sunucu/oturum';
import { yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { useBulusmalar } from './Bulusmalar';

interface Deger {
  kararlar: readonly Karar[];
  yenile: () => Promise<void>;
  /** Hata fırlatır. */
  kur: (grup: string, t: KararTanimi) => Promise<void>;
  /** Oylarımın yeni hâli; olmazsa false. */
  oyla: (k: Karar, secenekler: string[]) => Promise<boolean>;
  /** Hata fırlatır. Gün kararında buluşma kurulduysa true. */
  ver: (k: Karar, secenek: string) => Promise<boolean>;
  sil: (k: Karar) => Promise<void>;
}

const BOS: readonly Karar[] = [];
const hic = async () => undefined;
const Baglam = createContext<Deger>({
  kararlar: BOS,
  yenile: hic,
  kur: hic,
  oyla: async () => false,
  ver: async () => false,
  sil: hic,
});

export function KararSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi } = useVeri();
  const bulusma = useBulusmalar();
  const bulusmaYenile = bulusma.yenile;
  const [kararlar, setKararlar] = useState<readonly Karar[]>(BOS);
  const sira = useRef(0);

  const yenile = useCallback(async () => {
    if (!ben) return;
    const no = ++sira.current;
    try {
      const liste = await kararlariOku();
      if (no === sira.current) setKararlar(liste);
    } catch (e) {
      console.warn('Kararlar okunamadı', e);
    }
  }, [ben]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setKararlar(BOS); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    return () => a.remove();
  }, [ben, yenile]);

  const kur = useCallback(
    async (grup: string, t: KararTanimi) => {
      await kararKur(grup, t);
      await yenile();
    },
    [yenile],
  );

  const oyla = useCallback(
    async (k: Karar, secenekler: string[]) => {
      if (!ben) return false;
      sira.current++; // yoldaki okuma bu değişikliği ezmesin
      const onceki = k.oylar;
      const yeni = k.oylar
        .filter((o) => o.kullanici !== ben)
        .concat(secenekler.map((s) => ({ secenek: s, kullanici: ben })));
      setKararlar((l) => l.map((x) => (x.id === k.id ? { ...x, oylar: yeni } : x)));
      try {
        await kararOyla(k.id, secenekler);
        return true;
      } catch (e) {
        console.warn(e);
        setKararlar((l) => l.map((x) => (x.id === k.id ? { ...x, oylar: onceki } : x)));
        return false;
      }
    },
    [ben],
  );

  const ver = useCallback(
    async (k: Karar, secenek: string) => {
      const bulusmaId = await kararVer(k.id, secenek);
      const s = k.secenekler.find((x) => x.id === secenek);
      if (bulusmaId && s?.gun && ben) {
        const b = {
          id: bulusmaId,
          grup: k.grup,
          grupAdi: k.grupAdi,
          kuran: ben,
          baslik: k.soru,
          gun: s.gun,
          saat: s.saat,
          yer: k.yer,
          yanitlar: [{ kullanici: ben, yanit: 'geliyorum' as const }],
        };
        await yeniKartKaydet(kapi, bulusmaKarti(yeniKimlik(), b), [], yeniKimlik);
        await bulusmaYenile();
      }
      await yenile();
      return !!bulusmaId;
    },
    [ben, kapi, bulusmaYenile, yenile],
  );

  const sil = useCallback(
    async (k: Karar) => {
      await kararSil(k.id);
      await yenile();
    },
    [yenile],
  );

  const deger = useMemo(() => ({ kararlar, yenile, kur, oyla, ver, sil }), [kararlar, yenile, kur, oyla, ver, sil]);
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useKararlar(): Deger {
  return useContext(Baglam);
}
