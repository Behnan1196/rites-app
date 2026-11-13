// Tablo (pilot 13 Kasım, P-120): Listeler'de 2–3 sütunlu liste (Ürün · Son fiyat · Yer;
// Ödünç verdiklerim: Ne · Kime · Ne zaman). Kartın bir parçasıdır (`blok.tur = 'tablo'`):
// `metin` sütun adları (JSON dizi), `maddeler` her satır bir JSON dizi (sütun sırasıyla).
// P-121: en çok 5 sütun (ekrana sığmazsa kayar); isteğe bağlı "Aldım" işareti: `metin`
// {"sutunlar": [...], "isaret": true}, işaretli satır {"h": [...], "y": true} (eskiler dizi).

export const EN_COK_SUTUN = 5;

export interface Tablo {
  sutunlar: string[];
  satirlar: string[][];
  /** Satırların solunda işaret kutusu (alındı). */
  isaret: boolean;
  /** Satır satır işaret (yalnız `isaret` açıkken anlamlı). */
  isaretli: boolean[];
}

function json(s: string): unknown {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

const metne = (x: unknown) => (x === null || x === undefined ? '' : String(x));
const nesneMi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Parçadan tablo; bozuk satır tek hücreli olur. */
export function tabloOku(b: { metin: string; maddeler: readonly string[] }): Tablo {
  const ust = json(b.metin);
  const ham = nesneMi(ust) ? (Array.isArray(ust.sutunlar) ? ust.sutunlar : []) : Array.isArray(ust) ? ust : [];
  const sutunlar = ham.map(String).slice(0, EN_COK_SUTUN);
  if (sutunlar.length === 0) sutunlar.push('Ad', 'Not');
  const isaretli: boolean[] = [];
  const satirlar = b.maddeler.map((m) => {
    const v = json(m);
    const d = nesneMi(v) ? (Array.isArray(v.h) ? v.h : []) : Array.isArray(v) ? v : null;
    isaretli.push(nesneMi(v) && v.y === true);
    const hucreler = d ? d.map(metne) : [m];
    return sutunlar.map((_, i) => hucreler[i] ?? '');
  });
  return { sutunlar, satirlar, isaret: nesneMi(ust) && ust.isaret === true, isaretli };
}

/** Tablo parçanın alanlarına. */
export function tabloYaz(t: Tablo): { metin: string; maddeler: string[] } {
  return {
    metin: t.isaret ? JSON.stringify({ sutunlar: t.sutunlar, isaret: true }) : JSON.stringify(t.sutunlar),
    maddeler: t.satirlar.map((s, k) => {
      const h = t.sutunlar.map((_, i) => (s[i] ?? '').trim());
      return JSON.stringify(t.isaretli[k] ? { h, y: true } : h);
    }),
  };
}

/** Boş tablo. */
export function bosTablo(sutunlar: string[], isaret = false): Tablo {
  return { sutunlar, satirlar: [], isaret, isaretli: [] };
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
    ...t,
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
  const ust = t.isaret ? ['Alındı', ...t.sutunlar] : t.sutunlar;
  const satirlar = t.satirlar.map((s, k) => (t.isaret ? [t.isaretli[k] ? 'Evet' : '', ...s] : s));
  return '\uFEFF' + [satir(ust), ...satirlar.map(satir)].join('\r\n') + '\r\n';
}

/** Yeni tablo için hazır sütunlar (ad çipleri). */
export const TABLO_ORNEKLERI: readonly { ad: string; sutunlar: string[]; isaret?: boolean }[] = [
  { ad: 'Market fiyatları', sutunlar: ['Ürün', 'Son fiyat', 'Yer'], isaret: true },
  { ad: 'Ödünç verdiklerim', sutunlar: ['Ne', 'Kime', 'Ne zaman'] },
  { ad: 'Telefonlar', sutunlar: ['Ad', 'Telefon', 'Not'] },
];
