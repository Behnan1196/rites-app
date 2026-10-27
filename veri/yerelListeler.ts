// Listelerim (pilot 27 Ekim, P-58): kişinin telefondaki listeleri (`yerel_liste`,
// `yerel_madde`). Paylaşınca ortak listeye (sunucu) taşınır. Tarihi olan madde ajandada
// o gün görünür. Bir kez: yalnız listeden ibaret tek seferlik kartlar buraya taşınır.

import type { BanaVerilen } from '@/mantik/listeler';
import type { Gun } from '@/mantik/tarih';
import { karttanListeler, tasinacakMi, YEREL_ONEKI, type YerelListe, type YerelMadde } from '@/mantik/yerelListe';

import { ayarOku } from './ayar';
import type { Kapi, Okuyucu, Yazici } from './kapi';
import { kartAyrinti, kartlariSil, tumKartlar } from './kartlar';
import { yeniKimlik } from './kimlik';

interface MaddeSatiri {
  id: string;
  liste: string;
  metin: string;
  yapildi: number;
  tarih: string | null;
  sira: number;
}

const maddeSatirdan = (s: MaddeSatiri): YerelMadde => ({
  id: s.id,
  liste: s.liste,
  metin: s.metin,
  yapildi: s.yapildi === 1,
  tarih: s.tarih,
  sira: s.sira,
});

type Uretec = () => string;

// ---- Okuma ----------------------------------------------------------------------

export async function yerelListeleriOku(
  oku: Okuyucu,
): Promise<(YerelListe & { maddeSayisi: number; kalan: number })[]> {
  return (
    await oku.hepsi<YerelListe & { madde_sayisi: number; kalan: number }>(
      `SELECT l.*, (SELECT COUNT(*) FROM yerel_madde m WHERE m.liste = l.id) AS madde_sayisi,
              (SELECT COUNT(*) FROM yerel_madde m WHERE m.liste = l.id AND m.yapildi = 0) AS kalan
       FROM yerel_liste l ORDER BY l.sira, l.olusturma`,
    )
  ).map(({ madde_sayisi, ...l }) => ({ ...l, maddeSayisi: madde_sayisi }));
}

export async function yerelListeOku(
  oku: Okuyucu,
  id: string,
): Promise<{ liste: YerelListe; maddeler: YerelMadde[] } | null> {
  const liste = await oku.ilk<YerelListe>('SELECT * FROM yerel_liste WHERE id = ?', [id]);
  if (!liste) return null;
  const maddeler = await oku.hepsi<MaddeSatiri>('SELECT * FROM yerel_madde WHERE liste = ? ORDER BY sira', [id]);
  return { liste, maddeler: maddeler.map(maddeSatirdan) };
}

/** Tarihi olan maddeler: ajandada sanal kart ("bana verilen" biçiminde). */
export async function tarihliYerelMaddeler(oku: Okuyucu): Promise<BanaVerilen[]> {
  const satirlar = await oku.hepsi<MaddeSatiri & { liste_adi: string }>(
    `SELECT m.*, l.ad AS liste_adi FROM yerel_madde m JOIN yerel_liste l ON l.id = m.liste
     WHERE m.tarih IS NOT NULL ORDER BY m.tarih, m.sira`,
  );
  return satirlar.map((s) => ({
    id: s.id,
    metin: s.metin,
    yapildi: s.yapildi === 1,
    tarih: s.tarih as Gun,
    liste: s.liste,
    listeAdi: s.liste_adi,
  }));
}

// ---- Yazma --------------------------------------------------------------------------

async function listeEkleY(
  y: Yazici,
  l: { ad: string; aciklama?: string },
  maddeler: { metin: string; yapildi?: boolean; tarih?: Gun | null }[] = [],
  kimlik: Uretec = yeniKimlik,
): Promise<string> {
  const id = YEREL_ONEKI + kimlik();
  const sira = ((await y.ilk<{ s: number | null }>('SELECT MAX(sira) AS s FROM yerel_liste'))?.s ?? 0) + 1;
  await y.calistir('INSERT INTO yerel_liste (id, ad, aciklama, sira, olusturma) VALUES (?, ?, ?, ?, ?)', [
    id,
    l.ad.trim(),
    l.aciklama ?? '',
    sira,
    new Date().toISOString(),
  ]);
  for (const [i, m] of maddeler.entries())
    await y.calistir('INSERT INTO yerel_madde (id, liste, metin, yapildi, tarih, sira) VALUES (?, ?, ?, ?, ?, ?)', [
      kimlik(),
      id,
      m.metin,
      m.yapildi ? 1 : 0,
      m.tarih ?? null,
      i + 1,
    ]);
  return id;
}

export async function yerelListeEkle(kapi: Kapi, ad: string, kimlik: Uretec = yeniKimlik): Promise<string> {
  let id = '';
  await kapi.yaz(['liste'], async (y) => {
    id = await listeEkleY(y, { ad }, [], kimlik);
  });
  return id;
}

export function yerelListeYaz(kapi: Kapi, id: string, alanlar: { ad?: string; aciklama?: string }): Promise<void> {
  return kapi.yaz(['liste'], async (y) => {
    if (alanlar.ad !== undefined)
      await y.calistir('UPDATE yerel_liste SET ad = ? WHERE id = ?', [alanlar.ad.trim(), id]);
    if (alanlar.aciklama !== undefined)
      await y.calistir('UPDATE yerel_liste SET aciklama = ? WHERE id = ?', [alanlar.aciklama, id]);
  });
}

export function yerelListeSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['liste'], async (y) => {
    await y.calistir('DELETE FROM yerel_madde WHERE liste = ?', [id]);
    await y.calistir('DELETE FROM yerel_liste WHERE id = ?', [id]);
  });
}

export function yerelMaddeEkle(kapi: Kapi, liste: string, metin: string, kimlik: Uretec = yeniKimlik): Promise<void> {
  return kapi.yaz(['liste'], async (y) => {
    const sira =
      ((await y.ilk<{ s: number | null }>('SELECT MAX(sira) AS s FROM yerel_madde WHERE liste = ?', [liste]))?.s ?? 0) +
      1;
    await y.calistir('INSERT INTO yerel_madde (id, liste, metin, yapildi, tarih, sira) VALUES (?, ?, ?, 0, NULL, ?)', [
      kimlik(),
      liste,
      metin.trim(),
      sira,
    ]);
  });
}

export function yerelMaddeDegistir(
  kapi: Kapi,
  id: string,
  d: { yapildi?: boolean; tarih?: Gun | null; metin?: string },
): Promise<void> {
  return kapi.yaz(['liste'], async (y) => {
    if (d.yapildi !== undefined)
      await y.calistir('UPDATE yerel_madde SET yapildi = ? WHERE id = ?', [d.yapildi ? 1 : 0, id]);
    if (d.tarih !== undefined) await y.calistir('UPDATE yerel_madde SET tarih = ? WHERE id = ?', [d.tarih, id]);
    if (d.metin !== undefined) await y.calistir('UPDATE yerel_madde SET metin = ? WHERE id = ?', [d.metin.trim(), id]);
  });
}

export function yerelMaddeSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['liste'], (y) => y.calistir('DELETE FROM yerel_madde WHERE id = ?', [id]));
}

// ---- Bir kez: liste kartlarını taşı ----------------------------------------------------

/**
 * Yalnız listeden ibaret tek seferlik kartları Listelerim'e taşır, kartları siler.
 * Ayar `listeler_tasindi` yazılınca bir daha çalışmaz. Taşınan liste sayısını döner.
 */
export async function listeKartlariniTasi(
  kapi: Kapi,
  oku: Okuyucu,
  bugunGun: Gun,
  kimlik: Uretec = yeniKimlik,
): Promise<number> {
  if (await ayarOku(oku, 'listeler_tasindi')) return 0;
  const tasinacaklar: { kartId: string; listeler: ReturnType<typeof karttanListeler> }[] = [];
  for (const k of await tumKartlar(oku)) {
    if (k.tekrar || k.planId || k.bag || k.blokSayisi === 0) continue;
    const a = await kartAyrinti(oku, k.id);
    if (!a || !tasinacakMi(a.kart, a.bloklar)) continue;
    const kayit = a.kart.tarih
      ? await oku.ilk<{ isaretler: string }>('SELECT isaretler FROM kayit WHERE kart_id = ? AND tarih = ?', [
          k.id,
          a.kart.tarih,
        ])
      : null;
    let isaretler: Record<string, boolean[]> = {};
    try {
      isaretler = kayit ? (JSON.parse(kayit.isaretler) as Record<string, boolean[]>) : {};
    } catch {
      isaretler = {};
    }
    tasinacaklar.push({ kartId: k.id, listeler: karttanListeler(a.kart, a.bloklar, isaretler, bugunGun) });
  }
  await kapi.yaz(['liste', 'ayar'], async (y) => {
    for (const t of tasinacaklar) for (const l of t.listeler) await listeEkleY(y, l, l.maddeler, kimlik);
    await y.calistir(
      'INSERT INTO ayar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger',
      ['listeler_tasindi', JSON.stringify(true)],
    );
  });
  await kartlariSil(
    kapi,
    tasinacaklar.map((t) => t.kartId),
  );
  return tasinacaklar.reduce((n, t) => n + t.listeler.length, 0);
}
