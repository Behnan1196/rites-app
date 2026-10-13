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
  'plan',
  'alan_durumu',
  'soru_cevap',
  'animsatici',
  'animsatici_gun',
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

/** Açılışta bir kez: son yedek 7 günden eskiyse sorulur (`10` madde 10). */
export function yedekSorusu(sonYedek: Gun | null, bugunGun: Gun): string | null {
  if (!sonYedek) return null;
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
