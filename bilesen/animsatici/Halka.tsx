// Dolan halka (zamanlayıcı; pilot 23 Ekim). SVG kitaplığı yok: iki yarım
// kırpma alanında döndürülen yarım halkalarla çizilir. Saat yönünde, tepeden.
//
// Yarım halka: üst ve sağ kenarı renkli bir çember 45° döndürülünce sağ yarıyı
// kaplar. Sağ kırpmada -135°'den başlayıp ilerlemeyle döner (ilk yarı); ikinci
// yarı sol kırpmada 45°'den başlar.

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { renk } from '../tema';

export function Halka({
  oran,
  boyut = 56,
  kalinlik = 6,
  dolu = renk.ana,
  bos = renk.anaAcik,
  children,
}: {
  /** 0…1; null: yalnız boş halka. */
  oran: number | null;
  boyut?: number;
  kalinlik?: number;
  dolu?: string;
  bos?: string;
  children?: ReactNode;
}) {
  const p = Math.min(1, Math.max(0, oran ?? 0));
  const yarim = boyut / 2;
  const yarimHalka = (derece: number, sol: number) => (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: sol,
        width: boyut,
        height: boyut,
        borderRadius: yarim,
        borderWidth: kalinlik,
        borderTopColor: dolu,
        borderRightColor: dolu,
        borderBottomColor: 'transparent',
        borderLeftColor: 'transparent',
        transform: [{ rotate: `${derece}deg` }],
      }}
    />
  );
  return (
    <View style={{ width: boyut, height: boyut }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: yarim, borderWidth: kalinlik, borderColor: bos }]} />
      {p > 0 && (
        <View style={{ position: 'absolute', top: 0, left: yarim, width: yarim, height: boyut, overflow: 'hidden' }}>
          {yarimHalka(-135 + 360 * Math.min(p, 0.5), -yarim)}
        </View>
      )}
      {p > 0.5 && (
        <View style={{ position: 'absolute', top: 0, left: 0, width: yarim, height: boyut, overflow: 'hidden' }}>
          {yarimHalka(45 + 360 * (p - 0.5), 0)}
        </View>
      )}
      <View style={[StyleSheet.absoluteFill, stiller.orta]}>{children}</View>
    </View>
  );
}

const stiller = StyleSheet.create({
  orta: { alignItems: 'center', justifyContent: 'center' },
});
