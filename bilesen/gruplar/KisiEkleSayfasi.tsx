// "+ Kişi ekle" (KS-1): Adı, E-posta, "Telefon rehberinden seç".

import { presentContactPickerAsync } from 'expo-contacts/legacy';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { eklendiMetni, epostaDuzelt, kisiEklemeHatasi, kisiFormuHatasi, type Kisi } from '@/mantik/kisiler';
import { kisiyiEkle } from '@/sunucu/kisiler';
import { yeniKimlik } from '@/veri/kimlik';
import { kisiEkle } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { renk } from '../tema';

export function KisiEkleSayfasi({
  gorunur,
  onKapat,
  kisiler,
  ekledigim,
  onEklendi,
}: {
  gorunur: boolean;
  onKapat: () => void;
  kisiler: readonly Kisi[];
  ekledigim: number;
  onEklendi: () => void;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [ad, setAd] = useState('');
  const [eposta, setEposta] = useState('');
  const [hata, setHata] = useState<{ alan: 'ad' | 'eposta'; metin: string } | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const rehberden = async () => {
    try {
      const k = await presentContactPickerAsync();
      if (!k) return;
      if (k.name) setAd(k.name);
      const e = k.emails?.find((x) => x.email)?.email;
      if (e) setEposta(e);
      setHata(e ? null : { alan: 'eposta', metin: 'Bu kişinin rehberde e-postası yok; elle yaz.' });
    } catch (e) {
      console.warn('Rehber açılamadı', e);
    }
  };

  const ekle = async () => {
    const h = kisiFormuHatasi(ad, eposta, kisiler, ekledigim);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      const { sonuc, kullaniciId } = await kisiyiEkle(eposta);
      await kisiEkle(kapi, {
        id: yeniKimlik(),
        ad: ad.trim(),
        eposta: epostaDuzelt(eposta),
        kullaniciId,
        durum: sonuc,
        benEkledim: sonuc !== 'bagli',
      });
      kisaMesaj(eklendiMetni(ad.trim(), sonuc));
      onEklendi();
      onKapat();
    } catch (e) {
      setHata({ alan: 'eposta', metin: kisiEklemeHatasi(e instanceof Error ? e.message : String(e)) });
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Kişi ekle"
      solVazgec
      degisti={ad.trim() !== '' || eposta.trim() !== ''}
      altAlan={<Dugme etiket="Ekle" onPress={() => void ekle()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        <GirisAlani
          etiket="Adı"
          value={ad}
          onChangeText={(t) => {
            setAd(t);
            setHata(null);
          }}
          placeholder="Örneğin: Ali (eşim)"
          hata={hata?.alan === 'ad' ? hata.metin : null}
          returnKeyType="next"
        />
        <GirisAlani
          etiket="E-posta"
          value={eposta}
          onChangeText={(t) => {
            setEposta(t);
            setHata(null);
          }}
          placeholder="ornek@eposta.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          hata={hata?.alan === 'eposta' ? hata.metin : null}
          returnKeyType="done"
          onSubmitEditing={() => void ekle()}
        />
        {Platform.OS !== 'web' && (
          <Dugme tur="ikincil" etiket="Telefon rehberinden seç" yaziRengi={renk.ana} onPress={() => void rehberden()} />
        )}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({ kap: { gap: 14 } });
