import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

type Tur = 'ana' | 'vurgu' | 'ikincil' | 'yazi' | 'tehlike';

interface Ozellikler {
  etiket: string;
  onPress: () => void;
  tur?: Tur;
  pasif?: boolean;
  style?: StyleProp<ViewStyle>;
  erisimIpucu?: string;
  /** Yazı rengini zorla (ör. çerçeveli kırmızı "Sil ve kapat"). */
  yaziRengi?: string;
}

/**
 * Düğmeler.
 * - ana: dolu deniz yeşili, büyük (ekranın tek ana düğmesi)
 * - vurgu: dolu kehribar ("+ Kart ekle", "Planı başlat")
 * - ikincil: beyaz, çerçeveli
 * - yazi: yalnız yazı (Vazgeç, Tamam, Kapat…)
 * - tehlike: kırmızı yazı (Sil…)
 */
export function Dugme({ etiket, onPress, tur = 'ana', pasif = false, style, erisimIpucu, yaziRengi }: Ozellikler) {
  const dolu = tur === 'ana' || tur === 'vurgu';
  const yaziRengiSecimi = yaziRengi ?? (dolu
    ? renk.yuzey
    : tur === 'tehlike'
      ? renk.hata
      : tur === 'ikincil'
        ? renk.yazi
        : renk.ana);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: pasif }}
      accessibilityHint={erisimIpucu}
      disabled={pasif}
      onPress={onPress}
      hitSlop={tur === 'yazi' || tur === 'tehlike' ? 8 : 0}
      style={({ pressed }) => [
        stiller.temel,
        dolu && stiller.buyuk,
        tur === 'ana' && { backgroundColor: renk.ana },
        tur === 'vurgu' && { backgroundColor: renk.vurgu },
        tur === 'ikincil' && stiller.ikincil,
        pasif && { opacity: 0.45 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Yazi kalinlik={dolu || tur === 'ikincil' ? 'kalin' : 'yariKalin'} renk={yaziRengiSecimi} style={dolu && stiller.buyukYazi}>
        {etiket}
      </Yazi>
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  temel: {
    minHeight: olcu.enAzDokunma,
    minWidth: olcu.enAzDokunma,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: olcu.kose.dugme,
  },
  buyuk: {
    minHeight: olcu.anaDugme,
    paddingHorizontal: 20,
  },
  buyukYazi: {
    fontSize: 19,
  },
  ikincil: {
    minHeight: 52,
    backgroundColor: renk.yuzey,
    borderWidth: 2,
    borderColor: renk.cizgi,
  },
});
