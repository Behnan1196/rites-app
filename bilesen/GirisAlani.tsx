import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { boyut, olcu, renk, yazi } from './tema';
import { Yazi } from './Yazi';

interface Ozellikler extends Omit<TextInputProps, 'style'> {
  /** Görünen etiket. Her giriş alanının etiketi vardır (erişilebilirlik). */
  etiket: string;
  /** Etiket ekranda görünmesin, yalnız ekran okuyucu okusun. */
  etiketGizli?: boolean;
  hata?: string | null;
}

/** Etiketli yazı alanı; hata varsa altında kısa, sakin bir satır. */
export const GirisAlani = forwardRef<TextInput, Ozellikler>(function GirisAlani(
  { etiket, etiketGizli = false, hata, onFocus, onBlur, ...geri },
  ref,
) {
  const [odakta, setOdakta] = useState(false);
  return (
    <View style={stiller.kap}>
      {!etiketGizli && (
        <Yazi kalinlik="kalin" style={stiller.etiket}>
          {etiket}
        </Yazi>
      )}
      <TextInput
        ref={ref}
        accessibilityLabel={etiket}
        placeholderTextColor={renk.soluk}
        selectionColor={renk.ana}
        onFocus={(e) => {
          setOdakta(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOdakta(false);
          onBlur?.(e);
        }}
        {...geri}
        style={[
          stiller.alan,
          yazi('normal'),
          geri.multiline && stiller.cokSatir,
          odakta && { borderColor: renk.yazi },
          !!hata && { borderColor: renk.hata },
        ]}
      />
      {!!hata && (
        <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite" style={stiller.hata}>
          {hata}
        </Yazi>
      )}
    </View>
  );
});

const stiller = StyleSheet.create({
  kap: { gap: 8 },
  cokSatir: { minHeight: 120, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  etiket: { marginBottom: 2 },
  alan: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: boyut.govde + 1,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.dugme,
  },
  hata: { marginTop: 2 },
});
