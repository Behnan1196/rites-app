// Ortak listeler (GR-2, GR-4, `05` §9). Tek liste türü; maddeye isteğe bağlı
// Kime? / Ne zaman?. Ad, paylaşım ve silme yalnız listeyi kuranda; listeye
// erişen herkes madde ekler, işaretler, verir ve siler (10. görev kararı).

import { kisaGoreliTarih } from './ajanda';
import type { AdBulucu, SunucuKisisi } from './gruplar';
import type { KaynakliKart } from './kaynak';
import { gunEkle, type Gun } from './tarih';

export interface OrtakListe {
  id: string;
  ad: string;
  sahip: string;
  /** Listenin açık olduğu gruplar. */
  gruplar: { id: string; ad: string }[];
  /** Listenin doğrudan açık olduğu kişiler. */
  kisiler: string[];
  /** Listeyi gören herkes (sahip dahil). */
  uyeler: SunucuKisisi[];
  /** Yapılmamış madde sayısı. */
  kalan: number;
}

export interface Madde {
  id: string;
  liste: string;
  metin: string;
  yapildi: boolean;
  ekleyen: string | null;
  kime: string | null;
  tarih: Gun | null;
  sira: number;
}

/** Bana tarihle verilen madde (ajandada sanal kart). */
export interface BanaVerilen {
  id: string;
  metin: string;
  yapildi: boolean;
  tarih: Gun;
  liste: string;
  listeAdi: string;
}

export const GRUP_NOTU = 'Gruba sonradan katılan herkes bu listeyi de görür.';
export const GRUP_SECIM_NOTU = 'Gruba sonradan katılanlar da listeyi görür.';
export const MADDE_NOTU = 'İkisi de isteğe bağlı. Bir kişiye tarihle verilen madde o kişinin ajandasında görünür.';
export const BOS_LISTE = 'Liste boş. İlk maddeyi yukarıdan ekle.';

export function listeFormuHatasi(ad: string): string | null {
  return ad.trim() === '' ? 'Listeye bir ad ver.' : null;
}

/** Listenin paylaşıldığı kişiler, benim açımdan: kuran (ben değilsem) ve listeye eklenen kişiler. */
export function paylasimKisileri(liste: OrtakListe, ben: string, ad: AdBulucu): { id: string; ad: string }[] {
  const idler = [...new Set([liste.sahip, ...liste.kisiler])].filter((k) => k !== ben);
  return idler.map((k) => ({ id: k, ad: ad(liste.uyeler.find((u) => u.id === k) ?? k) }));
}

/** Ortak Listeler satırı: "Aile, Hasan Bey" (gruplar, sonra kişiler); kimse yoksa "Yalnız sen". */
export function kimlerleMetni(liste: OrtakListe, ben: string, ad: AdBulucu): string {
  const adlar = [...liste.gruplar.map((g) => g.ad), ...paylasimKisileri(liste, ben, ad).map((k) => k.ad)];
  return adlar.length ? adlar.join(', ') : 'Yalnız sen';
}

export function kisiSayisiMetni(liste: OrtakListe): string {
  return `${Math.max(1, liste.uyeler.length)} kişi`;
}

export function kalanMetni(kalan: number): string {
  return kalan > 0 ? `${kalan} madde kaldı` : 'Madde kalmadı';
}

/** "Sen ve Ali (eşim), Elif (kızım)"; kimse yoksa "Yalnız sen". */
export function uyelerMetni(liste: OrtakListe, ben: string, ad: AdBulucu): string {
  const digerleri = liste.uyeler.filter((u) => u.id !== ben).map((u) => ad(u));
  return digerleri.length ? `Sen ve ${digerleri.join(', ')}` : 'Yalnız sen';
}

/** "Sen ekledin" · "Elif (kızım) ekledi"; ekleyen bilinmiyorsa boş. */
export function ekleyenMetni(m: Madde, ben: string, ad: AdBulucu): string {
  if (!m.ekleyen) return '';
  return m.ekleyen === ben ? 'Sen ekledin' : `${ad(m.ekleyen)} ekledi`;
}

/** Maddenin altındaki etiket: "Ali (eşim) · Bugün", "Sen · Yarın", "15 Ekim"; ikisi de boşsa null. */
export function atamaEtiketi(
  m: Pick<Madde, 'kime' | 'tarih'>,
  ben: string,
  ad: AdBulucu,
  bugunGun: Gun,
): { metin: string; bana: boolean } | null {
  const parcalar = [m.kime ? ad(m.kime) : '', m.tarih ? kisaGoreliTarih(m.tarih, bugunGun) : ''].filter(Boolean);
  if (!parcalar.length) return null;
  return { metin: parcalar.join(' · '), bana: m.kime === ben };
}

/** Kime? seçenekleri: Kimse · Sen · listenin öteki üyeleri. */
export function kimeSecenekleri(liste: OrtakListe, ben: string, ad: AdBulucu): { id: string | null; etiket: string }[] {
  return [
    { id: null, etiket: 'Kimse' },
    { id: ben, etiket: 'Sen' },
    ...liste.uyeler.filter((u) => u.id !== ben).map((u) => ({ id: u.id, etiket: ad(u) })),
  ];
}

/** Ne zaman? hazır seçenekleri. */
export function zamanSecenekleri(bugunGun: Gun): { tarih: Gun | null; etiket: string }[] {
  return [
    { tarih: null, etiket: 'Tarih yok' },
    { tarih: bugunGun, etiket: 'Bugün' },
    { tarih: gunEkle(bugunGun, 1), etiket: 'Yarın' },
  ];
}

export function maddeleriSirala(maddeler: readonly Madde[]): Madde[] {
  return [...maddeler].sort((a, b) => a.sira - b.sira);
}

/** Listeye kişi olarak eklendiysem "Listeden ayrıl" diyebilirim; gruptan görüyorsam grubun adı döner. */
export function erisimYolu(liste: OrtakListe, ben: string): { tur: 'sahip' } | { tur: 'kisi' } | { tur: 'grup'; gruplar: string[] } {
  if (liste.sahip === ben) return { tur: 'sahip' };
  if (liste.kisiler.includes(ben)) return { tur: 'kisi' };
  return { tur: 'grup', gruplar: liste.gruplar.map((g) => g.ad) };
}

// ---- Ajandada sanal kart (`05` §9) --------------------------------------------------

export const MADDE_ONEKI = 'madde:';

export type MaddeKarti = KaynakliKart & { blokSayisi: number; maddeId: string; listeId: string };

/** Bana tarihle verilen madde o gün ajandamda kart gibi görünür (veritabanında kart yok). */
export function maddeKarti(m: BanaVerilen): MaddeKarti {
  return {
    id: MADDE_ONEKI + m.id,
    baslik: m.metin,
    kisa: '',
    tarih: m.tarih,
    tarihsiz: false,
    saat: null,
    hatirlatma: null,
    alarm: false,
    tekrar: null,
    bitis: null,
    atlanan: [],
    planId: null,
    kaynak: 'kendim',
    gelenKimden: null,
    kilitli: false,
    yapildi: m.yapildi,
    birakildi: false,
    sira: 0,
    blokSayisi: 0,
    listeAdi: m.listeAdi,
    maddeId: m.id,
    listeId: m.liste,
  };
}

export function maddeKartiMi(k: { id: string }): k is MaddeKarti {
  return k.id.startsWith(MADDE_ONEKI);
}

/** Sanal kartların "yapıldı" durumu gün bazında (madde tek bir güne aittir). */
export function maddeYapilanlari(maddeler: readonly BanaVerilen[]): Map<Gun, Set<string>> {
  const sonuc = new Map<Gun, Set<string>>();
  for (const m of maddeler) {
    if (!m.yapildi) continue;
    const s = sonuc.get(m.tarih) ?? new Set<string>();
    s.add(MADDE_ONEKI + m.id);
    sonuc.set(m.tarih, s);
  }
  return sonuc;
}

/** İki "yapılanlar" haritasını birleştirir (yeni harita döner). */
export function yapilanlariBirlestir(
  a: ReadonlyMap<Gun, ReadonlySet<string>> | undefined,
  b: ReadonlyMap<Gun, ReadonlySet<string>>,
): Map<Gun, Set<string>> {
  const sonuc = new Map<Gun, Set<string>>();
  for (const [g, s] of a ?? []) sonuc.set(g, new Set(s));
  for (const [g, s] of b) {
    const t = sonuc.get(g) ?? new Set<string>();
    for (const x of s) t.add(x);
    sonuc.set(g, t);
  }
  return sonuc;
}

/** Sunucu hatası → metin (null: bağlantı sorunu). */
export function listeHatasi(mesaj: string): string | null {
  if (mesaj.includes('bagli degil')) return 'Listeyi yalnız bağlı olduğun kişilere açabilirsin.';
  if (mesaj.includes('ad yok')) return 'Listeye bir ad ver.';
  return null;
}
