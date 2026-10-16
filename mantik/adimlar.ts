// "Proje adımları" bloğu (pilot 16 Ekim; deneme). Liste bloğundan farkı: işaretler
// güne bağlı değil, kalıcıdır; kart günden güne taşınsa da kaldığı yerden sürer.
// Her adımın yapıldığı gün tutulur. Bütün adımlar yapılınca kart yapıldı sayılır;
// tekrarlı kartsa dizisi o gün biter (ajandadan kalkar). Bir adımın işareti
// kaldırılırsa ikisi de geri alınır.
//
// Ürün sahibinin niyeti: rutin (Liste, her gün sıfırlanır) ile proje (Proje
// adımları) ayrımını burada denemek; ileride gerçek bir mini projeye büyütmek.

import type { Kart } from './kart';
import type { Gun } from './tarih';

export interface AdimDurumu {
  /** Her adımın (maddeler ile aynı sırada) yapıldığı gün; yapılmadıysa null. */
  yapilan: (Gun | null)[];
  /** Bütün adımların bittiği gün (kart o gün yapıldı sayıldı). */
  bitti: Gun | null;
  /** Tekrarlı kartın, bitince değiştirilen eski bitiş günü (geri almak için). */
  oncekiBitis: Gun | null;
}

export const BOS_ADIM_DURUMU: AdimDurumu = { yapilan: [], bitti: null, oncekiBitis: null };

/** Kayıttaki durum, adım sayısına göre düzeltilmiş. */
export function adimDurumu(ham: unknown, adimSayisi: number): AdimDurumu {
  const d = (ham ?? {}) as Partial<AdimDurumu>;
  const yapilan = Array.isArray(d.yapilan) ? d.yapilan : [];
  return {
    yapilan: Array.from({ length: adimSayisi }, (_, i) =>
      typeof yapilan[i] === 'string' ? (yapilan[i] as Gun) : null,
    ),
    bitti: typeof d.bitti === 'string' ? d.bitti : null,
    oncekiBitis: typeof d.oncekiBitis === 'string' ? d.oncekiBitis : null,
  };
}

export function ilerleme(d: AdimDurumu): { yapilan: number; toplam: number } {
  return { yapilan: d.yapilan.filter(Boolean).length, toplam: d.yapilan.length };
}

export function hepsiYapildiMi(d: AdimDurumu): boolean {
  return d.yapilan.length > 0 && d.yapilan.every(Boolean);
}

/** "3 / 7 adım" */
export function ilerlemeMetni(d: AdimDurumu): string {
  const { yapilan, toplam } = ilerleme(d);
  return `${yapilan} / ${toplam} adım`;
}

/**
 * Düzenlemeden sonra adımların işaretleri metne göre taşınır: aynı metinli adım
 * yapılmışsa yapılmış kalır (sırası değişse de). Yeni adım yapılmamış başlar.
 */
export function adimlariEsle(
  eskiMaddeler: readonly string[],
  eski: AdimDurumu,
  yeniMaddeler: readonly string[],
): AdimDurumu {
  const kullanilan = new Set<number>();
  const yapilan = yeniMaddeler.map((m) => {
    const i = eskiMaddeler.findIndex((e, j) => e === m && !kullanilan.has(j));
    if (i < 0) return null;
    kullanilan.add(i);
    return eski.yapilan[i] ?? null;
  });
  return { ...eski, yapilan };
}

export type KartEtkisi =
  /** Bütün adımlar bitti: o günün kaydı yapıldı; tekrarlıysa dizi o gün biter. */
  | { tur: 'bitti'; gun: Gun; bitis: Gun | null | undefined }
  /** Bitmişti, bir adım geri alındı: o günün kaydı geri alınır; tekrarlıysa eski bitiş döner. */
  | { tur: 'geriAlindi'; gun: Gun; bitis: Gun | null | undefined }
  | null;

/**
 * Bir adımı işaretler ya da işaretini kaldırır. Kartın nasıl etkileneceğini de
 * söyler (`bitis` undefined: kartın bitişine dokunulmaz).
 */
export function adimiDegistir(
  d: AdimDurumu,
  i: number,
  yapildi: boolean,
  gun: Gun,
  kart: Pick<Kart, 'tekrar' | 'bitis'>,
): { durum: AdimDurumu; etki: KartEtkisi } {
  if (i < 0 || i >= d.yapilan.length) return { durum: d, etki: null };
  const yeni: AdimDurumu = { ...d, yapilan: d.yapilan.map((g, j) => (j === i ? (yapildi ? gun : null) : g)) };
  const once = d.bitti !== null;
  const simdi = hepsiYapildiMi(yeni);
  if (!once && simdi) {
    return {
      durum: { ...yeni, bitti: gun, oncekiBitis: kart.tekrar ? kart.bitis : null },
      etki: { tur: 'bitti', gun, bitis: kart.tekrar ? gun : undefined },
    };
  }
  if (once && !simdi) {
    return {
      durum: { ...yeni, bitti: null, oncekiBitis: null },
      etki: { tur: 'geriAlindi', gun: d.bitti!, bitis: kart.tekrar ? d.oncekiBitis : undefined },
    };
  }
  return { durum: yeni, etki: null };
}
