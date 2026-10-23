// Ana ekranların kabı: güvenli alan, üst satır (başlık ya da geri, simgeler,
// avatar) ve kayan içerik.
// Sekme değişince içerik en başa döner (İS-1); açık sekmeye yeniden
// dokununca da başa kayar.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useScrollToTop } from 'expo-router';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { olcu, renk } from './tema';
import { UstCubuk } from './UstCubuk';
import { Yazi } from './Yazi';

/**
 * İçerikteki bir parça (ör. zamanlayıcı kadranı) parmakla çevrilirken ekranın
 * kaymasını durdurur: `const kilitle = useKaydirmaKilidi(); kilitle(true)`.
 */
const KaydirmaKilidi = createContext<(kilitli: boolean) => void>(() => undefined);
export const useKaydirmaKilidi = () => useContext(KaydirmaKilidi);

interface Ozellikler {
  baslik?: string;
  /** Başlık marka gibi (petrol renk) yazılsın: Giriş'teki "Rites". */
  marka?: boolean;
  altBaslik?: string;
  /** Alt ekranlarda sol üstteki "‹ [Geri gidilen yer]" (`04` Gezinme). */
  geri?: string;
  /** Geri düğmesinin işi; verilmezse bir önceki ekrana döner. */
  onGeri?: () => void;
  /** Sürükleme sırasında kaydırmayı durdurmak için. */
  kaydirilabilir?: boolean;
  /** Üst satırda avatarın solundaki simge düğmeleri (Ajandam: ara, süz, görünüm, takvim). */
  baslikSag?: ReactNode;
  /** Sağ üstte avatar (Profil · Ayarlar); P-34: yalnız Giriş. */
  avatar?: boolean;
  children?: ReactNode;
}

export function EkranKabi({
  baslik,
  marka = false,
  altBaslik,
  geri,
  onGeri,
  kaydirilabilir = true,
  baslikSag,
  avatar = false,
  children,
}: Ozellikler) {
  const kenar = useSafeAreaInsets();
  const kaydirma = useRef<ScrollView>(null);
  const [kilitli, setKilitli] = useState(false);
  const kilitle = useMemo(() => (k: boolean) => setKilitli(k), []);

  useScrollToTop(kaydirma);

  // Ekrandan ayrılırken başa al; geri gelindiğinde en baştan görünsün.
  useFocusEffect(useCallback(() => () => kaydirma.current?.scrollTo({ y: 0, animated: false }), []));

  return (
    <View style={[stiller.kap, { paddingTop: kenar.top }]}>
      <UstCubuk
        sol={
          geri ? (
            <Pressable
              onPress={onGeri ?? (() => router.back())}
              accessibilityRole="button"
              accessibilityLabel={`${geri} ekranına dön`}
              style={stiller.geri}
              hitSlop={6}
            >
              <Ionicons name="chevron-back" size={20} color={renk.ana} />
              <Yazi renk={renk.ana} style={stiller.geriYazi} numberOfLines={1}>
                {geri}
              </Yazi>
            </Pressable>
          ) : baslik ? (
            <Yazi
              tur="ekranBasligi"
              accessibilityRole="header"
              renk={marka ? renk.ana : undefined}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {baslik}
            </Yazi>
          ) : null
        }
        sag={baslikSag}
        avatar={avatar}
      />
      <ScrollView
        ref={kaydirma}
        scrollEnabled={kaydirilabilir && !kilitli}
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps="handled"
      >
        {((!!geri && !!baslik) || !!altBaslik) && (
          <View style={stiller.baslikAlani}>
            {!!geri && !!baslik && (
              <Yazi tur="ekranBasligi" accessibilityRole="header">
                {baslik}
              </Yazi>
            )}
            {!!altBaslik && <Yazi tur="ikincil">{altBaslik}</Yazi>}
          </View>
        )}
        <KaydirmaKilidi.Provider value={kilitle}>{children}</KaydirmaKilidi.Provider>
      </ScrollView>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: olcu.ekranKenari,
    paddingTop: 4,
    paddingBottom: 32,
    gap: olcu.bolumArasi,
  },
  baslikAlani: { gap: 4, marginBottom: 4 },
  geri: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    marginLeft: -4,
    maxWidth: '100%',
  },
  geriYazi: { fontSize: 18 },
});
