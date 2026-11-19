// Koç paketi (P-134): örneği kurar ve kaldırır. Kartlar `mantik/kocPaketi` `paketKartlari` ile
// üretilir; koçun bilgisi ayarda (`koc`).

import { kocBilgisi, ORNEK_BAG, paketKartlari, type KocPaketi } from '@/mantik/kocPaketi';
import { gunEkle, type Gun } from '@/mantik/tarih';

import { ayarSil, ayarYaz } from './ayar';
import type { Kapi, Okuyucu } from './kapi';
import { kartlariSil, yeniKartKaydet, type KimlikUretici } from './kartlar';

export async function paketiKur(kapi: Kapi, p: KocPaketi, bugunGun: Gun, idUret: KimlikUretici): Promise<void> {
  for (const t of paketKartlari(p, bugunGun, idUret)) await yeniKartKaydet(kapi, t.kart, t.bloklar, idUret);
  await ayarYaz(kapi, 'koc', kocBilgisi(p, bugunGun, gunEkle(bugunGun, p.gunSayisi - 1)));
}

/** Örneğin kartlarını (adımları, kayıtlarıyla) ve koç bilgisini siler. */
export async function ornegiKaldir(kapi: Kapi, oku: Okuyucu): Promise<void> {
  const s = await oku.hepsi<{ id: string }>('SELECT id FROM kart WHERE bag LIKE ? AND ust IS NULL', [`${ORNEK_BAG}%`]);
  await kartlariSil(
    kapi,
    s.map((x) => x.id),
  );
  // Adımı ayrıca kalmış olursa (liste silinmişse) o da gitsin.
  const kalan = await oku.hepsi<{ id: string }>('SELECT id FROM kart WHERE bag LIKE ?', [`${ORNEK_BAG}%`]);
  await kartlariSil(
    kapi,
    kalan.map((x) => x.id),
  );
  await ayarSil(kapi, 'koc');
}

/** Koçtan gelen (örnek) kartlar: antrenmanlar ve beslenme planı. */
export async function kocKartKimlikleri(oku: Okuyucu): Promise<{ antrenmanlar: string[]; beslenme: string | null }> {
  const s = await oku.hepsi<{ id: string; bag: string }>(
    'SELECT id, bag FROM kart WHERE bag LIKE ? AND ust IS NULL ORDER BY bag',
    [`${ORNEK_BAG}%`],
  );
  return {
    antrenmanlar: s.filter((x) => x.bag.startsWith(`${ORNEK_BAG}antrenman:`)).map((x) => x.id),
    beslenme: s.find((x) => x.bag === `${ORNEK_BAG}beslenme`)?.id ?? null,
  };
}
