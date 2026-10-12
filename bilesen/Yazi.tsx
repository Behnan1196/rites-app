import { Text, type TextProps } from 'react-native';

import { trBuyuk } from '@/mantik/metin';

import { boyut, renk, yazi, type Kalinlik } from './tema';

type Tur =
  | 'ekranBasligi'
  | 'bolumBasligi'
  | 'kartBasligi'
  | 'govde'
  | 'ikincil'
  | 'etiket'
  | 'kutuBasligi';

const TURLER: Record<Tur, { boyut: number; kalinlik: Kalinlik; renk: string; satirAraligi: number }> = {
  ekranBasligi: { boyut: boyut.ekranBasligi, kalinlik: 'kalin', renk: renk.yazi, satirAraligi: 32 },
  bolumBasligi: { boyut: boyut.bolumBasligi, kalinlik: 'kalin', renk: renk.yazi, satirAraligi: 26 },
  kartBasligi: { boyut: boyut.kartBasligi, kalinlik: 'kalin', renk: renk.yazi, satirAraligi: 24 },
  govde: { boyut: boyut.govde, kalinlik: 'normal', renk: renk.yazi, satirAraligi: 24 },
  ikincil: { boyut: boyut.ikincil, kalinlik: 'normal', renk: renk.ikincil, satirAraligi: 22 },
  etiket: { boyut: boyut.etiket, kalinlik: 'normal', renk: renk.ikincil, satirAraligi: 19 },
  kutuBasligi: { boyut: boyut.etiket, kalinlik: 'kalin', renk: renk.ikincil, satirAraligi: 19 },
};

interface Ozellikler extends TextProps {
  tur?: Tur;
  kalinlik?: Kalinlik;
  renk?: string;
}

/**
 * Uygulamadaki bütün yazılar. `kutuBasligi` Türkçe kurallara göre büyük harfe
 * çevrilir ("BUGÜN SIRADA") ve harf aralığı 0,5 olur.
 */
export function Yazi({ tur = 'govde', kalinlik, renk: renkSecimi, style, children, ...geri }: Ozellikler) {
  const t = TURLER[tur];
  const icerik =
    tur === 'kutuBasligi' && typeof children === 'string' ? trBuyuk(children) : children;
  return (
    <Text
      {...geri}
      style={[
        yazi(kalinlik ?? t.kalinlik),
        { fontSize: t.boyut, lineHeight: t.satirAraligi, color: renkSecimi ?? t.renk },
        tur === 'kutuBasligi' && { letterSpacing: 0.5 },
        style,
      ]}
    >
      {icerik}
    </Text>
  );
}
