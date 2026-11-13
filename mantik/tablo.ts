// Tablo (pilot 13 Kasım, P-120): Listeler'de 2–5 sütunlu liste (Market fiyatları, Ödünç
// verdiklerim…). Kartın bir parçasıdır (`blok.tur = 'tablo'`).
// P-122: her sütunun türü var: Yazı · Sayı (isteğe bağlı altta toplam) · Tarih · İşaret.
//
// Saklama: `metin` {"sutunlar": [{"ad", "tur", "toplam"?}]}; `maddeler` her satır bir JSON dizi
// (sütun sırasıyla; tarih "YYYY-MM-DD", işaret "1" ya da ""). Eski biçimler okunur: `metin`
// sütun adları dizisi (P-120) ya da {"sutunlar": [adlar], "isaret": true} (P-121; işaret başta
// "Alındı" sütunu olur, işaretli satır {"h": [...], "y": true}).

import { gecerliGunMu, kisaTarih } from './tarih';

export const EN_COK_SUTUN = 5;

export type SutunTuru = 'yazi' | 'sayi' | 'tarih' | 'isaret';

export const SUTUN_TURLERI: readonly { tur: SutunTuru; ad: string }[] = [
  { tur: 'yazi', ad: 'Yazı' },
  { tur: 'sayi', ad: 'Sayı' },
  { tur: 'tarih', ad: 'Tarih' },
  { tur: 'isaret', ad: 'İşaret' },
];

export interface Sutun {
  ad: string;
  tur: SutunTuru;
  /** Sayı sütununda altta toplam. */
  toplam?: boolean;
}

export interface Tablo {
  sutunlar: Sutun[];
  satirlar: string[][];
}

/** P-121'deki "Alındı" kutusunun sütun adı. */
export const ISARET_SUTUNU = 'Alındı';
const ISARETLI = '1';

function json(s: string): unknown {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

const metne = (x: unknown) => (x === null || x === undefined ? '' : String(x));
const nesneMi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const turMu = (x: unknown): x is SutunTuru => x === 'yazi' || x === 'sayi' || x === 'tarih' || x === 'isaret';

function sutunOku(x: unknown): Sutun {
  if (!nesneMi(x)) return { ad: metne(x), tur: 'yazi' };
  const tur = turMu(x.tur) ? x.tur : 'yazi';
  return { ad: metne(x.ad), tur, ...(tur === 'sayi' && x.toplam === true ? { toplam: true } : {}) };
}

/** Parçadan tablo; bozuk satır tek hücreli olur. */
export function tabloOku(b: { metin: string; maddeler: readonly string[] }): Tablo {
  const ust = json(b.metin);
  const ham = nesneMi(ust) ? (Array.isArray(ust.sutunlar) ? ust.sutunlar : []) : Array.isArray(ust) ? ust : [];
  // P-121'in tek işaret kutusu başta bir İşaret sütunu olur.
  const eskiIsaret = nesneMi(ust) && ust.isaret === true;
  const sutunlar = [...(eskiIsaret ? [{ ad: ISARET_SUTUNU, tur: 'isaret' as const }] : []), ...ham.map(sutunOku)].slice(
    0,
    EN_COK_SUTUN,
  );
  if (sutunlar.length === 0) sutunlar.push({ ad: 'Ad', tur: 'yazi' }, { ad: 'Not', tur: 'yazi' });
  const satirlar = b.maddeler.map((m) => {
    const v = json(m);
    const d = nesneMi(v) ? (Array.isArray(v.h) ? v.h : []) : Array.isArray(v) ? v : null;
    const hucreler = d ? d.map(metne) : [m];
    if (eskiIsaret) hucreler.unshift(nesneMi(v) && v.y === true ? ISARETLI : '');
    return sutunlar.map((s, i) => hucreDuzelt(s.tur, hucreler[i] ?? ''));
  });
  return { sutunlar, satirlar };
}

function hucreDuzelt(tur: SutunTuru, h: string): string {
  const t = h.trim();
  if (tur === 'isaret') return t && t !== '0' ? ISARETLI : '';
  return t;
}

/** Tablo parçanın alanlarına. */
export function tabloYaz(t: Tablo): { metin: string; maddeler: string[] } {
  return {
    metin: JSON.stringify({
      sutunlar: t.sutunlar.map((s) => ({
        ad: s.ad,
        tur: s.tur,
        ...(s.tur === 'sayi' && s.toplam ? { toplam: true } : {}),
      })),
    }),
    maddeler: t.satirlar.map((s) => JSON.stringify(t.sutunlar.map((c, i) => hucreDuzelt(c.tur, s[i] ?? '')))),
  };
}

/** Boş tablo. */
export function bosTablo(sutunlar: Sutun[]): Tablo {
  return { sutunlar, satirlar: [] };
}

/** Sütunları temizler: adı boş olanlar atılır, en çok beş; hiç yoksa null. */
export function sutunlariDuzelt(sutunlar: readonly Sutun[]): Sutun[] | null {
  const t = sutunlar
    .map((s) => ({ ...s, ad: s.ad.trim() }))
    .filter((s) => s.ad)
    .slice(0, EN_COK_SUTUN);
  return t.length > 0 ? t : null;
}

/**
 * Sütunlar değişince satırlar eski sütunların yerine göre taşınır: `eskiYer[i]` yeni i.
 * sütunun eski sırası (yeni sütunsa null). Türü değişen sütunun değerleri yeni türe uyarlanır.
 */
export function sutunlariDegistir(t: Tablo, sutunlar: Sutun[], eskiYer: (number | null)[]): Tablo {
  return {
    sutunlar,
    satirlar: t.satirlar.map((s) =>
      sutunlar.map((c, i) => (eskiYer[i] === null ? '' : hucreDuzelt(c.tur, s[eskiYer[i]!] ?? ''))),
    ),
  };
}

/** "1.250,50" · "12,5" · "12.5" → sayı; sayı değilse null. */
export function sayiMi(s: string): number | null {
  const t = s.trim().replace(/\s|₺|TL/gi, '');
  if (!/^-?[\d.,]+$/.test(t)) return null;
  const virgul = t.lastIndexOf(',');
  const nokta = t.lastIndexOf('.');
  const ondalik = virgul > nokta ? ',' : nokta > virgul && /\.\d{1,2}$/.test(t) ? '.' : null;
  const temiz =
    ondalik === ','
      ? t.replace(/\./g, '').replace(',', '.')
      : ondalik === '.'
        ? t.replace(/,/g, '')
        : t.replace(/[.,]/g, '');
  const n = Number(temiz);
  return Number.isFinite(n) ? n : null;
}

/** Sayı Türkçe biçimde: 1.250,5 */
export function sayiMetni(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

export function isaretliMi(h: string): boolean {
  return h === ISARETLI;
}

/** Hücrenin görünen yazısı (tarih "13 Kasım"; işaret görünmez, kutu çizilir). */
export function hucreMetni(tur: SutunTuru, h: string): string {
  if (tur === 'tarih' && gecerliGunMu(h)) return kisaTarih(h);
  if (tur === 'isaret') return '';
  return h;
}

/** Sayı sütununun toplamı (sayı olmayan hücreler atlanır). */
export function sutunToplami(satirlar: readonly (readonly string[])[], i: number): number {
  return satirlar.reduce((t, s) => t + (sayiMi(s[i] ?? '') ?? 0), 0);
}

/** Satır "yapıldı" mı: ilk İşaret sütunu işaretliyse (üstü çizilir). */
export function satirIsaretliMi(t: Pick<Tablo, 'sutunlar'>, satir: readonly string[]): boolean {
  const i = t.sutunlar.findIndex((s) => s.tur === 'isaret');
  return i >= 0 && isaretliMi(satir[i] ?? '');
}

export type Siralama = { sutun: number; artan: boolean } | null;

/**
 * Satırları sıralar (sıralama yoksa eklenme sırası). Sayı sütununda sayı gibi, tarihte tarihe
 * göre, işarette işaretliler önce; yazıda (ve türü yazı olup iki değer de sayıysa sayı gibi)
 * Türkçe alfabe sırasıyla. Boşlar hep sonda. Satırın asıl yeri `i` ile döner.
 */
export function satirlariSirala(
  satirlar: readonly string[][],
  s: Siralama,
  tur: SutunTuru = 'yazi',
): { satir: string[]; i: number }[] {
  const liste = satirlar.map((satir, i) => ({ satir, i }));
  if (!s) return liste;
  const yon = s.artan ? 1 : -1;
  return liste.sort((a, b) => {
    const x = (a.satir[s.sutun] ?? '').trim();
    const y = (b.satir[s.sutun] ?? '').trim();
    if (tur === 'isaret') {
      const fark = Number(isaretliMi(y)) - Number(isaretliMi(x));
      return fark === 0 ? a.i - b.i : fark * yon;
    }
    if (!x || !y) return x ? -1 : y ? 1 : a.i - b.i;
    let fark: number;
    if (tur === 'tarih') fark = x < y ? -1 : x > y ? 1 : 0;
    else {
      const nx = sayiMi(x);
      const ny = sayiMi(y);
      fark = nx !== null && ny !== null ? nx - ny : x.localeCompare(y, 'tr', { sensitivity: 'base' });
    }
    return fark === 0 ? a.i - b.i : fark * yon;
  });
}

/** Aranan söz satırın yazı, sayı ya da tarih hücrelerinden birinde (Türkçe harfler gözetilmeden). */
export function satirUyar(t: Pick<Tablo, 'sutunlar'>, satir: readonly string[], arama: string): boolean {
  const a = arama.trim().toLocaleLowerCase('tr');
  return (
    !a ||
    t.sutunlar.some((c, i) =>
      c.tur === 'isaret'
        ? false
        : hucreMetni(c.tur, satir[i] ?? '')
            .toLocaleLowerCase('tr')
            .includes(a),
    )
  );
}

/** Excel'in açtığı CSV (Türkçe Excel ';' ayırıcı bekler; başta BOM). Tarih 13.11.2026, işaret "Evet". */
export function tabloCsv(t: Tablo): string {
  const hucre = (h: string) => (/[;"\n\r]/.test(h) ? `"${h.replace(/"/g, '""')}"` : h);
  const deger = (c: Sutun, h: string) =>
    c.tur === 'isaret'
      ? isaretliMi(h)
        ? 'Evet'
        : ''
      : c.tur === 'tarih' && gecerliGunMu(h)
        ? h.split('-').reverse().join('.')
        : h;
  const satir = (s: readonly string[]) => s.map(hucre).join(';');
  return (
    '﻿' +
    [
      satir(t.sutunlar.map((c) => c.ad)),
      ...t.satirlar.map((s) => satir(t.sutunlar.map((c, i) => deger(c, s[i] ?? '')))),
    ].join('\r\n') +
    '\r\n'
  );
}

/** Yeni tablo için hazır sütunlar (ad çipleri). */
export const TABLO_ORNEKLERI: readonly { ad: string; sutunlar: Sutun[] }[] = [
  {
    ad: 'Market fiyatları',
    sutunlar: [
      { ad: ISARET_SUTUNU, tur: 'isaret' },
      { ad: 'Ürün', tur: 'yazi' },
      { ad: 'Son fiyat', tur: 'sayi', toplam: true },
      { ad: 'Yer', tur: 'yazi' },
    ],
  },
  {
    ad: 'Ödünç verdiklerim',
    sutunlar: [
      { ad: 'Ne', tur: 'yazi' },
      { ad: 'Kime', tur: 'yazi' },
      { ad: 'Ne zaman', tur: 'tarih' },
      { ad: 'Geri geldi', tur: 'isaret' },
    ],
  },
  {
    ad: 'Telefonlar',
    sutunlar: [
      { ad: 'Ad', tur: 'yazi' },
      { ad: 'Telefon', tur: 'yazi' },
      { ad: 'Not', tur: 'yazi' },
    ],
  },
];
