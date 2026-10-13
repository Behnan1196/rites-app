// Kişilerim: telefondaki adres defteri (`03` → kisi).

import type { Eslestirme, Kisi, KisiDurumu } from '@/mantik/kisiler';

import type { Kapi, Okuyucu, Yazici } from './kapi';

interface KisiSatiri {
  id: string;
  ad: string;
  eposta: string;
  kullanici_id: string | null;
  durum: string;
  ben_ekledim: number;
}

const satirdan = (s: KisiSatiri): Kisi => ({
  id: s.id,
  ad: s.ad,
  eposta: s.eposta,
  kullaniciId: s.kullanici_id,
  durum: s.durum as KisiDurumu,
  benEkledim: s.ben_ekledim === 1,
});

export async function kisileriOku(oku: Okuyucu): Promise<Kisi[]> {
  return (await oku.hepsi<KisiSatiri>('SELECT * FROM kisi ORDER BY ad COLLATE NOCASE, olusturma')).map(satirdan);
}

async function ekleY(y: Yazici, k: Kisi, simdi: string) {
  await y.calistir(
    `INSERT INTO kisi (id, ad, eposta, kullanici_id, durum, ben_ekledim, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (eposta) DO UPDATE SET kullanici_id = excluded.kullanici_id, durum = excluded.durum`,
    [k.id, k.ad.trim(), k.eposta, k.kullaniciId, k.durum, k.benEkledim ? 1 : 0, simdi],
  );
}

export function kisiEkle(kapi: Kapi, k: Kisi, simdi: string = new Date().toISOString()): Promise<void> {
  return kapi.yaz(['kisi'], (y) => ekleY(y, k, simdi));
}

export function kisiSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['kisi'], (y) => y.calistir('DELETE FROM kisi WHERE id = ?', [id]));
}

/** Sunucuyla eşleştirmenin sonucunu tek işlemde yazar; değişiklik yoksa yazmaz. */
export async function eslestirmeyiUygula(
  kapi: Kapi,
  e: Eslestirme,
  kimlik: () => string,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  if (e.ekle.length + e.guncelle.length + e.sil.length === 0) return;
  await kapi.yaz(['kisi'], async (y) => {
    for (const id of e.sil) await y.calistir('DELETE FROM kisi WHERE id = ?', [id]);
    for (const k of e.guncelle) {
      await y.calistir('UPDATE kisi SET kullanici_id = ?, durum = ? WHERE id = ?', [k.kullaniciId, k.durum, k.id]);
    }
    for (const k of e.ekle) await ekleY(y, { ...k, id: kimlik() }, simdi);
  });
}

/** Hesabımı sil ("telefondakiler kalsın"): sunucudaki bağlantılar gittiği için Kişilerim de boşalır. */
export function kisileriTemizle(kapi: Kapi): Promise<void> {
  return kapi.yaz(['kisi'], (y) => y.calistir('DELETE FROM kisi'));
}
