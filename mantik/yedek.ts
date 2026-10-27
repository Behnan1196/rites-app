// Yedek (PR-2, `10` madde 10): tek dosya, parolasız; kişinin kendi bulutuna
// paylaşım sayfasıyla kaydedilir, dosya seçiciyle geri yüklenir.

import { gunFarki, kisaTarih, type Gun } from './tarih';

export const YEDEK_BICIMI = 'rites-yedek';

export const YEDEK_ACIKLAMASI =
  "Ajandan, notların ve kütüphanen bu telefonda duruyor. Telefon kaybolursa ya da değişirse geri almak için kendi bulutuna yedek al. Yedek Rites'a gitmez.";

/** Yedeğe giren tablolar; geri yüklemede bu sırayla yazılır (önce üst tablolar). */
export const YEDEK_TABLOLARI = [
  'ayar',
  'kart',
  'blok',
  'kayit',
  'not',
  'program',
  'program_kart',
  'alan_durumu',
  'animsatici',
  'animsatici_gun',
  'kisi',
  'kutuphane',
  'paylasilan',
  'yerel_liste',
  'yerel_madde',
] as const;

export type Satir = Record<string, string | number | null>;

export interface YedekDosyasi {
  bicim: typeof YEDEK_BICIMI;
  /** Veritabanı sürümü (göç numarası). */
  surum: number;
  olusturma: string;
  /** Yedeği alan telefondaki dosya klasörünün adresi (geri yüklemede yollar çevrilir). */
  dosyaKlasoru: string;
  tablolar: Record<string, Satir[]>;
  /** Dosya adı → base64 içerik (fotoğraf, ses, belge). */
  dosyalar: Record<string, string>;
}

/** "rites-yedek-2026-10-13.json" */
export function yedekDosyaAdi(gun: Gun): string {
  return `${YEDEK_BICIMI}-${gun}.json`;
}

/** "Son yedek: 13 Ekim (bugün)" · "Henüz yedek almadın." */
export function sonYedekMetni(sonYedek: Gun | null, bugunGun: Gun): string {
  if (!sonYedek) return 'Henüz yedek almadın.';
  const fark = gunFarki(sonYedek, bugunGun);
  const ek = fark === 0 ? 'bugün' : fark === 1 ? 'dün' : `${fark} gün önce`;
  return `Son yedek: ${kisaTarih(sonYedek)} (${ek})`;
}

/**
 * Açılışta bir kez: son yedek 7 günden eskiyse sorulur (`10` madde 10). Hiç
 * yedek yoksa ilk açılıştan 7 gün sonra sorulur (ürün sahibinin onayı, 13 Ekim).
 */
export function yedekSorusu(sonYedek: Gun | null, ilkAcilis: Gun | null, bugunGun: Gun): string | null {
  if (!sonYedek) {
    return ilkAcilis && gunFarki(ilkAcilis, bugunGun) > 7 ? 'Henüz yedeğin yok. Şimdi yedekleyelim mi?' : null;
  }
  const fark = gunFarki(sonYedek, bugunGun);
  return fark > 7 ? `Son yedeğin ${fark} gün önce. Şimdi yedekleyelim mi?` : null;
}

export type YedekSorunu = 'bicim' | 'yeni';

/** Dosya Rites yedeği mi, bu sürüm okuyabilir mi? */
export function yedekSorunu(veri: unknown, buSurum: number): YedekSorunu | null {
  const y = veri as Partial<YedekDosyasi> | null;
  if (!y || y.bicim !== YEDEK_BICIMI || typeof y.surum !== 'number' || typeof y.tablolar !== 'object') return 'bicim';
  if (y.surum > buSurum) return 'yeni';
  return null;
}

export const YEDEK_SORUNU_METNI: Record<YedekSorunu, string> = {
  bicim: 'Bu dosya bir Rites yedeği değil.',
  yeni: "Bu yedek Rites'ın daha yeni bir sürümünden. Önce uygulamayı güncelle.",
};

/** Programlardan önceki (sürüm 15'ten eski) yedekte plan kartları ve onların blok / kayıtları. */
export const PROGRAM_SURUMU = 15;

/**
 * Eski yedekteki plan kartlarını ayıklar (göç 15'teki gibi planlar silinir);
 * yeni yedekte satırlar olduğu gibi kalır.
 */
export function eskiPlanlariAyikla(yedek: Pick<YedekDosyasi, 'surum' | 'tablolar'>): Record<string, Satir[]> {
  if (yedek.surum >= PROGRAM_SURUMU) return yedek.tablolar;
  const planKartlari = new Set(
    (yedek.tablolar.kart ?? []).filter((k) => k.plan_id !== null && k.plan_id !== undefined).map((k) => String(k.id)),
  );
  const t = { ...yedek.tablolar };
  t.kart = (t.kart ?? []).filter((k) => !planKartlari.has(String(k.id)));
  t.blok = (t.blok ?? []).filter((b) => !planKartlari.has(String(b.kart_id)));
  t.kayit = (t.kayit ?? []).filter((r) => !planKartlari.has(String(r.kart_id)));
  t.kutuphane = (t.kutuphane ?? []).filter((k) => k.tur !== 'plan');
  return t;
}

/**
 * Yedekteki dosya yollarını yeni telefonun klasörüne çevirir. Yollar metin
 * alanlarında ve JSON içinde (ör. kayıt fotoğrafları) geçebilir.
 */
export function yollariCevir(satirlar: readonly Satir[], eskiKlasor: string, yeniKlasor: string): Satir[] {
  if (!eskiKlasor || eskiKlasor === yeniKlasor) return satirlar.map((s) => ({ ...s }));
  const eski = eskiKlasor.endsWith('/') ? eskiKlasor : `${eskiKlasor}/`;
  const yeni = yeniKlasor.endsWith('/') ? yeniKlasor : `${yeniKlasor}/`;
  return satirlar.map((s) => {
    const c: Satir = {};
    for (const [k, v] of Object.entries(s)) c[k] = typeof v === 'string' ? v.split(eski).join(yeni) : v;
    return c;
  });
}
