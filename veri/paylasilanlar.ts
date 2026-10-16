// Başka uygulamadan (ör. YouTube) Rites'a paylaşılan bağlantılar (pilot 16 Ekim).
// Paylaşım Rites'ı açmaz; bağlantı telefonda bekler, Rites açılınca buraya yazılır
// ve Gelenler'de hazır bir kart olarak görünür. Yalnız bu telefonda durur.

import type { Kapi, Okuyucu } from './kapi';

export interface Paylasilan {
  id: string;
  baslik: string;
  adres: string;
  /** ISO zaman */
  olusturma: string;
}

export async function paylasilanlariOku(oku: Okuyucu): Promise<Paylasilan[]> {
  return oku.hepsi<Paylasilan>(
    'SELECT id, baslik, adres, olusturma FROM paylasilan ORDER BY olusturma DESC, rowid DESC',
  );
}

export function paylasilanEkle(kapi: Kapi, p: Paylasilan): Promise<void> {
  return kapi.yaz(['paylasilan'], (y) =>
    y.calistir('INSERT INTO paylasilan (id, baslik, adres, olusturma) VALUES (?, ?, ?, ?)', [
      p.id,
      p.baslik,
      p.adres,
      p.olusturma,
    ]),
  );
}

export function paylasilanSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['paylasilan'], (y) => y.calistir('DELETE FROM paylasilan WHERE id = ?', [id]));
}
