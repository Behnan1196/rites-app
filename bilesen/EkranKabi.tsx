// Ana ekranların kabı: güvenli alan, üst çubuk, başlık ve kayan içerik.
// Sekme değişince içerik en başa döner (İS-1); açık sekmeye yeniden
// dokununca da başa kayar.

import { useFocusEffect, useScrollToTop } from 'expo-router';
import { useCallback, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { olcu, renk } from './tema';
import { UstCubuk } from './UstCubuk';
import { Yazi } from './Yazi';

interface Ozellikler {
  baslik?: string;
  altBaslik?: string;
  children?: ReactNode;
}

export function EkranKabi({ baslik, altBaslik, children }: Ozellikler) {
  const kenar = useSafeAreaInsets();
  const kaydirma = useRef<ScrollView>(null);

  useScrollToTop(kaydirma);

  // Ekrandan ayrılırken başa al; geri gelindiğinde en baştan görünsün.
  useFocusEffect(
    useCallback(
      () => () => kaydirma.current?.scrollTo({ y: 0, animated: false }),
      [],
    ),
  );

  return (
    <View style={[stiller.kap, { paddingTop: kenar.top }]}>
      <UstCubuk />
      <ScrollView
        ref={kaydirma}
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps="handled"
      >
        {(baslik || altBaslik) && (
          <View style={stiller.baslikAlani}>
            {!!baslik && (
              <Yazi tur="ekranBasligi" accessibilityRole="header">
                {baslik}
              </Yazi>
            )}
            {!!altBaslik && <Yazi tur="ikincil">{altBaslik}</Yazi>}
          </View>
        )}
        {children}
      </ScrollView>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: olcu.ekranKenari,
    paddingTop: 8,
    paddingBottom: 32,
    gap: olcu.bolumArasi,
  },
  baslikAlani: { gap: 4, marginBottom: 4 },
});
