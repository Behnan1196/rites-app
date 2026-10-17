// Giriş'teki Anımsatıcılar kutusu (`05` §7): çalan varsa "Şimdi çalıyor" ve
// Durdur / Ertele; yoksa sıradaki ve "bugün N kez daha".
// Pilot 17 Ekim: kurulu "Süre sonra"lar kalan süreleriyle (İptal) ve hızlı
// kurmak için "Süre sonra" düğmesi.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { erteleMetni, girisOzeti, kalanMetni, kalanSureMetni, type Animsatici } from '@/mantik/animsatici';
import { animsaticiSil } from '@/veri/animsaticilar';
import { useSimdiMs } from '@/veri/useSimdi';
import { useVeri } from '@/veri/VeriSaglayici';

import { useAnimsaticiFormu } from '../animsatici/AnimsaticiFormu';
import { useAnimsatmalar } from '../animsatici/useAnimsatmalar';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const ac = () => router.push('/giris/animsaticilar');

export function AnimsaticilarKutusu() {
  const kisaMesaj = useKisaMesaj();
  const { kapi } = useVeri();
  const simdiMs = useSimdiMs();
  const form = useAnimsaticiFormu();
  const { yukleniyor, animsaticilar, animsatmalar, durdur, ertele } = useAnimsatmalar();
  if (yukleniyor) return null;
  const { calan } = girisOzeti(animsatmalar);
  // Sıradaki / kalan yalnız "Saatinde"lerden; "Süre sonra"lar ayrı satırda.
  const { siradaki, kalan } = girisOzeti(animsatmalar.filter((m) => !m.animsatici.bitis));
  const sureler = animsaticilar.filter((a) => a.bitis && new Date(a.bitis).getTime() > simdiMs - 60_000);
  const iptal = (a: Animsatici) =>
    void animsaticiSil(kapi, a.id)
      .then(() => kisaMesaj(`İptal edildi: ${a.ad}`))
      .catch((e: unknown) => hata(e));
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
        {form.oge}
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
      <Pressable
        onPress={ac}
        accessibilityRole="button"
        accessibilityLabel={`${ust}. ${alt}`}
        style={({ pressed }) => [stiller.sakin, pressed && { opacity: 0.75 }]}
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
      {sureler.map((a) => (
        <View key={a.id} style={stiller.sureSatiri}>
          <Ionicons name="timer-outline" size={22} color={renk.ana} />
          <View style={stiller.esnek}>
            <Yazi kalinlik="kalin" numberOfLines={1}>
              {a.ad}
            </Yazi>
            <Yazi tur="ikincil">{`${a.saatler[0] ?? ''} · ${kalanSureMetni(a.bitis!, simdiMs)}`}</Yazi>
          </View>
          <Dugme tur="yazi" etiket="İptal" onPress={() => iptal(a)} />
        </View>
      ))}
      <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="⏱  Süre sonra" onPress={() => form.ac(null, 'sure')} />
      {form.oge}
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
  sakin: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76 },
  dikey: { gap: 10 },
  sureSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
    paddingTop: 8,
  },
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
