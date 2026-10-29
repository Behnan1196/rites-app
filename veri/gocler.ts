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
  {
    // "Proje adımları" bloğunun kalıcı durumu (JSON; pilot 16 Ekim).
    surum: 10,
    sql: `ALTER TABLE blok ADD COLUMN durum TEXT;`,
  },
  {
    // "Süre sonra" anımsatıcısının çalacağı an (ISO; pilot 17 Ekim). Günler artık
    // hafta günü listesi olarak (JSON) yazılır; eski değerler okurken çevrilir.
    surum: 11,
    sql: `ALTER TABLE animsatici ADD COLUMN bitis TEXT;`,
  },
  {
    // Ajanda elle sıralanır (pilot 17 Ekim): görünen sıra (önce saatliler saatine
    // göre, sonra saatsizler) korunarak kartlar 1, 2, 3… diye numaralanır.
    surum: 12,
    sql: `
      UPDATE kart SET sira = (
        SELECT COUNT(*) FROM kart k2
        WHERE COALESCE(k2.saat, '99:99') < COALESCE(kart.saat, '99:99')
           OR (COALESCE(k2.saat, '99:99') = COALESCE(kart.saat, '99:99') AND k2.sira < kart.sira)
           OR (COALESCE(k2.saat, '99:99') = COALESCE(kart.saat, '99:99') AND k2.sira = kart.sira AND k2.id < kart.id)
      ) + 1;
    `,
  },
  {
    // Grup etkinliğinden gelen kart (pilot 18 Ekim, Buluşma): etkinliğe bağ.
    surum: 13,
    sql: `ALTER TABLE kart ADD COLUMN bag TEXT;`,
  },
  {
    // Anımsatıcının bildirim sesi (pilot 19 Ekim); null: telefonun sesi.
    surum: 14,
    sql: `ALTER TABLE animsatici ADD COLUMN ses TEXT;`,
  },
  {
    // Planlar yerine Programlar (pilot 20 Ekim). Ürün sahibinin kararıyla pilottaki
    // planlar, kartları ve kütüphanedeki plan kopyaları silinir. Kartın `plan_id`si
    // artık programı gösterir. Kişi kendi alanını ekleyebilir (`alan_durumu.ad`).
    surum: 15,
    sql: `
      DELETE FROM kayit WHERE kart_id IN (SELECT id FROM kart WHERE plan_id IS NOT NULL);
      DELETE FROM blok WHERE kart_id IN (SELECT id FROM kart WHERE plan_id IS NOT NULL);
      DELETE FROM kart WHERE plan_id IS NOT NULL;
      DELETE FROM kutuphane WHERE tur = 'plan';
      DROP TABLE IF EXISTS soru_cevap;
      DROP TABLE IF EXISTS plan;
      CREATE TABLE IF NOT EXISTS program (
        id            TEXT PRIMARY KEY NOT NULL,
        ad            TEXT NOT NULL,
        alanlar       TEXT NOT NULL DEFAULT '[]',
        neden         TEXT NOT NULL DEFAULT '',
        sure          INTEGER,
        durum         TEXT NOT NULL DEFAULT 'hazir',
        baslangic     TEXT,
        yildiz        INTEGER NOT NULL DEFAULT 0,
        degerlendirme TEXT NOT NULL DEFAULT '',
        kaynak        TEXT NOT NULL DEFAULT 'Kendim',
        olusturma     TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS program_kart (
        id         TEXT PRIMARY KEY NOT NULL,
        program_id TEXT NOT NULL REFERENCES program (id) ON DELETE CASCADE,
        sira       REAL NOT NULL DEFAULT 0,
        gun        INTEGER NOT NULL DEFAULT 0,
        baslik     TEXT NOT NULL,
        kisa       TEXT NOT NULL DEFAULT '',
        saat       TEXT,
        hatirlatma TEXT,
        alarm      INTEGER NOT NULL DEFAULT 0,
        tekrar     TEXT,
        bloklar    TEXT NOT NULL DEFAULT '[]'
      );
      CREATE INDEX IF NOT EXISTS program_kart_program ON program_kart (program_id, gun, sira);
      ALTER TABLE alan_durumu ADD COLUMN ad TEXT;
      ALTER TABLE alan_durumu ADD COLUMN aciklama TEXT NOT NULL DEFAULT '';
      ALTER TABLE alan_durumu ADD COLUMN sira REAL NOT NULL DEFAULT 0;
    `,
  },
  {
    // İğneli notlar Giriş'te görünür (pilot 21 Ekim).
    surum: 16,
    sql: `ALTER TABLE "not" ADD COLUMN igneli INTEGER NOT NULL DEFAULT 0;`,
  },
  {
    // Zamanlayıcı (pilot 23 Ekim): halka için toplam süre, duraklatılınca kalan süre (ms).
    surum: 17,
    sql: `ALTER TABLE animsatici ADD COLUMN toplam_ms INTEGER;
          ALTER TABLE animsatici ADD COLUMN duraklama INTEGER;`,
  },
  {
    // Kartın alarm sesi (pilot 23 Ekim, P-33).
    surum: 18,
    sql: `ALTER TABLE kart ADD COLUMN alarm_sesi TEXT;
          ALTER TABLE program_kart ADD COLUMN alarm_sesi TEXT;`,
  },
  {
    // Tekrarlı kartta seri sayılsın mı (pilot 24 Ekim, P-35): 1 / 0; NULL: kural.
    surum: 19,
    sql: `ALTER TABLE kart ADD COLUMN seri_say INTEGER;`,
  },
  {
    // Kartın isimli çeşidi (pilot 24 Ekim, P-41): `KartCesidi.id`; NULL: çeşitsiz.
    surum: 20,
    sql: `ALTER TABLE kart ADD COLUMN cesit TEXT;`,
  },
  {
    // Programın kartının isimli çeşidi (pilot 25 Ekim, P-45); ajandaya geçen karta da geçer.
    surum: 21,
    sql: `ALTER TABLE program_kart ADD COLUMN cesit TEXT;`,
  },
  {
    // Listelerim (pilot 27 Ekim, P-58): kişinin telefondaki listeleri ve maddeleri.
    surum: 22,
    sql: `CREATE TABLE yerel_liste (
            id         TEXT PRIMARY KEY,
            ad         TEXT NOT NULL,
            aciklama   TEXT NOT NULL DEFAULT '',
            sira       REAL NOT NULL DEFAULT 0,
            olusturma  TEXT NOT NULL
          );
          CREATE TABLE yerel_madde (
            id       TEXT PRIMARY KEY,
            liste    TEXT NOT NULL REFERENCES yerel_liste(id) ON DELETE CASCADE,
            metin    TEXT NOT NULL,
            yapildi  INTEGER NOT NULL DEFAULT 0,
            tarih    TEXT,
            sira     REAL NOT NULL DEFAULT 0
          );
          CREATE INDEX yerel_madde_liste ON yerel_madde (liste, sira);
          CREATE INDEX yerel_madde_tarih ON yerel_madde (tarih);`,
  },
  {
    // Liste çeşitleri (pilot 29 Ekim, P-61): yapilacak · alisveris · hazirlik · not; madde miktarı.
    surum: 23,
    sql: `ALTER TABLE yerel_liste ADD COLUMN cesit TEXT NOT NULL DEFAULT 'yapilacak';
          ALTER TABLE yerel_madde ADD COLUMN miktar TEXT NOT NULL DEFAULT '';`,
  },
  {
    // Görünümde sabit alanlar (pilot 29 Ekim, P-65): parça (`blok.sabit`) ve kart (`kart.sabitler`, JSON).
    surum: 24,
    sql: `ALTER TABLE blok ADD COLUMN sabit INTEGER NOT NULL DEFAULT 0;
          ALTER TABLE kart ADD COLUMN sabitler TEXT;`,
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
export async function gocleriUygula(db: HamVeriTabani, gocler: readonly Goc[] = GOCLER): Promise<number> {
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
