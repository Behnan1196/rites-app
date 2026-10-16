// Kartı silmek (kart görünümündeki menüden; pilot 16 Ekim). Tekrarlı kartta önce
// "Hangi günler silinsin?" (yalnız bu gün / bu gün ve sonrası), değilse onay sorulur.

import { useState } from 'react';

import { bolmeSecenekleri, bolmeSorusuGerekirMi, sil, silmeOnayi, type BolmeSecimi } from '@/mantik/bolme';
import type { Kart } from '@/mantik/kart';
import type { Gun } from '@/mantik/tarih';
import { islemleriUygula, kayitVarMi } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu, type OnaySecenegi } from '../OnayKutusu';

type Soru = { tur: 'gunler' } | { tur: 'onay'; aciklama: string };

/** `const sil = useKartSil(onSilindi); sil.baslat(kart, gun); {sil.oge}` */
export function useKartSil(onSilindi: () => void) {
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [hedef, setHedef] = useState<{ kart: Kart; gun: Gun; soru: Soru } | null>(null);

  const baslat = async (kart: Kart, gun: Gun) => {
    if (bolmeSorusuGerekirMi(kart, gun)) {
      setHedef({ kart, gun, soru: { tur: 'gunler' } });
      return;
    }
    const onay = silmeOnayi(kart, await kayitVarMi(oku, kart.id));
    setHedef({ kart, gun, soru: { tur: 'onay', aciklama: onay.aciklama ?? 'Bu işlem geri alınamaz.' } });
  };

  const uygula = async (secim: BolmeSecimi | null) => {
    if (!hedef) return;
    const { kart, gun } = hedef;
    setHedef(null);
    try {
      const sonuc = sil(kart, gun, secim);
      await islemleriUygula(kapi, sonuc.islemler, [], yeniKimlik);
      if (sonuc.mesaj) kisaMesaj(sonuc.mesaj);
      onSilindi();
    } catch (e) {
      console.error('Kart silinemedi', e);
      kisaMesaj('Silinemedi. Yeniden dene.');
    }
  };

  const vazgec: OnaySecenegi = { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setHedef(null) };
  let oge = null;
  if (hedef) {
    const s = bolmeSecenekleri(hedef.gun);
    oge = (
      <Katman>
        {hedef.soru.tur === 'gunler' ? (
          <OnayKutusu
            baslik="Hangi günler silinsin?"
            aciklama="Geçmiş günlerin kayıtları silinmez."
            secenekler={[
              { etiket: s.yalnizBuGun, tur: 'tehlike', onPress: () => void uygula('yalnizBuGun') },
              { etiket: s.buGunVeSonrasi, tur: 'tehlike', onPress: () => void uygula('buGunVeSonrasi') },
              vazgec,
            ]}
          />
        ) : (
          <OnayKutusu
            baslik="Kart silinsin mi?"
            aciklama={hedef.soru.aciklama}
            secenekler={[{ etiket: 'Sil', tur: 'tehlike', onPress: () => void uygula(null) }, vazgec]}
          />
        )}
      </Katman>
    );
  }
  return { baslat: (kart: Kart, gun: Gun) => void baslat(kart, gun), oge };
}
