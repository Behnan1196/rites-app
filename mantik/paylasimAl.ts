// Başka bir uygulamadan (ör. YouTube) Rites'a paylaşılan bağlantı → kart taslağı.
// Pilot kararı (16 Ekim; 14 Ekim kararının yerine): paylaşım Rites'ı açmaz,
// bağlantı Gelenler'de hazır bir kart olarak bekler; başlık videonun başlığı,
// içinde Video bloğu. "Ajandama ekle" yeni kart formunu bununla dolu açar.

import type { KartPaketi } from './paylasim';

/** Paylaşım eklentisinden gelen ham öğe (expo-sharing `SharePayload` ile uyumlu). */
export interface PaylasilanOge {
  value: string;
  shareType: string;
}

/** Paylaşım eklentisi her paylaşımın başına bu işaretle bir metin öğesi koyar (paylaşımlar birikir). */
export const PAYLASIM_ISARETI = 'rites-paylasim:';

/** Biriken öğeleri paylaşımlara böler; işaret yoksa hepsi tek paylaşımdır (eski eklenti). */
export function paylasimlaraBol(ogeler: readonly PaylasilanOge[]): PaylasilanOge[][] {
  const gruplar: PaylasilanOge[][] = [];
  let simdiki: PaylasilanOge[] | null = null;
  for (const o of ogeler) {
    if (o.shareType === 'text' && o.value.startsWith(PAYLASIM_ISARETI)) {
      simdiki = [];
      gruplar.push(simdiki);
      continue;
    }
    if (!simdiki) {
      simdiki = [];
      gruplar.push(simdiki);
    }
    simdiki.push(o);
  }
  return gruplar.filter((g) => g.length > 0);
}

const ADRES = /https?:\/\/[^\s<>"']+/i;

/** İlk bağlantıyı bulur: önce `url` türündeki öğe, yoksa metnin içindeki ilk adres. */
export function paylasilanAdres(ogeler: readonly PaylasilanOge[]): string | null {
  const url = ogeler.find((o) => o.shareType === 'url' && ADRES.test(o.value));
  if (url) return url.value.trim();
  for (const o of ogeler) {
    const m = ADRES.exec(o.value);
    if (m) return m[0].replace(/[).,;!?]+$/, '');
  }
  return null;
}

/** Bağlantının dışındaki metin (bazı uygulamalar başlığı da gönderir). */
export function paylasilanMetin(ogeler: readonly PaylasilanOge[]): string | null {
  for (const o of ogeler) {
    if (o.shareType !== 'text') continue;
    const metin = o.value.replace(ADRES, '').replace(/\s+/g, ' ').trim();
    if (metin) return metin;
  }
  return null;
}

const YOUTUBE = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;

export function youtubeMu(adres: string): boolean {
  try {
    return YOUTUBE.test(new URL(adres).hostname);
  } catch {
    return false;
  }
}

const KIMLIK = /^[A-Za-z0-9_-]{11}$/;

/** "90", "90s", "1m30s", "1h2m3s" → saniye; anlaşılmazsa 0. */
export function baslangicSaniyesi(t: string | null): number {
  if (!t) return 0;
  if (/^\d+s?$/.test(t)) return parseInt(t, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  if (!m || !t) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** YouTube bağlantısından video kimliği ve başlangıç saniyesi; YouTube değilse null. */
export function youtubeVideosu(adres: string): { kimlik: string; baslangic: number } | null {
  let u: URL;
  try {
    u = new URL(adres.trim());
  } catch {
    return null;
  }
  if (!YOUTUBE.test(u.hostname)) return null;
  let kimlik: string | null = null;
  const parcalar = u.pathname.split('/').filter(Boolean);
  if (/youtu\.be$/i.test(u.hostname)) kimlik = parcalar[0] ?? null;
  else if (u.searchParams.get('v')) kimlik = u.searchParams.get('v');
  else if (['shorts', 'embed', 'live', 'v'].includes(parcalar[0] ?? '')) kimlik = parcalar[1] ?? null;
  if (!kimlik || !KIMLIK.test(kimlik)) return null;
  return { kimlik, baslangic: baslangicSaniyesi(u.searchParams.get('t') ?? u.searchParams.get('start')) };
}

/** YouTube'un takip ekleri (`si`, `feature`, `pp`) atılır; video ve zaman (`v`, `t`, `list`) kalır. */
export function adresiTemizle(adres: string): string {
  try {
    const u = new URL(adres);
    if (!YOUTUBE.test(u.hostname)) return adres;
    for (const k of ['si', 'feature', 'pp']) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return adres;
  }
}

/** Başlığı anahtar gerektirmeden almak için YouTube oEmbed adresi. */
export function oembedAdresi(adres: string): string {
  return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(adres)}`;
}

/** oEmbed yanıtından başlık; yoksa null. */
export function oembedBasligi(yanit: unknown): string | null {
  const b = (yanit as { title?: unknown } | null)?.title;
  return typeof b === 'string' && b.trim() ? b.trim() : null;
}

export interface KartTaslagi {
  baslik: string;
  videoAdresi: string;
}

/** Başlık sırası: videonun başlığı → paylaşılan metin → "YouTube videosu" / site adı. */
export function paylasimTaslagi(adres: string, videoBasligi: string | null, metin: string | null): KartTaslagi {
  const temiz = adresiTemizle(adres);
  let yedek = 'Video';
  try {
    yedek = youtubeMu(temiz) ? 'YouTube videosu' : new URL(temiz).hostname.replace(/^www\./, '');
  } catch {
    // adres çözülemezse "Video"
  }
  return { baslik: (videoBasligi ?? metin ?? yedek).slice(0, 200), videoAdresi: temiz };
}

/** Gelenler'deki paylaşılan bağlantının kart paketi (Kütüphaneme kaydet için). */
export function paylasilanPaketi(t: KartTaslagi): KartPaketi {
  return {
    surum: 1,
    baslik: t.baslik,
    kisa: '',
    saat: null,
    tekrar: null,
    bloklar: [{ tur: 'video', ad: '', metin: t.videoAdresi, birim: '', dakika: null, maddeler: [] }],
  };
}

/** "YouTube" ya da site adı (Gelenler'de "… paylaştın" satırı için). */
export function kaynakAdi(adres: string): string {
  if (youtubeMu(adres)) return 'YouTube';
  try {
    return new URL(adres).hostname.replace(/^www\./, '');
  } catch {
    return 'Bağlantı';
  }
}

export const BAGLANTI_YOK = 'Paylaşılan içerikte bir bağlantı bulunamadı.';
