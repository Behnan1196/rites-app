// "Hesabımı sil" → "telefondakiler de silinsin": telefondaki bütün veri silinir
// (`07` → Gizlilik). Uygulama ilk açılıştaki gibi ad sorusuyla başlar.

import { Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { YEDEK_TABLOLARI } from '@/mantik/yedek';

import type { Kapi } from './kapi';

export async function telefondakileriSil(kapi: Kapi): Promise<void> {
  await kapi.yaz(['ayar', 'kart', 'not', 'plan', 'animsatici', 'kisi', 'kutuphane', 'paylasilan'], async (y) => {
    for (const t of [...YEDEK_TABLOLARI].reverse()) await y.calistir(`DELETE FROM "${t}"`);
  });
  if (Platform.OS !== 'web') {
    const d = new Directory(Paths.document, 'dosyalar');
    if (d.exists) d.delete();
  }
}
