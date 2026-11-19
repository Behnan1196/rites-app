// Antrenman akışı (pilot 19 Kasım, P-133): listenin (rutinin) adımları egzersizlerdir; "Antrenmana
// başla" ile tek kayan sayfada egzersiz egzersiz ilerlenir. Bitince özet: süre, yapılan egzersiz,
// set ve tekrar, yeni rekorlar, "Nasıl geçti?" (1–5) ve not. Özet rutinin o günkü kaydına yazılır
// (`degerler.antrenman`, JSON).

import type { Blok, Kayit } from './kart';
import { setGecmisi, setHedefiOku, setleriOku, type SetHedefi } from './setler';
import type { Gun } from './tarih';

export interface AntrenmanAdimi {
  id: string;
  baslik: string;
  bloklar: readonly Blok[];
  kayitlar: readonly Kayit[];
  /** O gün yapıldı mı (listenin işareti). */
  yapildi: boolean;
}

export const ANTRENMAN_DEGERI = 'antrenman';

export interface AntrenmanKaydi {
  /** Saniye. */
  sure: number;
  /** 1–5; 0: verilmedi. */
  puan: number;
  not: string;
}

export function setBlogu(a: Pick<AntrenmanAdimi, 'bloklar'>): Blok | null {
  return a.bloklar.find((b) => b.tur === 'setler') ?? null;
}

/** Listede setli egzersiz var mı ("Antrenmana başla" için). */
export function antrenmanMi(adimlar: readonly Pick<AntrenmanAdimi, 'bloklar'>[]): boolean {
  return adimlar.some((a) => setBlogu(a) !== null);
}

function gununKaydi(kayitlar: readonly Kayit[], gun: Gun): Kayit | undefined {
  return kayitlar.find((k) => k.tarih === gun);
}

/** Egzersizin hedef yazısı: "3 × 10 · 20 kg" ya da setsizse boş. */
export function adimHedefi(a: Pick<AntrenmanAdimi, 'bloklar'>): SetHedefi | null {
  const b = setBlogu(a);
  return b ? setHedefiOku(b) : null;
}

/** İlk yapılmamış adımın sırası; hepsi yapıldıysa son adım. */
export function siradakiAdim(adimlar: readonly Pick<AntrenmanAdimi, 'yapildi'>[]): number {
  const i = adimlar.findIndex((a) => !a.yapildi);
  return i >= 0 ? i : Math.max(0, adimlar.length - 1);
}

export interface Rekor {
  ad: string;
  kg: number;
}

export interface AntrenmanOzeti {
  egzersiz: number;
  yapilanEgzersiz: number;
  set: number;
  tekrar: number;
  rekorlar: Rekor[];
}

/** Günün özeti; rekor: o günün en ağırı, daha önceki her günün en ağırından büyükse. */
export function antrenmanOzeti(adimlar: readonly AntrenmanAdimi[], gun: Gun): AntrenmanOzeti {
  let set = 0;
  let tekrar = 0;
  const rekorlar: Rekor[] = [];
  for (const a of adimlar) {
    const b = setBlogu(a);
    const k = gununKaydi(a.kayitlar, gun);
    if (!b || !k) continue;
    const yapilan = setleriOku(k, setHedefiOku(b), b.id).filter((s) => s.yapildi);
    set += yapilan.length;
    tekrar += yapilan.reduce((t, s) => t + s.tekrar, 0);
    const bugun = setGecmisi([k], b)[0]?.enAgir ?? null;
    const onceki = setGecmisi(a.kayitlar, b, gun)
      .map((g) => g.enAgir)
      .filter((n): n is number => n !== null);
    if (bugun !== null && onceki.length > 0 && bugun > Math.max(...onceki)) rekorlar.push({ ad: a.baslik, kg: bugun });
  }
  return {
    egzersiz: adimlar.length,
    yapilanEgzersiz: adimlar.filter((a) => a.yapildi).length,
    set,
    tekrar,
    rekorlar,
  };
}

/** "38 dk" · "1 sa 5 dk" · "45 sn" */
export function antrenmanSuresi(sn: number): string {
  const dk = Math.floor(sn / 60);
  if (dk === 0) return `${sn} sn`;
  if (dk < 60) return `${dk} dk`;
  return `${Math.floor(dk / 60)} sa ${dk % 60} dk`;
}

/** Geçen süre göstergesi: "12:40" · "1:05:12". */
export function gecenSure(sn: number): string {
  const s = Math.max(0, Math.floor(sn));
  const sa = Math.floor(s / 3600);
  const dk = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return sa > 0 ? `${sa}:${String(dk).padStart(2, '0')}:${ss}` : `${dk}:${ss}`;
}

export function antrenmanKaydiYaz(k: Kayit, a: AntrenmanKaydi): Kayit {
  return {
    ...k,
    degerler: {
      ...k.degerler,
      [ANTRENMAN_DEGERI]: JSON.stringify({ sure: Math.round(a.sure), puan: a.puan, not: a.not.trim() }),
    },
  };
}
