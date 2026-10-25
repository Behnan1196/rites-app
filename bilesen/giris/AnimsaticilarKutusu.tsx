// Giriş'teki Anımsatıcılar kutusu (`05` §7): çalan varsa "Şimdi çalıyor" ve
// Durdur / Ertele; yoksa sıradaki ve "bugün N kez daha".
// Pilot 23 Ekim: kurulu zamanlayıcılar saniye saniye geri sayan satırlarla
// (halka, Duraklat / Devam, İptal). P-32: başlık satırının sağındaki
// zamanlayıcı simgesi kutunun içinde kadranı açar. P-42: tek zamanlayıcı: biri
// çalışırken simge görünmez, kutuda yalnız onun satırı durur; +1 dk yok.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { erteleMetni, girisOzeti, kalanMetni } from '@/mantik/animsatici';
import { duraklatildiMi, zamanlayiciSurerMi } from '@/mantik/zamanlayici';
import { useSaniye } from '@/veri/useSimdi';

import { useAnimsatmalar } from '../animsatici/useAnimsatmalar';
import { ZamanlayiciKurucu } from '../animsatici/ZamanlayiciKurucu';
import { ZamanlayiciSatiri } from '../animsatici/ZamanlayiciSatiri';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { KutuSimgesi } from './KutuSimgesi';
import { ModulDugmesi } from './ModulDugmesi';

const ac = () => router.push('/giris/animsaticilar');

export function AnimsaticilarKutusu() {
  const kisaMesaj = useKisaMesaj();
  const [kuruluyor, setKuruluyor] = useState(false);
  const { yukleniyor, animsaticilar, animsatmalar, durdur, ertele } = useAnimsatmalar();
  // Çalışan (duraklatılmamış) zamanlayıcı varsa saniyede bir tazelenir.
  const sayanVar = animsaticilar.some((a) => a.bitis && !duraklatildiMi(a));
  const simdiMs = useSaniye(sayanVar);
  if (yukleniyor) return null;
  // Saati gelmiş ama saniyesi dolmamış zamanlayıcı henüz "çalıyor" sayılmaz.
  const { calan } = girisOzeti(
    animsatmalar.filter((m) => !(m.animsatici.bitis && new Date(m.animsatici.bitis).getTime() > simdiMs)),
  );
  // Sıradaki / kalan yalnız "Saatinde"lerden; zamanlayıcılar ayrı satırda.
  const { siradaki, kalan } = girisOzeti(animsatmalar.filter((m) => !m.animsatici.bitis));
  const sureler = animsaticilar.filter((a) => zamanlayiciSurerMi(a, simdiMs));
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

  const saatliVar = animsaticilar.some((a) => !a.bitis);
  const ust = saatliVar ? `Anımsatıcılar · ${kalanMetni(kalan)}` : 'Anımsatıcılar';
  const alt = !saatliVar
    ? sureler.length > 0
      ? 'Saatli anımsatıcın yok.'
      : 'Henüz anımsatıcın yok.'
    : siradaki
      ? `Sıradaki: ${siradaki.gosterilen} · ${siradaki.animsatici.ad}`
      : 'Bugünkü anımsatmalar bitti';

  return (
    <View style={[stiller.kutu, stiller.dikey]}>
      <View style={stiller.ustSatir}>
        <Pressable
          onPress={ac}
          accessibilityRole="button"
          accessibilityLabel={`${ust}. ${alt}`}
          style={({ pressed }) => [stiller.sakin, stiller.esnek, pressed && { opacity: 0.75 }]}
        >
          <ModulDugmesi
            etiket="Anımsatıcılar'ı aç"
            onPress={ac}
            zemin={renk.vurguAcik}
            simge={<KutuSimgesi k="animsatici" />}
          />
          <View style={stiller.esnek}>
            <Yazi tur="kutuBasligi" renk={renk.vurguYazi}>
              {ust}
            </Yazi>
            <Yazi kalinlik="kalin" style={stiller.alt}>
              {alt}
            </Yazi>
          </View>
        </Pressable>
        {/* P-32: zamanlayıcı başlık satırındaki simgeden; basınca kadran açılır. P-42: tek zamanlayıcı. */}
        {sureler.length === 0 && (
          <Pressable
            onPress={() => setKuruluyor((k) => !k)}
            accessibilityRole="button"
            accessibilityLabel={kuruluyor ? 'Zamanlayıcıyı kapat' : 'Zamanlayıcı kur'}
            accessibilityState={{ expanded: kuruluyor }}
            hitSlop={4}
            style={({ pressed }) => [
              stiller.zamanlayiciSimgesi,
              kuruluyor && stiller.simgeAcik,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="timer-outline" size={26} color={kuruluyor ? renk.yuzey : renk.ana} />
          </Pressable>
        )}
      </View>
      {sureler.map((a) => (
        <View key={a.id} style={stiller.sureSatiri}>
          <ZamanlayiciSatiri a={a} simdiMs={simdiMs} />
        </View>
      ))}
      {kuruluyor && sureler.length === 0 && (
        <View style={stiller.sureSatiri}>
          <ZamanlayiciKurucu onKapat={() => setKuruluyor(false)} />
        </View>
      )}
    </View>
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
  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  zamanlayiciSimgesi: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simgeAcik: { backgroundColor: renk.ana },
  sakin: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76 },
  dikey: { gap: 10 },
  sureSatiri: {
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
    paddingTop: 8,
  },
  esnek: { flex: 1 },
  alt: { fontSize: 18 },
  calan: { borderColor: renk.hata, borderWidth: 2, gap: 12 },
  calanUst: { gap: 4 },
  dugmeler: { flexDirection: 'row', gap: 10 },
});
