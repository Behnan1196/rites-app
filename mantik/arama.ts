// Ajandada arama (A-6, `05` §8) ve hafta başlığı.

import { gorunurMu, tekrarMetni } from './gorunurluk';
import type { Kart } from './kart';
import { trKucuk } from './metin';
import { AY_ADLARI, goreliTarih, gunEkle, uzunTarih, type Gun } from './tarih';

export const ARAMA_EN_AZ = 2;
/** Tekrarlı kartın "ilk görünür günü" en çok bu kadar ileride aranır. */
const ILERI_BAKIS = 366;

/** Aranacak metin: başlık, kısa açıklama, tekrar metni ve blokların içi. */
export function aramaMetni(kart: Kart, blokMetni: string): string {
  return trKucuk([kart.baslik, kart.kisa, kart.tekrar ? tekrarMetni(kart.tekrar) : '', blokMetni].join(' '));
}

/** Tekrarlı kartın bugünden itibaren ilk görünür günü; bulunamazsa başlangıcı. */
export function ilkGorunurGun(kart: Kart, bugunGun: Gun): Gun {
  for (let i = 0; i < ILERI_BAKIS; i++) {
    const g = gunEkle(bugunGun, i);
    if (gorunurMu(kart, g, bugunGun)) return g;
  }
  return kart.tarih ?? bugunGun;
}

export interface AramaSonucu<T extends Kart> {
  kart: T;
  /** "Bugün, 11 Ekim Pazar · 12:00" · "Tekrarlı · Her gün · 07:30" · "Tarihsiz adım" */
  nerede: string;
  /** "O güne git" ve "Kartı aç" için gün; tarihsiz adımda null. */
  gun: Gun | null;
}

/**
 * En az 2 harf; Türkçe büyük/küçük harf doğru eşleşir. Geçmiş, gelecek,
 * tekrarlı ve tarihsiz kartlar dahil. Sıra: tekrarlılar, tarihliler (tarihe
 * ve saate göre), tarihsizler.
 */
export function ara<T extends Kart>(
  kartlar: readonly T[],
  blokMetinleri: ReadonlyMap<string, string>,
  sorgu: string,
  bugunGun: Gun,
): AramaSonucu<T>[] {
  const q = trKucuk(sorgu.trim());
  if (q.length < ARAMA_EN_AZ) return [];
  const bulunan = kartlar.filter((k) => aramaMetni(k, blokMetinleri.get(k.id) ?? '').includes(q));

  const sonuclar = bulunan.map((kart): AramaSonucu<T> & { sira: string } => {
    if (kart.tarihsiz) return { kart, nerede: 'Tarihsiz adım', gun: null, sira: `2|${kart.baslik}` };
    const saat = kart.saat ? ` · ${kart.saat}` : '';
    if (kart.tekrar) {
      return {
        kart,
        nerede: `Tekrarlı · ${tekrarMetni(kart.tekrar)}${saat}`,
        gun: ilkGorunurGun(kart, bugunGun),
        sira: `0|${kart.saat ?? '99:99'}`,
      };
    }
    const gun = kart.tarih ?? bugunGun;
    const goreli = goreliTarih(gun, bugunGun);
    const uzun = uzunTarih(gun);
    return {
      kart,
      nerede: `${goreli === uzun ? '' : `${goreli}, `}${uzun}${saat}`,
      gun,
      sira: `1|${gun}|${kart.saat ?? '99:99'}`,
    };
  });
  return sonuclar.sort((a, b) => a.sira.localeCompare(b.sira)).map(({ sira: _s, ...s }) => s);
}

export function bulunduMetni(adet: number): string {
  return adet > 0 ? `${adet} kart bulundu` : 'Bu sözcükle bir kart bulunamadı.';
}

/** Hafta başlığı: "5 – 11 Ekim"; ay değişiyorsa "28 Eyl – 4 Eki". */
export function haftaBasligi(pazartesi: Gun): string {
  const pazar = gunEkle(pazartesi, 6);
  const ay = (g: Gun) => Number(g.slice(5, 7)) - 1;
  const gun = (g: Gun) => Number(g.slice(8));
  if (ay(pazartesi) === ay(pazar)) return `${gun(pazartesi)} – ${gun(pazar)} ${AY_ADLARI[ay(pazar)]}`;
  const kisa = (g: Gun) => `${gun(g)} ${AY_ADLARI[ay(g)]!.slice(0, 3)}`;
  return `${kisa(pazartesi)} – ${kisa(pazar)}`;
}
