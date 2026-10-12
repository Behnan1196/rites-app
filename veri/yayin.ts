// Değişiklik yayını: yazma kapısı bir şey yazınca hangi konuların
// değiştiğini duyurur; ekranlar ilgilendikleri konulara abone olur.

/**
 * Veritabanında değişebilecek konular. Yeni tablolar geldikçe eklenir.
 * `kart`: kartlar, blokları ve günlük kayıtları.
 */
export type Konu = 'ayar' | 'kart';

export type Dinleyici = (degisenler: ReadonlySet<Konu>) => void;

export interface Yayin {
  /** Verilen konulardan biri değişince dinleyiciyi çağırır. Aboneliği bitiren fonksiyon döner. */
  abone(konular: readonly Konu[], dinleyici: Dinleyici): () => void;
  /** Konuların değiştiğini duyurur. Her dinleyici bir duyuruda en çok bir kez çağrılır. */
  duyur(konular: readonly Konu[]): void;
}

export function yayinOlustur(): Yayin {
  const aboneler = new Set<{ konular: ReadonlySet<Konu>; dinleyici: Dinleyici }>();

  return {
    abone(konular, dinleyici) {
      const kayit = { konular: new Set(konular), dinleyici };
      aboneler.add(kayit);
      return () => {
        aboneler.delete(kayit);
      };
    },
    duyur(konular) {
      if (konular.length === 0) return;
      const degisenler: ReadonlySet<Konu> = new Set(konular);
      // Duyuru sırasında abonelik değişirse (ekran kapanırsa) şaşmamak için kopya üzerinde dön.
      for (const kayit of [...aboneler]) {
        if (!aboneler.has(kayit)) continue;
        for (const konu of degisenler) {
          if (kayit.konular.has(konu)) {
            kayit.dinleyici(degisenler);
            break;
          }
        }
      }
    },
  };
}
