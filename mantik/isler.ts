// İş (pilot 18 Ekim, grup etkinliklerinin beşincisi): Ortak iş ile Birinden iste
// tek türde. Kime? "Herkes" ise isteyen "Ben alırım" der; bir kişiyse o kişi kabul
// eder ya da reddeder (ret isteyene döner). Alanın ajandasına tek seferlik kart
// düşer (`bag`: `is:<id>`); tarih yoksa aldığı güne. Kartta "Yaptım" deyince grupta
// "Yapıldı" olur; yapılanlar 7 gün görünür.

import { yeniKart, type Kart } from './kart';
import type { Gun } from './tarih';

export type IsDurumu = 'acik' | 'istendi' | 'alindi' | 'reddedildi' | 'yapildi';
export type IsEylemi = 'al' | 'reddet' | 'birak' | 'yaptim' | 'geri';

export interface GrupIsi {
  id: string;
  grup: string;
  grupAdi: string;
  isteyen: string;
  baslik: string;
  tarih: Gun | null;
  /** null: herkese açık. */
  kime: string | null;
  durum: IsDurumu;
  alan: string | null;
  yapilma: string | null;
}

export const IS_ORNEKLERI = ['Eczaneye uğra', 'Faturayı öde', 'Okuldan al', 'Ekmek al', 'Kargoyu teslim al'] as const;

export const IS_NOTU = 'Alan kişinin ajandasına düşer; "Yaptım" deyince grupta yapıldı görünür (bir hafta).';

/** Satırdaki durum metni. */
export function isDurumMetni(i: GrupIsi, ben: string, ad: (id: string) => string): string {
  const kim = (id: string | null) => (id === ben ? 'Sen' : id ? ad(id) : '');
  switch (i.durum) {
    case 'acik':
      return 'Herkese açık · isteyen alır';
    case 'istendi':
      return i.kime === ben ? `${kim(i.isteyen)} senden istiyor` : `${kim(i.kime)} yanıtlayacak`;
    case 'alindi':
      return i.alan === ben ? 'Sende' : `${kim(i.alan)} aldı`;
    case 'reddedildi':
      return i.kime ? `${kim(i.kime)} alamadı` : 'Kimse almadı';
    case 'yapildi':
      return `Yapıldı · ${kim(i.alan)} ✓`;
  }
}

/** Kişinin bu işte yapabilecekleri (satırdaki düğmeler). */
export function isEylemleri(i: GrupIsi, ben: string): IsEylemi[] {
  if (i.durum === 'acik') return ['al'];
  if (i.durum === 'istendi' && i.kime === ben) return ['al', 'reddet'];
  if (i.durum === 'alindi' && i.alan === ben) return ['yaptim', 'birak'];
  if (i.durum === 'yapildi' && i.alan === ben) return ['geri'];
  return [];
}

export const EYLEM_ETIKETI: Record<IsEylemi, string> = {
  al: 'Ben alırım',
  reddet: 'Alamam',
  birak: 'Bırak',
  yaptim: 'Yaptım',
  geri: 'Geri al',
};

/** "İstendi" işinde "Ben alırım" yerine "Kabul et". */
export function eylemEtiketi(i: GrupIsi, e: IsEylemi): string {
  return e === 'al' && i.durum === 'istendi' ? 'Kabul et' : EYLEM_ETIKETI[e];
}

/** Grup ekranındaki sıra: önce bende olanlar ve benden istenenler, sonra açıklar, sonra öbürleri; yapılanlar en sonda. */
export function grubunIsleri(isler: readonly GrupIsi[], grup: string, ben: string): GrupIsi[] {
  const oncelik = (i: GrupIsi) => {
    if (i.durum === 'yapildi') return 4;
    if ((i.durum === 'istendi' && i.kime === ben) || (i.durum === 'alindi' && i.alan === ben)) return 0;
    if (i.durum === 'reddedildi' && i.isteyen === ben) return 0;
    if (i.durum === 'acik') return 1;
    return 2;
  };
  return isler.filter((i) => i.grup === grup).sort((a, b) => oncelik(a) - oncelik(b));
}

export function isFormuHatasi(baslik: string): string | null {
  return baslik.trim() ? null : 'İşe bir ad ver.';
}

export function isHatasi(mesaj: string): string | null {
  if (mesaj.includes('grup yok')) return 'Bu grubun üyesi değilsin.';
  if (mesaj.includes('yetki yok')) return 'Bunu yalnız işi isteyen değiştirebilir.';
  if (mesaj.includes('kime gecersiz')) return 'İşi grubun bir üyesine verebilirsin.';
  if (mesaj.includes('durum')) return 'Bu iş bu arada değişmiş; liste yenilendi.';
  if (mesaj.includes('ad yok')) return 'İşe bir ad ver.';
  return null;
}

// ---- Ajandadaki kart ve eşitleme ------------------------------------------------------

const ONEK = 'is:';

export function isBagi(id: string): string {
  return ONEK + id;
}

export function isBagCoz(bag: string | null): string | null {
  return bag?.startsWith(ONEK) ? bag.slice(ONEK.length) || null : null;
}

export function isKarti(id: string, i: Pick<GrupIsi, 'id' | 'baslik' | 'tarih' | 'grupAdi'>, bugunGun: Gun): Kart {
  return yeniKart(id, {
    baslik: i.baslik,
    kisa: 'Grup işi',
    tarih: i.tarih ?? bugunGun,
    kaynak: 'grup',
    gelenKimden: i.grupAdi,
    bag: isBagi(i.id),
  });
}

/**
 * Sunucu ile telefon arasındaki fark:
 * - bende olan (alındı ya da benim yaptığım) işin kartı yoksa eklenir;
 * - kartı yapıldıysa ama iş hâlâ "alındı"ysa sunucuya "yaptım", kart yapılmadıysa ama iş "yapıldı"ysa "geri";
 * - artık bende olmayan işin yapılmamış kartı silinir (yapılmışsa geçmiş olarak kalır).
 */
export function isEslemesi(
  kartlar: readonly { id: string; bag: string | null; yapildi: boolean }[],
  isler: readonly GrupIsi[],
  ben: string,
): { ekle: GrupIsi[]; sil: string[]; yaptim: string[]; geri: string[] } {
  const harita = new Map(isler.map((i) => [i.id, i]));
  const bende = (i: GrupIsi | undefined) => !!i && i.alan === ben && (i.durum === 'alindi' || i.durum === 'yapildi');
  const kartiOlan = new Set<string>();
  const sonuc = { ekle: [] as GrupIsi[], sil: [] as string[], yaptim: [] as string[], geri: [] as string[] };
  for (const k of kartlar) {
    const id = isBagCoz(k.bag);
    if (!id) continue;
    const i = harita.get(id);
    if (!bende(i)) {
      if (!k.yapildi) sonuc.sil.push(k.id);
      continue;
    }
    kartiOlan.add(id);
    if (k.yapildi && i!.durum === 'alindi') sonuc.yaptim.push(id);
    if (!k.yapildi && i!.durum === 'yapildi') sonuc.geri.push(id);
  }
  sonuc.ekle = isler.filter((i) => i.durum === 'alindi' && i.alan === ben && !kartiOlan.has(i.id));
  return sonuc;
}
