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

/**
 * Sesli notu paylaşır ya da Dosyalar'a kaydettirir (pilot 21 Ekim): kayıt
 * okunur bir adla geçici klasöre kopyalanır ("Sesli not 21 Ekim 11.22.m4a").
 * Biçim m4a (AAC): iPhone kaydı böyle tutar; Mac, Windows ve telefonlar çalar.
 */
export async function sesliNotuPaylas(uri: string, ad: string): Promise<void> {
  const Sharing = await import('expo-sharing');
  if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) throw new Error('Paylaşım yok');
  const guvenli = ad.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80);
  const hedef = new File(Paths.cache, `${guvenli}.m4a`);
  if (hedef.exists) hedef.delete();
  await new File(uri).copy(hedef);
  await Sharing.shareAsync(hedef.uri, { mimeType: 'audio/mp4', UTI: 'public.mpeg-4-audio', dialogTitle: ad });
}
