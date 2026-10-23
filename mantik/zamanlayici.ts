// Zamanlayıcı (pilot 23 Ekim; eski adı "Süre sonra"): saniyesiyle kurulan, bir
// kez çalan anımsatıcı. Çalışırken saniye saniye geri sayar; duraklatılır,
// sürdürülür, bir dakika uzatılır, iptal edilir.
//
// Kayıt bir `animsatici` satırıdır: `bitis` çalacağı an, `toplamMs` halkanın
// dolması için toplam süre (uzatınca büyür), `duraklama` duraklatılmışsa kalan
// süre (ms). Duraklatılmış zamanlayıcı hiçbir güne düşmez: bildirimi ve alarmı
// kurulmaz, "Şimdi çalıyor" olmaz.

import type { Animsatici } from './animsatici';

/** Hazır süreler (dakika). */
export const ZAMANLAYICI_SURELERI = [1, 3, 5, 10, 15, 30] as const;
export const VARSAYILAN_ZAMANLAYICI_MS = 5 * 60_000;
/** Tekerlekte en çok 23 sa 59 dk 59 sn. */
export const EN_UZUN_ZAMANLAYICI_MS = (24 * 3600 - 1) * 1000;
/** "+1 dk". */
export const UZATMA_MS = 60_000;
/** Zamanlayıcıda alarmın ertelemesi (dakika). */
export const ZAMANLAYICI_ERTELEME = 5;

export type ZamanlayiciAlanlari = Pick<Animsatici, 'bitis' | 'toplamMs' | 'duraklama'>;

export interface SureParcalari {
  sa: number;
  dk: number;
  sn: number;
}

export function sureParcala(ms: number): SureParcalari {
  const t = Math.max(0, Math.round(ms / 1000));
  return { sa: Math.floor(t / 3600), dk: Math.floor((t % 3600) / 60), sn: t % 60 };
}

export function sureBirlestir({ sa, dk, sn }: SureParcalari): number {
  return Math.min(EN_UZUN_ZAMANLAYICI_MS, ((sa * 60 + dk) * 60 + sn) * 1000);
}

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
  const { sa, dk, sn } = sureParcala(ms);
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

/** Halkanın dolan kısmı (0…1); toplam süre bilinmiyorsa (eski kayıt) null. */
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

/** "Bitiş 10:05" / "Duraklatıldı" / "Süre doldu". */
export function zamanlayiciAltMetni(a: ZamanlayiciAlanlari & Pick<Animsatici, 'saatler'>, simdiMs: number): string {
  if (duraklatildiMi(a)) return 'Duraklatıldı';
  if (kalanMs(a, simdiMs) <= 0) return 'Süre doldu';
  return `Bitiş ${a.saatler[0] ?? ''}`;
}
