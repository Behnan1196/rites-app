// Zamanlayıcı kadranı (pilot 23 Ekim, P-32): eski mutfak zamanlayıcısı gibi.
// Tutamak halkanın üstünde parmakla çevrilir; bir tam tur 60 dk, adım 1 dk.
// Renkli yay seçilen süredir (tepeden saat yönünde). Kenarda her 5 dk'da çizgi,
// 0 · 15 · 30 · 45 yazar. Ortada süre ve Başlat.
//
// Yeni yerel modül yok: dokunuş View'un dokunma olaylarıyla, çizim View'larla. Çevirirken
// ekran kaymasın diye EkranKabi'nin kaydırması kilitlenir. Ekran okuyucuda
// halka "ayarlanabilir" öğedir (yukarı / aşağı kaydırınca 1 dk).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { KADRAN_DK, kadranAcisiDakika, kadranDegeri, kadranDokunusu } from '@/mantik/zamanlayici';

import { useKaydirmaKilidi } from '../EkranKabi';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { Halka } from './Halka';

const KUTU = 272;
const HALKA = 212;
const KALINLIK = 22;
const MERKEZ = KUTU / 2;
/** Halkanın orta çizgisi (tutamak burada). */
const R_HALKA = (HALKA - KALINLIK) / 2;
const R_CIZGI = HALKA / 2 + 9;
const R_SAYI = HALKA / 2 + 24;
const TUTAMAK = 36;

/** Kutudaki nokta (merkeze göre) → x, y (sol üst köşe). */
const konum = (r: number, dk: number, boyut: number) => {
  const a = (dk / KADRAN_DK) * 2 * Math.PI;
  return { left: MERKEZ + r * Math.sin(a) - boyut / 2, top: MERKEZ - r * Math.cos(a) - boyut / 2 };
};

export function Kadran({
  dk,
  onDegis,
  onBaslat,
  pasif,
}: {
  dk: number;
  onDegis: (dk: number) => void;
  onBaslat: () => void;
  pasif?: boolean;
}) {
  const kilitle = useKaydirmaKilidi();
  const deger = useRef(dk);
  /** Dokunuşun başladığı yerden kutunun sayfadaki sol üst köşesi. */
  const koken = useRef({ x: 0, y: 0 });
  useEffect(() => {
    deger.current = dk;
  }, [dk]);

  /** `ilk`: dokunulan yere doğrudan atlar; sürüklerken tepeden geçince sıçramaz. */
  const ayarla = (e: GestureResponderEvent, ilk = false) => {
    const dx = e.nativeEvent.pageX - koken.current.x - MERKEZ;
    const dy = e.nativeEvent.pageY - koken.current.y - MERKEZ;
    const ham = kadranAcisiDakika(dx, dy);
    const yeni = ilk ? kadranDokunusu(ham) : kadranDegeri(deger.current, ham);
    if (yeni !== deger.current) {
      deger.current = yeni;
      onDegis(yeni);
    }
  };
  const dokunus = {
    // Yalnız halkanın çevresine dokununca (ortadaki Başlat'a değil).
    onStartShouldSetResponder: (e: GestureResponderEvent) => {
      const dx = e.nativeEvent.locationX - MERKEZ;
      const dy = e.nativeEvent.locationY - MERKEZ;
      const uzaklik = Math.sqrt(dx * dx + dy * dy);
      return uzaklik > R_HALKA - 44 && uzaklik < KUTU / 2 + 8;
    },
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      koken.current = {
        x: e.nativeEvent.pageX - e.nativeEvent.locationX,
        y: e.nativeEvent.pageY - e.nativeEvent.locationY,
      };
      kilitle(true);
      ayarla(e, true);
    },
    onResponderMove: (e: GestureResponderEvent) => ayarla(e),
    onResponderRelease: () => kilitle(false),
    onResponderTerminate: () => kilitle(false),
  };

  const tutamak = konum(R_HALKA, dk, TUTAMAK);

  return (
    <View style={stiller.kutu} {...dokunus}>
      {/* Çizgiler ve sayılar (dokunuşu kutuya bırakır). */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: 12 }, (_, i) => {
          const d = i * 5;
          const p = konum(R_CIZGI, d, 0);
          const buyuk = d % 15 === 0;
          return (
            <View
              key={d}
              style={[
                stiller.cizgi,
                buyuk && stiller.buyukCizgi,
                {
                  left: p.left - (buyuk ? 1.5 : 1),
                  top: p.top - (buyuk ? 5 : 4),
                  transform: [{ rotate: `${d * 6}deg` }],
                },
              ]}
            />
          );
        })}
        {[0, 15, 30, 45].map((d) => {
          const p = konum(R_SAYI, d, 28);
          return (
            <View key={d} style={[stiller.sayi, p]}>
              <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
                {String(d)}
              </Yazi>
            </View>
          );
        })}
      </View>

      <View
        pointerEvents="none"
        style={stiller.halka}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Zamanlayıcının süresi"
        accessibilityValue={{ text: `${dk} dakika` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onDegis(Math.min(KADRAN_DK, Math.max(0, dk + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))
        }
      >
        <Halka oran={dk / KADRAN_DK} boyut={HALKA} kalinlik={KALINLIK} />
      </View>

      <View pointerEvents="none" style={[stiller.tutamak, tutamak]} />

      <View pointerEvents="box-none" style={stiller.orta}>
        <Yazi kalinlik="kalin" style={stiller.rakam} importantForAccessibility="no">
          {`${String(dk).padStart(2, '0')}:00`}
        </Yazi>
        <Pressable
          onPress={onBaslat}
          disabled={pasif}
          accessibilityRole="button"
          accessibilityLabel={`Başlat, ${dk} dakika`}
          accessibilityState={{ disabled: !!pasif }}
          style={({ pressed }) => [stiller.baslat, pasif && { opacity: 0.4 }, pressed && { opacity: 0.75 }]}
        >
          <Ionicons name="play" size={26} color={renk.yuzey} style={stiller.oynat} />
          <Yazi tur="etiket" kalinlik="kalin" renk={renk.yuzey}>
            Başlat
          </Yazi>
        </Pressable>
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: { width: KUTU, height: KUTU, alignSelf: 'center' },
  halka: { position: 'absolute', left: (KUTU - HALKA) / 2, top: (KUTU - HALKA) / 2 },
  cizgi: { position: 'absolute', width: 2, height: 8, borderRadius: 1, backgroundColor: renk.pasif },
  buyukCizgi: { width: 3, height: 10, backgroundColor: renk.ikincil },
  sayi: { position: 'absolute', width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  tutamak: {
    position: 'absolute',
    width: TUTAMAK,
    height: TUTAMAK,
    borderRadius: TUTAMAK / 2,
    backgroundColor: renk.yuzey,
    borderWidth: 3,
    borderColor: renk.ana,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  orta: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rakam: { fontSize: 34, lineHeight: 40, color: renk.yazi, fontVariant: ['tabular-nums'] },
  baslat: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oynat: { marginLeft: 3 },
});
