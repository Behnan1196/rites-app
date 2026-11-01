// İçerik kataloğunu arada bir indirir (pilot 20 Ekim): açılışta ve uygulama öne
// dönünce, en çok 6 saatte bir. Yeni katalog saklanır ve hemen kullanılır;
// bağlanamazsa telefondaki kopya (ya da uygulamayla gelen) kalır. P-81: uygulamanın katalog sürümü
// değişince (`KATALOG_SURUMU`) 6 saat beklenmez.

import { useEffect } from 'react';
import { AppState } from 'react-native';

import { ayniKatalog, katalog, katalogCoz, katalogDenensinMi, KATALOG_SURUMU, sadeKatalog } from '@/mantik/katalog';
import { katalogIndir } from '@/sunucu/katalog';
import { ayarOku, ayarYaz } from '@/veri/ayar';
import type { Kapi } from '@/veri/kapi';
import { katalogDenendi, katalogKaydet } from '@/veri/katalog';
import { useVeri } from '@/veri/VeriSaglayici';

/**
 * Kataloğu şimdi indirir (tasarımcı yayınlayınca, P-41; 6 saati beklemez).
 * Bağlanamazsa hata fırlatır.
 */
export async function katalogYenile(kapi: Kapi): Promise<void> {
  const yeni = katalogCoz(await katalogIndir());
  // Şu anki katalog sade hâliyle durur (`katalog()`); karşılaştırma da öyle.
  if (yeni && !ayniKatalog(sadeKatalog(yeni), katalog())) await katalogKaydet(kapi, yeni);
  else await katalogDenendi(kapi);
  if (yeni) await ayarYaz(kapi, 'katalog_surumu', KATALOG_SURUMU);
}

export function KatalogGuncelleyici() {
  const { kapi, oku } = useVeri();
  useEffect(() => {
    let calisiyor = false;
    const dene = async () => {
      if (calisiyor) return;
      calisiyor = true;
      try {
        const surum = await ayarOku(oku, 'katalog_surumu');
        if (!katalogDenensinMi(await ayarOku(oku, 'katalog_denendi'), new Date(), surum ?? null)) return;
        await katalogYenile(kapi);
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
