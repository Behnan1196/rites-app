// Başka bir uygulamadan (ör. YouTube) Rites'a paylaşılan bağlantı → kart taslağı.
// Pilot kararı (14 Ekim): paylaşılan video yeni kart formunu dolu açar; başlık
// videonun başlığı, içinde Video bloğu.

/** Paylaşım eklentisinden gelen ham öğe (expo-sharing `SharePayload` ile uyumlu). */
export interface PaylasilanOge {
  value: string;
  shareType: string;
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

export const BAGLANTI_YOK = 'Paylaşılan içerikte bir bağlantı bulunamadı.';
