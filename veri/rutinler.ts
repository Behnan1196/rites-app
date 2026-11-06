// Rutin (pilot 5 Kasım, P-93): adımları okuma, ekleme, sıralama, işaretleme ve listeden çevirme.

import { adimDurumu } from '@/mantik/adimlar';
import { yeniKart, type Kart } from '@/mantik/kart';
import { adimSirasi } from '@/mantik/rutinAdimlari';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu } from './kapi';
import {
  gunYapilanlari,
  isaretle,
  kartAyrinti,
  kartKayitlari,
  tumKartlar,
  yeniKartKaydet,
  type KartOzeti,
  type KimlikUretici,
} from './kartlar';

const HER_GUN = { gunSayisi: null, gunler: null, desen: 'hergun' as const };

/** Rutinin adımları, sırasıyla. */
export async function rutinAdimlari(oku: Okuyucu, rutinId: string): Promise<KartOzeti[]> {
  return adimSirasi((await tumKartlar(oku)).filter((k) => k.ust === rutinId));
}

/** Rutinin sonuna bir adım (yalnız başlıklı kart; video, zamanlayıcı… sonra eklenir). */
export async function rutinAdimiEkle(
  kapi: Kapi,
  oku: Okuyucu,
  rutin: Pick<Kart, 'id' | 'tarih'>,
  baslik: string,
  bugunGun: Gun,
  idUret: KimlikUretici,
): Promise<string> {
  const adimlar = await rutinAdimlari(oku, rutin.id);
  const sira = Math.max(0, ...adimlar.map((a) => a.ustSira ?? 0)) + 1;
  const id = idUret();
  await yeniKartKaydet(
    kapi,
    yeniKart(id, {
      baslik: baslik.trim(),
      tarih: rutin.tarih ?? bugunGun,
      tekrar: HER_GUN,
      ust: rutin.id,
      ustSira: sira,
    }),
    [],
    idUret,
  );
  return id;
}

/** Rutin olarak işaretle (adımları sonra eklenir). */
export function rutinYap(kapi: Kapi, kartId: string): Promise<void> {
  return kapi.yaz(['kart'], (y) => y.calistir('UPDATE kart SET rutin = 1 WHERE id = ?', [kartId]));
}

/** İki adımın yerini değiştirir. */
export function adimlarinYeriniDegistir(
  kapi: Kapi,
  a: Pick<Kart, 'id' | 'ustSira'>,
  b: Pick<Kart, 'id' | 'ustSira'>,
): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    await y.calistir('UPDATE kart SET ust_sira = ? WHERE id = ?', [b.ustSira ?? 0, a.id]);
    await y.calistir('UPDATE kart SET ust_sira = ? WHERE id = ?', [a.ustSira ?? 0, b.id]);
  });
}

/**
 * Adımı işaretler; bütün adımlar o gün yapıldıysa rutin de yapıldı olur, bir adımın işareti
 * kalkınca rutinin de kalkar.
 */
export async function rutinAdimiIsaretle(
  kapi: Kapi,
  oku: Okuyucu,
  rutinId: string,
  adimId: string,
  gun: Gun,
  yapildi: boolean,
): Promise<void> {
  await isaretle(kapi, adimId, gun, yapildi);
  const adimlar = await rutinAdimlari(oku, rutinId);
  const yapilanlar = await gunYapilanlari(oku, gun);
  const hepsi = adimlar.length > 0 && adimlar.every((a) => yapilanlar.has(a.id));
  if (hepsi !== yapilanlar.has(rutinId)) await isaretle(kapi, rutinId, gun, hepsi);
}

/**
 * Kartın listesini rutine çevirir: her madde bir adım kartı olur (o günün işaretleriyle), liste
 * kalkar, kart rutin olur. Liste yoksa yalnız rutin olur. Eklenen adım sayısını döner.
 */
export async function rutineCevir(
  kapi: Kapi,
  oku: Okuyucu,
  kartId: string,
  gun: Gun,
  idUret: KimlikUretici,
): Promise<number> {
  const a = await kartAyrinti(oku, kartId);
  if (!a) return 0;
  const liste = a.bloklar.find((b) => b.tur === 'liste' || b.tur === 'adimlar' || b.tur === 'bilgi');
  await rutinYap(kapi, kartId);
  if (!liste) return 0;
  const kayit = (await kartKayitlari(oku, kartId)).find((k) => k.tarih === gun);
  const durum = liste.tur === 'adimlar' ? adimDurumu(liste.durum, liste.maddeler.length) : null;
  const yapildiMi = (i: number) =>
    liste.tur === 'liste'
      ? !!kayit?.isaretler[liste.id]?.[i]
      : liste.tur === 'adimlar'
        ? durum?.yapilan[i] === gun
        : false;
  let n = 0;
  for (const [i, madde] of liste.maddeler.entries()) {
    const id = await rutinAdimiEkle(kapi, oku, a.kart, madde, gun, idUret);
    if (yapildiMi(i)) await isaretle(kapi, id, gun, true);
    n++;
  }
  await kapi.yaz(['kart'], (y) => y.calistir('DELETE FROM blok WHERE id = ?', [liste.id]));
  return n;
}

/** P-101: sürükleyerek sıralama: adımların yeni sırası (kimlikler sırasıyla). */
export function adimSiralariniYaz(kapi: Kapi, kimlikler: readonly string[]): Promise<void> {
  return kapi.yaz(['kart'], async (y) => {
    for (const [i, id] of kimlikler.entries())
      await y.calistir('UPDATE kart SET ust_sira = ? WHERE id = ?', [i + 1, id]);
  });
}
