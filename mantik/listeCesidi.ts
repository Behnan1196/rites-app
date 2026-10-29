// Liste çeşitleri (pilot 29 Ekim, P-61). Listeler artık yalnız adla değil, davranışla
// da ayrılır; kişisel ve paylaşılan listelerde aynı:
// - Yapılacaklar: maddeye gün verilir (o gün ajandada); yapılan alta iner.
// - Alışveriş: maddeye miktar ("2 kg"); alınan alta iner; "Alınanları temizle";
//   yazarken önceki alışverişlerden öneri (telefonda tutulan geçmiş).
// - Hazırlık: tekrar kullanılır; işaretli madde yerinde kalır, "Baştan başla" yalnız
//   işaretleri siler.
// - Not listesi: işaret kutusu yok; yalnız sıralı maddeler.
// Yeni listede ad çipi çeşidi de seçer ("Market" → Alışveriş); elle yazılan ad Yapılacaklar.

import { trKucuk } from './metin';

export type ListeCesidi = 'yapilacak' | 'alisveris' | 'hazirlik' | 'not';

export interface CesitTanimi {
  cesit: ListeCesidi;
  ad: string;
  /** Ionicons adı. */
  ikon: 'checkbox-outline' | 'cart-outline' | 'bag-check-outline' | 'reader-outline';
  aciklama: string;
}

export const LISTE_CESITLERI: readonly CesitTanimi[] = [
  {
    cesit: 'yapilacak',
    ad: 'Yapılacaklar',
    ikon: 'checkbox-outline',
    aciklama: 'Bir maddeye gün verirsen o gün ajandanda görünür. Yapılan alta iner.',
  },
  {
    cesit: 'alisveris',
    ad: 'Alışveriş',
    ikon: 'cart-outline',
    aciklama: 'Miktarıyla yaz ("2 kg domates"). Alınan alta iner; sonra "Alınanları temizle".',
  },
  {
    cesit: 'hazirlik',
    ad: 'Hazırlık',
    ikon: 'bag-check-outline',
    aciklama: 'Bavul, bayram, misafir. Maddeler kalır; "Baştan başla" yalnız işaretleri siler.',
  },
  {
    cesit: 'not',
    ad: 'Not listesi',
    ikon: 'reader-outline',
    aciklama: 'Okunacak kitaplar, hediye fikirleri. İşaret kutusu yok.',
  },
];

export const VARSAYILAN_CESIT: ListeCesidi = 'yapilacak';

export function cesitMi(x: unknown): x is ListeCesidi {
  return LISTE_CESITLERI.some((c) => c.cesit === x);
}

/** Bilinmeyen ya da boş değer Yapılacaklar sayılır (eski listeler). */
export function cesitTanimi(cesit: string | null | undefined): CesitTanimi {
  return LISTE_CESITLERI.find((c) => c.cesit === cesit) ?? LISTE_CESITLERI[0]!;
}

/** Yeni listede ad çipleri; her biri çeşidini de seçer. */
export const AD_ORNEKLERI: readonly { ad: string; cesit: ListeCesidi }[] = [
  { ad: 'Yapılacaklar', cesit: 'yapilacak' },
  { ad: 'Market', cesit: 'alisveris' },
  { ad: 'Bayram hazırlığı', cesit: 'hazirlik' },
  { ad: 'Bavul', cesit: 'hazirlik' },
  { ad: 'Taşınma', cesit: 'yapilacak' },
  { ad: 'Okunacak kitaplar', cesit: 'not' },
  { ad: 'Hediye fikirleri', cesit: 'not' },
];

/** İşaret kutusu var mı (Not listesinde yok). */
export function isaretliMi(cesit: ListeCesidi): boolean {
  return cesit !== 'not';
}

/** Maddeye gün verilir mi (ajanda): Not listesinde yok. */
export function tarihliMi(cesit: ListeCesidi): boolean {
  return cesit !== 'not';
}

/** Ekranda sıra: Yapılacaklar ve Alışveriş'te yapılanlar alta iner; ötekilerde sıra değişmez. */
export function maddeSirasi<T extends { yapildi: boolean; sira: number }>(
  cesit: ListeCesidi,
  maddeler: readonly T[],
): T[] {
  const sirali = [...maddeler].sort((a, b) => a.sira - b.sira);
  if (cesit !== 'yapilacak' && cesit !== 'alisveris') return sirali;
  return [...sirali.filter((m) => !m.yapildi), ...sirali.filter((m) => m.yapildi)];
}

/** Listeler ekranında satırın alt yazısı. */
export function listeOzeti(cesit: ListeCesidi, toplam: number, kalan: number): string {
  if (toplam === 0) return 'Boş';
  switch (cesit) {
    case 'alisveris':
      return kalan === 0 ? 'Hepsi alındı' : `${kalan} alınacak`;
    case 'hazirlik':
      return `${toplam - kalan}/${toplam} hazır`;
    case 'not':
      return `${toplam} madde`;
    default:
      return kalan === 0 ? 'Hepsi tamam' : `${kalan} kalan`;
  }
}

/** Paylaşılan liste satırında sağdaki yazı (sunucu yalnız kalan sayıyı verir). */
export function paylasilanOzeti(cesit: ListeCesidi, kalan: number): string {
  switch (cesit) {
    case 'alisveris':
      return kalan > 0 ? `${kalan} alınacak` : 'Hepsi alındı';
    case 'not':
      return '';
    default:
      return kalan > 0 ? `${kalan} madde kaldı` : 'Madde kalmadı';
  }
}

const BIRIMLER = [
  'kg',
  'kilo',
  'g',
  'gr',
  'gram',
  'lt',
  'l',
  'litre',
  'adet',
  'paket',
  'kutu',
  'şişe',
  'demet',
  'kavanoz',
  'dilim',
  'tane',
];
const MIKTAR = new RegExp(`^(\\d+(?:[.,]\\d+)?|yarım|bir|iki|üç|dört|beş)\\s*(${BIRIMLER.join('|')})?\\s+(.+)$`, 'iu');

/**
 * Alışverişte yazılan satırdan miktarı ayırır: "2 kg domates" → ("domates", "2 kg");
 * "3 ekmek" → ("ekmek", "3"); miktar yoksa olduğu gibi.
 */
export function miktarAyir(satir: string): { metin: string; miktar: string } {
  const t = satir.trim().replace(/\s+/g, ' ');
  const m = MIKTAR.exec(t);
  if (!m) return { metin: basHarfBuyuk(t), miktar: '' };
  const metin = basHarfBuyuk(m[3]!.trim());
  return { metin, miktar: [m[1], m[2]].filter(Boolean).join(' ') };
}

/** "domates" → "Domates" (Türkçe: "ıspanak" → "Ispanak", "incir" → "İncir"). */
export function basHarfBuyuk(metin: string): string {
  return metin ? metin.charAt(0).toLocaleUpperCase('tr-TR') + metin.slice(1) : metin;
}

/** Madde sayfasında miktar çipleri. */
export const MIKTAR_ORNEKLERI = ['1', '2', '3', '½ kg', '1 kg', '1 paket', '1 lt'] as const;

/** Alışveriş geçmişi: en yeni başta, büyük-küçük harf farkı yok sayılır, en çok 150. */
export function gecmiseEkle(gecmis: readonly string[], metin: string): string[] {
  // Geçmişte büyük harfle başlasın (öneri çipinde ve eklenince düzgün görünsün).
  const t = basHarfBuyuk(metin.trim());
  if (!t) return [...gecmis];
  const k = trKucuk(t);
  return [t, ...gecmis.filter((g) => trKucuk(g) !== k)].slice(0, 150);
}

/**
 * Yazılana göre öneriler: başı uyanlar önce, sonra içinde geçenler; listede alınmamış
 * olarak duranlar önerilmez. En çok 5.
 */
export function alisverisOnerileri(gecmis: readonly string[], yazilan: string, listede: readonly string[]): string[] {
  const y = trKucuk(miktarAyir(yazilan).metin);
  if (y.length < 2) return [];
  const var_ = new Set(listede.map(trKucuk));
  const adaylar = gecmis.filter((g) => !var_.has(trKucuk(g)) && trKucuk(g) !== y);
  const bas = adaylar.filter((g) => trKucuk(g).startsWith(y));
  const ic = adaylar.filter((g) => !trKucuk(g).startsWith(y) && trKucuk(g).includes(y));
  return [...bas, ...ic].slice(0, 5);
}
