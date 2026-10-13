// Giriş: selam ve tarih yok; kutular kayıtlı sırasıyla (G-7, `05` §10).
// Gelenler, Su ve Ortak Listeler kutuları kendi görevlerinde gelecek.

import { Fragment } from 'react';
import { StyleSheet } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { AnimsaticilarKutusu } from '@/bilesen/giris/AnimsaticilarKutusu';
import { BugunSirada } from '@/bilesen/giris/BugunSirada';
import { DevamEdenler } from '@/bilesen/giris/DevamEdenler';
import { useGirisAyari, useKutuSirasi } from '@/bilesen/giris/GirisAyari';
import { GununSorusu } from '@/bilesen/giris/GununSorusu';
import { HizliNot } from '@/bilesen/giris/HizliNot';
import type { KutuAnahtari } from '@/mantik/giris';

const KUTU_BILESENI: Partial<Record<KutuAnahtari, () => React.ReactNode>> = {
  not: () => <HizliNot />,
  bugun: () => <BugunSirada />,
  animsatici: () => <AnimsaticilarKutusu />,
  devam: () => <DevamEdenler />,
  soru: () => <GununSorusu />,
};

export default function Giris() {
  const sira = useKutuSirasi();
  const { girisAyariniAc } = useGirisAyari();
  return (
    <EkranKabi>
      {sira?.filter((a) => a.acik).map((a) => {
        const ciz = KUTU_BILESENI[a.k];
        return ciz ? <Fragment key={a.k}>{ciz()}</Fragment> : null;
      })}
      <Dugme tur="yazi" etiket="Giriş'te neler görünsün?" onPress={girisAyariniAc} style={stiller.ayar} />
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  ayar: { alignSelf: 'center' },
});
