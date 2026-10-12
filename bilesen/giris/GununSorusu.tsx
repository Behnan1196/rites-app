// Günün sorusu (G-6): yalnız etkin bir planda soru tanımlıysa görünür.
// 1–5 düğmeleri ve iki uç yazısı; cevaptan sonra "Cevabın: 4 / 5",
// "Değiştir" ve "Gelişim'de gör ›".

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { trBuyuk } from '@/mantik/metin';
import { cevapMetni, sorulanPlan } from '@/mantik/plan';
import { useSorgu } from '@/veri/kancalar';
import { planlariOku, soruCevapla, soruCevaplari } from '@/veri/planlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function GununSorusu() {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const veri = useSorgu(
    ['plan'],
    async (oku) => {
      const plan = sorulanPlan(await planlariOku(oku));
      if (!plan) return null;
      const cevap = (await soruCevaplari(oku, plan.id, bugunGun, bugunGun)).get(bugunGun) ?? null;
      return { plan, cevap };
    },
    [bugunGun],
  );
  if (!veri.veri || !veri.veri.plan.gununSorusu) return null;
  const { plan, cevap } = veri.veri;
  const soru = plan.gununSorusu!;

  const cevapla = (deger: number | null) =>
    soruCevapla(kapi, plan.id, bugunGun, deger).catch((e: unknown) => {
      console.error('Cevap kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    });

  return (
    <View style={stiller.kutu}>
      <Yazi tur="kutuBasligi" renk={renk.vurguYazi} accessibilityRole="header">
        {`Günün sorusu · ${trBuyuk(plan.ad)}`}
      </Yazi>
      <Yazi tur="bolumBasligi">{soru.metin}</Yazi>

      {cevap === null ? (
        <>
          <View style={stiller.secenekler}>
            {[1, 2, 3, 4, 5].map((d) => (
              <Pressable
                key={d}
                onPress={() => void cevapla(d)}
                accessibilityRole="button"
                accessibilityLabel={`${d}${d === 1 ? `, ${soru.alt}` : d === 5 ? `, ${soru.ust}` : ''}`}
                style={({ pressed }) => [stiller.secenek, pressed && { opacity: 0.7 }]}
              >
                <Yazi tur="bolumBasligi">{String(d)}</Yazi>
              </Pressable>
            ))}
          </View>
          <View style={stiller.uclar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Yazi tur="ikincil">{soru.alt}</Yazi>
            <Yazi tur="ikincil">{soru.ust}</Yazi>
          </View>
        </>
      ) : (
        <View style={stiller.cevap}>
          <Yazi kalinlik="kalin" style={stiller.esnek} accessibilityLiveRegion="polite">
            {cevapMetni(cevap)}
          </Yazi>
          <Pressable onPress={() => void cevapla(null)} accessibilityRole="button" style={stiller.bag} hitSlop={6}>
            <Yazi kalinlik="kalin" renk={renk.ana}>
              Değiştir
            </Yazi>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/yasam/plan/[id]', params: { id: plan.id, sekme: 'gelisim' } })}
            accessibilityRole="button"
            style={stiller.bag}
            hitSlop={6}
          >
            <Yazi kalinlik="kalin" renk={renk.ana}>
              {"Gelişim'de gör ›"}
            </Yazi>
          </Pressable>
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
    gap: 12,
  },
  secenekler: { flexDirection: 'row', gap: 8 },
  secenek: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uclar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  cevap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  esnek: { flexGrow: 1 },
  bag: { minHeight: 44, justifyContent: 'center' },
});
