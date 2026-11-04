// Ölçümlerin gidişatı (pilot 4 Kasım, P-87): kartın ⋯ → Gidişat. Son günler satır satır, her
// ölçüm bir sütun; hücrede o günün değeri, zemininin koyuluğu değerin büyüklüğü (Sayarak'ta
// hedefe, Puan'da 5'e, Sayı'da bu dönemin en küçüğü ile en büyüğü arasına göre). Yorum yok:
// kişi "kahvenin az olduğu günler" ile "enerji"yi yan yana görür. Üstte son 7 günün ortalaması.

import type { Blok, Kayit } from './kart';
import { gunEkle, type Gun } from './tarih';

export const GIDISAT_PARCALARI = ['adet', 'olcum', 'puan'] as const;

export interface GidisatSutunu {
  id: string;
  ad: string;
  birim: string;
  tur: (typeof GIDISAT_PARCALARI)[number];
}

export interface GidisatHucresi {
  deger: number | null;
  /** 0–1: zeminin koyuluğu. */
  yogunluk: number;
}

export interface GidisatTablosu {
  sutunlar: GidisatSutunu[];
  /** En yeni gün başta. */
  satirlar: { gun: Gun; yapildi: boolean; hucreler: GidisatHucresi[] }[];
  /** Son 7 günün ortalaması (değer girilen günler); hiç yoksa null. */
  ortalama: (number | null)[];
}

const VARSAYILAN_AD: Record<GidisatSutunu['tur'], string> = { adet: 'Sayı', olcum: 'Ölçüm', puan: 'Puan' };

export function olcumParcalariMi(bloklar: readonly Pick<Blok, 'tur'>[]): boolean {
  return bloklar.some((b) => (GIDISAT_PARCALARI as readonly string[]).includes(b.tur));
}

/** "72,5" ya da "72.5" → 72.5; boş ya da sayı değilse null. */
export function sayiOku(metin: string | undefined): number | null {
  if (metin === undefined) return null;
  const t = metin.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** 3 → "3"; 7.25 → "7,3". */
export function sayiMetni(n: number): string {
  const y = Math.round(n * 10) / 10;
  return String(y).replace('.', ',');
}

export function gidisatTablosu(
  bloklar: readonly Blok[],
  kayitlar: readonly Kayit[],
  bugunGun: Gun,
  gunSayisi = 28,
): GidisatTablosu {
  const sutunlar: GidisatSutunu[] = bloklar
    .filter((b): b is Blok & { tur: GidisatSutunu['tur'] } => (GIDISAT_PARCALARI as readonly string[]).includes(b.tur))
    .map((b) => ({ id: b.id, ad: b.ad.trim() || VARSAYILAN_AD[b.tur], birim: b.birim.trim(), tur: b.tur }));
  const gunune = new Map(kayitlar.map((k) => [k.tarih, k]));
  const gunler = Array.from({ length: gunSayisi }, (_, i) => gunEkle(bugunGun, -i));
  const degerler = gunler.map((g) =>
    sutunlar.map((s) => {
      const k = gunune.get(g);
      const n = sayiOku(k?.degerler[s.id]);
      // Sayarak'ta değer yazılmamış gün 0 değil boş (o gün kart açılmamış olabilir).
      return n;
    }),
  );
  const olcekler = sutunlar.map((s, j) => {
    const blok = bloklar.find((b) => b.id === s.id);
    if (s.tur === 'puan') return { alt: 0, ust: 5 };
    if (s.tur === 'adet') {
      const hedef = blok?.dakika && blok.dakika > 0 ? blok.dakika : null;
      const enCok = Math.max(0, ...degerler.map((d) => d[j] ?? 0));
      return { alt: 0, ust: hedef ?? Math.max(1, enCok) };
    }
    const dolu = degerler.map((d) => d[j]).filter((x): x is number => x !== null);
    if (dolu.length === 0) return { alt: 0, ust: 1 };
    return { alt: Math.min(...dolu), ust: Math.max(...dolu) };
  });
  const yogunluk = (n: number | null, j: number) => {
    if (n === null) return 0;
    const { alt, ust } = olcekler[j]!;
    if (ust === alt) return 0.5;
    return Math.min(1, Math.max(0.08, (n - alt) / (ust - alt)));
  };
  const satirlar = gunler.map((gun, i) => ({
    gun,
    yapildi: !!gunune.get(gun)?.yapildi,
    hucreler: degerler[i]!.map((deger, j) => ({ deger, yogunluk: yogunluk(deger, j) })),
  }));
  const ortalama = sutunlar.map((_, j) => {
    const dolu = degerler
      .slice(0, 7)
      .map((d) => d[j])
      .filter((x): x is number => x !== null);
    return dolu.length ? dolu.reduce((a, b) => a + b, 0) / dolu.length : null;
  });
  return { sutunlar, satirlar, ortalama };
}
