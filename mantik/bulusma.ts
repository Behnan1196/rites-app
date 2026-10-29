// Buluşma (pilot 18 Ekim, grup etkinliklerinin ikincisi): grubun üyesi bir gün
// (isteğe bağlı saat ve yer) önerir; herkes Geliyorum / Belki / Gelemem der.
// "Geliyorum" diyenin ajandasına telefonda bir kart girer; kart buluşmaya
// `bag` alanıyla bağlıdır. Buluşma silinir, gün ya da saati değişir ya da yanıt
// değişirse kart kalkar (`kaldirilacakKartlar`).

import { gunEkle, uzunTarih, type Gun } from './tarih';
import { yeniKart, type Kart } from './kart';

export type BulusmaYaniti = 'geliyorum' | 'belki' | 'gelemem';

export interface Bulusma {
  id: string;
  grup: string;
  grupAdi: string;
  kuran: string;
  baslik: string;
  gun: Gun;
  saat: string | null;
  yer: string;
  /** Görüntülü görüşme bağlantısı (P-62); yoksa boş. Eski sunucuda alan yok. */
  baglanti?: string;
  yanitlar: { kullanici: string; yanit: BulusmaYaniti }[];
}

// ---- Görüntülü görüşme (pilot 29 Ekim, P-62) -------------------------------------------

export const GORUSME_NOTU =
  'WhatsApp\'ta Aramalar sekmesinde "Arama bağlantısı oluştur"a dokun, Görüntülü\'yü seç, bağlantıyı kopyala ve buraya yapıştır. Saatinde herkes "Görüşmeye katıl"a dokunur.';

const BILINEN_ALANLAR =
  /^(www\.|call\.whatsapp\.com|chat\.whatsapp\.com|wa\.me|meet\.google\.com|([a-z0-9-]+\.)?zoom\.us|facetime\.apple\.com)/i;

/** Yapıştırılan bağlantıyı düzeltir: boşlukları atar, "https://" eksikse ekler. */
export function gorusmeBaglantisi(metin: string): string {
  const t = metin.trim().replace(/\s+/g, '');
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return BILINEN_ALANLAR.test(t) ? `https://${t}` : t;
}

export function gorusmeBaglantisiHatasi(metin: string): string | null {
  const t = gorusmeBaglantisi(metin);
  if (!t) return null;
  if (!/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(t))
    return "Bu bir bağlantıya benzemiyor. WhatsApp'tan kopyaladığın bağlantıyı yapıştır.";
  if (t.length > 300) return 'Bağlantı çok uzun.';
  return null;
}

/** "WhatsApp" · "Google Meet" · "Zoom" · "FaceTime"; bilinmiyorsa null. */
export function gorusmeUygulamasi(baglanti: string | undefined): string | null {
  if (!baglanti) return null;
  if (/whatsapp\.com|wa\.me/i.test(baglanti)) return 'WhatsApp';
  if (/meet\.google\.com/i.test(baglanti)) return 'Google Meet';
  if (/zoom\.us/i.test(baglanti)) return 'Zoom';
  if (/facetime\.apple\.com/i.test(baglanti)) return 'FaceTime';
  return null;
}

export const YANITLAR: readonly { yanit: BulusmaYaniti; etiket: string }[] = [
  { yanit: 'geliyorum', etiket: 'Geliyorum' },
  { yanit: 'belki', etiket: 'Belki' },
  { yanit: 'gelemem', etiket: 'Gelemem' },
];

export const BULUSMA_ORNEKLERI = ['Akşam yemeği', 'Kahvaltı', 'Yürüyüş', 'Kahve', 'Film', 'Doğum günü'] as const;

export const BULUSMA_NOTU =
  '"Geliyorum" diyenin ajandasına düşer. Günü ya da saati değiştirirsen herkes yeniden yanıtlar.';

export function benimYanitim(b: Bulusma, ben: string): BulusmaYaniti | null {
  return b.yanitlar.find((y) => y.kullanici === ben)?.yanit ?? null;
}

/** "3 geliyor · 1 belki · 1 gelemiyor" (boşsa "Henüz yanıt yok"). */
export function yanitOzeti(b: Bulusma): string {
  const say = (y: BulusmaYaniti) => b.yanitlar.filter((x) => x.yanit === y).length;
  const parcalar = [
    say('geliyorum') && `${say('geliyorum')} geliyor`,
    say('belki') && `${say('belki')} belki`,
    say('gelemem') && `${say('gelemem')} gelemiyor`,
  ].filter(Boolean);
  return parcalar.length ? parcalar.join(' · ') : 'Henüz yanıt yok';
}

/** "Geliyor: Ali, Sen · Belki: Elif" */
export function yanitAyrintisi(b: Bulusma, ad: (id: string) => string): string {
  const grup = (y: BulusmaYaniti, etiket: string) => {
    const adlar = b.yanitlar.filter((x) => x.yanit === y).map((x) => ad(x.kullanici));
    return adlar.length ? `${etiket}: ${adlar.join(', ')}` : null;
  };
  return [grup('geliyorum', 'Geliyor'), grup('belki', 'Belki'), grup('gelemem', 'Gelemiyor')]
    .filter(Boolean)
    .join(' · ');
}

/** "25 Ekim Pazar · 19:30 · Bizde" */
export function bulusmaZamani(b: Pick<Bulusma, 'gun' | 'saat' | 'yer'>): string {
  return [uzunTarih(b.gun), b.saat, b.yer || null].filter(Boolean).join(' · ');
}

/** Grup ekranında gösterilenler: bugün ve sonrası, tarih sırasıyla. */
export function yaklasanlar(bulusmalar: readonly Bulusma[], grup: string, bugunGun: Gun): Bulusma[] {
  return bulusmalar.filter((b) => b.grup === grup && b.gun >= bugunGun);
}

export function bulusmaFormuHatasi(baslik: string, gun: Gun | null): string | null {
  if (!baslik.trim()) return 'Buluşmaya bir ad ver.';
  if (!gun) return 'Bir gün seç.';
  return null;
}

/** Sunucu hatası → metin (null: bağlantı sorunu). */
export function bulusmaHatasi(mesaj: string): string | null {
  if (mesaj.includes('grup yok')) return 'Bu grubun üyesi değilsin.';
  if (mesaj.includes('yetki yok')) return 'Buluşmayı yalnız kuran değiştirebilir.';
  if (mesaj.includes('ad yok')) return 'Buluşmaya bir ad ver.';
  return null;
}

// ---- Ajandadaki kart -----------------------------------------------------------

const ONEK = 'bulusma:';

/** Kartın buluşmaya bağı: "bulusma:<id>|<gün>|<saat>" (gün ya da saat değişince bağ kopar). */
export function bulusmaBagi(b: Pick<Bulusma, 'id' | 'gun' | 'saat'>): string {
  return `${ONEK}${b.id}|${b.gun}|${b.saat ?? ''}`;
}

export function bagCoz(bag: string | null): { id: string; imza: string } | null {
  if (!bag?.startsWith(ONEK)) return null;
  const [id, ...geri] = bag.slice(ONEK.length).split('|');
  return id ? { id, imza: geri.join('|') } : null;
}

/** "Geliyorum" denince ajandaya giren kart. Saatliyse 1 saat önce bildirim. */
export function bulusmaKarti(id: string, b: Bulusma): Kart {
  return yeniKart(id, {
    baslik: b.baslik,
    kisa: b.yer ? `Yer: ${b.yer}` : '',
    tarih: b.gun,
    saat: b.saat,
    hatirlatma: b.saat ? '1sa' : null,
    kaynak: 'grup',
    gelenKimden: b.grupAdi,
    bag: bulusmaBagi(b),
  });
}

/**
 * Sunucudaki duruma göre telefondan kalkacak buluşma kartları: buluşma artık yok
 * (silindi ya da gruptan çıkıldı; yalnız bugün ve sonrası için), gün ya da saati
 * değişti, ya da yanıtım artık "Geliyorum" değil. Geçmiş kartlara dokunulmaz.
 */
export function kaldirilacakKartlar(
  kartlar: readonly Pick<Kart, 'id' | 'bag' | 'tarih'>[],
  bulusmalar: readonly Bulusma[],
  ben: string,
  bugunGun: Gun,
): string[] {
  const harita = new Map(bulusmalar.map((b) => [b.id, b]));
  const sinir = gunEkle(bugunGun, -1);
  return kartlar
    .filter((k) => {
      const bag = bagCoz(k.bag);
      if (!bag) return false;
      if (k.tarih && k.tarih <= sinir) return false;
      const b = harita.get(bag.id);
      if (!b) return true;
      return bulusmaBagi(b) !== k.bag || benimYanitim(b, ben) !== 'geliyorum';
    })
    .map((k) => k.id);
}
