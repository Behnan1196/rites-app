// Çoklu video (pilot 27 Ekim, P-53): bir video parçasında birden çok video; her birinin
// bağlantısı, isteğe bağlı başlığı, başlama ve bitiş saniyesi. Saklama: `blok.maddeler`
// her video için bir JSON; `blok.metin` ilk videonun bağlantısı (eski sürümler ve arama
// için). Eski kartta yalnız `metin` vardır: tek video.

import { baslangicSaniyesi } from './paylasimAl';

export interface Video {
  adres: string;
  /** Başlık (isteğe bağlı; seçicide gösterilmez, "Video 1" yazar). */
  baslik: string;
  /** Başlama ve bitiş (saniye); yoksa null. */
  bas: number | null;
  bit: number | null;
}

const sayi = (x: unknown): number | null =>
  typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.round(x) : null;

/** Parçanın videoları (eski tek bağlantılı biçim de). */
export function blokVideolari(b: { metin: string; maddeler: readonly string[] }): Video[] {
  const sonuc: Video[] = [];
  for (const m of b.maddeler) {
    try {
      const v = JSON.parse(m) as Record<string, unknown>;
      if (v && typeof v.adres === 'string' && v.adres.trim())
        sonuc.push({
          adres: v.adres.trim(),
          baslik: typeof v.baslik === 'string' ? v.baslik : '',
          bas: sayi(v.bas),
          bit: sayi(v.bit),
        });
    } catch {
      // eski / bozuk madde: atlanır
    }
  }
  if (sonuc.length === 0 && b.metin.trim()) sonuc.push({ adres: b.metin.trim(), baslik: '', bas: null, bit: null });
  return sonuc;
}

/** Videolar → parçanın alanları. */
export function videolarBlogu(videolar: readonly Video[]): { metin: string; maddeler: string[] } {
  return {
    metin: videolar[0]?.adres ?? '',
    maddeler: videolar.map((v) => JSON.stringify({ adres: v.adres, baslik: v.baslik, bas: v.bas, bit: v.bit })),
  };
}

/** "1:30", "1:02:03", "90" ya da "1m30s" → saniye; boş ya da geçersizse null. */
export function sureCoz(metin: string): number | null {
  const t = metin.trim();
  if (!t) return null;
  if (/^\d+(:\d{1,2}){1,2}$/.test(t)) return t.split(':').reduce((a, p) => a * 60 + Number(p), 0);
  if (/^\d+$/.test(t)) return Number(t);
  const s = baslangicSaniyesi(t);
  return s > 0 ? s : null;
}

/** Saniye → "1:30" / "1:02:03"; null → boş. */
export function sureYaz(sn: number | null): string {
  if (sn === null) return '';
  const sa = Math.floor(sn / 3600);
  const dk = Math.floor((sn % 3600) / 60);
  const s = sn % 60;
  const iki = (n: number) => String(n).padStart(2, '0');
  return sa > 0 ? `${sa}:${iki(dk)}:${iki(s)}` : `${dk}:${iki(s)}`;
}

/** Bağlantıdaki başlangıç (YouTube `t=`): başlama boşsa oradan. */
export function adrestekiBaslangic(adres: string): number | null {
  try {
    const u = new URL(adres.trim());
    const s = baslangicSaniyesi(u.searchParams.get('t') ?? u.searchParams.get('start'));
    return s > 0 ? s : null;
  } catch {
    return null;
  }
}
