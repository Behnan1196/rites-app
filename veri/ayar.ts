// Ayarlar: anahtar–değer, değer JSON olarak saklanır (`03` → ayar).

import type { KutuAyari } from '@/mantik/giris';
import { adHatasi, adTemizle } from '@/mantik/metin';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu } from './kapi';

/** Bilinen ayarlar ve türleri. Yeni ayar buraya eklenir. */
export interface Ayarlar {
  /** Kullanıcının "Sana nasıl hitap edelim?" sorusuna verdiği ad. */
  ad: string;
  /** Giriş kutularının sırası ve açık/kapalı (`05` §10). */
  giris_kutulari: KutuAyari[];
  /** Son yedeğin günü. */
  son_yedek: Gun;
  /** Uygulamanın ilk açıldığı gün (hiç yedek yoksa 7 günlük soru için). */
  ilk_acilis: Gun;
  /** Telefonun bağlı olduğu e-posta: ilk girişte yazılır; başka e-postayla girilemez (13 Ekim kararı). */
  bagli_eposta: string;
}

export type AyarAnahtari = keyof Ayarlar;

export async function ayarOku<K extends AyarAnahtari>(
  oku: Okuyucu,
  anahtar: K,
): Promise<Ayarlar[K] | null> {
  const satir = await oku.ilk<{ deger: string }>('SELECT deger FROM ayar WHERE anahtar = ?', [anahtar]);
  if (!satir) return null;
  try {
    return JSON.parse(satir.deger) as Ayarlar[K];
  } catch {
    return null;
  }
}

export function ayarSil(kapi: Kapi, anahtar: AyarAnahtari): Promise<void> {
  return kapi.yaz(['ayar'], (y) => y.calistir('DELETE FROM ayar WHERE anahtar = ?', [anahtar]));
}

export function ayarYaz<K extends AyarAnahtari>(kapi: Kapi, anahtar: K, deger: Ayarlar[K]): Promise<void> {
  return kapi.yaz(['ayar'], (y) =>
    y.calistir(
      'INSERT INTO ayar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger',
      [anahtar, JSON.stringify(deger)],
    ),
  );
}

/**
 * Adı denetleyip kaydeder. Geçersizse kaydetmez ve kullanıcıya gösterilecek
 * mesajı döndürür; başarılıysa null.
 */
export async function adKaydet(kapi: Kapi, ham: string): Promise<string | null> {
  const hata = adHatasi(ham);
  if (hata) return hata;
  await ayarYaz(kapi, 'ad', adTemizle(ham));
  return null;
}
