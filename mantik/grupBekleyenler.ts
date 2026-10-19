// Gruplardan bana bekleyenler (pilot 19 Ekim): yanıt bekleyen her şey Gelenler'e
// düşer, düğmeleriyle; yanıtlayınca kalkar. Üyenin grup ekranını açması gerekmez.
// - İş: benden istendi (gizlenemez) ya da herkese açık (gizlenebilir);
// - Buluşma: bugün ve sonrası, kuran ben değilim, henüz yanıtlamadım;
// - Oylama: açık, kuran ben değilim, oy vermedim (gizlenebilir);
// - Birlikte rutin: kuran ben değilim, katılmadım (gizlenebilir).
// Gizlenenler telefonda tutulur (`gelen_gizli` ayarı).

import { benimYanitim, type Bulusma } from './bulusma';
import type { GrupIsi } from './isler';
import { oylamaAcikMi, oylarim, type Karar } from './karar';
import { katildimMi, type Rutin } from './rutin';
import type { Gun } from './tarih';

export type Bekleyen =
  | { tur: 'is'; anahtar: string; grup: string; grupAdi: string; gizlenir: boolean; is: GrupIsi }
  | { tur: 'bulusma'; anahtar: string; grup: string; grupAdi: string; gizlenir: false; bulusma: Bulusma }
  | { tur: 'karar'; anahtar: string; grup: string; grupAdi: string; gizlenir: true; karar: Karar }
  | { tur: 'rutin'; anahtar: string; grup: string; grupAdi: string; gizlenir: true; rutin: Rutin };

export interface GrupIcerigi {
  isler: readonly GrupIsi[];
  bulusmalar: readonly Bulusma[];
  kararlar: readonly Karar[];
  rutinler: readonly Rutin[];
}

/** Gizlenenler en çok bu kadar tutulur (eskiler düşer). */
export const GIZLI_SINIRI = 200;

export function banaBekleyenler(
  ic: GrupIcerigi,
  ben: string,
  bugunGun: Gun,
  gizli: ReadonlySet<string> = new Set(),
): Bekleyen[] {
  const sonuc: Bekleyen[] = [];
  for (const i of ic.isler) {
    if (i.durum === 'istendi' && i.kime === ben)
      sonuc.push({ tur: 'is', anahtar: `is:${i.id}`, grup: i.grup, grupAdi: i.grupAdi, gizlenir: false, is: i });
    else if (i.durum === 'acik' && i.isteyen !== ben)
      sonuc.push({ tur: 'is', anahtar: `is:${i.id}`, grup: i.grup, grupAdi: i.grupAdi, gizlenir: true, is: i });
  }
  for (const b of ic.bulusmalar)
    if (b.gun >= bugunGun && b.kuran !== ben && benimYanitim(b, ben) === null)
      sonuc.push({
        tur: 'bulusma',
        anahtar: `bulusma:${b.id}`,
        grup: b.grup,
        grupAdi: b.grupAdi,
        gizlenir: false,
        bulusma: b,
      });
  for (const k of ic.kararlar)
    if (k.kuran !== ben && oylamaAcikMi(k, bugunGun) && oylarim(k, ben).length === 0)
      sonuc.push({
        tur: 'karar',
        anahtar: `karar:${k.id}`,
        grup: k.grup,
        grupAdi: k.grupAdi,
        gizlenir: true,
        karar: k,
      });
  for (const r of ic.rutinler)
    if (r.kuran !== ben && !katildimMi(r, ben))
      sonuc.push({
        tur: 'rutin',
        anahtar: `rutin:${r.id}`,
        grup: r.grup,
        grupAdi: r.grupAdi,
        gizlenir: true,
        rutin: r,
      });
  return sonuc.filter((b) => !(b.gizlenir && gizli.has(b.anahtar)));
}

/** Gruplar sekmesindeki satır için: grup başına bana bekleyen sayısı. */
export function grupBasinaBekleyen(bekleyenler: readonly Bekleyen[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const b of bekleyenler) m.set(b.grup, (m.get(b.grup) ?? 0) + 1);
  return m;
}

/** Gelenler kutusundaki özet parçası: "2 grup isteği" (boşsa null). */
export function bekleyenOzeti(bekleyenler: readonly Bekleyen[]): string | null {
  if (bekleyenler.length === 0) return null;
  return bekleyenler.length === 1 ? '1 grup isteği' : `${bekleyenler.length} grup isteği`;
}

/** Kuran için: kim henüz yanıtlamadı (gruptaki üyelerden, kuran hariç). */
export function yanitlamayanlar(uyeler: readonly string[], yanitlayanlar: readonly string[], kuran: string): string[] {
  const y = new Set(yanitlayanlar);
  return uyeler.filter((u) => u !== kuran && !y.has(u));
}

/** Gizli listesine ekler; en eskiler düşer. */
export function gizliyeEkle(gizli: readonly string[], anahtar: string): string[] {
  return [...gizli.filter((g) => g !== anahtar), anahtar].slice(-GIZLI_SINIRI);
}
