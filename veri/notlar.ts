// Notlar (`03` → not, `05` §11): yapışkan notlar, sesli not, sıra, ajandaya alma.

import { yeniKart } from '@/mantik/kart';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu } from './kapi';
import { bloklariYazY, kartEkleY, type KimlikUretici } from './kartlar';

export interface Not {
  id: string;
  metin: string;
  sesli: boolean;
  sesYolu: string | null;
  sira: number;
  olusturma: string;
}

interface NotSatiri {
  id: string;
  metin: string;
  sesli: number;
  ses_yolu: string | null;
  sira: number;
  olusturma: string;
}

const notSatirdan = (s: NotSatiri): Not => ({
  id: s.id,
  metin: s.metin,
  sesli: s.sesli === 1,
  sesYolu: s.ses_yolu,
  sira: s.sira,
  olusturma: s.olusturma,
});

/** Notlar kişinin sırasıyla (yeni not en üstte başlar). */
export async function notlariOku(oku: Okuyucu): Promise<Not[]> {
  const satirlar = await oku.hepsi<NotSatiri>('SELECT * FROM "not" ORDER BY sira, olusturma DESC');
  return satirlar.map(notSatirdan);
}

/** Yeni not en üste eklenir (N-1). Boş not kaydedilmez. */
export function notEkle(
  kapi: Kapi,
  alanlar: { id: string; metin: string; sesli?: boolean; sesYolu?: string | null },
  simdi: string = new Date().toISOString(),
): Promise<void> {
  const metin = alanlar.metin.trim();
  if (metin === '') return Promise.resolve();
  return kapi.yaz(['not'], async (y) => {
    const en = await y.ilk<{ s: number | null }>('SELECT MIN(sira) AS s FROM "not"');
    const sira = (en?.s ?? 1) - 1;
    await y.calistir('INSERT INTO "not" (id, metin, sesli, ses_yolu, sira, olusturma) VALUES (?, ?, ?, ?, ?, ?)', [
      alanlar.id,
      metin,
      alanlar.sesli ? 1 : 0,
      alanlar.sesYolu ?? null,
      sira,
      simdi,
    ]);
  });
}

export function notMetniniDegistir(kapi: Kapi, id: string, metin: string): Promise<void> {
  const temiz = metin.trim();
  if (temiz === '') return Promise.resolve();
  return kapi.yaz(['not'], (y) => y.calistir('UPDATE "not" SET metin = ? WHERE id = ?', [temiz, id]));
}

export function notSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['not'], (y) => y.calistir('DELETE FROM "not" WHERE id = ?', [id]));
}

/** Notların yeni sırası (kimlikler, yukarıdan aşağı). */
export function notlariSirala(kapi: Kapi, kimlikler: readonly string[]): Promise<void> {
  return kapi.yaz(['not'], async (y) => {
    for (const [sira, id] of kimlikler.entries()) {
      await y.calistir('UPDATE "not" SET sira = ? WHERE id = ?', [sira, id]);
    }
  });
}

/**
 * Notu bugünün ajandasına al (N-3, `05` §11): başlığı not metni olan, saatsiz
 * bir kart oluşur ve not silinir. Sesli notun kaydı kaybolmasın diye kartın
 * Dosya bloğu olarak taşınır.
 */
export function notuAjandayaAl(
  kapi: Kapi,
  not: Not,
  bugunGun: Gun,
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<string> {
  const kart = yeniKart(idUret(), { baslik: not.metin.trim() || 'Not', tarih: bugunGun, sira: Date.now() });
  return kapi
    .yaz(['not', 'kart'], async (y) => {
      await kartEkleY(y, kart, simdi);
      if (not.sesli && not.sesYolu) {
        await bloklariYazY(
          y,
          kart.id,
          [{ id: 'ses', tur: 'dosya', ad: 'Sesli not', metin: '', birim: '', dakika: null, maddeler: [], dosya: not.sesYolu }],
          idUret,
        );
      }
      await y.calistir('DELETE FROM "not" WHERE id = ?', [not.id]);
    })
    .then(() => kart.id);
}
