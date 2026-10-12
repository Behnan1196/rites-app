// Fotoğraf ve dosyalar telefonda, uygulamanın kendi klasöründe saklanır (`03`).
// Seçicilerin verdiği geçici kopya kalıcı klasöre taşınır.

import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { yeniKimlik } from './kimlik';

function klasor(): Directory {
  const d = new Directory(Paths.document, 'dosyalar');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

/** Geçici dosyayı kalıcı klasöre kopyalar; yeni adresini döndürür. */
export async function dosyayiSakla(geciciUri: string, ad?: string): Promise<string> {
  if (Platform.OS === 'web') return geciciUri; // tarayıcıda deneme için
  const kaynak = new File(geciciUri);
  const uzanti = (ad ?? kaynak.name).split('.').pop();
  const hedef = new File(klasor(), `${yeniKimlik()}${uzanti ? `.${uzanti}` : ''}`);
  await kaynak.copy(hedef);
  return hedef.uri;
}
