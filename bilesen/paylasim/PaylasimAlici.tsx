// Başka uygulamadan paylaşılanları alır (kök düzende bir kez çizilir, görünmez).
//
// Paylaşım eklentisi Rites'ı açmaz; paylaşılanlar telefonda (App Group) birikir.
// Rites açılınca ya da öne gelince okunur: her paylaşımın bağlantısı, video
// başlığıyla birlikte Gelenler'e yazılır, biriken liste temizlenir.

import * as Sharing from 'expo-sharing';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { BAGLANTI_YOK, paylasilanAdres, paylasilanMetin, paylasimlaraBol, paylasimTaslagi } from '@/mantik/paylasimAl';
import { yeniKimlik } from '@/veri/kimlik';
import { paylasilanEkle } from '@/veri/paylasilanlar';
import { videoBasligi } from '@/veri/videoBasligi';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';

export function PaylasimAlici() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let isleniyor = false;
    const al = async () => {
      if (isleniyor) return;
      isleniyor = true;
      try {
        const ogeler = Sharing.getSharedPayloads();
        if (ogeler.length === 0) return;
        Sharing.clearSharedPayloads();
        let eklenen = 0;
        let sonBaslik = '';
        for (const grup of paylasimlaraBol(ogeler)) {
          const adres = paylasilanAdres(grup);
          if (!adres) continue;
          const t = paylasimTaslagi(adres, await videoBasligi(adres), paylasilanMetin(grup));
          await paylasilanEkle(kapi, {
            id: yeniKimlik(),
            baslik: t.baslik,
            adres: t.videoAdresi,
            olusturma: new Date().toISOString(),
          });
          eklenen++;
          sonBaslik = t.baslik;
        }
        if (eklenen === 0) kisaMesaj(BAGLANTI_YOK);
        else kisaMesaj(eklenen === 1 ? `Gelenler'e eklendi: ${sonBaslik}` : `Gelenler'e ${eklenen} bağlantı eklendi`);
      } catch (e) {
        console.error('Paylaşılan alınamadı', e);
      } finally {
        isleniyor = false;
      }
    };
    void al();
    const abonelik = AppState.addEventListener('change', (d) => {
      if (d === 'active') void al();
    });
    return () => abonelik.remove();
  }, [kapi, kisaMesaj]);

  return null;
}
