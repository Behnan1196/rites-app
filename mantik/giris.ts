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

/** Giriş'te görünen iğneli notların en çok sayısı (pilot 21 Ekim). */
export const IGNELI_EN_COK = 3;

/**
 * Giriş'teki notlar (pilot 21 Ekim; eskiden en yeni iki not): yalnız iğnelenenler,
 * Notlar'daki sırasıyla; en çok 3, fazlası sayılır.
 */
export function igneliNotlar<T extends { igneli: boolean }>(
  notlar: readonly T[],
  adet = IGNELI_EN_COK,
): { gosterilen: T[]; fazla: number } {
  const igneli = notlar.filter((n) => n.igneli);
  return { gosterilen: igneli.slice(0, adet), fazla: Math.max(0, igneli.length - adet) };
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
  { k: 'not', ad: 'Hızlı Not', aciklama: 'Notların; kapatırsan buradan yeniden açarsın', hazir: true },
  { k: 'gelenler', ad: 'Gelenler', aciklama: 'Sana gönderilenler ve gruplarından yanıt bekleyenler', hazir: true },
  { k: 'bugun', ad: 'Bugün sırada', aciklama: 'Ajandandaki sıradaki iş', hazir: true },
  { k: 'animsatici', ad: 'Anımsatıcılar', aciklama: 'Sıradaki anımsatma', hazir: true },
  { k: 'devam', ad: 'Devam edenler', aciklama: 'Uyguladığın programlar', hazir: true },
  // Pilot 20 Ekim: Günün sorusu planla birlikte kalktı (ayarda da görünmez).
  { k: 'soru', ad: 'Günün sorusu', aciklama: '', hazir: false },
  { k: 'su', ad: 'Su', aciklama: 'Yarım kutu · günlük bardak sayacı', hazir: false },
  // Pilot 19 Ekim: listelerin yeri grup; kutu kalktı (ayarda da görünmez).
  { k: 'ortak', ad: 'Ortak Listeler', aciklama: 'Yarım kutu · başkalarıyla listeler', hazir: false },
];

/** Yarım kutular (`05` §10). */
export const YARIM_KUTULAR: ReadonlySet<KutuAnahtari> = new Set(['su', 'ortak']);

/**
 * Giriş'in satırları: tam kutu tek başına; arka arkaya gelen iki yarım kutu yan yana;
 * tek kalan yarım kutu satırı doldurur.
 */
export function kutuSatirlari(kutular: readonly KutuAnahtari[]): KutuAnahtari[][] {
  const satirlar: KutuAnahtari[][] = [];
  for (const k of kutular) {
    const son = satirlar[satirlar.length - 1];
    if (YARIM_KUTULAR.has(k) && son && son.length === 1 && YARIM_KUTULAR.has(son[0]!)) son.push(k);
    else satirlar.push([k]);
  }
  return satirlar;
}

export const GIRIS_AYARI_ACIKLAMASI =
  "Sırasını değiştirmek için satıra uzun basıp sürükle; düğmeyle aç ya da kapat. Kapattığın kutu silinmez, yalnız Giriş'ten kalkar.";

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

/**
 * Sürükleyerek sıralama (pilot 21 Ekim): görünen kutuların yeni sırası; görünmeyen
 * (henüz yazılmamış) kutular yerinde kalır, görünenler kendi yerlerine yeni sırayla oturur.
 */
export function kutulariSirala(sira: readonly KutuAyari[], gorunenYeniSira: readonly KutuAnahtari[]): KutuAyari[] {
  const gorunen = new Set(hazirKutular(sira).map((a) => a.k));
  const kuyruk = gorunenYeniSira.filter((k) => gorunen.has(k));
  if (kuyruk.length !== gorunen.size) return [...sira];
  let i = 0;
  return sira.map((a) => {
    if (!gorunen.has(a.k)) return a;
    const k = kuyruk[i++];
    return { ...sira.find((x) => x.k === k)! };
  });
}

export function kutuAcikMi(sira: readonly KutuAyari[], k: KutuAnahtari): boolean {
  return sira.find((a) => a.k === k)?.acik ?? true;
}
