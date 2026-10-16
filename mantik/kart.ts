// Kart, blok ve günlük kayıt modeli (`03` → kart, blok, kayit).
// Kartın tanımı (ne, ne zaman, hangi bloklar) ile bir gündeki durumu (kayıt)
// ayrıdır: tekrarlı kartta her günün kaydı ayrıdır (K-12).

import type { AdimDurumu } from './adimlar';
import type { Gun, GunKisa } from './tarih';

export type HatirlatmaSecimi = 'saatinde' | '15dk' | '1sa';

export type TekrarDeseni = 'hergun' | 'haftaici' | 'haftasonu';

export interface Tekrar {
  /** Kaç gün sürecek (başlangıç dahil). null = süresiz. */
  gunSayisi: number | null;
  /** Yalnız bu günler. null ya da boş = her gün. */
  gunler: GunKisa[] | null;
  /** Hazır desen; varsa `gunler`in yerine geçer. */
  desen: TekrarDeseni | null;
}

export type KartKaynagi = 'kendim' | 'gelen' | 'koc';

export interface Kart {
  id: string;
  baslik: string;
  /** Kısa açıklama; boş olabilir. */
  kisa: string;
  /** Tek seferlik kartta günü, tekrarlıda başlangıcı; tarihsiz adımda null. */
  tarih: Gun | null;
  /** Yalnız plan adımı için true olabilir; hiçbir günde görünmez. */
  tarihsiz: boolean;
  /** "SS:dd" */
  saat: string | null;
  hatirlatma: HatirlatmaSecimi | null;
  /** Hatırlatma alarm olarak çalar (iOS 26; pilot 16 Ekim). */
  alarm: boolean;
  /** null = tek seferlik. */
  tekrar: Tekrar | null;
  /** "Bu gün ve sonrası" bölmesinde eski dizinin son günü. */
  bitis: Gun | null;
  /** "Yalnız bu gün" ile diziden çıkarılan günler. */
  atlanan: Gun[];
  planId: string | null;
  kaynak: KartKaynagi;
  /** Gelenler'den eklendiyse gönderenin adı (etiket için). */
  gelenKimden: string | null;
  /** Koç kartı (sonraki sürüm). */
  kilitli: boolean;
  /** Yalnız tek seferlik kart için kısa yol; asıl doğruluk kayıttadır. */
  yapildi: boolean;
  /** Geçmişten kalanlarda "Bırak" denmiş. */
  birakildi: boolean;
  /** Aynı gün içinde elle sıra (ileride). */
  sira: number;
}

export const ICERIK_BLOKLARI = ['talimat', 'video', 'liste', 'adimlar', 'foto', 'dosya'] as const;
export const KAYIT_BLOKLARI = ['sayac', 'olcum', 'gunnot', 'gelfoto'] as const;
export type BlokTuru = (typeof ICERIK_BLOKLARI)[number] | (typeof KAYIT_BLOKLARI)[number];

export interface Blok {
  id: string;
  kartId: string;
  sira: number;
  tur: BlokTuru;
  /** Ölçüm adı, zamanlayıcı adı, liste adı. */
  ad: string;
  /** Talimat metni, video bağlantısı. */
  metin: string;
  /** Ölçüm birimi. */
  birim: string;
  /** Zamanlayıcı süresi. */
  dakika: number | null;
  /** Liste maddeleri; proje adımları. */
  maddeler: string[];
  /** Yalnız "Proje adımları": kalıcı işaretler (güne bağlı değil). */
  durum?: AdimDurumu | null;
  /** Fotoğraf / dosya yerel yolu. */
  dosya: string | null;
}

/** Kartın bir gündeki durumu. Yoksa boş kabul edilir (`05` §2). */
export interface Kayit {
  kartId: string;
  tarih: Gun;
  yapildi: boolean;
  /** Ölçüm ve günün notu değerleri: blok kimliği → değer. */
  degerler: Record<string, string>;
  /** Liste işaretleri: blok kimliği → madde başına işaret. */
  isaretler: Record<string, boolean[]>;
  /** Gelişim fotoğrafları: blok kimliği → yerel yol. */
  fotolar: Record<string, string>;
}

export function bosKayit(kartId: string, tarih: Gun): Kayit {
  return { kartId, tarih, yapildi: false, degerler: {}, isaretler: {}, fotolar: {} };
}

/** Yeni kartın varsayılan alanları; yalnız başlık zorunlu (K-1). */
export function yeniKart(id: string, alanlar: Partial<Omit<Kart, 'id'>> & { baslik: string }): Kart {
  return {
    id,
    kisa: '',
    tarih: null,
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
    yapildi: false,
    birakildi: false,
    sira: 0,
    ...alanlar,
  };
}

export function tekrarliMi(kart: Kart): boolean {
  return kart.tekrar !== null;
}
