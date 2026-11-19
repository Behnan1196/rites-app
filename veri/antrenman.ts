// Antrenman akışı (P-133): listenin adımlarını parçaları, kayıtları ve o günkü işaretiyle okur;
// bitince özeti rutinin o günkü kaydına yazar.

import { antrenmanKaydiYaz, type AntrenmanAdimi, type AntrenmanKaydi } from '@/mantik/antrenman';
import type { Kart } from '@/mantik/kart';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu } from './kapi';
import { kartAyrinti, kartKayitlari, kayitDegistir } from './kartlar';
import { rutinAdimlari, rutinYapilanlari } from './rutinler';

export async function antrenmanAdimlari(
  oku: Okuyucu,
  rutin: Pick<Kart, 'id' | 'rutin'>,
  gun: Gun,
): Promise<AntrenmanAdimi[]> {
  const adimlar = await rutinAdimlari(oku, rutin.id);
  const yapilanlar = await rutinYapilanlari(oku, rutin, gun);
  return Promise.all(
    adimlar.map(async (k) => ({
      id: k.id,
      baslik: k.baslik,
      bloklar: (await kartAyrinti(oku, k.id))?.bloklar ?? [],
      kayitlar: await kartKayitlari(oku, k.id),
      yapildi: yapilanlar.has(k.id),
    })),
  );
}

/** Listede setli egzersiz var mı ("Antrenmana başla" düğmesi için). */
export async function antrenmanVarMi(oku: Okuyucu, rutinId: string): Promise<boolean> {
  const s = await oku.ilk<{ n: number }>(
    "SELECT COUNT(*) AS n FROM blok b JOIN kart k ON k.id = b.kart_id WHERE k.ust = ? AND b.tur = 'setler'",
    [rutinId],
  );
  return (s?.n ?? 0) > 0;
}

export function antrenmaniKaydet(kapi: Kapi, rutinId: string, gun: Gun, a: AntrenmanKaydi): Promise<void> {
  return kayitDegistir(kapi, rutinId, gun, (k) => antrenmanKaydiYaz(k, a));
}
