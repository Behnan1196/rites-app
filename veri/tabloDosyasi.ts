// P-120: tabloyu Excel'in açtığı CSV dosyası olarak paylaşım sayfasına verir.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { tabloCsv, tabloOku } from '@/mantik/tablo';

export async function tabloyuDisaVer(ad: string, blok: { metin: string; maddeler: readonly string[] }): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Tarayıcıda dosya verilmez.');
  const dosyaAdi = `${ad.replace(/[\\/:*?"<>|]/g, ' ').trim() || 'Tablo'}.csv`;
  const hedef = new File(Paths.cache, dosyaAdi);
  if (hedef.exists) hedef.delete();
  hedef.create();
  hedef.write(tabloCsv(tabloOku(blok)));
  await Sharing.shareAsync(hedef.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle: ad,
  });
}
