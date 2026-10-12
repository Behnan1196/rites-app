// Testler için bellekte çalışan çok basit sahte veritabanı.
// Gerçek SQL çalıştırmaz; yapılan çağrıları kaydeder. `ayar` tablosu ve
// `PRAGMA user_version` için en az davranışı taklit eder.

import type { HamVeriTabani, SqlDeger } from '../kapi';

export interface SahteVeriTabani extends HamVeriTabani {
  gunluk: string[];
  ayarlar: Map<string, string>;
  userVersion: number;
  /** Bir sonraki işlemi (transaction) hata ile bitir. */
  sonrakiIslemHataVersin: boolean;
}

export function sahteVeriTabani(): SahteVeriTabani {
  const db: SahteVeriTabani = {
    gunluk: [],
    ayarlar: new Map(),
    userVersion: 0,
    sonrakiIslemHataVersin: false,

    async execAsync(sql) {
      db.gunluk.push(`exec:${sql.trim()}`);
      const m = /PRAGMA user_version = (\d+)/.exec(sql);
      if (m) db.userVersion = Number(m[1]);
    },
    async runAsync(sql, params: SqlDeger[]) {
      db.gunluk.push(`run:${sql}`);
      if (sql.startsWith('INSERT INTO ayar')) {
        db.ayarlar.set(String(params[0]), String(params[1]));
      }
    },
    async getAllAsync<T>(sql: string) {
      db.gunluk.push(`hepsi:${sql}`);
      return [] as T[];
    },
    async getFirstAsync<T>(sql: string, params: SqlDeger[]) {
      db.gunluk.push(`ilk:${sql}`);
      if (sql === 'PRAGMA user_version') return { user_version: db.userVersion } as T;
      if (sql.startsWith('SELECT deger FROM ayar')) {
        const deger = db.ayarlar.get(String(params[0]));
        return (deger === undefined ? null : { deger }) as T | null;
      }
      return null;
    },
    async withTransactionAsync(islem) {
      db.gunluk.push('islem:basla');
      try {
        await islem();
        if (db.sonrakiIslemHataVersin) {
          db.sonrakiIslemHataVersin = false;
          throw new Error('sahte hata');
        }
        db.gunluk.push('islem:bitti');
      } catch (e) {
        db.gunluk.push('islem:geri');
        throw e;
      }
    },
  };
  return db;
}
