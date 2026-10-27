// Veritabanını açar, göçleri uygular; okuyucuyu, yazma kapısını ve
// yayını bütün uygulamaya verir.

import { openDatabaseAsync } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { bugun } from '@/mantik/tarih';

import { gocleriUygula } from './gocler';
import { sakliKataloguYukle } from './katalog';
import { listeKartlariniTasi } from './yerelListeler';
import { ozelAlanlariOku } from './programlar';
import { kapiOlustur, okuyucuOlustur, type HamVeriTabani, type Kapi, type Okuyucu } from './kapi';
import { yayinOlustur, type Yayin } from './yayin';

const VERITABANI_ADI = 'rites.db';

export interface Veri {
  oku: Okuyucu;
  kapi: Kapi;
  yayin: Yayin;
}

const VeriBaglami = createContext<Veri | null>(null);

type Durum = { tur: 'aciliyor' } | { tur: 'hazir'; veri: Veri } | { tur: 'hata' };

interface Ozellikler {
  children: ReactNode;
  /** Veritabanı açılırken gösterilecek şey (açılış ekranı açıkken genellikle null). */
  bekleme: ReactNode;
  /** Veritabanı açılamazsa gösterilecek şey. */
  hata: ReactNode;
}

export function VeriSaglayici({ children, bekleme, hata }: Ozellikler) {
  const [durum, setDurum] = useState<Durum>({ tur: 'aciliyor' });

  useEffect(() => {
    let iptal = false;
    (async () => {
      try {
        const db: HamVeriTabani = await openDatabaseAsync(VERITABANI_ADI);
        await gocleriUygula(db);
        const yayin = yayinOlustur();
        const veri: Veri = { oku: okuyucuOlustur(db), kapi: kapiOlustur(db, yayin), yayin };
        // İndirilmiş içerik kataloğu (yoksa uygulamayla gelen) ve kişinin alanları her ekranda bilinsin.
        await sakliKataloguYukle(veri.oku).catch((e: unknown) => console.warn('Katalog okunamadı', e));
        await ozelAlanlariOku(veri.oku).catch((e: unknown) => console.warn('Alanlar okunamadı', e));
        // P-58: bir kez: yalnız listeden ibaret tek seferlik kartlar Listelerim'e taşınır.
        await listeKartlariniTasi(veri.kapi, veri.oku, bugun()).catch((e: unknown) =>
          console.warn('Liste kartları taşınamadı', e),
        );
        if (!iptal) setDurum({ tur: 'hazir', veri });
      } catch (e) {
        console.error('Veritabanı açılamadı', e);
        if (!iptal) setDurum({ tur: 'hata' });
      }
    })();
    return () => {
      iptal = true;
    };
  }, []);

  if (durum.tur === 'aciliyor') return bekleme;
  if (durum.tur === 'hata') return hata;
  return <VeriBaglami.Provider value={durum.veri}>{children}</VeriBaglami.Provider>;
}

export function useVeri(): Veri {
  const veri = useContext(VeriBaglami);
  if (!veri) throw new Error('useVeri, VeriSaglayici içinde kullanılmalı.');
  return veri;
}
