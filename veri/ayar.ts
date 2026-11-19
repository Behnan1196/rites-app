// Ayarlar: anahtar–değer, değer JSON olarak saklanır (`03` → ayar).

import type { KutuAyari } from '@/mantik/giris';
import type { KocBilgisi } from '@/mantik/kocPaketi';
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
  /** Gelenler'de "Gizle" denen grup istekleri (`mantik/grupBekleyenler`; pilot 19 Ekim). */
  gelen_gizli: string[];
  /** Ajanda (kart) hatırlatmalarının sesi (`mantik/sesler`); yoksa telefonun sesi. */
  hatirlatma_sesi: string | null;
  /** Gelenler'e bir şey düşünce telefona bildirim gelsin mi (sunucudan; pilot 19 Ekim). */
  gelen_bildirimi: boolean;
  /** İçerik kataloğunun telefondaki kopyası (`mantik/katalog`; pilot 20 Ekim). */
  katalog: unknown;
  /** Kataloğun en son indirilmeye çalışıldığı an (ISO). */
  katalog_denendi: string;
  /** P-81: telefondaki katalog hangi KATALOG_SURUMU ile indirildi. */
  katalog_surumu: number;
  /** Kütüphanem'de gizlenen öneriler (`p:<id>`, `k:<id>`). */
  gizli_oneriler: string[];
  /** Profil fotoğrafının telefondaki yolu (yalnız bu telefonda; sunucuya gitmez). */
  avatar: string | null;
  /** Giriş'teki zamanlayıcının ayarı (`mantik/zamanlayici`; P-42); okurken `zamanlayiciAyariCoz`. */
  zamanlayici: unknown;
  /** Uzman görünümü (P-51): kart formunda bütün parçalar, programda "N. gün". */
  uzman_gorunumu: boolean;
  /** Liste kartları Listelerim'e taşındı (P-58; bir kez). */
  listeler_tasindi: boolean;
  /** P-110: Listelerim (yerel_liste) liste kartlarına çevrildi. */
  listeler_karta: boolean;
  /** Alışveriş listelerine yazılan maddeler, en yeni başta (P-61: yazarken öneri; yalnız bu telefonda). */
  alisveris_gecmisi: string[];
  /** P-88: son kurulan anımsatıcının "Nasıl uyarsın?", sesi ve ertelemesi; yeni anımsatıcı bunlarla açılır. */
  son_animsatici: { alarm: boolean; ses: string | null; erteleDk: number };
  /** P-134: bağlı koç ve diyetisyen (şimdilik yalnız örnek; `mantik/kocPaketi`). */
  koc: KocBilgisi;
}

export type AyarAnahtari = keyof Ayarlar;

export async function ayarOku<K extends AyarAnahtari>(oku: Okuyucu, anahtar: K): Promise<Ayarlar[K] | null> {
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
