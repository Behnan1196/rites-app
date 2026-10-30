// Zamanlayıcı (pilot 23 Ekim; eski adı "Süre sonra"): saniyesiyle kurulan, bir
// kez çalan anımsatıcı. Çalışırken saniye saniye geri sayar; duraklatılır,
// sürdürülür, bir dakika uzatılır, iptal edilir.
//
// Kayıt bir `animsatici` satırıdır: `bitis` çalacağı an, `toplamMs` halkanın
// dolması için toplam süre (uzatınca büyür), `duraklama` duraklatılmışsa kalan
// süre (ms). Duraklatılmış zamanlayıcı hiçbir güne düşmez: bildirimi ve alarmı
// kurulmaz, "Şimdi çalıyor" olmaz.

import type { Animsatici } from './animsatici';

/** İlk açılışta gelen süre. */
export const VARSAYILAN_ZAMANLAYICI_DK = 5;
/** P-70: 1 saat sınırı kalktı; en çok 23:59:59. */
export const ZAMANLAYICI_EN_COK_MS = (24 * 3600 - 1) * 1000;
/** Zamanlayıcıda ertele (dakika; yalnız alarmda; P-31). */
export const ZAMANLAYICI_ERTELEME = 1;

export type ZamanlayiciAlanlari = Pick<Animsatici, 'bitis' | 'toplamMs' | 'duraklama'>;

const iki = (n: number) => String(n).padStart(2, '0');

/** Geri sayım: "05:00", "00:09", "1:05:00". Saniye yukarı yuvarlanır (00:00 yalnız bitince). */
export function geriSayimMetni(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const sa = Math.floor(t / 3600);
  const dk = Math.floor((t % 3600) / 60);
  const sn = t % 60;
  return sa > 0 ? `${sa}:${iki(dk)}:${iki(sn)}` : `${iki(dk)}:${iki(sn)}`;
}

/** Ekran okuyucu ve varsayılan ad için: "5 dk", "1 sa 30 dk", "45 sn", "2 dk 30 sn". */
export function zamanlayiciSuresiMetni(ms: number): string {
  const t = Math.max(0, Math.round(ms / 1000));
  const sa = Math.floor(t / 3600);
  const dk = Math.floor((t % 3600) / 60);
  const sn = t % 60;
  const parca: string[] = [];
  if (sa) parca.push(`${sa} sa`);
  if (dk) parca.push(`${dk} dk`);
  if (sn) parca.push(`${sn} sn`);
  return parca.join(' ') || '0 sn';
}

export function duraklatildiMi(a: Pick<Animsatici, 'duraklama'>): boolean {
  return a.duraklama !== null && a.duraklama !== undefined;
}

/** Kalan süre (ms, en az 0). */
export function kalanMs(a: ZamanlayiciAlanlari, simdiMs: number): number {
  if (duraklatildiMi(a)) return Math.max(0, a.duraklama!);
  if (!a.bitis) return 0;
  return Math.max(0, new Date(a.bitis).getTime() - simdiMs);
}

/** Geçen kısım (0…1); toplam süre bilinmiyorsa (eski kayıt) null. Halka kalanı (1 − bu) gösterir. */
export function ilerleme(a: ZamanlayiciAlanlari, simdiMs: number): number | null {
  if (!a.toplamMs || a.toplamMs <= 0) return null;
  return Math.min(1, Math.max(0, 1 - kalanMs(a, simdiMs) / a.toplamMs));
}

/** Giriş'te ve listede satırı görünsün mü: duraklatılmış ya da henüz bitmemiş. */
export function zamanlayiciSurerMi(a: Pick<Animsatici, 'bitis' | 'duraklama'>, simdiMs: number): boolean {
  if (!a.bitis) return false;
  return duraklatildiMi(a) || new Date(a.bitis).getTime() > simdiMs;
}

/**
 * Bitiş anı (ISO) ve saat ("SS:dd"). Saat, bildirim / alarm / bugünün durumu için
 * anımsatıcının kendi saatidir.
 */
export function bitisHesapla(simdiMs: number, kalan: number): { bitis: string; saat: string } {
  const d = new Date(simdiMs + kalan);
  return { bitis: d.toISOString(), saat: `${iki(d.getHours())}:${iki(d.getMinutes())}` };
}

/** "Duraklatıldı" / "Süre doldu"; çalışırken boş (bitiş saati yazılmaz; P-31). */
export function zamanlayiciAltMetni(a: ZamanlayiciAlanlari, simdiMs: number): string {
  if (duraklatildiMi(a)) return 'Duraklatıldı';
  if (kalanMs(a, simdiMs) <= 0) return 'Süre doldu';
  return '';
}

// ---- Giriş'teki tek zamanlayıcının ayarı (P-42, P-70) --------------------------------

/**
 * Giriş'te tek zamanlayıcı vardır; ayarları ⚙'den: nasıl çalsın (alarm / bildirim), ses.
 * Son kurulan süre hatırlanır. P-70: yalnız dijital (kadran kalktı; eski `gorunum` okunmaz).
 */
export interface ZamanlayiciAyari {
  cal: 'alarm' | 'bildirim';
  /** `mantik/sesler` adı; null: telefonun sesi. */
  ses: string | null;
  /** Son kurulan süre (ms); açılınca bu gelir. */
  sonMs: number;
}

export const VARSAYILAN_ZAMANLAYICI: ZamanlayiciAyari = {
  cal: 'alarm',
  ses: null,
  sonMs: VARSAYILAN_ZAMANLAYICI_DK * 60_000,
};

/** Saklı ayar → geçerli ayar (eksik / bozuk alan varsayılana döner). */
export function zamanlayiciAyariCoz(x: unknown): ZamanlayiciAyari {
  const a = (x && typeof x === 'object' ? x : {}) as Partial<Record<keyof ZamanlayiciAyari, unknown>>;
  const v = VARSAYILAN_ZAMANLAYICI;
  const ms = typeof a.sonMs === 'number' && Number.isFinite(a.sonMs) ? Math.round(a.sonMs / 1000) * 1000 : v.sonMs;
  return {
    cal: a.cal === 'bildirim' ? 'bildirim' : 'alarm',
    ses: typeof a.ses === 'string' && a.ses ? a.ses : null,
    sonMs: ms >= 1000 && ms <= ZAMANLAYICI_EN_COK_MS ? ms : v.sonMs,
  };
}

/** Çarkların saat, dakika ve saniyesi → ms (en çok 23:59:59). */
export function parcalardanMs(sa: number, dk: number, sn: number): number {
  const t = Math.max(0, sa) * 3600 + Math.max(0, dk) * 60 + Math.max(0, sn);
  return Math.min(ZAMANLAYICI_EN_COK_MS, t * 1000);
}

/** ms → çarkların saat, dakika ve saniyesi. */
export function sureParcalari(ms: number): { sa: number; dk: number; sn: number } {
  const t = Math.round(Math.max(0, Math.min(ZAMANLAYICI_EN_COK_MS, ms)) / 1000);
  return { sa: Math.floor(t / 3600), dk: Math.floor((t % 3600) / 60), sn: t % 60 };
}

/** Bildirimin çaldıktan sonra kalan bu kadar beklenir (telefonun saati ile aradaki pay). */
const BITIS_PAYI_MS = 5000;

/**
 * P-70: bildirimle çalan zamanlayıcı bir kez çalar ve kendiliğinden biter (ertelemesi yok,
 * "Şimdi çalıyor" olmaz): süresi geçmiş olanlar silinir. Alarmlı olan durdurulana kadar kalır.
 */
export function bitenBildirimZamanlayicilari(
  animsaticilar: readonly Pick<Animsatici, 'id' | 'bitis' | 'alarm' | 'duraklama'>[],
  simdiMs: number,
): string[] {
  return animsaticilar
    .filter(
      (a) => !!a.bitis && !a.alarm && !duraklatildiMi(a) && new Date(a.bitis).getTime() + BITIS_PAYI_MS <= simdiMs,
    )
    .map((a) => a.id);
}

/** Bildirimle çalan zamanlayıcı mı (Giriş'te "Şimdi çalıyor" olmaz). */
export function bildirimliZamanlayiciMi(a: Pick<Animsatici, 'bitis' | 'alarm'>): boolean {
  return !!a.bitis && !a.alarm;
}
