// Giriş: selam ve tarih yok; kutular kayıtlı sırasıyla (G-7, `05` §10).
// Yarım kutular (Ortak Listeler; Su sonra) arka arkaya gelirse yan yana dizilir,
// tek kalırsa satırı doldurur. Su kutusu sonra gelecek.

import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { AnimsaticilarKutusu } from '@/bilesen/giris/AnimsaticilarKutusu';
import { BugunSirada } from '@/bilesen/giris/BugunSirada';
import { DevamEdenler } from '@/bilesen/giris/DevamEdenler';
import { GelenlerKutusu } from '@/bilesen/giris/GelenlerKutusu';
import { useGirisAyari, useKutuSirasi } from '@/bilesen/giris/GirisAyari';
import { GununSorusu } from '@/bilesen/giris/GununSorusu';
import { HizliNot } from '@/bilesen/giris/HizliNot';
import { OrtakListelerKutusu } from '@/bilesen/giris/OrtakListelerKutusu';
import { kutuSatirlari, type KutuAnahtari } from '@/mantik/giris';

const KUTU_BILESENI: Partial<Record<KutuAnahtari, () => React.ReactNode>> = {
  not: () => <HizliNot />,
  gelenler: () => <GelenlerKutusu />,
  bugun: () => <BugunSirada />,
  animsatici: () => <AnimsaticilarKutusu />,
  devam: () => <DevamEdenler />,
  soru: () => <GununSorusu />,
  ortak: () => <OrtakListelerKutusu />,
};

export default function Giris() {
  const sira = useKutuSirasi();
  const { girisAyariniAc } = useGirisAyari();
  return (
    <EkranKabi>
      {kutuSatirlari((sira ?? []).filter((a) => a.acik && KUTU_BILESENI[a.k]).map((a) => a.k)).map((satir) =>
        satir.length === 1 ? (
          <Fragment key={satir[0]}>{KUTU_BILESENI[satir[0]!]?.()}</Fragment>
        ) : (
          <View key={satir.join('-')} style={stiller.yanYana}>
            {satir.map((k) => (
              <Fragment key={k}>{KUTU_BILESENI[k]?.()}</Fragment>
            ))}
          </View>
        ),
      )}
      <Dugme tur="yazi" etiket="Giriş'te neler görünsün?" onPress={girisAyariniAc} style={stiller.ayar} />
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  ayar: { alignSelf: 'center' },
  yanYana: { flexDirection: 'row', gap: 12 },
});
