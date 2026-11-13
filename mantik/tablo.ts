// Tablo (pilot 13 Kasım, P-120): Listeler'de 2–3 sütunlu liste (Ürün · Son fiyat · Yer;
// Ödünç verdiklerim: Ne · Kime · Ne zaman). Kartın bir parçasıdır (`blok.tur = 'tablo'`):
// `metin` sütun adları (JSON dizi), `maddeler` her satır bir JSON dizi (sütun sırasıyla).

export const EN_COK_SUTUN = 3;

export interface Tablo {
  sutunlar: string[];
  satirlar: string[][];
}

function jsonDizi(s: string): unknown[] | null {
  try {
    const v: unknown = JSON.parse(s);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** Parçadan tablo; bozuk satır tek hücreli olur. */
export function tabloOku(b: { metin: string; maddeler: readonly string[] }): Tablo {
  const sutunlar = (jsonDizi(b.metin) ?? []).map(String).slice(0, EN_COK_SUTUN);
  if (sutunlar.length === 0) sutunlar.push('Ad', 'Not');
  const satirlar = b.maddeler.map((m) => {
    const d = jsonDizi(m);
    const hucreler = d ? d.map((x) => (x === null || x === undefined ? '' : String(x))) : [m];
    return sutunlar.map((_, i) => hucreler[i] ?? '');
  });
  return { sutunlar, satirlar };
}

/** Tablo parçanın alanlarına. */
export function tabloYaz(t: Tablo): { metin: string; maddeler: string[] } {
  return {
    metin: JSON.stringify(t.sutunlar),
    maddeler: t.satirlar.map((s) => JSON.stringify(t.sutunlar.map((_, i) => (s[i] ?? '').trim()))),
  };
}

/** Sütun adlarını temizler: boşlar atılır, en çok üç; hiç yoksa null. */
export function sutunlariDuzelt(adlar: readonly string[]): string[] | null {
  const t = adlar
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, EN_COK_SUTUN);
  return t.length > 0 ? t : null;
}

/**
 * Sütun adları değişince satırlar eski sütunların yerine göre taşınır: `eskiYer[i]` yeni i.
 * sütunun eski sırası (yeni sütunsa null).
 */
export function sutunlariDegistir(t: Tablo, sutunlar: string[], eskiYer: (number | null)[]): Tablo {
  return {
    sutunlar,
    satirlar: t.satirlar.map((s) => sutunlar.map((_, i) => (eskiYer[i] === null ? '' : (s[eskiYer[i]!] ?? '')))),
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

export type Siralama = { sutun: number; artan: boolean } | null;

/**
 * Satırları sıralar (sıralama yoksa eklenme sırası). İki değer de sayıysa sayı gibi, değilse
 * Türkçe alfabe sırasıyla; boşlar hep sonda. Satırın asıl yeri `i` ile döner.
 */
export function satirlariSirala(satirlar: readonly string[][], s: Siralama): { satir: string[]; i: number }[] {
  const liste = satirlar.map((satir, i) => ({ satir, i }));
  if (!s) return liste;
  const yon = s.artan ? 1 : -1;
  return liste.sort((a, b) => {
    const x = a.satir[s.sutun] ?? '';
    const y = b.satir[s.sutun] ?? '';
    if (!x.trim() || !y.trim()) return x.trim() ? -1 : y.trim() ? 1 : a.i - b.i;
    const nx = sayiMi(x);
    const ny = sayiMi(y);
    const fark = nx !== null && ny !== null ? nx - ny : x.localeCompare(y, 'tr', { sensitivity: 'base' });
    return fark === 0 ? a.i - b.i : fark * yon;
  });
}

/** Aranan söz satırın herhangi bir hücresinde (büyük-küçük harf ve Türkçe harfler gözetilmeden). */
export function satirUyar(satir: readonly string[], arama: string): boolean {
  const a = arama.trim().toLocaleLowerCase('tr');
  return !a || satir.some((h) => h.toLocaleLowerCase('tr').includes(a));
}

/** Excel'in açtığı CSV (Türkçe Excel ';' ayırıcı bekler; başta BOM). */
export function tabloCsv(t: Tablo): string {
  const hucre = (h: string) => (/[;"\n\r]/.test(h) ? `"${h.replace(/"/g, '""')}"` : h);
  const satir = (s: readonly string[]) => s.map(hucre).join(';');
  return '﻿' + [satir(t.sutunlar), ...t.satirlar.map(satir)].join('\r\n') + '\r\n';
}

/** Yeni tablo için hazır sütunlar (ad çipleri). */
export const TABLO_ORNEKLERI: readonly { ad: string; sutunlar: string[] }[] = [
  { ad: 'Market fiyatları', sutunlar: ['Ürün', 'Son fiyat', 'Yer'] },
  { ad: 'Ödünç verdiklerim', sutunlar: ['Ne', 'Kime', 'Ne zaman'] },
  { ad: 'Telefonlar', sutunlar: ['Ad', 'Telefon', 'Not'] },
];
