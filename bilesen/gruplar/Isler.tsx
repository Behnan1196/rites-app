// Grup işleri (pilot 18 Ekim): uygulama boyunca tek kaynak. Oturum açılınca,
// uygulama öne dönünce, grup ekranı öne gelince ve kartlarda bir değişiklik olunca
// okunur ve eşitlenir (`isEslemesi`): bende olan işin kartı ajandada, kartta
// "Yaptım" sunucuda; bende olmayan işin yapılmamış kartı silinir.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { isBagi, isEslemesi, isKarti, type GrupIsi, type IsEylemi } from '@/mantik/isler';
import { isDuzenle, isEkle, isleriOku, isSil, isYanitla, type IsTanimi } from '@/sunucu/isler';
import { useOturum } from '@/sunucu/oturum';
import { bagliKartlar, isaretle, isKartlari, kartlariSil, yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

interface Deger {
  isler: readonly GrupIsi[];
  yenile: () => Promise<void>;
  /** Hata fırlatır. */
  ekle: (grup: string, t: IsTanimi) => Promise<void>;
  duzenle: (i: GrupIsi, t: IsTanimi) => Promise<void>;
  yanitla: (i: GrupIsi, e: IsEylemi) => Promise<void>;
  sil: (i: GrupIsi) => Promise<void>;
}

const BOS: readonly GrupIsi[] = [];
const hic = async () => undefined;
const Baglam = createContext<Deger>({ isler: BOS, yenile: hic, ekle: hic, duzenle: hic, yanitla: hic, sil: hic });

export function IsSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi, oku, yayin } = useVeri();
  const bugunGun = useBugun();
  const [isler, setIsler] = useState<readonly GrupIsi[]>(BOS);
  const sira = useRef(0);
  const calisiyor = useRef(false);
  const yeniden = useRef(false);
  const isVar = useRef(false);
  useEffect(() => {
    isVar.current = !!ben && isler.some((i) => i.alan === ben);
  }, [isler, ben]);

  const esitle = useCallback(
    async (liste: readonly GrupIsi[], kim: string): Promise<boolean> => {
      const fark = isEslemesi(await isKartlari(oku), liste, kim);
      await kartlariSil(kapi, fark.sil);
      for (const i of fark.ekle) await yeniKartKaydet(kapi, isKarti(yeniKimlik(), i, bugunGun), [], yeniKimlik);
      for (const id of fark.yaptim) await isYanitla(id, 'yaptim');
      for (const id of fark.geri) await isYanitla(id, 'geri');
      return fark.yaptim.length + fark.geri.length > 0;
    },
    [kapi, oku, bugunGun],
  );

  const yenile = useCallback(async () => {
    if (!ben) return;
    if (calisiyor.current) {
      yeniden.current = true;
      return;
    }
    calisiyor.current = true;
    try {
      do {
        yeniden.current = false;
        const no = ++sira.current;
        let liste = await isleriOku();
        if (await esitle(liste, ben)) liste = await isleriOku();
        if (no === sira.current) setIsler(liste);
      } while (yeniden.current);
    } catch (e) {
      console.warn('İşler okunamadı ya da eşitlenemedi', e);
    } finally {
      calisiyor.current = false;
    }
  }, [ben, esitle]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setIsler(BOS); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    let zaman: ReturnType<typeof setTimeout> | null = null;
    const kapat = yayin.abone(['kart'], () => {
      if (!isVar.current) return;
      if (zaman) clearTimeout(zaman);
      zaman = setTimeout(() => void yenile(), 1500);
    });
    return () => {
      a.remove();
      kapat();
      if (zaman) clearTimeout(zaman);
    };
  }, [ben, yenile, yayin]);

  const ekle = useCallback(
    async (grup: string, t: IsTanimi) => {
      await isEkle(grup, t);
      await yenile();
    },
    [yenile],
  );
  const duzenle = useCallback(
    async (i: GrupIsi, t: IsTanimi) => {
      await isDuzenle(i.id, t);
      await yenile();
    },
    [yenile],
  );
  const sil = useCallback(
    async (i: GrupIsi) => {
      await isSil(i.id);
      await yenile();
    },
    [yenile],
  );

  /** Sunucuya yazar, ardından ajandadaki kartı da aynı duruma getirir. */
  const yanitla = useCallback(
    async (i: GrupIsi, e: IsEylemi) => {
      await isYanitla(i.id, e);
      const kart = (await bagliKartlar(oku)).find((k) => k.bag === isBagi(i.id));
      if (e === 'al' && !kart) await yeniKartKaydet(kapi, isKarti(yeniKimlik(), i, bugunGun), [], yeniKimlik);
      if (e === 'birak' && kart) await kartlariSil(kapi, [kart.id]);
      if ((e === 'yaptim' || e === 'geri') && kart?.tarih) await isaretle(kapi, kart.id, kart.tarih, e === 'yaptim');
      await yenile();
    },
    [kapi, oku, bugunGun, yenile],
  );

  const deger = useMemo(
    () => ({ isler, yenile, ekle, duzenle, yanitla, sil }),
    [isler, yenile, ekle, duzenle, yanitla, sil],
  );
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useIsler(): Deger {
  return useContext(Baglam);
}
