// Liste çeşitleri (pilot 29 Ekim, P-61; 1 Kasım, P-86: kartın listeleriyle aynı üç çeşit).
// Kişisel ve paylaşılan listelerde aynı:
// - Adımlar (`yapilacak`): işaretlediğin kalır; maddeye gün verilir (o gün ajandada);
//   yapılan alta iner; "Yapılanları temizle".
// - Günlük kontrol (`gunluk`): işaretler her gün baştan (işaretin günü tutulur).
// - Bilgi listesi (`not`): işaret kutusu yok; yalnız sıralı maddeler.
// Eski Alışveriş ve Hazırlık listeleri Adımlar oldu; miktarlar kalktı (P-86).

export type ListeCesidi = 'yapilacak' | 'gunluk' | 'not';

export interface CesitTanimi {
  cesit: ListeCesidi;
  ad: string;
  /** Ionicons adı. */
  ikon: 'checkbox-outline' | 'refresh-outline' | 'reader-outline';
  aciklama: string;
}

export const LISTE_CESITLERI: readonly CesitTanimi[] = [
  {
    cesit: 'yapilacak',
    ad: 'Adımlar',
    ikon: 'checkbox-outline',
    aciklama: 'İşaretlediğin kalır; yapılan alta iner. Bir maddeye gün verirsen o gün ajandanda görünür.',
  },
  {
    cesit: 'gunluk',
    ad: 'Günlük kontrol',
    ikon: 'refresh-outline',
    aciklama: 'Her gün baştan: dün işaretlenenler bugün yeniden boş.',
  },
  {
    cesit: 'not',
    ad: 'Bilgi listesi',
    ikon: 'reader-outline',
    aciklama: 'Okunacak kitaplar, hediye fikirleri. İşaret kutusu yok.',
  },
];

export const VARSAYILAN_CESIT: ListeCesidi = 'yapilacak';

export function cesitMi(x: unknown): x is ListeCesidi {
  return LISTE_CESITLERI.some((c) => c.cesit === x);
}

/** Bilinmeyen, boş ya da eski değer (alışveriş, hazırlık) Adımlar sayılır. */
export function cesitTanimi(cesit: string | null | undefined): CesitTanimi {
  return LISTE_CESITLERI.find((c) => c.cesit === cesit) ?? LISTE_CESITLERI[0]!;
}

/** Yeni listede ad çipleri; her biri çeşidini de seçer. */
export const AD_ORNEKLERI: readonly { ad: string; cesit: ListeCesidi }[] = [
  { ad: 'Yapılacaklar', cesit: 'yapilacak' },
  { ad: 'Market', cesit: 'yapilacak' },
  { ad: 'Bavul', cesit: 'yapilacak' },
  { ad: 'Çıkmadan önce', cesit: 'gunluk' },
  { ad: 'Okunacak kitaplar', cesit: 'not' },
  { ad: 'Hediye fikirleri', cesit: 'not' },
];

/** İşaret kutusu var mı (Bilgi listesinde yok). */
export function isaretliMi(cesit: ListeCesidi): boolean {
  return cesit !== 'not';
}

/** Maddeye gün verilir mi (ajanda): yalnız Adımlar'da. */
export function tarihliMi(cesit: ListeCesidi): boolean {
  return cesit === 'yapilacak';
}

/** Madde bugün işaretli mi: Günlük kontrolde yalnız bugün işaretlendiyse. */
export function isaretliGorunur(
  cesit: ListeCesidi,
  m: { yapildi: boolean; yapildiGun?: string | null },
  bugunGun: string,
): boolean {
  if (!m.yapildi) return false;
  return cesit !== 'gunluk' || m.yapildiGun === bugunGun;
}

/** Ekranda sıra: Adımlar'da yapılanlar alta iner; ötekilerde sıra değişmez. */
export function maddeSirasi<T extends { yapildi: boolean; sira: number }>(
  cesit: ListeCesidi,
  maddeler: readonly T[],
): T[] {
  const sirali = [...maddeler].sort((a, b) => a.sira - b.sira);
  if (cesit !== 'yapilacak') return sirali;
  return [...sirali.filter((m) => !m.yapildi), ...sirali.filter((m) => m.yapildi)];
}

/** Listeler ekranında satırın alt yazısı. */
export function listeOzeti(cesit: ListeCesidi, toplam: number, kalan: number): string {
  if (toplam === 0) return 'Boş';
  switch (cesit) {
    case 'not':
      return `${toplam} madde`;
    case 'gunluk':
      return kalan === 0 ? 'Bugün hepsi tamam' : `Bugün ${toplam - kalan}/${toplam}`;
    default:
      return kalan === 0 ? 'Hepsi tamam' : `${kalan} kalan`;
  }
}

/** Paylaşılan liste satırında sağdaki yazı (sunucu yalnız kalan sayıyı verir; günlükte anlamsız). */
export function paylasilanOzeti(cesit: ListeCesidi, kalan: number): string {
  if (cesit !== 'yapilacak') return '';
  return kalan > 0 ? `${kalan} madde kaldı` : 'Madde kalmadı';
}
