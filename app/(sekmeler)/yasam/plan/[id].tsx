// Plan ekranı (P-1): "‹ [Alan]", simge, ad, süre; Bilgiler · Plan · Gelişim
// (Plan seçili açılır).

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BolumluDugme } from '@/bilesen/BolumluDugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { BilgilerSekmesi } from '@/bilesen/plan/BilgilerSekmesi';
import { GelisimSekmesi } from '@/bilesen/plan/GelisimSekmesi';
import { PlanSekmesi } from '@/bilesen/plan/PlanSekmesi';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi } from '@/bilesen/yasam/parcalar';
import { alanAdi } from '@/mantik/alanlar';
import { gorunurMu } from '@/mantik/gorunurluk';
import { adimKarti, planEnUzunSerisi, planMetaMetni, sonOlcumler, soruGrafigi } from '@/mantik/plan';
import { gunEkle, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, planKartlari, planKayitlari, type KartOzeti } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import {
  adimEkle,
  adimiAjandayaAl,
  adimIsaretle,
  alanDurumlari,
  planBilgisiYaz,
  planiBitir,
  planOku,
  soruCevaplari,
} from '@/veri/planlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

type Sekme = 'bilgi' | 'plan' | 'gelisim';

const SEKMELER = [
  { deger: 'bilgi', etiket: 'Bilgiler' },
  { deger: 'plan', etiket: 'Plan' },
  { deger: 'gelisim', etiket: 'Gelişim' },
] as const;

export default function PlanEkrani() {
  const { id, sekme: ilkSekme } = useLocalSearchParams<{ id: string; sekme?: string }>();
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const form = useKartFormu();
  const [sekme, setSekme] = useState<Sekme>(
    ilkSekme === 'bilgi' || ilkSekme === 'gelisim' ? ilkSekme : 'plan',
  );
  const [bitirSoruluyor, setBitirSoruluyor] = useState(false);

  const veri = useSorgu(
    ['plan', 'kart'],
    async (oku) => {
      const plan = await planOku(oku, id ?? '');
      if (!plan) return null;
      const kartlar = await planKartlari(oku, plan.id);
      const { olcumler, kayitlar } = await planKayitlari(oku, plan.id);
      return {
        plan,
        kartlar,
        olcumler,
        kayitlar,
        yapilanlar: await gunYapilanlari(oku, bugunGun),
        puan: (await alanDurumlari(oku)).get(plan.alan)?.puan ?? 0,
        cevaplar: plan.gununSorusu ? await soruCevaplari(oku, plan.id, gunEkle(bugunGun, -6), bugunGun) : null,
      };
    },
    [id, bugunGun],
  );

  const gelisim = useMemo(() => {
    const v = veri.veri;
    if (!v) return null;
    const duzenliler = v.kartlar.filter((k) => k.tekrar);
    const bugunkuler = duzenliler.filter((k) => gorunurMu(k, bugunGun, bugunGun));
    const yapilanGunler = new Map<string, Set<Gun>>();
    for (const k of v.kayitlar) {
      if (!k.yapildi) continue;
      const kume = yapilanGunler.get(k.kartId) ?? new Set<Gun>();
      kume.add(k.tarih);
      yapilanGunler.set(k.kartId, kume);
    }
    return {
      bugunYapilan: bugunkuler.filter((k) => v.yapilanlar.has(k.id)).length,
      bugunToplam: bugunkuler.length,
      enUzunSeri: planEnUzunSerisi(duzenliler, yapilanGunler, bugunGun),
      olcumler: sonOlcumler(v.olcumler, v.kayitlar),
      soru: v.cevaplar ? soruGrafigi(v.cevaplar, bugunGun) : null,
    };
  }, [veri.veri, bugunGun]);

  if (veri.yukleniyor) return <EkranKabi geri="Yaşam Tarzım" />;
  if (!veri.veri || !gelisim) {
    return (
      <EkranKabi geri="Yaşam Tarzım">
        <Yazi tur="ikincil">Bu plan bulunamadı.</Yazi>
      </EkranKabi>
    );
  }

  const { plan, kartlar, yapilanlar, puan } = veri.veri;
  const etkin = plan.durum === 'etkin';

  const kartiAc = (kart: KartOzeti) => {
    const gun = kart.tekrar ? bugunGun : (kart.tarih ?? bugunGun);
    if (kart.blokSayisi > 0 || kart.kilitli) {
      router.push({ pathname: '/kart/[id]', params: { id: kart.id, gun, geri: plan.ad } });
    } else {
      form.ac({ tur: 'duzenle', kart, bloklar: [], gun });
    }
  };

  const hata = (e: unknown) => {
    console.error('Plan değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  return (
    <>
      <EkranKabi
        geri={alanAdi(plan.alan)}
        onGeri={() => router.dismissTo({ pathname: '/yasam/alan/[alan]', params: { alan: plan.alan } })}
      >
        <View style={stiller.ust}>
          <AlanSimgesi alan={plan.alan} buyuk />
          <View style={stiller.esnek}>
            <Yazi tur="ekranBasligi" accessibilityRole="header">
              {plan.ad}
            </Yazi>
            <Yazi tur="ikincil">{etkin ? planMetaMetni(plan, bugunGun) : `${alanAdi(plan.alan)} · Bitti`}</Yazi>
          </View>
        </View>

        <BolumluDugme erisimEtiketi="Plan bölümleri" secenekler={SEKMELER} secili={sekme} onSec={setSekme} />

        {sekme === 'bilgi' && (
          <BilgilerSekmesi
            key={plan.id}
            plan={plan}
            bugunGun={bugunGun}
            onBilgi={(b) => planBilgisiYaz(kapi, plan.id, b).catch(hata)}
            onSoru={(gununSorusu) =>
              planBilgisiYaz(kapi, plan.id, { gununSorusu })
                .then(() => kisaMesaj(gununSorusu ? 'Günün sorusu kaydedildi' : 'Günün sorusu kaldırıldı'))
                .catch(hata)
            }
            onBitir={() => setBitirSoruluyor(true)}
          />
        )}

        {sekme === 'plan' && (
          <PlanSekmesi
            kartlar={kartlar}
            bugunYapilanlar={yapilanlar}
            bugunGun={bugunGun}
            etkin={etkin}
            onKartiAc={kartiAc}
            onAdimIsaretle={(k, yapildi) => adimIsaretle(kapi, k, yapildi).catch(hata)}
            onAjandayaAl={(k) =>
              adimiAjandayaAl(kapi, k.id, bugunGun)
                .then(() => kisaMesaj(`Bugünün ajandasına alındı: ${k.baslik}`))
                .catch(hata)
            }
            onAdimEkle={(baslik) => adimEkle(kapi, adimKarti(yeniKimlik(), baslik, plan.id, Date.now())).catch(hata)}
            onAjandamdaGor={() =>
              router.navigate({ pathname: '/ajandam', params: { gun: bugunGun, an: String(Date.now()) } })
            }
          />
        )}

        {sekme === 'gelisim' && (
          <GelisimSekmesi plan={plan} kartlar={kartlar} bugunGun={bugunGun} simdikiPuan={puan} {...gelisim} />
        )}
      </EkranKabi>

      {form.oge}

      {bitirSoruluyor && (
        <Katman>
          <OnayKutusu
            baslik="Plan bitsin mi?"
            aciklama="Kartları ajandandan kalkar. Geçmiş kayıtların silinmez."
            secenekler={[
              {
                etiket: 'Planı bitir',
                tur: 'tehlike',
                onPress: () => {
                  setBitirSoruluyor(false);
                  planiBitir(kapi, plan.id)
                    .then(() => kisaMesaj(`Plan bitti: ${plan.ad}`))
                    .catch(hata);
                },
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setBitirSoruluyor(false) },
            ]}
          />
        </Katman>
      )}
    </>
  );
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  esnek: { flex: 1 },
});
