// Veritabanı yapısının sürümleri (göçler).
//
// Her göç bir kez, sırayla ve kendi işlemi içinde çalışır; sürüm numarası
// SQLite'ın `PRAGMA user_version` değerinde tutulur. Var olan bir göç
// değiştirilmez; yapı değişince yeni sürüm eklenir.

import type { HamVeriTabani } from './kapi';

export interface Goc {
  surum: number;
  sql: string;
}

export const GOCLER: readonly Goc[] = [
  {
    surum: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS ayar (
        anahtar TEXT PRIMARY KEY NOT NULL,
        deger   TEXT NOT NULL
      );
    `,
  },
];

/** Göç listesi 1'den başlayıp birer birer artıyor mu? (Yazım hatasına karşı.) */
export function gocListesiHatasi(gocler: readonly Goc[]): string | null {
  for (let i = 0; i < gocler.length; i++) {
    const beklenen = i + 1;
    if (gocler[i]?.surum !== beklenen) {
      return `Göç ${i + 1}. sırada ${beklenen} numaralı olmalı.`;
    }
  }
  return null;
}

/**
 * Eksik göçleri uygular ve veritabanının son sürümünü döndürür.
 * Kurulum ayarları (WAL, yabancı anahtar) her açılışta yapılır.
 */
export async function gocleriUygula(
  db: HamVeriTabani,
  gocler: readonly Goc[] = GOCLER,
): Promise<number> {
  const hata = gocListesiHatasi(gocler);
  if (hata) throw new Error(hata);

  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const satir = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  let surum = satir?.user_version ?? 0;

  for (const goc of gocler) {
    if (goc.surum <= surum) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(goc.sql);
      await db.execAsync(`PRAGMA user_version = ${goc.surum}`);
    });
    surum = goc.surum;
  }
  return surum;
}
