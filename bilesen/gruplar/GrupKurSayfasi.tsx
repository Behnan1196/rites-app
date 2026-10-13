// "+ Grup kur" (GR-1): ad ve Kişilerim'den seçim; seçilenlere davet gider.
// Gruba yalnız bağlı olduğun kişiler çağrılabilir.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bagliKisiler, GRUP_FORMU_NOTU, grupFormuHatasi, grupHatasi, grupKurulduMetni } from '@/mantik/gruplar';
import { BAGLANAMIYOR, type Kisi } from '@/mantik/kisiler';
import { grupKur } from '@/sunucu/gruplar';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { SecimSatiri } from './parcalar';

export function GrupKurSayfasi({
  onKapat,
  kisiler,
  onKuruldu,
}: {
  onKapat: () => void;
  kisiler: readonly Kisi[];
  onKuruldu: (id: string) => void;
}) {
  const kisaMesaj = useKisaMesaj();
  const [ad, setAd] = useState('');
  const [secili, setSecili] = useState<ReadonlySet<string>>(new Set());
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const secilebilir = bagliKisiler(kisiler);

  const degistir = (id: string) =>
    setSecili((s) => {
      const y = new Set(s);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });

  const kur = async () => {
    const h = grupFormuHatasi(ad);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      const id = await grupKur(ad, [...secili]);
      kisaMesaj(grupKurulduMetni(ad, secili.size));
      onKuruldu(id);
      onKapat();
    } catch (e) {
      setHata(grupHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik="Grup kur"
      solVazgec
      degisti={ad.trim() !== '' || secili.size > 0}
      altAlan={<Dugme etiket="Grubu kur" onPress={() => void kur()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        <GirisAlani
          etiket="Grubun adı"
          value={ad}
          onChangeText={(t) => {
            setAd(t);
            setHata(null);
          }}
          placeholder="Örneğin: Aile, Yürüyüş grubu"
          hata={hata}
          returnKeyType="done"
        />
        <Yazi kalinlik="kalin">Kimler olsun?</Yazi>
        {secilebilir.length === 0 ? (
          <Yazi tur="ikincil">{"Gruba çağırabilmek için önce Kişilerim'den biriyle bağlanmalısın."}</Yazi>
        ) : (
          <Bolum style={stiller.liste}>
            {secilebilir.map((k, i) => (
              <SecimSatiri
                key={k.id}
                ad={k.ad}
                secili={secili.has(k.kullaniciId)}
                onPress={() => degistir(k.kullaniciId)}
                cizgili={i > 0}
              />
            ))}
          </Bolum>
        )}
        <Yazi tur="ikincil" renk={renk.ikincil}>
          {GRUP_FORMU_NOTU}
        </Yazi>
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  liste: { gap: 0, paddingVertical: 4 },
});
