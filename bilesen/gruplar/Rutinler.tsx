// Birlikte rutinler (pilot 18 Ekim): uygulama boyunca tek kaynak. Oturum açılınca,
// uygulama öne dönünce, grup ekranı öne gelince ve kartlarda bir değişiklik olunca
// (ör. ajandada "Yaptım") okunur ve eşitlenir:
// - rutin silindiyse ya da artık katılmıyorsam ajandadaki dizisi dün biter;
// - rutin kartındaki "Yaptım"lar sunucuya yazılır (geçen haftanın başından bugüne).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import {
  bitecekKartlar,
  esitlemeBasi,
  isaretFarki,
  rutinBagCoz,
  rutinBagi,
  rutinKarti,
  type Rutin,
} from '@/mantik/rutin';
import { gunEkle, type GunKisa } from '@/mantik/tarih';
import { useOturum } from '@/sunucu/oturum';
import { rutinDuzenle, rutineKatil, rutinIsaretle, rutinKur, rutinleriOku, rutinSil } from '@/sunucu/rutin';
import { bagiBitir, bagliKartlar, gunlerinYapilanlari, yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

interface Deger {
  rutinler: readonly Rutin[];
  yenile: () => Promise<void>;
  /** Kurar ve kuranın ajandasına seçtiği günlerde kart ekler. Hata fırlatır. */
  kur: (grup: { id: string; ad: string }, ad: string, hedef: number, gunler: GunKisa[]) => Promise<void>;
  katil: (r: Rutin, gunler: GunKisa[]) => Promise<void>;
  /** Ayrılır; ajandadaki dizisi dün biter. */
  ayril: (r: Rutin) => Promise<void>;
  duzenle: (r: Rutin, ad: string, hedef: number) => Promise<void>;
  sil: (r: Rutin) => Promise<void>;
}

const BOS: readonly Rutin[] = [];
const hic = async () => undefined;
const Baglam = createContext<Deger>({
  rutinler: BOS,
  yenile: hic,
  kur: hic,
  katil: hic,
  ayril: hic,
  duzenle: hic,
  sil: hic,
});

export function RutinSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi, oku, yayin } = useVeri();
  const bugunGun = useBugun();
  const [rutinler, setRutinler] = useState<readonly Rutin[]>(BOS);
  const sira = useRef(0);
  const calisiyor = useRef(false);
  const yeniden = useRef(false);
  const katildigimVar = useRef(false);
  useEffect(() => {
    katildigimVar.current = !!ben && rutinler.some((r) => r.katilanlar.some((k) => k.kullanici === ben));
  }, [rutinler, ben]);

  const esitle = useCallback(
    async (liste: readonly Rutin[], kim: string): Promise<boolean> => {
      const kartlar = (await bagliKartlar(oku)).filter((k) => rutinBagCoz(k.bag));
      await bagiBitir(kapi, bitecekKartlar(kartlar, liste, kim), gunEkle(bugunGun, -1));
      const ilk = esitlemeBasi(bugunGun);
      const yapilanlar = await gunlerinYapilanlari(oku, ilk, bugunGun);
      let degisti = false;
      for (const r of liste) {
        const benim = r.katilanlar.find((k) => k.kullanici === kim);
        if (!benim) continue;
        const kimlikler = new Set(kartlar.filter((k) => rutinBagCoz(k.bag) === r.id).map((k) => k.id));
        if (kimlikler.size === 0) continue;
        const yerel = new Set(
          [...yapilanlar].filter(([, s]) => [...s].some((id) => kimlikler.has(id))).map(([g]) => g),
        );
        const fark = isaretFarki(yerel, benim.gunler, ilk, bugunGun);
        for (const g of fark.ekle) await rutinIsaretle(r.id, g, true);
        for (const g of fark.sil) await rutinIsaretle(r.id, g, false);
        if (fark.ekle.length || fark.sil.length) degisti = true;
      }
      return degisti;
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
        const ilk = esitlemeBasi(bugunGun);
        let liste = await rutinleriOku(ilk);
        if (await esitle(liste, ben)) liste = await rutinleriOku(ilk);
        if (no === sira.current) setRutinler(liste);
      } while (yeniden.current);
    } catch (e) {
      console.warn('Rutinler okunamadı ya da eşitlenemedi', e);
    } finally {
      calisiyor.current = false;
    }
  }, [ben, bugunGun, esitle]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setRutinler(BOS); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    // Ajandada "Yaptım" denince (biraz bekleyip) sunucuya yaz.
    let zaman: ReturnType<typeof setTimeout> | null = null;
    const kapat = yayin.abone(['kart'], () => {
      if (!katildigimVar.current) return;
      if (zaman) clearTimeout(zaman);
      zaman = setTimeout(() => void yenile(), 1500);
    });
    return () => {
      a.remove();
      kapat();
      if (zaman) clearTimeout(zaman);
    };
  }, [ben, yenile, yayin]);

  const kartEkle = useCallback(
    (r: Pick<Rutin, 'id' | 'ad' | 'hedef' | 'grupAdi'>, gunler: GunKisa[]) =>
      yeniKartKaydet(kapi, rutinKarti(yeniKimlik(), r, gunler, bugunGun), [], yeniKimlik),
    [kapi, bugunGun],
  );

  const kur = useCallback(
    async (grup: { id: string; ad: string }, ad: string, hedef: number, gunler: GunKisa[]) => {
      const id = await rutinKur(grup.id, ad, hedef);
      await kartEkle({ id, ad: ad.trim(), hedef, grupAdi: grup.ad }, gunler);
      await yenile();
    },
    [kartEkle, yenile],
  );

  const katil = useCallback(
    async (r: Rutin, gunler: GunKisa[]) => {
      await rutineKatil(r.id, true);
      const varMi = (await bagliKartlar(oku)).some((k) => k.bag === rutinBagi(r.id));
      if (!varMi) await kartEkle(r, gunler);
      await yenile();
    },
    [oku, kartEkle, yenile],
  );

  const ayril = useCallback(
    async (r: Rutin) => {
      await rutineKatil(r.id, false);
      const kimlikler = (await bagliKartlar(oku)).filter((k) => k.bag === rutinBagi(r.id)).map((k) => k.id);
      await bagiBitir(kapi, kimlikler, gunEkle(bugunGun, -1));
      await yenile();
    },
    [kapi, oku, bugunGun, yenile],
  );

  const duzenle = useCallback(
    async (r: Rutin, ad: string, hedef: number) => {
      await rutinDuzenle(r.id, ad, hedef);
      await yenile();
    },
    [yenile],
  );

  const sil = useCallback(
    async (r: Rutin) => {
      await rutinSil(r.id);
      await yenile();
    },
    [yenile],
  );

  const deger = useMemo(
    () => ({ rutinler, yenile, kur, katil, ayril, duzenle, sil }),
    [rutinler, yenile, kur, katil, ayril, duzenle, sil],
  );
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useRutinler(): Deger {
  return useContext(Baglam);
}
