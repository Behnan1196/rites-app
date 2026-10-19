// Gelenler bildirimi (pilot 19 Ekim): Gelenler'e bir şey düşünce (kart, kişi
// isteği, grup daveti, iş, buluşma, oylama…) telefona sunucudan bildirim gelir.
// Gelenler kutusundaki zille açılıp kapatılır (varsayılan açık). Oturum açılınca
// ve uygulama her açıldığında bu telefonun adresi sunucuya yazılır.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

import { bildirimAdresiYaz } from '@/sunucu/bildirimAdresi';
import { useOturum } from '@/sunucu/oturum';
import { ayarOku, ayarYaz } from '@/veri/ayar';
import { bildirimJetonu } from '@/veri/bildirimler';
import { useSorgu } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from './KisaMesaj';

interface Deger {
  /** null: oturum yok (zil gösterilmez). */
  acik: boolean | null;
  degistir: () => Promise<void>;
}

const Baglam = createContext<Deger>({ acik: null, degistir: async () => undefined });

export function GelenBildirimiSaglayici({ children }: { children: ReactNode }) {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const ayar = useSorgu(['ayar'], async (o) => (await ayarOku(o, 'gelen_bildirimi')) ?? true, []);
  const acik = ayar.yukleniyor ? null : (ayar.veri ?? true);
  const yazilan = useRef<string | null>(null);

  // Oturum açılınca (ve tercih değişince) adres sunucuya yazılır.
  useEffect(() => {
    if (!ben || acik === null) return;
    const anahtar = `${ben}:${acik}`;
    if (yazilan.current === anahtar) return;
    let iptal = false;
    void (async () => {
      const jeton = await bildirimJetonu();
      if (!jeton || iptal) return;
      await bildirimAdresiYaz(jeton, acik);
      yazilan.current = anahtar;
    })().catch((e: unknown) => console.warn('Bildirim adresi yazılamadı', e));
    return () => {
      iptal = true;
    };
  }, [ben, acik]);

  const degistir = useCallback(async () => {
    if (!ben || acik === null) return;
    const yeni = !acik;
    if (yeni) {
      const jeton = await bildirimJetonu();
      if (!jeton) {
        kisaMesaj('Bildirim izni kapalı. Ayarlar → Rites → Bildirimler’den açabilirsin.');
        return;
      }
    }
    await ayarYaz(kapi, 'gelen_bildirimi', yeni);
    kisaMesaj(yeni ? 'Gelenler bildirimleri açık' : 'Gelenler bildirimleri kapalı');
  }, [ben, acik, kapi, kisaMesaj]);

  const deger = useMemo(() => ({ acik: ben ? acik : null, degistir }), [ben, acik, degistir]);
  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useGelenBildirimi(): Deger {
  return useContext(Baglam);
}
