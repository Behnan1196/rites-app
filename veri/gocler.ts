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
  {
    // Kartlar, blokları ve günlük kayıtları (`03`).
    surum: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS kart (
        id           TEXT PRIMARY KEY NOT NULL,
        baslik       TEXT NOT NULL,
        kisa         TEXT NOT NULL DEFAULT '',
        tarih        TEXT,
        tarihsiz     INTEGER NOT NULL DEFAULT 0,
        saat         TEXT,
        hatirlatma   TEXT,
        tekrar       TEXT,
        bitis        TEXT,
        atlanan      TEXT NOT NULL DEFAULT '[]',
        plan_id      TEXT,
        kaynak       TEXT NOT NULL DEFAULT 'kendim',
        gelen_kimden TEXT,
        kilitli      INTEGER NOT NULL DEFAULT 0,
        yapildi      INTEGER NOT NULL DEFAULT 0,
        birakildi    INTEGER NOT NULL DEFAULT 0,
        sira         REAL NOT NULL DEFAULT 0,
        olusturma    TEXT NOT NULL,
        guncelleme   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS kart_tarih ON kart (tarih);
      CREATE TABLE IF NOT EXISTS blok (
        id       TEXT PRIMARY KEY NOT NULL,
        kart_id  TEXT NOT NULL REFERENCES kart (id) ON DELETE CASCADE,
        sira     INTEGER NOT NULL,
        tur      TEXT NOT NULL,
        ad       TEXT NOT NULL DEFAULT '',
        metin    TEXT NOT NULL DEFAULT '',
        birim    TEXT NOT NULL DEFAULT '',
        dakika   INTEGER,
        maddeler TEXT NOT NULL DEFAULT '[]',
        dosya    TEXT
      );
      CREATE INDEX IF NOT EXISTS blok_kart ON blok (kart_id, sira);
      CREATE TABLE IF NOT EXISTS kayit (
        kart_id   TEXT NOT NULL REFERENCES kart (id) ON DELETE CASCADE,
        tarih     TEXT NOT NULL,
        yapildi   INTEGER NOT NULL DEFAULT 0,
        degerler  TEXT NOT NULL DEFAULT '{}',
        isaretler TEXT NOT NULL DEFAULT '{}',
        fotolar   TEXT NOT NULL DEFAULT '{}',
        PRIMARY KEY (kart_id, tarih)
      );
      CREATE INDEX IF NOT EXISTS kayit_tarih ON kayit (tarih);
    `,
  },
  {
    // Notlar (`03` → not).
    surum: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS "not" (
        id        TEXT PRIMARY KEY NOT NULL,
        metin     TEXT NOT NULL,
        sesli     INTEGER NOT NULL DEFAULT 0,
        ses_yolu  TEXT,
        sira      REAL NOT NULL,
        olusturma TEXT NOT NULL
      );
    `,
  },
  {
    // Planlar, alan durumları ve Günün sorusu cevapları (`03` → plan, alan_durumu, soru_cevap).
    surum: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS plan (
        id              TEXT PRIMARY KEY NOT NULL,
        ad              TEXT NOT NULL,
        alan            TEXT NOT NULL,
        kaynak          TEXT NOT NULL DEFAULT 'kendim',
        neden           TEXT NOT NULL DEFAULT '',
        hedef           TEXT NOT NULL DEFAULT '',
        baslangic       TEXT NOT NULL,
        bitis           TEXT,
        baslangic_puani INTEGER NOT NULL DEFAULT 0,
        gunun_sorusu    TEXT,
        durum           TEXT NOT NULL DEFAULT 'etkin',
        olusturma       TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS kart_plan ON kart (plan_id);
      CREATE TABLE IF NOT EXISTS alan_durumu (
        alan      TEXT PRIMARY KEY NOT NULL,
        acik      INTEGER NOT NULL,
        puan      INTEGER NOT NULL DEFAULT 0,
        ilerlemek INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS soru_cevap (
        plan_id TEXT NOT NULL REFERENCES plan (id) ON DELETE CASCADE,
        tarih   TEXT NOT NULL,
        deger   INTEGER NOT NULL,
        PRIMARY KEY (plan_id, tarih)
      );
    `,
  },
  {
    // Anımsatıcılar ve yalnız bugünün durumları (`03` → animsatici, animsatici_gun).
    surum: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS animsatici (
        id        TEXT PRIMARY KEY NOT NULL,
        ad        TEXT NOT NULL,
        saatler   TEXT NOT NULL,
        gunler    TEXT NOT NULL DEFAULT 'hergun',
        sesli     INTEGER NOT NULL DEFAULT 1,
        ertele_dk INTEGER NOT NULL DEFAULT 10,
        olusturma TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS animsatici_gun (
        animsatici_id  TEXT NOT NULL REFERENCES animsatici (id) ON DELETE CASCADE,
        tarih          TEXT NOT NULL,
        saat           TEXT NOT NULL,
        durum          TEXT,
        ertelenen_saat TEXT,
        PRIMARY KEY (animsatici_id, tarih, saat)
      );
    `,
  },
  {
    // Kişilerim: kişinin verdiği adlarla telefondaki adres defteri (`03` → kisi).
    surum: 6,
    sql: `
      CREATE TABLE IF NOT EXISTS kisi (
        id           TEXT PRIMARY KEY NOT NULL,
        ad           TEXT NOT NULL,
        eposta       TEXT NOT NULL UNIQUE,
        kullanici_id TEXT,
        durum        TEXT NOT NULL,
        ben_ekledim  INTEGER NOT NULL DEFAULT 1,
        olusturma    TEXT NOT NULL
      );
    `,
  },
  {
    // Kütüphanem: kartın ya da planın kayıtsız kopyası, etiketleriyle (`03` → kutuphane).
    surum: 7,
    sql: `
      CREATE TABLE IF NOT EXISTS kutuphane (
        id             TEXT PRIMARY KEY NOT NULL,
        tur            TEXT NOT NULL,
        baslik         TEXT NOT NULL,
        alanlar        TEXT NOT NULL DEFAULT '[]',
        etiket_tur     TEXT NOT NULL,
        kaynak         TEXT NOT NULL,
        paylasilabilir INTEGER NOT NULL DEFAULT 1,
        icerik         TEXT NOT NULL,
        olusturma      TEXT NOT NULL
      );
    `,
  },
  {
    // Alarm olarak çalan anımsatıcı (iOS 26 AlarmKit; pilot 14 Ekim).
    surum: 8,
    sql: `ALTER TABLE animsatici ADD COLUMN alarm INTEGER NOT NULL DEFAULT 0;`,
  },
  {
    // Pilot 16 Ekim: başka uygulamadan paylaşılan bağlantılar Gelenler'de bekler;
    // ajanda kartının hatırlatması alarm olarak çalabilir.
    surum: 9,
    sql: `
      CREATE TABLE IF NOT EXISTS paylasilan (
        id        TEXT PRIMARY KEY NOT NULL,
        baslik    TEXT NOT NULL,
        adres     TEXT NOT NULL,
        olusturma TEXT NOT NULL
      );
      ALTER TABLE kart ADD COLUMN alarm INTEGER NOT NULL DEFAULT 0;
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
