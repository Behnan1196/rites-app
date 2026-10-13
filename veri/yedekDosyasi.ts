// Yedeğin dosya tarafı (`10` madde 10): tek JSON dosyası, parolasız.
// Yedek: veritabanı + fotoğraf/ses dosyaları → paylaşım sayfası ("Dosyalar'a kaydet").
// Geri yükleme: dosya seçici → denetim → onaydan sonra tek işlemde yazma.

import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { bugun } from '@/mantik/tarih';
import { yedekDosyaAdi, yedekSorunu, YEDEK_SORUNU_METNI, type YedekDosyasi } from '@/mantik/yedek';

import { ayarYaz } from './ayar';
import type { Kapi, Okuyucu } from './kapi';
import { veritabaniSurumu, yedegiYaz, yedekVerisi } from './yedek';

function dosyaKlasoru(): Directory {
  const d = new Directory(Paths.document, 'dosyalar');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

/** Yedek dosyasını hazırlar, paylaşım sayfasını açar; sayfa kapanınca son yedek günü yazılır. */
export async function yedekAl(oku: Okuyucu, kapi: Kapi): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Tarayıcıda yedek alınmaz.');
  const klasor = dosyaKlasoru();
  const yedek = await yedekVerisi(oku, klasor.uri);
  for (const oge of klasor.list()) {
    if (oge instanceof File) yedek.dosyalar[oge.name] = await oge.base64();
  }
  const gun = bugun();
  const hedef = new File(Paths.cache, yedekDosyaAdi(gun));
  if (hedef.exists) hedef.delete();
  hedef.create();
  hedef.write(JSON.stringify(yedek));
  await Sharing.shareAsync(hedef.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Yedeği kaydet',
  });
  await ayarYaz(kapi, 'son_yedek', gun);
}

export type YedekSecimi = { tur: 'vazgecildi' } | { tur: 'hata'; metin: string } | { tur: 'hazir'; yedek: YedekDosyasi };

/** Dosya seçtirir ve denetler; yazmaz. */
export async function yedekSec(oku: Okuyucu): Promise<YedekSecimi> {
  const sonuc = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (sonuc.canceled || !sonuc.assets[0]) return { tur: 'vazgecildi' };
  let veri: unknown;
  try {
    veri = JSON.parse(await new File(sonuc.assets[0].uri).text());
  } catch {
    return { tur: 'hata', metin: YEDEK_SORUNU_METNI.bicim };
  }
  const sorun = yedekSorunu(veri, await veritabaniSurumu(oku));
  return sorun ? { tur: 'hata', metin: YEDEK_SORUNU_METNI[sorun] } : { tur: 'hazir', yedek: veri as YedekDosyasi };
}

/** Onaydan sonra: dosyaları yazar, veritabanını yedektekiyle değiştirir. */
export async function yedegiGeriYukle(kapi: Kapi, yedek: YedekDosyasi): Promise<void> {
  const klasor = dosyaKlasoru();
  for (const [ad, icerik] of Object.entries(yedek.dosyalar ?? {})) {
    const f = new File(klasor, ad);
    if (!f.exists) f.create();
    f.write(icerik, { encoding: 'base64' });
  }
  await yedegiYaz(kapi, yedek, klasor.uri);
}

/** Yedekteki özet: "12 kart · 3 not · 2 plan" (onay kutusunda). */
export function yedekOzeti(yedek: YedekDosyasi): string {
  const say = (t: string) => yedek.tablolar[t]?.length ?? 0;
  const parcalar = [`${say('kart')} kart`, `${say('not')} not`, `${say('plan')} plan`, `${say('animsatici')} anımsatıcı`];
  return parcalar.join(' · ');
}
