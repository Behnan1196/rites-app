// Gruplar (GR-1): grup bir kişi kümesidir; içerik taşımaz (`08` karar 36).
// Kuran üye çağırır ve çıkarır, grubu siler; üye "Gruptan ayrıl" der (10. görev kararı).
// Gruba yalnız bağlı kişiler çağrılır.

import type { Kisi } from './kisiler';
import { trKucuk } from './metin';

export type UyelikDurumu = 'davet' | 'uye';

/** Sunucudaki bir kullanıcı: kendi verdiği ad ve e-postası. */
export interface SunucuKisisi {
  id: string;
  ad: string;
  eposta: string;
}

export interface GrupUyesi extends SunucuKisisi {
  durum: UyelikDurumu;
}

export interface Grup {
  id: string;
  ad: string;
  kurucu: string;
  /** Benim bu gruptaki durumum. */
  benim: UyelikDurumu;
  /** Kuran dahil, katılma sırasıyla. */
  uyeler: GrupUyesi[];
  /** Bu gruba açık listeler (yalnız üyeyken görünür). */
  listeler: { id: string; ad: string }[];
}

export type AdBulucu = (k: SunucuKisisi | string) => string;

/**
 * Bir kişinin görünen adı: ben → "Sen"; Kişilerim'deyse verdiğim ad ("Ali (eşim)");
 * değilse kendi verdiği ad; o da yoksa e-postası.
 */
export function adBulucu(ben: string, kisiler: readonly Kisi[], bilinenler: readonly SunucuKisisi[] = []): AdBulucu {
  return (k) => {
    const id = typeof k === 'string' ? k : k.id;
    if (id === ben) return 'Sen';
    const kisi = kisiler.find((x) => x.kullaniciId === id);
    if (kisi) return kisi.ad;
    const s = typeof k === 'string' ? bilinenler.find((x) => x.id === id) : k;
    return s?.ad || s?.eposta || 'Eski üye';
  };
}

/** "Aile" → "Aile grubu"; "Yürüyüş grubu" olduğu gibi kalır. */
export function grupAdi(ad: string): string {
  return /\bgrub[uı]$/u.test(trKucuk(ad.trim())) ? ad.trim() : `${ad.trim()} grubu`;
}

export function grupFormuHatasi(ad: string): string | null {
  return ad.trim() === '' ? 'Gruba bir ad ver.' : null;
}

export function grupKurulduMetni(ad: string, cagrilan: number): string {
  return `${grupAdi(ad)} kuruldu${cagrilan > 0 ? '; davetler gönderildi.' : '.'}`;
}

export const GRUP_FORMU_NOTU =
  "Seçtiklerine gruba katılma daveti gider. Gruba kendin kişi ekledikçe ücretsiz sınırın etkilenmez; sınır yalnız Kişilerim'e eklediklerini sayar.";

export const GRUP_LISTELERI_NOTU = 'Gruba eklediğin herkes bu listeleri de görür.';

/** Beni çağıran, henüz katılmadığım gruplar. */
export function grupDavetleri(gruplar: readonly Grup[]): Grup[] {
  return gruplar.filter((g) => g.benim === 'davet');
}

export function uyeOlduklarim(gruplar: readonly Grup[]): Grup[] {
  return gruplar.filter((g) => g.benim === 'uye');
}

/** "Ayşe seni Aile grubuna çağırdı." */
export function grupDavetMetni(grup: Grup, ad: AdBulucu): string {
  const kuran = grup.uyeler.find((u) => u.id === grup.kurucu) ?? grup.kurucu;
  return `${ad(kuran)} seni ${grupAdi(grup.ad)}na çağırdı.`;
}

/** Giriş'teki Gelenler satırı için: tek davette davet metni, çokta "2 grup daveti". */
export function davetOzeti(davetler: readonly Grup[], ad: AdBulucu): string | null {
  if (davetler.length === 0) return null;
  return davetler.length === 1 ? grupDavetMetni(davetler[0]!, ad) : `${davetler.length} grup daveti`;
}

/** Gruplarım satırının alt yazısı: "3 kişi" · "Henüz kimse yok"; bekleyen davet varsa eklenir. */
export function grupSayiMetni(grup: Grup, ben: string): string {
  const digerleri = grup.uyeler.filter((u) => u.id !== ben);
  const uye = digerleri.filter((u) => u.durum === 'uye').length;
  const davet = digerleri.length - uye;
  const bas = uye > 0 ? `${uye} kişi` : 'Henüz kimse yok';
  return davet > 0 ? `${bas} · ${davet} davet bekliyor` : bas;
}

export type BagliKisi = Kisi & { kullaniciId: string };

/** Grup kur ve Yeni liste formlarında seçilebilen kişiler: yalnız bağlı olanlar. */
export function bagliKisiler(kisiler: readonly Kisi[]): BagliKisi[] {
  return kisiler.filter((k): k is BagliKisi => k.durum === 'bagli' && k.kullaniciId !== null);
}

/** Kişilerinden ekle: bağlı olup grupta olmayanlar. */
export function cagrilabilecekler(grup: Grup, kisiler: readonly Kisi[]): BagliKisi[] {
  const icerde = new Set(grup.uyeler.map((u) => u.id));
  return bagliKisiler(kisiler).filter((k) => !icerde.has(k.kullaniciId));
}

/** Sunucu hatası → kişiye gösterilecek metin (null: bağlantı sorunu). */
export function grupHatasi(mesaj: string): string | null {
  if (mesaj.includes('bagli degil')) return 'Gruba yalnız bağlı olduğun kişileri çağırabilirsin.';
  if (mesaj.includes('ad yok')) return 'Gruba bir ad ver.';
  return null;
}
