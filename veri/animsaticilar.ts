// Anımsatıcılar ve bugünkü durumları (`03`, `05` §7). Geçmiş günler tutulmaz:
// her yazmada bugünden eski satırlar silinir.

import { saatleriSirala, type Animsatici, type AnimsaticiGunleri, type AnimsaticiGunu } from '@/mantik/animsatici';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu, Yazici } from './kapi';

interface AnimsaticiSatiri {
  id: string;
  ad: string;
  saatler: string;
  gunler: string;
  sesli: number;
  ertele_dk: number;
}

function satirdan(s: AnimsaticiSatiri): Animsatici {
  let saatler: string[] = [];
  try {
    saatler = JSON.parse(s.saatler) as string[];
  } catch {
    saatler = [];
  }
  return {
    id: s.id,
    ad: s.ad,
    saatler: saatleriSirala(saatler),
    gunler: (['hergun', 'haftaici', 'haftasonu'].includes(s.gunler) ? s.gunler : 'hergun') as AnimsaticiGunleri,
    sesli: s.sesli === 1,
    erteleDk: s.ertele_dk,
  };
}

export async function animsaticilariOku(oku: Okuyucu): Promise<Animsatici[]> {
  return (await oku.hepsi<AnimsaticiSatiri>('SELECT * FROM animsatici ORDER BY olusturma, rowid')).map(satirdan);
}

/** Yalnız o günün durumları. */
export async function gunDurumlari(oku: Okuyucu, gun: Gun): Promise<AnimsaticiGunu[]> {
  const satirlar = await oku.hepsi<{ animsatici_id: string; saat: string; durum: string | null; ertelenen_saat: string | null }>(
    'SELECT animsatici_id, saat, durum, ertelenen_saat FROM animsatici_gun WHERE tarih = ?',
    [gun],
  );
  return satirlar.map((s) => ({
    animsaticiId: s.animsatici_id,
    saat: s.saat,
    durduruldu: s.durum === 'durduruldu',
    ertelenenSaat: s.ertelenen_saat,
  }));
}

async function eskileriSilY(y: Yazici, bugunGun: Gun) {
  await y.calistir('DELETE FROM animsatici_gun WHERE tarih < ?', [bugunGun]);
}

/** Uygulama açılırken: dünden kalan durumlar silinir. */
export function eskiGunleriSil(kapi: Kapi, bugunGun: Gun): Promise<void> {
  return kapi.yaz(['animsatici'], (y) => eskileriSilY(y, bugunGun));
}

export function animsaticiEkle(
  kapi: Kapi,
  a: Animsatici,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['animsatici'], (y) =>
    y.calistir(
      'INSERT INTO animsatici (id, ad, saatler, gunler, sesli, ertele_dk, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [a.id, a.ad.trim(), JSON.stringify(saatleriSirala(a.saatler)), a.gunler, a.sesli ? 1 : 0, a.erteleDk, simdi],
    ),
  );
}

export function animsaticiSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['animsatici'], (y) => y.calistir('DELETE FROM animsatici WHERE id = ?', [id]));
}

/** Durdur: o saatin kalan çalmaları iptal (`05` §7). */
export function durdur(kapi: Kapi, animsaticiId: string, gun: Gun, saat: string): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    await eskileriSilY(y, gun);
    await y.calistir(
      `INSERT INTO animsatici_gun (animsatici_id, tarih, saat, durum) VALUES (?, ?, ?, 'durduruldu')
       ON CONFLICT (animsatici_id, tarih, saat) DO UPDATE SET durum = 'durduruldu'`,
      [animsaticiId, gun, saat],
    );
  });
}

/** Ertele: o saat `ertelenenSaat`ten yeniden başlar. */
export function ertele(kapi: Kapi, animsaticiId: string, gun: Gun, saat: string, ertelenenSaat: string): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    await eskileriSilY(y, gun);
    await y.calistir(
      `INSERT INTO animsatici_gun (animsatici_id, tarih, saat, durum, ertelenen_saat) VALUES (?, ?, ?, NULL, ?)
       ON CONFLICT (animsatici_id, tarih, saat) DO UPDATE SET durum = NULL, ertelenen_saat = excluded.ertelenen_saat`,
      [animsaticiId, gun, saat, ertelenenSaat],
    );
  });
}
