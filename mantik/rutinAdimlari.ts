// Rutin (pilot 5 Kasım, P-93): kartlardan oluşan kart (Sabah rutini). Rutin ajandada tek
// satır; adımları sıralı kartlardır (video, zamanlayıcı… olabilir), ajandada ayrıca görünmez,
// rutinin günlerini izler. Rutinin ekranında ve Giriş'teki Bugün sırada adımlar işaretlenir;
// son adım işaretlenince rutin kendiliğinden yapıldı (biri kaldırılınca geri alınır).

import type { Kart } from './kart';

export type RutinAdimi = Pick<Kart, 'id' | 'baslik'> & Pick<Partial<Kart>, 'ustSira'>;

export function adimSirasi<T extends RutinAdimi>(adimlar: readonly T[]): T[] {
  return [...adimlar].sort((a, b) => (a.ustSira ?? 0) - (b.ustSira ?? 0));
}

export interface RutinDurumu<T extends RutinAdimi> {
  yapilan: number;
  toplam: number;
  /** Sıradaki yapılmamış adım; hepsi yapıldıysa null. */
  siradaki: T | null;
}

export function rutinDurumu<T extends RutinAdimi>(
  adimlar: readonly T[],
  yapilanlar: ReadonlySet<string>,
): RutinDurumu<T> {
  const sirali = adimSirasi(adimlar);
  const yapilan = sirali.filter((a) => yapilanlar.has(a.id)).length;
  return { yapilan, toplam: sirali.length, siradaki: sirali.find((a) => !yapilanlar.has(a.id)) ?? null };
}

/** "3/9" */
export function rutinIlerlemeMetni(d: { yapilan: number; toplam: number }): string {
  return `${d.yapilan}/${d.toplam}`;
}
