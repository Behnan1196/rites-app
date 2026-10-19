// Nöbetler (pilot 18 Ekim): uygulama boyunca tek kaynak. Oturum açılınca,
// uygulama öne dönünce, grup ekranı öne gelince ve kartlarda bir değişiklik olunca
// okunur ve eşitlenir:
// - önümüzdeki günlerde sırası bende olan her gün için ajandada kart (fazlası silinir);
// - nöbet kartındaki "Yaptım"lar sunucuya yazılır (son iki hafta).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { nobetBagCoz, nobetEslemesi, nobetIsaretFarki, nobetKarti, NOBET_UFKU, type Nobet } from '@/mantik/nobet';
import { gunEkle } from '@/mantik/tarih';
import { nobetDuzenle, nobetIsaretle, nobetKur, nobetleriOku, nobetSil, type NobetTanimi } from '@/sunucu/nobet';
import { tablolariDinle } from '@/sunucu/istemci';
import { useOturum } from '@/sunucu/oturum';
import { bagliKartlar, gunlerinYapilanlari, kartlariSil, yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

interface Deger {
  nobetler: readonly Nobet[];
  yenile: () => Promise<void>;
  /** Hata fırlatır. */
  kur: (grup: string, t: NobetTanimi) => Promise<void>;
  duzenle: (n: Nobet, t: NobetTanimi) => Promise<void>;
  sil: (n: Nobet) => Promise<void>;
}

const BOS: readonly Nobet[] = [];
const hic = async () => undefined;
const Baglam = createContext<Deger>({ nobetler: BOS, yenile: hic, kur: hic, duzenle: hic, sil: hic });

export function NobetSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi, oku, yayin } = useVeri();
  const bugunGun = useBugun();
  const [nobetler, setNobetler] = useState<readonly Nobet[]>(BOS);
  const sira = useRef(0);
  const calisiyor = useRef(false);
  const yeniden = useRef(false);
  const nobetVar = useRef(false);
  useEffect(() => {
    nobetVar.current = nobetler.length > 0;
  }, [nobetler]);

  const esitle = useCallback(
    async (liste: readonly Nobet[], kim: string): Promise<boolean> => {
      const kartlar = (await bagliKartlar(oku)).filter((k) => nobetBagCoz(k.bag));
      const { ekle, sil } = nobetEslemesi(kartlar, liste, kim, bugunGun);
      await kartlariSil(kapi, sil);
      for (const e of ekle) await yeniKartKaydet(kapi, nobetKarti(yeniKimlik(), e.nobet, e.gun), [], yeniKimlik);

      const ilk = gunEkle(bugunGun, -NOBET_UFKU);
      const yapilanlar = await gunlerinYapilanlari(oku, ilk, bugunGun);
      let degisti = false;
      for (const n of liste) {
        const benimKartlar = new Map(
          kartlar.filter((k) => nobetBagCoz(k.bag)?.id === n.id).map((k) => [k.id, nobetBagCoz(k.bag)!.gun]),
        );
        const yerel = new Set<string>();
        for (const [gun, s] of yapilanlar) for (const id of s) if (benimKartlar.get(id) === gun) yerel.add(gun);
        const fark = nobetIsaretFarki(yerel, n.kayitlar, kim, ilk, bugunGun);
        for (const g of fark.ekle) await nobetIsaretle(n.id, g, true);
        for (const g of fark.sil) await nobetIsaretle(n.id, g, false);
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
        const ilk = gunEkle(bugunGun, -NOBET_UFKU);
        let liste = await nobetleriOku(ilk);
        if (await esitle(liste, ben)) liste = await nobetleriOku(ilk);
        if (no === sira.current) setNobetler(liste);
      } while (yeniden.current);
    } catch (e) {
      console.warn('Nöbetler okunamadı ya da eşitlenemedi', e);
    } finally {
      calisiyor.current = false;
    }
  }, [ben, bugunGun, esitle]);

  useEffect(() => {
    if (!ben) {
      sira.current++;
      setNobetler(BOS); // eslint-disable-line react-hooks/set-state-in-effect -- oturum kapandı
      return;
    }
    void yenile();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void yenile();
    });
    const dinlemeyiKapat = tablolariDinle('nobetler', ['nobet', 'nobet_kayit'], () => void yenile());
    let zaman: ReturnType<typeof setTimeout> | null = null;
    const kapat = yayin.abone(['kart'], () => {
      if (!nobetVar.current) return;
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

  const kur = useCallback(
    async (grup: string, t: NobetTanimi) => {
      await nobetKur(grup, t);
      await yenile();
    },
    [yenile],
  );
  const duzenle = useCallback(
    async (n: Nobet, t: NobetTanimi) => {
      await nobetDuzenle(n.id, t);
      await yenile();
    },
    [yenile],
  );
  const sil = useCallback(
    async (n: Nobet) => {
      await nobetSil(n.id);
      await yenile();
    },
    [yenile],
  );

  const deger = useMemo(() => ({ nobetler, yenile, kur, duzenle, sil }), [nobetler, yenile, kur, duzenle, sil]);
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useNobetler(): Deger {
  return useContext(Baglam);
}
