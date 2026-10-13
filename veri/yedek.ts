// Yedeğin veritabanı tarafı: bütün tabloları okur, geri yüklemede tek işlemde
// yerine yazar. Dosyaların okunup yazılması `yedekDosyasi.ts`te.

import { YEDEK_BICIMI, YEDEK_TABLOLARI, yollariCevir, type Satir, type YedekDosyasi } from '@/mantik/yedek';

import type { Kapi, Okuyucu, SqlDeger } from './kapi';

const tirnak = (ad: string) => `"${ad}"`;

export async function veritabaniSurumu(oku: Okuyucu): Promise<number> {
  return (await oku.ilk<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
}

/** Yedek dosyasının içeriği (dosyalar hariç; onları çağıran ekler). */
export async function yedekVerisi(oku: Okuyucu, dosyaKlasoru: string): Promise<YedekDosyasi> {
  const tablolar: Record<string, Satir[]> = {};
  for (const t of YEDEK_TABLOLARI) tablolar[t] = await oku.hepsi<Satir>(`SELECT * FROM ${tirnak(t)}`);
  return {
    bicim: YEDEK_BICIMI,
    surum: await veritabaniSurumu(oku),
    olusturma: new Date().toISOString(),
    dosyaKlasoru,
    tablolar,
    dosyalar: {},
  };
}

/**
 * Yedeği geri yükler: bu telefondaki veriler silinir, yedektekiler yazılır.
 * Eski sürümden alınmış yedekte olmayan sütunlar varsayılanını alır; bu
 * sürümde olmayan sütunlar atlanır. Hepsi tek işlemde: yarıda kalırsa hiçbir şey değişmez.
 */
export function yedegiYaz(kapi: Kapi, yedek: YedekDosyasi, yeniKlasor: string): Promise<void> {
  return kapi.yaz(['ayar', 'kart', 'not', 'plan', 'animsatici', 'kisi', 'kutuphane'], async (y) => {
    for (const t of [...YEDEK_TABLOLARI].reverse()) await y.calistir(`DELETE FROM ${tirnak(t)}`);
    for (const t of YEDEK_TABLOLARI) {
      const sutunlar = new Set(
        (await y.hepsi<{ name: string }>(`PRAGMA table_info(${tirnak(t)})`)).map((s) => s.name),
      );
      const satirlar = yollariCevir(yedek.tablolar[t] ?? [], yedek.dosyaKlasoru, yeniKlasor);
      for (const s of satirlar) {
        const adlar = Object.keys(s).filter((k) => sutunlar.has(k));
        if (adlar.length === 0) continue;
        await y.calistir(
          `INSERT INTO ${tirnak(t)} (${adlar.map(tirnak).join(', ')}) VALUES (${adlar.map(() => '?').join(', ')})`,
          adlar.map((k) => s[k] as SqlDeger),
        );
      }
    }
  });
}
