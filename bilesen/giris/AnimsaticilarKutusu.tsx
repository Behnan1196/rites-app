// Giriş'teki Anımsatıcılar kutusu (`05` §7): çalan varsa "Şimdi çalıyor" ve
// Durdur / Ertele; yoksa sıradaki ve "bugün N kez daha".

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { erteleMetni, girisOzeti, kalanMetni } from '@/mantik/animsatici';

import { useAnimsatmalar } from '../animsatici/useAnimsatmalar';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const ac = () => router.push('/giris/animsaticilar');

export function AnimsaticilarKutusu() {
  const kisaMesaj = useKisaMesaj();
  const { yukleniyor, animsaticilar, animsatmalar, durdur, ertele } = useAnimsatmalar();
  if (yukleniyor) return null;
  const { calan, siradaki, kalan } = girisOzeti(animsatmalar);
  const hata = (e: unknown) => {
    console.error('Anımsatıcı değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  if (calan) {
    return (
      <View style={[stiller.kutu, stiller.calan]}>
        <Pressable onPress={ac} accessibilityRole="button" style={stiller.calanUst}>
          <Yazi tur="kutuBasligi" renk={renk.hata}>{`Şimdi çalıyor · ${calan.gosterilen}`}</Yazi>
          <Yazi tur="bolumBasligi">{calan.animsatici.ad}</Yazi>
        </Pressable>
        <View style={stiller.dugmeler}>
          <Dugme etiket="Durdur" onPress={() => void durdur(calan).catch(hata)} style={stiller.esnek} />
          <Dugme
            tur="ikincil"
            etiket={erteleMetni(calan.animsatici.erteleDk)}
            onPress={() => void ertele(calan).catch(hata)}
            style={stiller.esnek}
          />
        </View>
      </View>
    );
  }

  const ust = animsaticilar.length === 0 ? 'Anımsatıcılar' : `Anımsatıcılar · ${kalanMetni(kalan)}`;
  const alt =
    animsaticilar.length === 0
      ? 'Henüz anımsatıcın yok.'
      : siradaki
        ? `Sıradaki: ${siradaki.gosterilen} · ${siradaki.animsatici.ad}`
        : 'Bugünkü anımsatmalar bitti';

  return (
    <Pressable
      onPress={ac}
      accessibilityRole="button"
      accessibilityLabel={`${ust}. ${alt}`}
      style={({ pressed }) => [stiller.kutu, stiller.sakin, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.simge}>
        <Ionicons name="notifications-outline" size={24} color={renk.vurguYazi} />
      </View>
      <View style={stiller.esnek}>
        <Yazi tur="kutuBasligi" renk={renk.vurguYazi}>
          {ust}
        </Yazi>
        <Yazi kalinlik="kalin" style={stiller.alt}>
          {alt}
        </Yazi>
      </View>
      <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  sakin: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76 },
  simge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: renk.vurguAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  alt: { fontSize: 18 },
  calan: { borderColor: renk.hata, borderWidth: 2, gap: 12 },
  calanUst: { gap: 4 },
  dugmeler: { flexDirection: 'row', gap: 10 },
});
