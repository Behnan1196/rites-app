// Rutin (pilot 5 Kasım, P-93): kartlardan oluşan kart (Sabah rutini). Rutin ajandada tek
// satır; adımları sıralı kartlardır (video, zamanlayıcı… olabilir), ajandada ayrıca görünmez,
// rutinin günlerini izler. Rutinin ekranında ve Giriş'teki Bugün sırada adımlar işaretlenir;
// son adım işaretlenince rutin kendiliğinden yapıldı (biri kaldırılınca geri alınır).

import type { Blok, BlokTuru, Kart } from './kart';

// ---- Listenin çeşidi (P-105) ---------------------------------------------------------
// Kartın listesi adım kartlarından oluşur; çeşit rutinin kendisinde (`kart.rutin`).

export const RUTIN_GUNLUK = 1;
export const RUTIN_KALICI = 2;
export const RUTIN_BILGI = 3;
export type RutinCesidi = typeof RUTIN_GUNLUK | typeof RUTIN_KALICI | typeof RUTIN_BILGI;

export const RUTIN_CESITLERI: readonly { cesit: RutinCesidi; ad: string; aciklama: string }[] = [
  { cesit: RUTIN_KALICI, ad: 'Adımlar', aciklama: 'İşaretlediğin kalır' },
  { cesit: RUTIN_GUNLUK, ad: 'Günlük kontrol', aciklama: 'Her gün baştan' },
  { cesit: RUTIN_BILGI, ad: 'Bilgi listesi', aciklama: 'İşaretsiz' },
];

export function rutinCesidi(k: Pick<Partial<Kart>, 'rutin'>): RutinCesidi | null {
  const c = k.rutin ?? 0;
  return c === RUTIN_GUNLUK || c === RUTIN_KALICI || c === RUTIN_BILGI ? c : null;
}

export function rutinCesitAdi(c: RutinCesidi): string {
  return RUTIN_CESITLERI.find((x) => x.cesit === c)!.ad;
}

/** Eski blok listesinin çeşidi → rutin çeşidi. */
export function listedenCesit(tur: BlokTuru): RutinCesidi {
  return tur === 'adimlar' ? RUTIN_KALICI : tur === 'bilgi' ? RUTIN_BILGI : RUTIN_GUNLUK;
}

/** Rutin çeşidi → blok listesi (paylaşım, kütüphane, program için; adımlar madde olur). */
export function cesittenListe(c: RutinCesidi): 'liste' | 'adimlar' | 'bilgi' {
  return c === RUTIN_KALICI ? 'adimlar' : c === RUTIN_BILGI ? 'bilgi' : 'liste';
}

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

/**
 * P-105: paylaşırken, birine verirken, kütüphaneye ya da programa koyarken adım kartları
 * çeşidine göre bir liste parçası olarak gider (adların sırasıyla).
 */
export function adimlarListeParcasi<B extends { id: string; kartId: string; sira: number }>(
  kart: Pick<Kart, 'id' | 'rutin'>,
  bloklar: readonly B[],
  adimlar: readonly RutinAdimi[],
): (B | Blok)[] {
  const c = rutinCesidi(kart);
  if (!c || adimlar.length === 0) return [...bloklar];
  const liste: Blok = {
    id: `${kart.id}-adimlar`,
    kartId: kart.id,
    sira: Math.max(0, ...bloklar.map((b) => b.sira)) + 1,
    tur: cesittenListe(c),
    ad: '',
    metin: '',
    birim: '',
    dakika: null,
    maddeler: adimSirasi(adimlar).map((a) => a.baslik),
    dosya: null,
  };
  return [...bloklar, liste];
}
