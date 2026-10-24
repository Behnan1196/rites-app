// Kartın karakteri (pilot 24 Ekim, P-35, 2. adım). Kişi şablon seçmez; kart
// bloklarından ve tekrarından ne olduğunu anlar, kişi tek anahtarla düzeltir:
// - Tekrarlı kartta "Seriyi say" açık gelir; liste ya da ölçüm varsa kapalı gelir
//   (market listesi, kilo takibi). Kişinin seçimi `kart.seriSay`ta (null: kural).
// - Seri sayılmayan tekrarlı kartta seri yerine "Son 7 günde N kez".
// - Ölçümü olan kartta (takip) ölçümün geçmişi kartın içinde görünür.

import type { SeritGunu } from './gorunurluk';
import type { Blok, Kart, Kayit } from './kart';
import type { Gun } from './tarih';

/** Kuralın varsayılanı: liste ya da ölçüm varsa seri sayılmaz. */
export function seriVarsayilani(bloklar: readonly Pick<Blok, 'tur'>[]): boolean {
  return !bloklar.some((b) => b.tur === 'liste' || b.tur === 'olcum');
}

export function seriSayilirMi(kart: Pick<Kart, 'tekrar' | 'seriSay'>, bloklar: readonly Pick<Blok, 'tur'>[]): boolean {
  if (!kart.tekrar) return false;
  return kart.seriSay ?? seriVarsayilani(bloklar);
}

/** "Son 7 günde 5 kez" / "Son 7 günde henüz yok". */
export function sonYediGunMetni(serit: readonly SeritGunu[]): string {
  const n = serit.filter((s) => s.durum === 'yapildi').length;
  return n > 0 ? `Son 7 günde ${n} kez` : 'Son 7 günde henüz yok';
}

export interface OlcumNoktasi {
  tarih: Gun;
  deger: number;
  /** Yazıldığı gibi ("72,5"). */
  metin: string;
}

/** Ölçüm metni → sayı ("72,5" → 72.5); sayı değilse null. */
export function olcumSayisi(metin: string): number | null {
  const t = metin.trim().replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** Bir ölçümün o güne kadarki son `adet` değeri, eskiden yeniye. */
export function olcumGecmisi(kayitlar: readonly Kayit[], blokId: string, gun: Gun, adet = 7): OlcumNoktasi[] {
  const noktalar: OlcumNoktasi[] = [];
  for (const k of kayitlar) {
    if (k.tarih > gun) continue;
    const metin = k.degerler[blokId];
    if (metin === undefined) continue;
    const deger = olcumSayisi(metin);
    if (deger !== null) noktalar.push({ tarih: k.tarih, deger, metin: metin.trim() });
  }
  return noktalar.sort((a, b) => a.tarih.localeCompare(b.tarih)).slice(-adet);
}

/** Çubuk yükseklikleri (0…1): en küçük değer de görünsün diye 0.15'ten başlar. */
export function cubukOranlari(noktalar: readonly OlcumNoktasi[]): number[] {
  if (noktalar.length === 0) return [];
  const en = Math.min(...noktalar.map((n) => n.deger));
  const ust = Math.max(...noktalar.map((n) => n.deger));
  if (ust === en) return noktalar.map(() => 0.6);
  return noktalar.map((n) => 0.15 + (0.85 * (n.deger - en)) / (ust - en));
}

// ---- Not → kart (P-35, 4. adım) ------------------------------------------------

/** Dolu açılan yeni kart: paylaşılan video ya da "Karta çevir" denen not. */
export interface KartTaslagi {
  baslik: string;
  videoAdresi?: string;
  /** Talimat bloğu olur. */
  metin?: string;
  /** Sesli notun kaydı: dosya bloğu olur. */
  sesYolu?: string;
  /** Kart kaydedilince silinecek not. */
  notId?: string;
}

/** Not → kart taslağı: ilk satır başlık (en çok 60 harf); başka satır ya da uzun metin talimat olur. */
export function notKartTaslagi(not: {
  id: string;
  metin: string;
  sesli: boolean;
  sesYolu: string | null;
}): KartTaslagi {
  const metin = not.metin.trim();
  const ilk = metin.split('\n')[0]?.trim() ?? '';
  const baslik = (ilk.length > 60 ? `${ilk.slice(0, 59)}…` : ilk) || (not.sesli ? 'Sesli not' : 'Not');
  const uzun = !not.sesli && (metin.includes('\n') || ilk.length > 60);
  return {
    baslik,
    ...(uzun ? { metin } : {}),
    ...(not.sesli && not.sesYolu ? { sesYolu: not.sesYolu } : {}),
    notId: not.id,
  };
}
