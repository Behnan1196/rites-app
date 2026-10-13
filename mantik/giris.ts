// Giriş ekranı için saf yardımcılar.

import type { Kart } from './kart';

/**
 * Bugün sırada (G-8): bugün görünen, yapılmamış kartlardan saati şimdiden
 * sonra olan ilki; yoksa listedeki ilk yapılmamış. `kartlar` günün sırasıyla
 * (saat sırası, saatsizler sonda) verilir. `kalan`: bu karttan başka kaç yapılmamış iş var.
 */
export function siradaki<T extends Kart>(
  kartlar: readonly T[],
  yapilanlar: ReadonlySet<string>,
  simdiSaat: string,
): { kart: T; kalan: number } | null {
  const acik = kartlar.filter((k) => !yapilanlar.has(k.id));
  const kart = acik.find((k) => k.saat !== null && k.saat > simdiSaat) ?? acik[0];
  return kart ? { kart, kalan: acik.length - 1 } : null;
}

/** "Bugün 4 iş daha var" / "Bugünün son işi" */
export function kalanIsMetni(kalan: number): string {
  return kalan > 0 ? `Bugün ${kalan} iş daha var` : 'Bugünün son işi';
}

/** Bir öğeyi listede başka bir yere taşır (sürükleyerek sıralama). */
export function yerDegistir<T>(liste: readonly T[], nereden: number, nereye: number): T[] {
  const sonuc = [...liste];
  const [oge] = sonuc.splice(nereden, 1);
  if (oge === undefined) return [...liste];
  sonuc.splice(Math.max(0, Math.min(nereye, sonuc.length)), 0, oge);
  return sonuc;
}

/** Notlar açıkken Giriş'te görünen en yeni notlar (G-2). */
export function enYeniNotlar<T extends { olusturma: string }>(notlar: readonly T[], adet = 2): T[] {
  return [...notlar].sort((a, b) => b.olusturma.localeCompare(a.olusturma)).slice(0, adet);
}

// ---- Giriş kutuları (G-7, `05` §10) -------------------------------------------

export type KutuAnahtari = 'not' | 'gelenler' | 'bugun' | 'animsatici' | 'devam' | 'soru' | 'su' | 'ortak';

export interface KutuAyari {
  k: KutuAnahtari;
  acik: boolean;
}

export interface KutuTanimi {
  k: KutuAnahtari;
  ad: string;
  aciklama: string;
  /** Kutunun kendisi yazıldı mı? Yazılmamış kutu ayarda da görünmez. */
  hazir: boolean;
}

/** Varsayılan sıra (`02`); hepsi açık. */
export const KUTULAR: readonly KutuTanimi[] = [
  { k: 'not', ad: 'Hızlı Not', aciklama: 'Kapatırsan notların Ajandam’dan açılır', hazir: true },
  { k: 'gelenler', ad: 'Gelenler', aciklama: 'Sana gönderilen kartlar', hazir: true },
  { k: 'bugun', ad: 'Bugün sırada', aciklama: 'Ajandandaki sıradaki iş', hazir: true },
  { k: 'animsatici', ad: 'Anımsatıcılar', aciklama: 'Sıradaki anımsatma', hazir: true },
  { k: 'devam', ad: 'Devam edenler', aciklama: 'Süren planların', hazir: true },
  { k: 'soru', ad: 'Günün sorusu', aciklama: 'Planında soru varsa görünür', hazir: true },
  { k: 'su', ad: 'Su', aciklama: 'Yarım kutu · günlük bardak sayacı', hazir: false },
  { k: 'ortak', ad: 'Ortak Listeler', aciklama: 'Yarım kutu · başkalarıyla listeler', hazir: false },
];

export const GIRIS_AYARI_ACIKLAMASI = "Okla sırasını değiştir, düğmeyle aç ya da kapat. Kapattığın kutu silinmez, yalnız Giriş'ten kalkar.";

/**
 * Kayıtlı ayar ile bilinen kutuları birleştirir: bilinmeyenler atılır, kayıtta
 * olmayan yeni kutu türleri sıranın sonuna açık olarak eklenir (`05` §10).
 */
export function kutuSirasi(kayitli: readonly KutuAyari[] | null): KutuAyari[] {
  const bilinen = new Set(KUTULAR.map((t) => t.k));
  const sonuc: KutuAyari[] = [];
  for (const a of kayitli ?? []) {
    if (bilinen.has(a.k) && !sonuc.some((x) => x.k === a.k)) sonuc.push({ k: a.k, acik: a.acik });
  }
  for (const t of KUTULAR) if (!sonuc.some((x) => x.k === t.k)) sonuc.push({ k: t.k, acik: true });
  return sonuc;
}

/** Ayar ekranında görünen (yazılmış) kutular, sırasıyla. */
export function hazirKutular(sira: readonly KutuAyari[]): KutuAyari[] {
  return sira.filter((a) => KUTULAR.find((t) => t.k === a.k)?.hazir);
}

/**
 * Ayar ekranında ↑ ↓: görünen listede bir komşuyla yer değiştirir. Arada
 * görünmeyen (henüz yazılmamış) kutular yerinde kalır.
 */
export function kutuTasi(sira: readonly KutuAyari[], k: KutuAnahtari, yon: -1 | 1): KutuAyari[] {
  const gorunen = hazirKutular(sira).map((a) => a.k);
  const i = gorunen.indexOf(k);
  const j = i + yon;
  if (i < 0 || j < 0 || j >= gorunen.length) return [...sira];
  const komsu = gorunen[j]!;
  const a = sira.findIndex((x) => x.k === k);
  const b = sira.findIndex((x) => x.k === komsu);
  const yeni = [...sira];
  [yeni[a], yeni[b]] = [yeni[b]!, yeni[a]!];
  return yeni;
}

export function kutuAcikMi(sira: readonly KutuAyari[], k: KutuAnahtari): boolean {
  return sira.find((a) => a.k === k)?.acik ?? true;
}
