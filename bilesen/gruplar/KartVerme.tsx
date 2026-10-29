// Kart verme (pilot 29 Ekim, P-62): uygulama boyunca tek kaynak. Oturum açılınca, uygulama
// öne dönünce, sunucuda bir değişiklik olunca ve kartlarda bir değişiklik olunca okunur ve
// eşitlenir (`verilenEslemesi`): bana verilen kart ajandama tarihli düşer, ajandadaki
// "Yaptım" günleri sunucuya gider; geri alınan ya da bırakılan kartın kartı silinir.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { verilenEslemesi, verilenKarti, type AjandaIzni, type VerilenKart } from '@/mantik/kartVerme';
import type { KartPaketi } from '@/mantik/paylasim';
import type { Gun } from '@/mantik/tarih';
import { tablolariDinle } from '@/sunucu/istemci';
import {
  izinIste,
  izinleriOku,
  izinVer,
  kartiBirak,
  kartVer,
  kullaniciAdlari,
  verileniSil,
  verilenleriOku,
  yaptimSil,
  yaptimYaz,
} from '@/sunucu/kartVerme';
import { useOturum } from '@/sunucu/oturum';
import { isaretle, kartlariSil, verilenYerelKartlar, yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { kisileriOku } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

interface Deger {
  ben: string | null;
  izinler: readonly AjandaIzni[];
  verilenler: readonly VerilenKart[];
  yenile: () => Promise<void>;
  /** Hepsi hata fırlatır. */
  izinIste: (sahip: string) => Promise<void>;
  izinVer: (yetkili: string, ver: boolean) => Promise<void>;
  kartVer: (alanlar: readonly string[], paket: KartPaketi, baslangic: Gun) => Promise<void>;
  birak: (id: string) => Promise<void>;
  geriAl: (id: string) => Promise<void>;
}

const BOS_IZIN: readonly AjandaIzni[] = [];
const BOS_KART: readonly VerilenKart[] = [];
const hic = async () => undefined;
const Baglam = createContext<Deger>({
  ben: null,
  izinler: BOS_IZIN,
  verilenler: BOS_KART,
  yenile: hic,
  izinIste: hic,
  izinVer: hic,
  kartVer: hic,
  birak: hic,
  geriAl: hic,
});

export function KartVermeSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi, oku, yayin } = useVeri();
  const [izinler, setIzinler] = useState<readonly AjandaIzni[]>(BOS_IZIN);
  const [verilenler, setVerilenler] = useState<readonly VerilenKart[]>(BOS_KART);
  const sira = useRef(0);
  const calisiyor = useRef(false);
  const yeniden = useRef(false);
  const banaVar = useRef(false);
  useEffect(() => {
    banaVar.current = !!ben && verilenler.some((v) => v.alan === ben && v.durum === 'aktif');
  }, [verilenler, ben]);

  /** Alan tarafı: sunucu ile ajandayı eşitler; sunucuda bir şey değiştiyse true. */
  const esitle = useCallback(
    async (liste: readonly VerilenKart[], kim: string): Promise<boolean> => {
      const fark = verilenEslemesi(await verilenYerelKartlar(oku), liste, kim);
      await kartlariSil(kapi, fark.sil);
      if (fark.ekle.length > 0) {
        const yerelAd = new Map((await kisileriOku(oku)).map((k) => [k.kullaniciId, k.ad]));
        const eksik = fark.ekle.map((v) => v.veren).filter((id) => !yerelAd.has(id));
        const sunucuAd = await kullaniciAdlari([...new Set(eksik)]).catch(() => new Map<string, string>());
        for (const v of fark.ekle) {
          const ad = yerelAd.get(v.veren) ?? sunucuAd.get(v.veren) ?? '';
          const { kart, bloklar } = verilenKarti(v, ad, yeniKimlik);
          await yeniKartKaydet(kapi, kart, bloklar, yeniKimlik);
          // Başka telefonda yapılmış günler (yeniden kurulum) bu telefona da işlenir.
          for (const g of v.yapilan) await isaretle(kapi, kart.id, g, true);
        }
      }
      for (const y of fark.yaptim) await yaptimYaz(y.kart, y.gun);
      for (const g of fark.geri) await yaptimSil(g.kart, g.gun);
      return fark.yaptim.length + fark.geri.length > 0;
    },
    [kapi, oku],
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
        const [iz, liste0] = await Promise.all([izinleriOku(), verilenleriOku()]);
        let liste = liste0;
        if (await esitle(liste, ben)) liste = await verilenleriOku();
        if (no === sira.current) {
          setIzinler(iz);
          setVerilenler(liste);
        }
      } while (yeniden.current);
    } catch (e) {
      console.warn('Verilen kartlar okunamadı ya da eşitlenemedi', e);
    } finally {
      calisiyor.current = false;
    }
  }, [ben, esitle]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setIzinler(BOS_IZIN); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      setVerilenler(BOS_KART);
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    const dinlemeyiKapat = tablolariDinle('kartVerme', ['ajanda_izni', 'verilen_kart', 'verilen_yapildi'], () =>
      void yenile(),
    );
    let zaman: ReturnType<typeof setTimeout> | null = null;
    const kapat = yayin.abone(['kart'], () => {
      if (!banaVar.current) return;
      if (zaman) clearTimeout(zaman);
      zaman = setTimeout(() => void yenile(), 1500);
    });
    return () => {
      a.remove();
      dinlemeyiKapat();
      kapat();
      if (zaman) clearTimeout(zaman);
    };
  }, [ben, yenile, yayin]);

  const sonra = useCallback(
    <A extends unknown[]>(is: (...a: A) => Promise<unknown>) =>
      async (...a: A) => {
        await is(...a);
        await yenile();
      },
    [yenile],
  );

  const deger = useMemo<Deger>(
    () => ({
      ben,
      izinler,
      verilenler,
      yenile,
      izinIste: sonra(izinIste),
      izinVer: sonra(izinVer),
      kartVer: sonra(async (alanlar: readonly string[], paket: KartPaketi, baslangic: Gun) => {
        for (const a of alanlar) await kartVer(a, paket, baslangic);
      }),
      birak: sonra(kartiBirak),
      geriAl: sonra(verileniSil),
    }),
    [ben, izinler, verilenler, yenile, sonra],
  );
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useKartVerme(): Deger {
  return useContext(Baglam);
}
