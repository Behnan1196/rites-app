// Anımsatıcılar ve bugünkü durumları (`03`, `05` §7). Geçmiş günler tutulmaz:
// her yazmada bugünden eski satırlar silinir.

import { gunleriCoz, saatleriSirala, type Animsatici, type AnimsaticiGunu } from '@/mantik/animsatici';
import { gecerliSes } from '@/mantik/sesler';
import { bitisHesapla, ZAMANLAYICI_ERTELEME } from '@/mantik/zamanlayici';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu, Yazici } from './kapi';

interface AnimsaticiSatiri {
  id: string;
  ad: string;
  saatler: string;
  gunler: string;
  sesli: number;
  ertele_dk: number;
  alarm: number | null;
  bitis?: string | null;
  ses?: string | null;
  toplam_ms?: number | null;
  duraklama?: number | null;
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
    gunler: gunleriCoz(s.gunler),
    sesli: s.sesli === 1,
    erteleDk: s.ertele_dk,
    alarm: s.alarm === 1,
    bitis: s.bitis ?? null,
    ses: gecerliSes(s.ses),
    ...(s.bitis ? { toplamMs: s.toplam_ms ?? null, duraklama: s.duraklama ?? null } : {}),
  };
}

export async function animsaticilariOku(oku: Okuyucu): Promise<Animsatici[]> {
  return (await oku.hepsi<AnimsaticiSatiri>('SELECT * FROM animsatici ORDER BY olusturma, rowid')).map(satirdan);
}

/** Yalnız o günün durumları. */
export async function gunDurumlari(oku: Okuyucu, gun: Gun): Promise<AnimsaticiGunu[]> {
  const satirlar = await oku.hepsi<{
    animsatici_id: string;
    saat: string;
    durum: string | null;
    ertelenen_saat: string | null;
  }>('SELECT animsatici_id, saat, durum, ertelenen_saat FROM animsatici_gun WHERE tarih = ?', [gun]);
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

/** "Süre sonra" anımsatıcısı çaldıktan bu kadar sonra (durdurulmasa da) silinir. */
const BITEN_SURE_MS = 60 * 60_000;

/**
 * Uygulama açılırken ve gün değişince: dünden kalan durumlar ve çalıp geçmiş
 * "Süre sonra" anımsatıcıları (bir saatten eski) silinir.
 */
export function eskiGunleriSil(kapi: Kapi, bugunGun: Gun, simdiMs: number = Date.now()): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    await eskileriSilY(y, bugunGun);
    // Duraklatılmış zamanlayıcı kalır (kişi sürdürür ya da iptal eder).
    await y.calistir('DELETE FROM animsatici WHERE bitis IS NOT NULL AND duraklama IS NULL AND bitis < ?', [
      new Date(simdiMs - BITEN_SURE_MS).toISOString(),
    ]);
  });
}

export function animsaticiEkle(kapi: Kapi, a: Animsatici, simdi: string = new Date().toISOString()): Promise<void> {
  return kapi.yaz(['animsatici'], (y) =>
    y.calistir(
      'INSERT INTO animsatici (id, ad, saatler, gunler, sesli, ertele_dk, alarm, bitis, ses, olusturma) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        a.id,
        a.ad.trim(),
        JSON.stringify(saatleriSirala(a.saatler)),
        JSON.stringify([...a.gunler].sort()),
        a.sesli ? 1 : 0,
        a.erteleDk,
        a.alarm ? 1 : 0,
        a.bitis ? new Date(a.bitis).toISOString() : null,
        gecerliSes(a.ses),
        simdi,
      ],
    ),
  );
}

/** Düzenleme: bugünün durumlarından artık olmayan saatlerinkiler silinir. */
export function animsaticiGuncelle(kapi: Kapi, a: Animsatici): Promise<void> {
  const saatler = saatleriSirala(a.saatler);
  return kapi.yaz(['animsatici'], async (y) => {
    await y.calistir(
      'UPDATE animsatici SET ad = ?, saatler = ?, gunler = ?, sesli = ?, ertele_dk = ?, alarm = ?, ses = ? WHERE id = ?',
      [
        a.ad.trim(),
        JSON.stringify(saatler),
        JSON.stringify([...a.gunler].sort()),
        a.sesli ? 1 : 0,
        a.erteleDk,
        a.alarm ? 1 : 0,
        gecerliSes(a.ses),
        a.id,
      ],
    );
    await y.calistir(
      `DELETE FROM animsatici_gun WHERE animsatici_id = ? AND saat NOT IN (${saatler.map(() => '?').join(', ')})`,
      [a.id, ...saatler],
    );
  });
}

// ---- Zamanlayıcı (pilot 23 Ekim) ------------------------------------------------

export interface YeniZamanlayici {
  id: string;
  ad: string;
  ms: number;
  alarm: boolean;
  ses: string | null;
}

/** Kurar: `simdiMs + ms` anında bir kez çalar. */
export async function zamanlayiciKur(
  kapi: Kapi,
  z: YeniZamanlayici,
  simdiMs: number = Date.now(),
): Promise<{ bitis: string; saat: string }> {
  const b = bitisHesapla(simdiMs, z.ms);
  await kapi.yaz(['animsatici'], async (y) => {
    await y.calistir(
      'INSERT INTO animsatici (id, ad, saatler, gunler, sesli, ertele_dk, alarm, bitis, ses, toplam_ms, duraklama, olusturma) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NULL, ?)',
      [
        z.id,
        z.ad.trim(),
        JSON.stringify([b.saat]),
        '[]',
        ZAMANLAYICI_ERTELEME,
        z.alarm ? 1 : 0,
        b.bitis,
        gecerliSes(z.ses),
        Math.round(z.ms),
        new Date(simdiMs).toISOString(),
      ],
    );
  });
  return b;
}

async function zamanlayiciOku(y: Yazici, id: string) {
  return y.ilk<{ bitis: string | null; toplam_ms: number | null; duraklama: number | null }>(
    'SELECT bitis, toplam_ms, duraklama FROM animsatici WHERE id = ?',
    [id],
  );
}

async function bitisYaz(y: Yazici, id: string, simdiMs: number, kalan: number) {
  const b = bitisHesapla(simdiMs, kalan);
  await y.calistir('UPDATE animsatici SET bitis = ?, saatler = ?, duraklama = NULL WHERE id = ?', [
    b.bitis,
    JSON.stringify([b.saat]),
    id,
  ]);
  // Eski saatin bugünkü durumu (ertelendi / durduruldu) yenisine karışmasın.
  await y.calistir('DELETE FROM animsatici_gun WHERE animsatici_id = ?', [id]);
}

/** Duraklat: kalan süre saklanır; bildirimi ve alarmı kalkar. */
export function zamanlayiciDuraklat(kapi: Kapi, id: string, simdiMs: number = Date.now()): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    const z = await zamanlayiciOku(y, id);
    if (!z?.bitis || z.duraklama !== null) return;
    const kalan = Math.max(0, new Date(z.bitis).getTime() - simdiMs);
    await y.calistir('UPDATE animsatici SET duraklama = ? WHERE id = ?', [Math.round(kalan), id]);
  });
}

/** Devam: kalan süreden yeniden kurulur. */
export function zamanlayiciDevam(kapi: Kapi, id: string, simdiMs: number = Date.now()): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    const z = await zamanlayiciOku(y, id);
    if (!z?.bitis || z.duraklama === null) return;
    await bitisYaz(y, id, simdiMs, z.duraklama);
  });
}

/** "+1 dk": kalan süre ve halkanın toplamı uzar (duraklatılmışsa duraklatılmış kalır). */
export function zamanlayiciUzat(kapi: Kapi, id: string, ms: number, simdiMs: number = Date.now()): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    const z = await zamanlayiciOku(y, id);
    if (!z?.bitis) return;
    const kalan = z.duraklama !== null ? z.duraklama : Math.max(0, new Date(z.bitis).getTime() - simdiMs);
    const toplam = (z.toplam_ms ?? kalan) + ms;
    await y.calistir('UPDATE animsatici SET toplam_ms = ? WHERE id = ?', [Math.round(toplam), id]);
    if (z.duraklama !== null)
      await y.calistir('UPDATE animsatici SET duraklama = ? WHERE id = ?', [Math.round(kalan + ms), id]);
    else await bitisYaz(y, id, simdiMs, kalan + ms);
  });
}

/**
 * Zamanlayıcıda Ertele (P-31): saniyesiyle şimdiden `dk` dakika sonrasına yeniden
 * kurulur; geri sayım ve halka o süreyle baştan başlar.
 */
export function zamanlayiciErtele(kapi: Kapi, id: string, dk: number, simdiMs: number = Date.now()): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    const z = await zamanlayiciOku(y, id);
    if (!z?.bitis) return;
    await y.calistir('UPDATE animsatici SET toplam_ms = ? WHERE id = ?', [dk * 60_000, id]);
    await bitisYaz(y, id, simdiMs, dk * 60_000);
  });
}

export function animsaticiSil(kapi: Kapi, id: string): Promise<void> {
  return kapi.yaz(['animsatici'], (y) => y.calistir('DELETE FROM animsatici WHERE id = ?', [id]));
}

/** Durdur: o saatin kalan çalmaları iptal (`05` §7). "Süre sonra" anımsatıcısı silinir. */
export function durdur(kapi: Kapi, animsaticiId: string, gun: Gun, saat: string): Promise<void> {
  return kapi.yaz(['animsatici'], async (y) => {
    const satir = await y.ilk<{ bitis: string | null }>('SELECT bitis FROM animsatici WHERE id = ?', [animsaticiId]);
    if (satir?.bitis) {
      await y.calistir('DELETE FROM animsatici WHERE id = ?', [animsaticiId]);
      return;
    }
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
