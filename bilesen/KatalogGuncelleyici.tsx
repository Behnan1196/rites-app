// İçerik kataloğunu arada bir indirir (pilot 20 Ekim): açılışta ve uygulama öne
// dönünce, en çok 6 saatte bir. Yeni katalog saklanır ve hemen kullanılır;
// bağlanamazsa telefondaki kopya (ya da uygulamayla gelen) kalır.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ayniKatalog, katalog, katalogCoz, katalogDenensinMi } from '@/mantik/katalog';
import { katalogIndir } from '@/sunucu/katalog';
import { ayarOku } from '@/veri/ayar';
import { katalogDenendi, katalogKaydet } from '@/veri/katalog';
import { useVeri } from '@/veri/VeriSaglayici';

export function KatalogGuncelleyici() {
  const { kapi, oku } = useVeri();
  useEffect(() => {
    let calisiyor = false;
    const dene = async () => {
      if (calisiyor) return;
      calisiyor = true;
      try {
        if (!katalogDenensinMi(await ayarOku(oku, 'katalog_denendi'))) return;
        const ham = await katalogIndir();
        const yeni = katalogCoz(ham);
        if (yeni && !ayniKatalog(yeni, katalog())) await katalogKaydet(kapi, yeni);
        else await katalogDenendi(kapi);
      } catch (e) {
        console.warn('Katalog indirilemedi', e);
      } finally {
        calisiyor = false;
      }
    };
    void dene();
    const a = AppState.addEventListener('change', (d) => {
      if (d === 'active') void dene();
    });
    return () => a.remove();
  }, [kapi, oku]);
  return null;
}
