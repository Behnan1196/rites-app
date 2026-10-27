// Listelerim (pilot 27 Ekim, P-58): kişinin kendi listeleri telefonda durur; paylaşınca
// ortak liste olur (sunucu). Ajandada liste durmaz; tarihi olan madde o gün sanal kart olarak
// görünür (ortak listelerdeki "bana verilen" maddeler gibi).
//
// Taşıma: yalnız listeden ibaret tek seferlik kartlar (liste / işaretleri kalan liste; açıklama
// olabilir) Listelerim'e taşınır, kart silinir. Tarihi bugün ya da sonra olan kartın
// yapılmamış maddeleri o tarihi alır (ajandada o gün yine görünür).

import { adimDurumu } from './adimlar';
import type { Blok, Kart } from './kart';
import type { Gun } from './tarih';
import { htmldenDuz } from './zenginMetin';

/** Yerel liste kimlikleri bu ekle başlar (ortak listelerden ayırmak için). */
export const YEREL_ONEKI = 'y-';

export function yerelListeMi(id: string): boolean {
  return id.startsWith(YEREL_ONEKI);
}

export interface YerelListe {
  id: string;
  ad: string;
  aciklama: string;
  sira: number;
  olusturma: string;
}

export interface YerelMadde {
  id: string;
  liste: string;
  metin: string;
  yapildi: boolean;
  tarih: Gun | null;
  sira: number;
}

export interface TasinacakListe {
  ad: string;
  aciklama: string;
  maddeler: { metin: string; yapildi: boolean; tarih: Gun | null }[];
}

const LISTE_TURLERI = ['liste', 'adimlar'] as const;

/** Kart Listelerim'e taşınır mı: tek seferlik, programa / gruba bağlı değil, yalnız liste parçaları. */
export function tasinacakMi(
  kart: Pick<Kart, 'tekrar' | 'planId' | 'bag'>,
  bloklar: readonly Pick<Blok, 'tur'>[],
): boolean {
  if (kart.tekrar || kart.planId || kart.bag) return false;
  return bloklar.length > 0 && bloklar.every((b) => (LISTE_TURLERI as readonly string[]).includes(b.tur));
}

/**
 * Kartın listeleri. `isaretler`: kartın gününde günlük listenin işaretleri (blok → dizi).
 * Listenin adı kartın başlığıdır; listenin kendi adı varsa "Başlık · Ad".
 */
export function karttanListeler(
  kart: Pick<Kart, 'baslik' | 'kisa' | 'tarih'>,
  bloklar: readonly Pick<Blok, 'id' | 'tur' | 'ad' | 'maddeler' | 'durum'>[],
  isaretler: Readonly<Record<string, readonly boolean[]>>,
  bugunGun: Gun,
): TasinacakListe[] {
  const ileride = !!kart.tarih && kart.tarih >= bugunGun;
  return bloklar.map((b) => {
    const yapilan =
      b.tur === 'adimlar'
        ? adimDurumu(b.durum, b.maddeler.length).yapilan.map(Boolean)
        : b.maddeler.map((_, i) => !!isaretler[b.id]?.[i]);
    return {
      ad: b.ad && b.ad !== kart.baslik ? `${kart.baslik} · ${b.ad}` : kart.baslik,
      aciklama: htmldenDuz(kart.kisa),
      maddeler: b.maddeler.map((metin, i) => ({
        metin,
        yapildi: !!yapilan[i],
        tarih: ileride && !yapilan[i] ? kart.tarih : null,
      })),
    };
  });
}

/** Listenin kalan madde sayısı metni: "3 kalan" / "Hepsi tamam" / "Boş". */
export function kalanSayiMetni(toplam: number, kalan: number): string {
  if (toplam === 0) return 'Boş';
  return kalan === 0 ? 'Hepsi tamam' : `${kalan} kalan`;
}

export function kalanMetni(maddeler: readonly Pick<YerelMadde, 'yapildi'>[]): string {
  return kalanSayiMetni(maddeler.length, maddeler.filter((m) => !m.yapildi).length);
}
