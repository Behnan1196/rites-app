import { StyleSheet, View } from 'react-native';

import { Dugme } from './Dugme';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

export interface OnaySecenegi {
  etiket: string;
  /** ana: dolu · ikincil: çerçeveli · tehlike: kırmızı çerçeveli · yazi: yalnız yazı (Vazgeç) */
  tur?: 'ana' | 'ikincil' | 'tehlike' | 'yazi';
  onPress: () => void;
}

interface Ozellikler {
  baslik: string;
  aciklama?: string | null;
  secenekler: OnaySecenegi[];
}

/**
 * Ortada beyaz onay kutusu; düğmeler alt alta, tam genişlik.
 * Bulunduğu alanın tamamını kaplar (alttan sayfanın içinde de kullanılabilsin diye
 * kendi Modal'ı yoktur).
 */
export function OnayKutusu({ baslik, aciklama, secenekler }: Ozellikler) {
  return (
    <View style={stiller.perde} accessibilityViewIsModal>
      <View style={stiller.kutu} accessibilityRole="alert">
        <Yazi tur="bolumBasligi" style={stiller.baslik}>
          {baslik}
        </Yazi>
        {!!aciklama && (
          <Yazi tur="ikincil" style={stiller.aciklama}>
            {aciklama}
          </Yazi>
        )}
        <View style={stiller.dugmeler}>
          {secenekler.map((s) => (
            <Dugme
              key={s.etiket}
              etiket={s.etiket}
              onPress={s.onPress}
              tur={s.tur === 'tehlike' ? 'ikincil' : (s.tur ?? 'ana')}
              style={s.tur === 'tehlike' ? stiller.tehlikeDugme : undefined}
              yaziRengi={s.tur === 'tehlike' ? renk.hata : undefined}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  perde: {
    ...StyleSheet.absoluteFill,
    backgroundColor: renk.perde,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  kutu: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.onay,
    padding: 24,
  },
  baslik: { textAlign: 'center' },
  aciklama: { textAlign: 'center', marginTop: 8 },
  dugmeler: { gap: 12, marginTop: 20 },
  tehlikeDugme: { borderColor: renk.hata },
});
