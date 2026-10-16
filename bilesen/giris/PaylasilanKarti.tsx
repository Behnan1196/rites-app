// Gelenler'de başka uygulamadan paylaşılan bağlantı (pilot 16 Ekim): hazır bir
// kart gibi durur; YouTube videosuysa burada da oynatılır.
// Ajandama ekle (kart formu dolu açılır) · Kütüphaneme kaydet · Sil.

import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { kaynakAdi, youtubeVideosu } from '@/mantik/paylasimAl';
import type { Paylasilan } from '@/veri/paylasilanlar';

import { Dugme } from '../Dugme';
import { gomuluOynatmaVar, YoutubeOynatici } from '../kart/YoutubeOynatici';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function PaylasilanKarti({
  p,
  neZaman,
  onAjandayaEkle,
  onKutuphaneyeKaydet,
  onSil,
}: {
  p: Paylasilan;
  neZaman: string;
  onAjandayaEkle: () => void;
  onKutuphaneyeKaydet: () => void;
  onSil: () => void;
}) {
  const youtube = gomuluOynatmaVar ? youtubeVideosu(p.adres) : null;
  return (
    <View style={stiller.kart}>
      <Yazi tur="ikincil">{`${kaynakAdi(p.adres)}'dan paylaştın · ${neZaman}`}</Yazi>
      <Yazi tur="kartBasligi">{p.baslik}</Yazi>
      {youtube ? (
        <YoutubeOynatici kimlik={youtube.kimlik} baslangic={youtube.baslangic} />
      ) : (
        <Pressable onPress={() => void Linking.openURL(p.adres)} accessibilityRole="link" hitSlop={6}>
          <Yazi tur="ikincil" renk={renk.ana} numberOfLines={1}>
            {p.adres}
          </Yazi>
        </Pressable>
      )}
      <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Kütüphaneme kaydet" onPress={onKutuphaneyeKaydet} />
      <Dugme etiket="Ajandama ekle" onPress={onAjandayaEkle} />
      <Dugme tur="tehlike" etiket="Sil" onPress={onSil} />
    </View>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 8,
  },
});
