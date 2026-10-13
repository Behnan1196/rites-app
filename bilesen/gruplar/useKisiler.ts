// Kişilerim: telefondaki adres defteri + sunucudaki bağlantılar. Ekran her
// öne geldiğinde sunucuyla eşleştirilir.

import { useCallback } from 'react';

import { eslestir, gelenIstekler } from '@/mantik/kisiler';
import type { Oturum } from '@/sunucu/oturum';
import { baglantilariOku } from '@/sunucu/kisiler';
import { useSunucu } from '@/sunucu/useSunucu';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { eslestirmeyiUygula, kisileriOku } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

export function useKisiler(oturum: Oturum) {
  const { kapi, oku } = useVeri();
  const yerel = useSorgu(['kisi'], (o) => kisileriOku(o), []);
  const ben = oturum.durum === 'var' ? oturum.id : null;

  const yukle = useCallback(async () => {
    if (!ben) return null;
    const s = await baglantilariOku(ben);
    await eslestirmeyiUygula(kapi, eslestir(await kisileriOku(oku), s.baglantilar, s.davetler), yeniKimlik);
    return s;
  }, [ben, kapi, oku]);

  const sunucu = useSunucu(ben ? yukle : null, ben ?? '');
  return {
    ben,
    kisiler: yerel.veri ?? [],
    istekler: gelenIstekler(sunucu.veri?.baglantilar ?? []),
    baglanamiyor: sunucu.hata,
    yenile: sunucu.yenile,
  };
}
