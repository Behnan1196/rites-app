// Tek yazma kapısı.
//
// Kural: veritabanına yazan her işlem bu kapıdan geçer. Kapı yazmaları
// sıraya koyar (biri bitmeden öteki başlamaz), her yazmayı tek bir işlem
// (transaction) içinde çalıştırır ve başarıyla bitince değişen konuları
// yayına duyurur. Okumalar kapıdan geçmez; `Okuyucu` ile yapılır.

import type { Konu, Yayin } from './yayin';

export type SqlDeger = string | number | null;

/** expo-sqlite veritabanının bizim kullandığımız kadarı (testte sahtesi yazılabilsin diye). */
export interface HamVeriTabani {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlDeger[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: SqlDeger[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlDeger[]): Promise<T | null>;
  withTransactionAsync(islem: () => Promise<void>): Promise<void>;
}

/** Yalnız okuma. Ekranlar ve sorgular bunu kullanır. */
export interface Okuyucu {
  hepsi<T>(sql: string, params?: SqlDeger[]): Promise<T[]>;
  ilk<T>(sql: string, params?: SqlDeger[]): Promise<T | null>;
}

/** Yazma işleminin içinde verilen yazıcı; işlem bitince kullanılamaz. */
export interface Yazici {
  calistir(sql: string, params?: SqlDeger[]): Promise<void>;
  hepsi<T>(sql: string, params?: SqlDeger[]): Promise<T[]>;
  ilk<T>(sql: string, params?: SqlDeger[]): Promise<T | null>;
}

export interface Kapi {
  /**
   * `islem` içindeki bütün yazmaları tek işlemde çalıştırır.
   * Başarılı olursa `konular` duyurulur; hata olursa hiçbir şey yazılmaz ve hata fırlatılır.
   */
  yaz(konular: readonly Konu[], islem: (yazici: Yazici) => Promise<void>): Promise<void>;
}

export function okuyucuOlustur(db: HamVeriTabani): Okuyucu {
  return {
    hepsi: (sql, params = []) => db.getAllAsync(sql, params),
    ilk: (sql, params = []) => db.getFirstAsync(sql, params),
  };
}

export function kapiOlustur(db: HamVeriTabani, yayin: Yayin): Kapi {
  // Yazmaları sıraya koyan zincir. Bir yazmanın hatası sonrakileri durdurmaz.
  let sira: Promise<void> = Promise.resolve();

  return {
    yaz(konular, islem) {
      const buYazma = sira.then(async () => {
        let acik = true;
        const kapaliysaDur = () => {
          if (!acik) throw new Error('Yazıcı, kendi yazma işlemi bittikten sonra kullanıldı.');
        };
        const yazici: Yazici = {
          async calistir(sql, params = []) {
            kapaliysaDur();
            await db.runAsync(sql, params);
          },
          hepsi(sql, params = []) {
            kapaliysaDur();
            return db.getAllAsync(sql, params);
          },
          ilk(sql, params = []) {
            kapaliysaDur();
            return db.getFirstAsync(sql, params);
          },
        };
        try {
          await db.withTransactionAsync(() => islem(yazici));
        } finally {
          acik = false;
        }
      });
      sira = buYazma.catch(() => undefined);
      return buYazma.then(() => yayin.duyur(konular));
    },
  };
}
