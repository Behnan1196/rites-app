// Kişilerim (KS-1…KS-3, GR-3; `03` → kisi). Kişinin verdiği ad ("Ali (eşim)")
// telefonda kalır; sunucu yalnız bağlantıyı bilir. Bu dosya telefondaki adres
// defterini sunucudaki bağlantılarla eşleştirir.

import { trKucuk } from './metin';

export type KisiDurumu = 'bagli' | 'istek' | 'davet';

export interface Kisi {
  id: string;
  ad: string;
  eposta: string;
  kullaniciId: string | null;
  durum: KisiDurumu;
  /** Ücretsiz sınıra sayılır mı (ben ekledim). */
  benEkledim: boolean;
}

/** Sunucudaki bir bağlantı, benim açımdan. */
export interface SunucuBaglantisi {
  diger: string;
  eposta: string;
  /** Diğer kişinin kendi verdiği adı (Profil). */
  ad: string;
  durum: 'istek' | 'bagli';
  /** İsteği ben mi gönderdim? */
  benIstedim: boolean;
}

export const UCRETSIZ_SINIR = 5;

export const DURUM_METNI: Record<KisiDurumu, string> = {
  bagli: "Rites'ta, bağlısınız",
  istek: 'İstek gönderildi, onay bekleniyor',
  davet: "Davet gönderildi, Rites'a katılınca bağlanırsınız",
};

export const SINIR_ACIKLAMASI = 'Seni ekleyenler ve gruplarına katılanlar senin sınırından düşmez.';

export function epostaGecerliMi(eposta: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta.trim());
}

export function epostaDuzelt(eposta: string): string {
  return trKucuk(eposta.trim()).replace(/ı/g, 'i');
}

export type KisiFormuHatasi = { alan: 'ad' | 'eposta'; metin: string } | null;

export function kisiFormuHatasi(ad: string, eposta: string, kisiler: readonly Kisi[], ekledigim: number): KisiFormuHatasi {
  if (ad.trim() === '') return { alan: 'ad', metin: 'Önce bir ad yaz.' };
  if (!epostaGecerliMi(eposta)) return { alan: 'eposta', metin: 'E-posta adresi eksik ya da hatalı görünüyor.' };
  if (kisiler.some((k) => k.eposta === epostaDuzelt(eposta))) return { alan: 'eposta', metin: 'Bu e-posta zaten kişilerinde.' };
  if (ekledigim >= UCRETSIZ_SINIR) return { alan: 'eposta', metin: SINIR_DOLU };
  return null;
}

export const SINIR_DOLU = `Ücretsiz üyelikte en çok ${UCRETSIZ_SINIR} kişi ekleyebilirsin.`;

/** Sunucunun kişi ekleme hatası → kişiye gösterilecek metin. */
export function kisiEklemeHatasi(mesaj: string): string {
  if (mesaj.includes('zaten')) return 'Bu e-posta zaten kişilerinde.';
  if (mesaj.includes('sinir')) return SINIR_DOLU;
  if (mesaj.includes('kendin')) return 'Bu senin e-postan.';
  return BAGLANAMIYOR;
}

export const BAGLANAMIYOR = 'Şu an bağlanamıyor. Biraz sonra yeniden dene.';

export function eklendiMetni(ad: string, sonuc: KisiDurumu): string {
  if (sonuc === 'istek') return `${ad} Rites'ta. Bağlantı isteği gönderildi.`;
  if (sonuc === 'davet') return `${ad} henüz Rites'ta değil. Davet e-postası gönderildi.`;
  return `${ad} ile bağlandınız.`;
}

export function ekledigimSayi(kisiler: readonly Kisi[]): number {
  return kisiler.filter((k) => k.benEkledim).length;
}

/** "Eklediğin kişiler (ücretsiz) 3 / 5" */
export function sinirMetni(sayi: number): string {
  return `Eklediğin kişiler (ücretsiz) ${sayi} / ${UCRETSIZ_SINIR}`;
}

/** Seni eklemek isteyenler: bana gelen, onay bekleyen istekler. */
export function gelenIstekler(baglantilar: readonly SunucuBaglantisi[]): SunucuBaglantisi[] {
  return baglantilar.filter((b) => b.durum === 'istek' && !b.benIstedim);
}

export interface Eslestirme {
  ekle: Omit<Kisi, 'id'>[];
  guncelle: Kisi[];
  sil: string[];
}

/**
 * Telefondaki kişileri sunucudaki duruma getirir:
 * - Karşı taraf kabul ettiyse "bağlı", davet ettiğin kişi katıldıysa "istek" olur.
 * - Sunucuda karşılığı kalmayan kişi (iki taraftan biri sildi ya da reddetti) silinir.
 * - Sunucuda bağlı olup telefonda olmayan (başka telefonda kabul, geri yüklenen yedek)
 *   kişi, kendi adıyla eklenir.
 */
export function eslestir(
  kisiler: readonly Kisi[],
  baglantilar: readonly SunucuBaglantisi[],
  davetler: readonly string[],
): Eslestirme {
  const sonuc: Eslestirme = { ekle: [], guncelle: [], sil: [] };
  const kullanilan = new Set<string>();

  for (const k of kisiler) {
    const b =
      baglantilar.find((x) => k.kullaniciId !== null && x.diger === k.kullaniciId) ??
      (k.kullaniciId === null ? baglantilar.find((x) => x.eposta === k.eposta) : undefined);
    if (b) {
      kullanilan.add(b.diger);
      const durum: KisiDurumu = b.durum === 'bagli' ? 'bagli' : 'istek';
      if (b.durum === 'istek' && !b.benIstedim) {
        // Karşı taraf bana istek göndermiş: "Seni eklemek isteyenler"de görünür.
        sonuc.sil.push(k.id);
        kullanilan.delete(b.diger);
        continue;
      }
      if (k.durum !== durum || k.kullaniciId !== b.diger) sonuc.guncelle.push({ ...k, durum, kullaniciId: b.diger });
      continue;
    }
    if (k.kullaniciId === null && davetler.includes(k.eposta)) continue;
    sonuc.sil.push(k.id);
  }

  for (const b of baglantilar) {
    if (kullanilan.has(b.diger)) continue;
    if (b.durum === 'bagli' || b.benIstedim) {
      sonuc.ekle.push({
        ad: b.ad || b.eposta,
        eposta: b.eposta,
        kullaniciId: b.diger,
        durum: b.durum === 'bagli' ? 'bagli' : 'istek',
        benEkledim: b.benIstedim,
      });
    }
  }
  return sonuc;
}

/** Baş harfler (avatar): "Gül Aksoy" → "GA", "Ali (eşim)" → "A". */
export function kisiBasHarf(ad: string): string {
  const sozcukler = ad
    .replace(/\(.*?\)/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((s) => /^\p{L}/u.test(s));
  const harfler = sozcukler.slice(0, 2).map((s) => s[0]!.toLocaleUpperCase('tr'));
  return harfler.join('') || '?';
}

/** "2 kişi daha ekleyebilirsin." / "Sınır doldu." */
export function kalanKisiMetni(sayi: number): string {
  const kalan = UCRETSIZ_SINIR - sayi;
  return kalan > 0 ? `${kalan} kişi daha ekleyebilirsin.` : 'Sınır doldu.';
}
