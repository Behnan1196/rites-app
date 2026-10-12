// Alan ekranı (Y-1): puan, "ilerlemek istiyorum", planlar, + Yeni plan, hazır paketler.

import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { AcKapa, Bolum } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi, PlanSatiri } from '@/bilesen/yasam/parcalar';
import { usePlanlar } from '@/bilesen/yasam/usePlanlar';
import { alanBul, HAZIR_ORNEK_METNI, PUAN_SOZLERI, type Alan } from '@/mantik/alanlar';
import { alanDurumuYaz, varsayilanAlanDurumu } from '@/veri/planlar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function AlanEkrani() {
  const { alan: anahtar } = useLocalSearchParams<{ alan: string }>();
  const alan = alanBul(anahtar ?? '');
  if (!alan) {
    return (
      <EkranKabi geri="Yaşam Tarzım">
        <Yazi tur="ikincil">Bu alan bulunamadı.</Yazi>
      </EkranKabi>
    );
  }
  return <AlanIcerigi alan={alan} />;
}

function AlanIcerigi({ alan }: { alan: Alan }) {
  const { kapi } = useVeri();
  const { yukleniyor, ozetler, durumlar } = usePlanlar();
  const durum = durumlar?.get(alan.anahtar) ?? varsayilanAlanDurumu(alan.anahtar);
  const planlar = ozetler
    .filter((o) => o.plan.alan === alan.anahtar)
    .sort((a, b) => (a.plan.durum === b.plan.durum ? 0 : a.plan.durum === 'etkin' ? -1 : 1));

  const yeniPlan = (paket?: string) =>
    router.push({ pathname: '/yasam/yeni-plan', params: paket ? { alan: alan.anahtar, paket } : { alan: alan.anahtar } });

  return (
    <EkranKabi geri="Yaşam Tarzım">
      <View style={stiller.ust}>
        <AlanSimgesi alan={alan.anahtar} buyuk />
        <View style={stiller.esnek}>
          <Yazi tur="ekranBasligi" accessibilityRole="header">
            {alan.ad}
          </Yazi>
          <Yazi tur="ikincil">{alan.aciklama}</Yazi>
        </View>
      </View>

      <Bolum>
        <Yazi kalinlik="kalin">Bu alanda kendini nasıl hissediyorsun?</Yazi>
        <View style={stiller.puanlar} accessibilityRole="radiogroup">
          {[1, 2, 3, 4, 5].map((p) => {
            const secili = durum.puan === p;
            return (
              <Pressable
                key={p}
                onPress={() => void alanDurumuYaz(kapi, alan.anahtar, { puan: p })}
                accessibilityRole="radio"
                accessibilityState={{ selected: secili }}
                accessibilityLabel={`${p}, ${PUAN_SOZLERI[p]}`}
                style={({ pressed }) => [stiller.puan, secili && stiller.puanSecili, pressed && { opacity: 0.75 }]}
              >
                <Yazi tur="bolumBasligi" renk={secili ? renk.yuzey : renk.yazi}>
                  {String(p)}
                </Yazi>
              </Pressable>
            );
          })}
        </View>
        <View style={stiller.uclar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Yazi tur="ikincil" kalinlik={durum.puan === 1 ? 'kalin' : 'normal'} renk={durum.puan === 1 ? renk.ana : renk.ikincil}>
            {PUAN_SOZLERI[1]}
          </Yazi>
          <Yazi tur="ikincil" kalinlik="kalin" renk={renk.ana} style={stiller.orta}>
            {durum.puan >= 2 && durum.puan <= 4 ? PUAN_SOZLERI[durum.puan] : ''}
          </Yazi>
          <Yazi tur="ikincil" kalinlik={durum.puan === 5 ? 'kalin' : 'normal'} renk={durum.puan === 5 ? renk.ana : renk.ikincil}>
            {PUAN_SOZLERI[5]}
          </Yazi>
        </View>
      </Bolum>

      <Bolum style={stiller.satir}>
        <Yazi kalinlik="kalin" style={stiller.esnek}>
          Bu alanda ilerlemek istiyorum
        </Yazi>
        <AcKapa
          acik={durum.ilerlemek}
          etiket="Bu alanda ilerlemek istiyorum"
          onDegis={(ilerlemek) => void alanDurumuYaz(kapi, alan.anahtar, { ilerlemek })}
        />
      </Bolum>

      {!yukleniyor && planlar.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Planlar
          </Yazi>
          <View style={stiller.liste}>
            {planlar.map((o) => (
              <PlanSatiri
                key={o.plan.id}
                ad={o.plan.ad}
                meta={o.meta}
                hap={o.plan.durum === 'bitti' ? 'Bitti' : o.ilerleme}
                bitti={o.plan.durum === 'bitti'}
                onPress={() => router.push({ pathname: '/yasam/plan/[id]', params: { id: o.plan.id } })}
              />
            ))}
          </View>
        </>
      )}

      <Dugme etiket="+ Yeni plan" onPress={() => yeniPlan()} />

      {alan.paketler.length > 0 && (
        <>
          <View style={stiller.paketBasligi}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Hazır paketler
            </Yazi>
            <Yazi tur="ikincil">{HAZIR_ORNEK_METNI}</Yazi>
          </View>
          <View style={stiller.liste}>
            {alan.paketler.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => yeniPlan(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`${p.ad}, ${p.aciklama}, ${p.hafta} hafta`}
                style={({ pressed }) => [stiller.paket, pressed && { opacity: 0.75 }]}
              >
                <Yazi tur="kartBasligi">{p.ad}</Yazi>
                <Yazi>{p.aciklama}</Yazi>
                <Yazi tur="ikincil">{`${p.hafta} hafta · ${p.etkinlikler.length} etkinlik`}</Yazi>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  esnek: { flex: 1 },
  puanlar: { flexDirection: 'row', gap: 8 },
  puan: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puanSecili: { backgroundColor: renk.ana, borderColor: renk.ana },
  uclar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orta: { flex: 1, textAlign: 'center' },
  satir: { flexDirection: 'row', alignItems: 'center' },
  liste: { gap: 10 },
  paketBasligi: { gap: 4, marginTop: 8 },
  paket: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 4,
  },
});
