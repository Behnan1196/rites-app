// Hızlı Not kutusu kapalıyken Ajandam başlığının altında "Notlarım (N) ›" (G-7, `05` §10).

import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { kutuAcikMi } from '@/mantik/giris';
import { useSorgu } from '@/veri/kancalar';
import { notlariOku } from '@/veri/notlar';

import { useKutuSirasi } from '../giris/GirisAyari';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

export function NotlarimBaglantisi() {
  const sira = useKutuSirasi();
  const kapali = !!sira && !kutuAcikMi(sira, 'not');
  const notlar = useSorgu(['not'], async (oku) => (await notlariOku(oku)).length, []);
  if (!kapali || notlar.yukleniyor) return null;
  return (
    <Pressable
      onPress={() => router.push('/giris/notlar')}
      accessibilityRole="button"
      style={stiller.bag}
      hitSlop={6}
    >
      <Yazi kalinlik="kalin" renk={renk.ana}>{`Notlarım (${notlar.veri}) ›`}</Yazi>
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  bag: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
