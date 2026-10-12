// Alttan açılan sayfa (`06` Biçimler, `05` §12).
//
// - Zemin #F3F5F7, üst köşeler 24, üstte 44×5 tutamaç, arkada yarı saydam perde.
// - Ekranın üstünden en az 54 pt boşluk kalır.
// - Kapatma yolları: "Vazgeç"/"Kapat" düğmesi, tutamaçtan aşağı kaydırma,
//   perdeye dokunma, Android geri tuşu. İçinde değişiklik varsa (`degisti`)
//   hepsi önce "Yazdıkların silinsin mi?" diye sorar.
// - Üst katmanda çizilir (bkz. Katman.tsx); kapalıyken hiçbir şey çizmez.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dugme } from './Dugme';
import { Katman } from './Katman';
import { OnayKutusu, type OnaySecenegi } from './OnayKutusu';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

interface SagEylem {
  etiket: string;
  onPress: () => void;
  pasif?: boolean;
}

interface Ozellikler {
  gorunur: boolean;
  /** Sayfa gerçekten kapanınca çağrılır; çağıran `gorunur`u false yapar. */
  onKapat: () => void;
  baslik?: string;
  /** Solda "Vazgeç" (kapatma isteği). */
  solVazgec?: boolean;
  /** Sağda kapatan yazı düğmesi: "Kapat", "Tamam", "Bitti"… */
  sagKapat?: string;
  /** Sağda kendi işini yapan yazı düğmesi: "Kaydet"… (`sagKapat` ile birlikte verilmez). */
  sagEylem?: SagEylem;
  /** İçinde kaydedilmemiş değişiklik var mı? */
  degisti?: boolean;
  /** Altta beyaz, üst çizgili eylem alanı (ör. büyük "Kaydet"). */
  altAlan?: ReactNode;
  /** Sayfa zemini (not sayfası sarıdır). */
  zemin?: string;
  /** Sayfanın üstünde gösterilecek onay kutusu (ör. "Hangi günler silinsin?"). */
  onay?: { baslik: string; aciklama?: string | null; secenekler: OnaySecenegi[] } | null;
  children: ReactNode;
}

const KAPATMA_ESIGI = 120;
const KAPANIS_SURESI = 200;

export function AltSayfa({
  gorunur,
  onKapat,
  baslik,
  solVazgec,
  sagKapat,
  sagEylem,
  degisti = false,
  altAlan,
  zemin = renk.zemin,
  onay = null,
  children,
}: Ozellikler) {
  const { height: ekranYuksekligi } = useWindowDimensions();
  const kenar = useSafeAreaInsets();
  // Kapanış animasyonu sürerken de çizili kalsın diye ayrı bir durum tutulur.
  const [kapaniyor, setKapaniyor] = useState(false);
  const [onaySoruluyor, setOnaySoruluyor] = useState(false);
  const [kayma] = useState(() => new Animated.Value(ekranYuksekligi));

  // Animasyonlar JS tarafında sürülür (useNativeDriver: false).
  //
  // Dikkat: animasyon sürerken bileşen yeniden çizilirse React Native
  // animasyonu yarıda kesebiliyor ve "bitti" geri çağrısı finished=false gelir.
  // Bu yüzden sayfanın açık/kapalı durumu animasyonun bitişine bağlanmaz:
  // - açılış yarıda kesilirse sayfa yerine (0) konur,
  // - kapanışta sayfa, animasyondan bağımsız bir zamanlayıcıyla çizimden kalkar.
  const acikRef = useRef(gorunur);
  useEffect(() => {
    acikRef.current = gorunur;
  }, [gorunur]);

  useEffect(() => {
    if (gorunur) {
      // Yeni açılışta eski onay sorusu kalmasın; kapanış yarıda kaldıysa iptal.
      /* eslint-disable react-hooks/set-state-in-effect -- açılış/kapanışa bağlı tek seferlik durum */
      setOnaySoruluyor(false);
      setKapaniyor(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      kayma.setValue(ekranYuksekligi);
      Animated.spring(kayma, { toValue: 0, useNativeDriver: false, bounciness: 0, speed: 16 }).start(
        ({ finished }) => {
          if (!finished && acikRef.current) kayma.setValue(0);
        },
      );
      return;
    }
    setKapaniyor(true);
    Animated.timing(kayma, { toValue: ekranYuksekligi, duration: KAPANIS_SURESI, useNativeDriver: false }).start();
    const zamanlayici = setTimeout(() => setKapaniyor(false), KAPANIS_SURESI + 60);
    return () => clearTimeout(zamanlayici);
    // Yalnız görünürlük değişince çalışır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gorunur]);

  const geriYerlestir = () =>
    Animated.spring(kayma, { toValue: 0, useNativeDriver: false, bounciness: 0, speed: 20 }).start();

  const istekKapat = () => {
    if (degisti) {
      geriYerlestir();
      setOnaySoruluyor(true);
    } else {
      onKapat();
    }
  };

  // Perde, sayfa aşağı indikçe açılır. Her çizimde yeniden kurulmasın.
  const perdeSaydamligi = useMemo(
    () =>
      kayma.interpolate({
        inputRange: [0, ekranYuksekligi],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [kayma, ekranYuksekligi],
  );

  // Android geri tuşu sayfayı kapatır.
  useEffect(() => {
    if (!gorunur) return;
    const abonelik = BackHandler.addEventListener('hardwareBackPress', () => {
      istekKapat();
      return true;
    });
    return () => abonelik.remove();
  });

  // Tutamaçtan aşağı kaydırma. Değişiklik durumu ya da kapatma işlevi değişince yeniden kurulur.
  const surukleme = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => kayma.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_e, g) => {
          if (g.dy > KAPATMA_ESIGI || g.vy > 1.2) istekKapat();
          else geriYerlestir();
        },
        onPanResponderTerminate: () => geriYerlestir(),
      }),
    // istekKapat ve geriYerlestir yalnız degisti, onKapat ve kayma'ya bağlı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [degisti, onKapat, kayma],
  );

  if (!gorunur && !kapaniyor) return null;

  return (
    <Katman>
      <KeyboardAvoidingView
        style={stiller.dolu}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents={gorunur ? 'auto' : 'none'}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: perdeSaydamligi }]}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: renk.perde }]}
            onPress={istekKapat}
            accessibilityRole="button"
            accessibilityLabel="Sayfayı kapat"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            stiller.sayfa,
            {
              backgroundColor: zemin,
              maxHeight: ekranYuksekligi - kenar.top - olcu.sayfaUstBosluk,
              transform: [{ translateY: kayma }],
            },
          ]}
        >
          <View {...surukleme.panHandlers}>
            <View style={stiller.tutamacAlani}>
              <View style={stiller.tutamac} />
            </View>
            {(baslik || solVazgec || sagKapat || sagEylem) && (
              <View style={stiller.ustSatir}>
                <View style={stiller.yan}>
                  {solVazgec && <Dugme tur="yazi" etiket="Vazgeç" onPress={istekKapat} />}
                </View>
                <Yazi tur="bolumBasligi" style={stiller.baslik} numberOfLines={1} accessibilityRole="header">
                  {baslik ?? ''}
                </Yazi>
                <View style={[stiller.yan, stiller.sag]}>
                  {sagKapat && <Dugme tur="yazi" etiket={sagKapat} onPress={istekKapat} />}
                  {sagEylem && (
                    <Dugme tur="yazi" etiket={sagEylem.etiket} onPress={sagEylem.onPress} pasif={sagEylem.pasif} />
                  )}
                </View>
              </View>
            )}
          </View>

          <ScrollView
            style={stiller.icerikKaydirma}
            contentContainerStyle={[
              stiller.icerik,
              !altAlan && { paddingBottom: kenar.bottom + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {altAlan && (
            <View style={[stiller.altAlan, { paddingBottom: Math.max(kenar.bottom, 12) + 8 }]}>
              {altAlan}
            </View>
          )}
        </Animated.View>

        {onay && !onaySoruluyor && <OnayKutusu {...onay} />}

        {onaySoruluyor && (
          <OnayKutusu
            baslik="Yazdıkların silinsin mi?"
            secenekler={[
              { etiket: 'Devam et', tur: 'ana', onPress: () => setOnaySoruluyor(false) },
              {
                etiket: 'Sil ve kapat',
                tur: 'tehlike',
                onPress: () => {
                  setOnaySoruluyor(false);
                  onKapat();
                },
              },
            ]}
          />
        )}
      </KeyboardAvoidingView>
    </Katman>
  );
}

const stiller = StyleSheet.create({
  dolu: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end' },
  sayfa: {
    borderTopLeftRadius: olcu.kose.sayfa,
    borderTopRightRadius: olcu.kose.sayfa,
    overflow: 'hidden',
  },
  tutamacAlani: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  tutamac: { width: 44, height: 5, borderRadius: 3, backgroundColor: renk.pasif },
  ustSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 56,
  },
  yan: { flex: 1, alignItems: 'flex-start' },
  sag: { alignItems: 'flex-end' },
  baslik: { flex: 2, textAlign: 'center' },
  icerikKaydirma: { flexGrow: 0, flexShrink: 1 },
  icerik: { paddingHorizontal: olcu.ekranKenari, paddingTop: 8, gap: olcu.bolumArasi },
  altAlan: {
    backgroundColor: renk.yuzey,
    borderTopWidth: 1,
    borderTopColor: renk.cizgi,
    paddingHorizontal: olcu.ekranKenari,
    paddingTop: 12,
  },
});
