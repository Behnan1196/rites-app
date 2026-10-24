// İsimli kart çeşitleri (pilot 24 Ekim, P-41): seçim ekranı için gruplama ve
// tasarımcının simge seçenekleri. Çeşidin kendisi katalogdadır (`katalog.ts`).

import { katalog, type KartCesidi, type KatalogAlan } from './katalog';

/** Şu anki katalogdaki çeşitler; alan verilirse yalnız o alanın. */
export function cesitler(alan?: string): KartCesidi[] {
  const hepsi = katalog().cesitler;
  return alan ? hepsi.filter((c) => c.alan === alan) : hepsi;
}

export function cesitBul(id: string | null | undefined): KartCesidi | null {
  return (id && katalog().cesitler.find((c) => c.id === id)) || null;
}

/** Çeşitler alanlara göre, alanların sırasıyla; katalogda olmayan alan sona. */
export function cesitGruplari<T extends KartCesidi>(
  liste: readonly T[],
  alanlar: readonly Pick<KatalogAlan, 'anahtar' | 'ad'>[],
): { alan: string; ad: string; cesitler: T[] }[] {
  const sira = (a: string) => {
    const i = alanlar.findIndex((x) => x.anahtar === a);
    return i < 0 ? alanlar.length : i;
  };
  const anahtarlar = [...new Set(liste.map((c) => c.alan))].sort((a, b) => sira(a) - sira(b));
  return anahtarlar.map((alan) => ({
    alan,
    ad: alanlar.find((x) => x.anahtar === alan)?.ad ?? alan,
    cesitler: liste.filter((c) => c.alan === alan),
  }));
}

/** Tasarımcının seçebileceği simgeler (Ionicons). */
export const CESIT_SIMGELERI = [
  'restaurant-outline',
  'book-outline',
  'scale-outline',
  'camera-outline',
  'water-outline',
  'nutrition-outline',
  'cafe-outline',
  'fast-food-outline',
  'walk-outline',
  'barbell-outline',
  'fitness-outline',
  'moon-outline',
  'sunny-outline',
  'heart-outline',
  'happy-outline',
  'star-outline',
  'leaf-outline',
  'chatbubble-outline',
] as const;

/** Yeni çeşidin kimliği: alan + rastgele ek ("beslenme-3fa2c1"). */
export function yeniCesitKimligi(alan: string, rastgele: string): string {
  return `${alan}-${rastgele
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 6)
    .toLowerCase()}`;
}
