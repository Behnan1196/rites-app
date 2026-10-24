// Alan ekranı (pilot 20 Ekim): puan (kişinin kendi değerlendirmesi; programlardan
// bağımsız), bu alana etiketli programlar, + Yeni program,
// Rites önerileri. Kişinin eklediği alan yeniden adlandırılır ya da silinir.
// P-41: alanın kart çeşitleri ("Beslenme kartları"): dokununca kart o kalıpla açılır.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AltSayfa } from '@/bilesen/AltSayfa';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { Bolum } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { Kutu } from '@/bilesen/kart/CesitSecici';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { AlanSimgesi, ProgramSatiri } from '@/bilesen/yasam/parcalar';
import { useProgramFormu } from '@/bilesen/yasam/ProgramFormu';
import { useProgramlar } from '@/bilesen/yasam/useProgramlar';
import { CESIT_SIMGELERI, cesitler } from '@/mantik/cesit';
import { alanAdiHatasi, ozelMi, PUAN_SOZLERI, type Alan } from '@/mantik/alanlar';
import { oneriAnahtari, oneriKartlari, oneriler as tumOneriler, sureMetni, yildizMetni } from '@/mantik/program';
import { icerikMetaMetni } from '@/mantik/kutuphane';
import { useSorgu } from '@/veri/kancalar';
import { useBugun } from '@/veri/useBugun';
import { gizliOneriler } from '@/veri/katalog';
import { alanDurumuYaz, ozelAlanSil, ozelAlanYaz, varsayilanAlanDurumu } from '@/veri/programlar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function AlanEkrani() {
  const { alan: anahtar } = useLocalSearchParams<{ alan: string }>();
  const p = useProgramlar();
  const alan = p.alanlar.find((a) => a.anahtar === anahtar);
  if (p.yukleniyor) return <EkranKabi geri="Yaşam Tarzım" />;
  if (!alan) {
    return (
      <EkranKabi geri="Yaşam Tarzım">
        <Yazi tur="ikincil">Bu alan bulunamadı.</Yazi>
      </EkranKabi>
    );
  }
  return <AlanIcerigi alan={alan} p={p} />;
}

function AlanIcerigi({ alan, p }: { alan: Alan; p: ReturnType<typeof useProgramlar> }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const durum = p.durumlar?.get(alan.anahtar) ?? varsayilanAlanDurumu(alan.anahtar);
  const programlar = p.ozetler.filter((o) => o.program.alanlar.includes(alan.anahtar));
  const gizli = useSorgu(['ayar', 'kutuphane'], (o) => gizliOneriler(o), []).veri ?? new Set<string>();
  const oneriler = tumOneriler().filter(
    (o) => o.alanlar.includes(alan.anahtar) && !gizli.has(oneriAnahtari('program', o.id)),
  );
  const oneriKartlar = oneriKartlari().filter(
    (c) => c.alanlar.includes(alan.anahtar) && !gizli.has(oneriAnahtari('kart', c.id)),
  );
  const bugunGun = useBugun();
  const alanCesitleri = cesitler(alan.anahtar);
  const kartFormu = useKartFormu(() => kisaMesaj('Kart ajandana eklendi'));
  const programFormu = useProgramFormu((id) => router.push({ pathname: '/yasam/program/[id]', params: { id } }));
  const ozel = ozelMi(alan.anahtar);
  const [duzenle, setDuzenle] = useState<{ ad: string; aciklama: string } | null>(null);
  const [adHatasi, setAdHatasi] = useState<string | null>(null);
  const [silSorusu, setSilSorusu] = useState(false);

  const duzenlemeyiKaydet = async () => {
    if (!duzenle) return;
    const h = alanAdiHatasi(
      duzenle.ad,
      p.alanlar.filter((a) => a.anahtar !== alan.anahtar),
    );
    if (h) {
      setAdHatasi(h);
      return;
    }
    try {
      await ozelAlanYaz(kapi, alan.anahtar, duzenle.ad, duzenle.aciklama);
      setDuzenle(null);
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    }
  };

  const sil = async () => {
    setSilSorusu(false);
    try {
      await ozelAlanSil(kapi, alan.anahtar);
      kisaMesaj(`Alan silindi: ${alan.ad}`);
      router.back();
    } catch (e) {
      console.warn(e);
      kisaMesaj('Silinemedi. Yeniden dene.');
    }
  };

  return (
    <EkranKabi geri="Yaşam Tarzım">
      <View style={stiller.ust}>
        <AlanSimgesi alan={alan.anahtar} buyuk />
        <View style={stiller.esnek}>
          <Yazi tur="ekranBasligi" accessibilityRole="header">
            {alan.ad}
          </Yazi>
          {!!alan.aciklama && <Yazi tur="ikincil">{alan.aciklama}</Yazi>}
        </View>
      </View>

      <Bolum>
        <Yazi kalinlik="kalin">Bu alanda kendini nasıl hissediyorsun?</Yazi>
        <View style={stiller.puanlar} accessibilityRole="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => {
            const secili = durum.puan === n;
            return (
              <Pressable
                key={n}
                onPress={() => void alanDurumuYaz(kapi, alan.anahtar, { puan: n })}
                accessibilityRole="radio"
                accessibilityState={{ selected: secili }}
                accessibilityLabel={`${n}, ${PUAN_SOZLERI[n]}`}
                style={({ pressed }) => [stiller.puan, secili && stiller.puanSecili, pressed && { opacity: 0.75 }]}
              >
                <Yazi tur="bolumBasligi" renk={secili ? renk.yuzey : renk.yazi}>
                  {String(n)}
                </Yazi>
              </Pressable>
            );
          })}
        </View>
        <View style={stiller.uclar} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Yazi
            tur="ikincil"
            kalinlik={durum.puan === 1 ? 'kalin' : 'normal'}
            renk={durum.puan === 1 ? renk.ana : renk.ikincil}
          >
            {PUAN_SOZLERI[1]}
          </Yazi>
          <Yazi tur="ikincil" kalinlik="kalin" renk={renk.ana} style={stiller.orta}>
            {durum.puan >= 2 && durum.puan <= 4 ? PUAN_SOZLERI[durum.puan] : ''}
          </Yazi>
          <Yazi
            tur="ikincil"
            kalinlik={durum.puan === 5 ? 'kalin' : 'normal'}
            renk={durum.puan === 5 ? renk.ana : renk.ikincil}
          >
            {PUAN_SOZLERI[5]}
          </Yazi>
        </View>
        <Yazi tur="ikincil">Puan senin değerlendirmen; program uygulamadan da verebilirsin.</Yazi>
      </Bolum>

      {alanCesitleri.length > 0 && (
        <>
          <View style={stiller.paketBasligi}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              {`${alan.ad} kartları`}
            </Yazi>
            <Yazi tur="ikincil">Birini seç; kart hazır parçalarıyla açılır, içini sen doldurursun.</Yazi>
          </View>
          <View style={stiller.liste}>
            {alanCesitleri.map((c) => (
              <Kutu
                key={c.id}
                ikon={(c.ikon as (typeof CESIT_SIMGELERI)[number] | null) ?? 'leaf-outline'}
                ad={c.ad}
                aciklama={c.aciklama}
                onPress={() => kartFormu.ac({ tur: 'yeni', gun: bugunGun, cesit: c })}
              />
            ))}
          </View>
        </>
      )}

      {programlar.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Programlar
          </Yazi>
          <View style={stiller.liste}>
            {programlar.map((o) => (
              <ProgramSatiri
                key={o.program.id}
                ad={o.program.ad}
                meta={o.durumMetni}
                hap={o.bugun}
                soluk={o.durum !== 'uygulaniyor'}
                yildiz={yildizMetni(o.program.yildiz)}
                onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: o.program.id } })}
              />
            ))}
          </View>
        </>
      )}

      <Dugme tur="vurgu" etiket="+ Yeni program" onPress={() => programFormu.ac({ tur: 'yeni', alan: alan.anahtar })} />

      {oneriler.length + oneriKartlar.length > 0 && (
        <>
          <View style={stiller.paketBasligi}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Rites önerileri
            </Yazi>
            <Yazi tur="ikincil">Hazır programlar ve kartlar. Kendine alıp istediğin gibi değiştirebilirsin.</Yazi>
          </View>
          <View style={stiller.liste}>
            {oneriler.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: '/yasam/oneri/[id]', params: { id: o.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${o.ad}, ${o.aciklama}, ${sureMetni(o.sure)}`}
                style={({ pressed }) => [stiller.paket, pressed && { opacity: 0.75 }]}
              >
                <Yazi tur="kartBasligi">{o.ad}</Yazi>
                <Yazi>{o.aciklama}</Yazi>
                <Yazi tur="ikincil">{`Program · ${sureMetni(o.sure)} · ${o.kartlar.length} kart`}</Yazi>
              </Pressable>
            ))}
            {oneriKartlar.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/yasam/oneri/[id]', params: { id: c.id, tur: 'kart' } })}
                accessibilityRole="button"
                accessibilityLabel={`${c.baslik}, kart, ${icerikMetaMetni(c)}`}
                style={({ pressed }) => [stiller.paket, pressed && { opacity: 0.75 }]}
              >
                <Yazi kalinlik="kalin">{c.baslik}</Yazi>
                <Yazi tur="ikincil">{['Kart', c.tur, icerikMetaMetni(c)].filter(Boolean).join(' · ')}</Yazi>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {ozel && (
        <View style={stiller.ozelEylemler}>
          <Dugme
            tur="ikincil"
            yaziRengi={renk.ana}
            etiket="Alanı düzenle"
            onPress={() => setDuzenle({ ad: alan.ad, aciklama: alan.aciklama })}
          />
          <Dugme tur="tehlike" etiket="Alanı sil" onPress={() => setSilSorusu(true)} />
        </View>
      )}

      {programFormu.oge}
      {kartFormu.oge}

      <AltSayfa
        gorunur={duzenle !== null}
        onKapat={() => setDuzenle(null)}
        baslik="Alanı düzenle"
        solVazgec
        sagEylem={{ etiket: 'Kaydet', onPress: () => void duzenlemeyiKaydet() }}
      >
        <GirisAlani
          etiket="Alanın adı"
          value={duzenle?.ad ?? ''}
          onChangeText={(ad) => {
            setDuzenle((d) => (d ? { ...d, ad } : d));
            setAdHatasi(null);
          }}
          hata={adHatasi}
          returnKeyType="done"
        />
        <GirisAlani
          etiket="Kısa açıklama (isteğe bağlı)"
          value={duzenle?.aciklama ?? ''}
          onChangeText={(aciklama) => setDuzenle((d) => (d ? { ...d, aciklama } : d))}
          placeholder="Örneğin: Sebze, çiçek, kompost"
          returnKeyType="done"
        />
      </AltSayfa>

      {silSorusu && (
        <Katman>
          <OnayKutusu
            baslik={`"${alan.ad}" alanı silinsin mi?`}
            aciklama="Programların ve kartların silinmez; yalnız bu etiket kalkar."
            secenekler={[
              { etiket: 'Alanı sil', tur: 'tehlike', onPress: () => void sil() },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
            ]}
          />
        </Katman>
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
  ozelEylemler: { gap: 10, marginTop: 8 },
});
