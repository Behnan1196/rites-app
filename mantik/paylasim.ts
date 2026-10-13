// Kart paylaşımı ve Gelenler (L-4, `05` §13). Paylaşılan kart bir kopyadır:
// tanımı gider, kayıtları (yapıldı, değerler) ve telefondaki dosyalar gitmez.

import type { BlokTuru, Kart, Tekrar } from './kart';
import { yeniKart } from './kart';
import type { Gun } from './tarih';

export interface PaketBlok {
  tur: BlokTuru;
  ad: string;
  metin: string;
  birim: string;
  dakika: number | null;
  maddeler: string[];
}

export interface KartPaketi {
  surum: 1;
  baslik: string;
  kisa: string;
  saat: string | null;
  tekrar: Tekrar | null;
  bloklar: PaketBlok[];
  /** Kütüphaneden paylaşılınca etiketler de gider (L-4); alıcı kaydederken önceden seçili gelir. */
  alanlar?: string[];
  etiketTur?: string;
}

/** Telefona bağlı içerik (fotoğraf, dosya) taşınmaz; o bloklar boş tanım olarak gider. */
export function kartPaketi(
  kart: Pick<Kart, 'baslik' | 'kisa' | 'saat' | 'tekrar'>,
  bloklar: readonly { tur: BlokTuru; ad: string; metin: string; birim: string; dakika: number | null; maddeler: string[] }[],
): KartPaketi {
  return {
    surum: 1,
    baslik: kart.baslik,
    kisa: kart.kisa,
    saat: kart.saat,
    tekrar: kart.tekrar,
    bloklar: bloklar
      .filter((b) => b.tur !== 'foto' && b.tur !== 'dosya')
      .map((b) => ({ tur: b.tur, ad: b.ad, metin: b.metin, birim: b.birim, dakika: b.dakika, maddeler: [...b.maddeler] })),
  };
}

const BLOK_ADI: Record<BlokTuru, string> = {
  talimat: 'Talimat',
  video: 'Video',
  liste: 'Liste',
  foto: 'Fotoğraf',
  dosya: 'Dosya',
  sayac: 'Zamanlayıcı',
  olcum: 'Ölçüm',
  gunnot: 'Günün notu',
  gelfoto: 'Gelişim fotoğrafı',
};

/** Gelenler'deki blok özeti: ["Liste", "Talimat", "Zamanlayıcı"]. */
export function blokOzeti(p: KartPaketi): string[] {
  return p.bloklar.map((b) => BLOK_ADI[b.tur] ?? b.tur);
}

export const GELEN_UYARISI = 'Bir yakınının önerisi. Sağlığınla ilgiliyse önce uzmanına danış.';

/** "Bugün Ajandama ekle": bugüne tek seferlik kopya, kaynak "gelen". */
export function gelenKarti(
  p: KartPaketi,
  kimden: string,
  bugunGun: Gun,
  kimlik: () => string,
): { kart: Kart; bloklar: (PaketBlok & { id: string; dosya: null })[] } {
  return {
    kart: yeniKart(kimlik(), {
      baslik: p.baslik,
      kisa: p.kisa,
      tarih: bugunGun,
      saat: p.saat,
      kaynak: 'gelen',
      gelenKimden: kimden,
      sira: Date.now(),
    }),
    bloklar: p.bloklar.map((b) => ({ ...b, id: kimlik(), dosya: null })),
  };
}

export function paketGecerliMi(veri: unknown): veri is KartPaketi {
  const p = veri as Partial<KartPaketi> | null;
  return !!p && typeof p.baslik === 'string' && Array.isArray(p.bloklar);
}

/** "Elif: Fırında sebzeli bulgur ve 2 tane daha" / "Şu an yeni bir şey yok" */
export function gelenlerOzeti(liste: readonly { kimden: string; baslik: string }[]): string {
  const ilk = liste[0];
  if (!ilk) return 'Şu an yeni bir şey yok';
  return `${ilk.kimden}: ${ilk.baslik}${liste.length > 1 ? ` ve ${liste.length - 1} tane daha` : ''}`;
}
