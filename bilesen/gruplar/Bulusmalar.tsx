// Buluşmalar (pilot 18 Ekim): uygulama boyunca tek kaynak. Oturum açılınca,
// uygulama öne dönünce ve grup ekranı öne gelince sunucudan okunur; her okumadan
// sonra telefondaki buluşma kartları eşitlenir (`kaldirilacakKartlar`).
// "Geliyorum" denince kart hemen eklenir, başka yanıtta hemen kalkar.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { bulusmaBagi, bulusmaKarti, kaldirilacakKartlar, type Bulusma, type BulusmaYaniti } from '@/mantik/bulusma';
import {
  bulusmaDuzenle,
  bulusmaKur,
  bulusmalariOku,
  bulusmaSil,
  bulusmaYanitla,
  type BulusmaTanimi,
} from '@/sunucu/bulusma';
import { useOturum } from '@/sunucu/oturum';
import { bagliKart, bagliKartlar, kartlariSil, yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

interface Deger {
  bulusmalar: readonly Bulusma[];
  /** Son okuma başarısız oldu. */
  baglanamiyor: boolean;
  yenile: () => Promise<void>;
  /** Yanıtı yazar ve ajandadaki kartı ekler/kaldırır; olmazsa false. */
  yanitla: (b: Bulusma, yanit: BulusmaYaniti | null) => Promise<boolean>;
  /** Kurar; kuran geliyor sayılır, kartı ajandasına girer. Hata fırlatır. */
  kur: (grup: { id: string; ad: string }, t: BulusmaTanimi) => Promise<void>;
  /** Düzenler; gün ya da saat değiştiyse kuranın kartı yeni zamana taşınır. Hata fırlatır. */
  duzenle: (b: Bulusma, t: BulusmaTanimi) => Promise<void>;
  /** Siler (kartlar eşitlemede kalkar). Hata fırlatır. */
  sil: (b: Bulusma) => Promise<void>;
}

const BOS: readonly Bulusma[] = [];
const Baglam = createContext<Deger>({
  bulusmalar: BOS,
  baglanamiyor: false,
  yenile: async () => undefined,
  yanitla: async () => false,
  kur: async () => undefined,
  duzenle: async () => undefined,
  sil: async () => undefined,
});

export function BulusmaSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const [bulusmalar, setBulusmalar] = useState<readonly Bulusma[]>(BOS);
  const [baglanamiyor, setBaglanamiyor] = useState(false);
  const sira = useRef(0);

  const eslestir = useCallback(
    async (liste: readonly Bulusma[], kim: string) => {
      const sil = kaldirilacakKartlar(await bagliKartlar(oku), liste, kim, bugunGun);
      await kartlariSil(kapi, sil);
    },
    [kapi, oku, bugunGun],
  );

  const yenile = useCallback(async () => {
    if (!ben) return;
    const no = ++sira.current;
    try {
      const liste = await bulusmalariOku();
      if (no !== sira.current) return;
      setBulusmalar(liste);
      setBaglanamiyor(false);
      await eslestir(liste, ben);
    } catch (e) {
      console.warn('Buluşmalar okunamadı', e);
      if (no === sira.current) setBaglanamiyor(true);
    }
  }, [ben, eslestir]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setBulusmalar(BOS); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    return () => a.remove();
  }, [ben, yenile]);

  const yanitla = useCallback(
    async (b: Bulusma, yanit: BulusmaYaniti | null) => {
      if (!ben) return false;
      sira.current++; // yoldaki okuma bu değişikliği ezmesin
      const onceki = b.yanitlar;
      const yeni = b.yanitlar.filter((y) => y.kullanici !== ben).concat(yanit ? [{ kullanici: ben, yanit }] : []);
      setBulusmalar((l) => l.map((x) => (x.id === b.id ? { ...x, yanitlar: yeni } : x)));
      try {
        await bulusmaYanitla(b.id, yanit);
      } catch (e) {
        console.warn(e);
        setBulusmalar((l) => l.map((x) => (x.id === b.id ? { ...x, yanitlar: onceki } : x)));
        return false;
      }
      const kartId = await bagliKart(oku, bulusmaBagi(b));
      if (yanit === 'geliyorum' && !kartId) await yeniKartKaydet(kapi, bulusmaKarti(yeniKimlik(), b), [], yeniKimlik);
      if (yanit !== 'geliyorum' && kartId) await kartlariSil(kapi, [kartId]);
      return true;
    },
    [ben, kapi, oku],
  );

  const kur = useCallback(
    async (grup: { id: string; ad: string }, t: BulusmaTanimi) => {
      if (!ben) return;
      const id = await bulusmaKur(grup.id, t);
      const b: Bulusma = {
        id,
        grup: grup.id,
        grupAdi: grup.ad,
        kuran: ben,
        ...t,
        yanitlar: [{ kullanici: ben, yanit: 'geliyorum' }],
      };
      await yeniKartKaydet(kapi, bulusmaKarti(yeniKimlik(), b), [], yeniKimlik);
      await yenile();
    },
    [ben, kapi, yenile],
  );

  const duzenle = useCallback(
    async (b: Bulusma, t: BulusmaTanimi) => {
      if (!ben) return;
      await bulusmaDuzenle(b.id, t);
      const yeni: Bulusma = { ...b, ...t };
      if (bulusmaBagi(yeni) !== bulusmaBagi(b)) {
        const eski = await bagliKart(oku, bulusmaBagi(b));
        if (eski) await kartlariSil(kapi, [eski]);
        if (b.yanitlar.some((y) => y.kullanici === ben && y.yanit === 'geliyorum'))
          await yeniKartKaydet(kapi, bulusmaKarti(yeniKimlik(), yeni), [], yeniKimlik);
      }
      await yenile();
    },
    [ben, kapi, oku, yenile],
  );

  const sil = useCallback(
    async (b: Bulusma) => {
      await bulusmaSil(b.id);
      await yenile();
    },
    [yenile],
  );

  const deger = useMemo(
    () => ({ bulusmalar, baglanamiyor, yenile, yanitla, kur, duzenle, sil }),
    [bulusmalar, baglanamiyor, yenile, yanitla, kur, duzenle, sil],
  );
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useBulusmalar(): Deger {
  return useContext(Baglam);
}
