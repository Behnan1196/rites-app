// Kurulu bir zamanlayıcının satırı (Giriş'teki Anımsatıcılar kutusu ve
// Anımsatıcılar ekranı; pilot 23 Ekim). Solda dolan halka; ortasına dokununca
// Duraklat / Devam. Ad, saniye saniye geri sayım, bitiş saati; sağda +1 dk ve İptal.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Animsatici } from '@/mantik/animsatici';
import {
  duraklatildiMi,
  geriSayimMetni,
  ilerleme,
  kalanMs,
  UZATMA_MS,
  zamanlayiciAltMetni,
  zamanlayiciSuresiMetni,
} from '@/mantik/zamanlayici';
import { animsaticiSil, zamanlayiciDevam, zamanlayiciDuraklat, zamanlayiciUzat } from '@/veri/animsaticilar';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { Halka } from './Halka';

export function ZamanlayiciSatiri({ a, simdiMs }: { a: Animsatici; simdiMs: number }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const durdu = duraklatildiMi(a);
  const kalan = kalanMs(a, simdiMs);
  const hata = (e: unknown) => {
    console.error('Zamanlayıcı değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const duraklatDevam = () => void (durdu ? zamanlayiciDevam(kapi, a.id) : zamanlayiciDuraklat(kapi, a.id)).catch(hata);
  const uzat = () => void zamanlayiciUzat(kapi, a.id, UZATMA_MS).catch(hata);
  const iptal = () =>
    void animsaticiSil(kapi, a.id)
      .then(() => kisaMesaj(`İptal edildi: ${a.ad}`))
      .catch(hata);

  return (
    <View style={stiller.satir}>
      <Pressable
        onPress={duraklatDevam}
        accessibilityRole="button"
        accessibilityLabel={durdu ? `Devam et: ${a.ad}` : `Duraklat: ${a.ad}`}
        hitSlop={4}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <Halka oran={ilerleme(a, simdiMs)} dolu={durdu ? renk.soluk : renk.ana}>
          <Ionicons name={durdu ? 'play' : 'pause'} size={22} color={durdu ? renk.ikincil : renk.ana} />
        </Halka>
      </Pressable>
      <View
        style={stiller.esnek}
        accessible
        accessibilityLabel={`${a.ad}, ${zamanlayiciSuresiMetni(kalan)} kaldı, ${zamanlayiciAltMetni(a, simdiMs)}`}
      >
        <Yazi kalinlik="kalin" numberOfLines={1}>
          {a.ad}
        </Yazi>
        <Yazi kalinlik="kalin" renk={durdu ? renk.ikincil : renk.ana} style={stiller.sayac}>
          {geriSayimMetni(kalan)}
        </Yazi>
        <Yazi tur="etiket">{zamanlayiciAltMetni(a, simdiMs)}</Yazi>
      </View>
      <View style={stiller.dugmeler}>
        <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+1 dk" onPress={uzat} style={stiller.kucuk} />
        <Dugme tur="yazi" etiket="İptal" onPress={iptal} />
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  esnek: { flex: 1, minWidth: 0 },
  sayac: { fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
  dugmeler: { alignItems: 'flex-end', gap: 2 },
  kucuk: { minHeight: 44, paddingHorizontal: 12 },
});
