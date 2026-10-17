// Kartta fotoğraf: dokununca tam ekranda açılır; iki parmakla büyütülür, çift
// dokunuş 2,5 kat yakınlaştırır / geri alır (pilot 17 Ekim, P-14). Yakınlaştırma
// iOS'un kendi kaydırma görünümüyle yapılır; ek yerel modül gerekmez.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const YAKIN = 2.5;

interface Ozellikler {
  uri: string;
  etiket: string;
  style?: StyleProp<ImageStyle>;
}

export function BuyutulebilirFoto({ uri, etiket, style }: Ozellikler) {
  const [acik, setAcik] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setAcik(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`${etiket}. Büyütmek için aç`}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <Image source={{ uri }} style={style} />
        <View style={stiller.rozet} pointerEvents="none">
          <Ionicons name="expand-outline" size={18} color="#fff" />
        </View>
      </Pressable>
      {acik && <TamEkran uri={uri} etiket={etiket} onKapat={() => setAcik(false)} />}
    </>
  );
}

function TamEkran({ uri, etiket, onKapat }: { uri: string; etiket: string; onKapat: () => void }) {
  const { width, height } = useWindowDimensions();
  const kenar = useSafeAreaInsets();
  const kaydirma = useRef<ScrollView>(null);
  const olcek = useRef(1);
  const sonDokunus = useRef(0);

  const ciftDokunus = (x: number, y: number) => {
    const sv = kaydirma.current;
    if (!sv) return;
    if (olcek.current > 1.01) {
      sv.scrollResponderZoomTo({ x: 0, y: 0, width, height, animated: true });
    } else {
      const w = width / YAKIN;
      const h = height / YAKIN;
      sv.scrollResponderZoomTo({ x: x - w / 2, y: y - h / 2, width: w, height: h, animated: true });
    }
  };

  return (
    <Modal visible animationType="fade" presentationStyle="overFullScreen" transparent onRequestClose={onKapat}>
      <View style={stiller.zemin} accessibilityViewIsModal>
        <ScrollView
          ref={kaydirma}
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{ width, height }}
          maximumZoomScale={6}
          minimumZoomScale={1}
          centerContent
          bouncesZoom
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={64}
          onScroll={(e) => {
            olcek.current = e.nativeEvent.zoomScale ?? 1;
          }}
        >
          <Pressable
            onPress={(e) => {
              const simdi = e.nativeEvent.timestamp;
              if (simdi - sonDokunus.current < 300) {
                sonDokunus.current = 0;
                ciftDokunus(e.nativeEvent.locationX, e.nativeEvent.locationY);
              } else sonDokunus.current = simdi;
            }}
            accessible={false}
          >
            <Image source={{ uri }} style={{ width, height }} resizeMode="contain" accessibilityLabel={etiket} />
          </Pressable>
        </ScrollView>
        <Pressable
          onPress={onKapat}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          hitSlop={8}
          style={({ pressed }) => [stiller.kapat, { top: kenar.top + 8 }, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const stiller = StyleSheet.create({
  rozet: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zemin: { flex: 1, backgroundColor: '#000' },
  kapat: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
