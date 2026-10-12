// İlk açılışta tek soru: "Sana nasıl hitap edelim?" (yalnız ad, zorunlu).

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AD_EN_UZUN } from '@/mantik/metin';
import { adKaydet } from '@/veri/ayar';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from './Dugme';
import { GirisAlani } from './GirisAlani';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

export function AdSorusu() {
  const { kapi } = useVeri();
  const kenar = useSafeAreaInsets();
  const [ad, setAd] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const devam = async () => {
    if (kaydediliyor) return;
    setKaydediliyor(true);
    try {
      // Başarılı olunca ad yayınlanır ve uygulama kendiliğinden Giriş'e geçer.
      setHata(await adKaydet(kapi, ad));
    } finally {
      setKaydediliyor(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[stiller.kap, { paddingTop: kenar.top, paddingBottom: kenar.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.marka}>
          Rites
        </Yazi>
        <View style={stiller.soru}>
          <Yazi tur="ekranBasligi" accessibilityRole="header">
            Sana nasıl hitap edelim?
          </Yazi>
          <GirisAlani
            etiket="Sana nasıl hitap edelim?"
            etiketGizli
            value={ad}
            onChangeText={(t) => {
              setAd(t);
              if (hata) setHata(null);
            }}
            placeholder="Adın"
            maxLength={AD_EN_UZUN}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
            returnKeyType="done"
            onSubmitEditing={devam}
            hata={hata}
          />
        </View>
      </ScrollView>
      <View style={stiller.alt}>
        <Dugme etiket="Devam et" onPress={devam} pasif={kaydediliyor} />
      </View>
    </KeyboardAvoidingView>
  );
}

const stiller = StyleSheet.create({
  kap: { flex: 1, backgroundColor: renk.zemin },
  icerik: { padding: olcu.ekranKenari, gap: 40 },
  marka: { fontSize: 28, lineHeight: 34, marginTop: 10 },
  soru: { gap: 20 },
  alt: { paddingHorizontal: olcu.ekranKenari, paddingVertical: 12 },
});
