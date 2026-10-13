// Ajandam: Gün ve Hafta görünümü, takvim, arama, kaynağa göre süzme
// (A-1 … A-8, PL-4, `05` §8).

import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AramaKutusu, AramaSonuclari } from '@/bilesen/ajanda/Arama';
import { GunGezinme, HaftaSeridi } from '@/bilesen/ajanda/GunGezinme';
import { HaftaGorunumu } from '@/bilesen/ajanda/HaftaGorunumu';
import { Kalanlar } from '@/bilesen/ajanda/Kalanlar';
import { KartSatiri } from '@/bilesen/ajanda/KartSatiri';
import { KaynakCipleri } from '@/bilesen/ajanda/KaynakCipleri';
import { NotlarimBaglantisi } from '@/bilesen/ajanda/NotlarimBaglantisi';
import { TakvimSayfasi } from '@/bilesen/ajanda/TakvimSayfasi';
import { BolumluDugme } from '@/bilesen/BolumluDugme';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { Yazi } from '@/bilesen/Yazi';
import { bosGunMetni, gunBasligi, gununKartlari, haftaninGunleri, tamamMetni } from '@/mantik/ajanda';
import { ara, haftaBasligi } from '@/mantik/arama';
import { kalanlar } from '@/mantik/kalanlar';
import { kaynakAdi, kaynaklar, suz, TUMU, type KaynakAnahtari } from '@/mantik/kaynak';
import { gecerliGunMu, gunEkle, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { planlariOku } from '@/veri/planlar';
import {
  blokMetinleri,
  gunlerinYapilanlari,
  isaretle,
  kartiBirak,
  kartlariBuguneAl,
  tumKartlar,
  type KartOzeti,
} from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

type Gorunum = 'gun' | 'hafta';

const GORUNUMLER = [
  { deger: 'gun', etiket: 'Gün' },
  { deger: 'hafta', etiket: 'Hafta' },
] as const;

const BOS_KUME: ReadonlySet<string> = new Set();
const BOS_PLANLAR: ReadonlyMap<string, string> = new Map();

export default function Ajandam() {
  const bugunGun = useBugun();
  const { kapi } = useVeri();
  const [secili, setSecili] = useState<Gun>(bugunGun);
  const [gorunum, setGorunum] = useState<Gorunum>('gun');
  const [filtre, setFiltre] = useState<KaynakAnahtari>(TUMU);
  /** null: arama kapalı. */
  const [sorgu, setSorgu] = useState<string | null>(null);
  const [takvim, setTakvim] = useState({ acik: false, acilis: 0 });
  const form = useKartFormu();
  const kisaMesaj = useKisaMesaj();

  // Giriş'teki "Geçmişten kalan N iş ›" ajandayı bugünün Gün görünümünde açar.
  const { gun: istenenGun, an } = useLocalSearchParams<{ gun?: string; an?: string }>();
  useEffect(() => {
    if (istenenGun && gecerliGunMu(istenenGun)) {
      /* eslint-disable react-hooks/set-state-in-effect -- dışarıdan gelen gezinme isteği */
      setSecili(istenenGun);
      setGorunum('gun');
      setSorgu(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [istenenGun, an]);

  const hafta = useMemo(() => haftaninGunleri(secili), [secili]);
  const aramaAcik = sorgu !== null;

  const veri = useSorgu(
    ['kart', 'plan'],
    async (oku) => ({
      kartlar: await tumKartlar(oku),
      planAdlari: new Map((await planlariOku(oku)).map((p) => [p.id, p.ad])),
      yapilanlar: await gunlerinYapilanlari(oku, hafta[0]!, hafta[6]!),
      bloklar: aramaAcik ? await blokMetinleri(oku) : null,
    }),
    [hafta[0], aramaAcik],
  );

  const kartlar = veri.veri?.kartlar;
  const planAdlari = veri.veri?.planAdlari ?? BOS_PLANLAR;
  const yapilanlarHaritasi = veri.veri?.yapilanlar;
  const yapilanlar = (g: Gun) => yapilanlarHaritasi?.get(g) ?? BOS_KUME;

  // Süzme: çipler yalnız kartı olan kaynaklar; seçili kaynağın kartı kalmazsa "Tümü".
  const kaynakListesi = useMemo(() => kaynaklar(kartlar ?? []), [kartlar]);
  const etkinFiltre = kaynakListesi.includes(filtre) ? filtre : TUMU;
  const suzulmus = useMemo(() => suz(kartlar ?? [], etkinFiltre), [kartlar, etkinFiltre]);
  const suzuldu = etkinFiltre !== TUMU;

  const gunlukListe = useCallback((g: Gun) => gununKartlari(suzulmus, g, bugunGun), [suzulmus, bugunGun]);
  const gununKartlariListesi = useMemo(() => gunlukListe(secili), [gunlukListe, secili]);
  const sayilar = useMemo(() => new Map(hafta.map((g) => [g, gunlukListe(g).length])), [hafta, gunlukListe]);
  const haftaGunleri = useMemo(
    () => hafta.map((g) => ({ gun: g, kartlar: gunlukListe(g), yapilanlar: yapilanlarHaritasi?.get(g) ?? BOS_KUME })),
    [hafta, gunlukListe, yapilanlarHaritasi],
  );
  const takvimSayisi = useCallback((g: Gun) => gunlukListe(g).length, [gunlukListe]);

  const seciliYapilanlar = yapilanlar(secili);
  const yapilanSayisi = gununKartlariListesi.filter((k) => seciliYapilanlar.has(k.id)).length;
  const kalanListesi = useMemo(
    () => (kartlar && secili === bugunGun ? kalanlar(kartlar, bugunGun) : []),
    [kartlar, secili, bugunGun],
  );

  const sonuclar = useMemo(
    () => (kartlar && sorgu !== null ? ara(kartlar, veri.veri?.bloklar ?? new Map(), sorgu, bugunGun) : []),
    [kartlar, sorgu, veri.veri?.bloklar, bugunGun],
  );

  const buguneAl = async (liste: readonly KartOzeti[]) => {
    await kartlariBuguneAl(kapi, liste, bugunGun);
    kisaMesaj(liste.length === 1 ? `Bugüne alındı: ${liste[0]!.baslik}` : `${liste.length} kart bugüne alındı`);
  };

  const kartiAc = (kart: KartOzeti, gun: Gun) => {
    if (kart.blokSayisi > 0 || kart.kilitli) {
      router.push({ pathname: '/kart/[id]', params: { id: kart.id, gun } });
    } else {
      form.ac({ tur: 'duzenle', kart, bloklar: [], gun });
    }
  };

  const gunuAc = (gun: Gun) => {
    setSecili(gun);
    setGorunum('gun');
  };

  const adim = gorunum === 'hafta' ? 7 : 1;
  const uzakta = gorunum === 'hafta' ? !hafta.includes(bugunGun) : secili !== bugunGun;

  return (
    <EkranKabi
      baslik="Ajandam"
      baslikSag={
        <>
          <SimgeDugmesi ikon="search" etiket="Ajandada ara" onPress={() => setSorgu(sorgu ?? '')} />
          <SimgeDugmesi
            ikon="calendar-outline"
            etiket="Takvimi aç"
            onPress={() => setTakvim((t) => ({ acik: true, acilis: t.acilis + 1 }))}
          />
        </>
      }
    >
      <NotlarimBaglantisi />
      {aramaAcik ? (
        <>
          <AramaKutusu deger={sorgu} onDegis={setSorgu} onVazgec={() => setSorgu(null)} />
          {kartlar && (
            <AramaSonuclari
              sorgu={sorgu}
              sonuclar={sonuclar}
              planAdlari={planAdlari}
              onKartiAc={(s) => {
                setSorgu(null);
                kartiAc(s.kart, s.gun ?? bugunGun);
              }}
              onGuneGit={(s) => {
                setSorgu(null);
                if (s.gun) gunuAc(s.gun);
              }}
              onPlaniAc={(s) => {
                setSorgu(null);
                if (s.kart.planId) router.push({ pathname: '/yasam/plan/[id]', params: { id: s.kart.planId } });
              }}
            />
          )}
        </>
      ) : (
        <>
          <BolumluDugme erisimEtiketi="Görünüm" secenekler={GORUNUMLER} secili={gorunum} onSec={setGorunum} />
          <GunGezinme
            baslik={gorunum === 'hafta' ? haftaBasligi(hafta[0]!) : gunBasligi(secili, bugunGun)}
            oncekiEtiket={gorunum === 'hafta' ? 'Önceki hafta' : 'Önceki gün'}
            sonrakiEtiket={gorunum === 'hafta' ? 'Sonraki hafta' : 'Sonraki gün'}
            uzakta={uzakta}
            onOnceki={() => setSecili(gunEkle(secili, -adim))}
            onSonraki={() => setSecili(gunEkle(secili, adim))}
            onBugun={() => setSecili(bugunGun)}
          />
          {gorunum === 'gun' && (
            <HaftaSeridi gunler={hafta} secili={secili} bugunGun={bugunGun} sayilar={sayilar} onSec={setSecili} />
          )}
          <KaynakCipleri
            kaynaklar={kaynakListesi}
            secili={etkinFiltre}
            planAdlari={planAdlari}
            onSec={setFiltre}
          />

          {!veri.yukleniyor && gorunum === 'gun' && (
            <>
              <Kalanlar
                liste={kalanListesi}
                bugunGun={bugunGun}
                onBuguneAl={(liste) => void buguneAl(liste as KartOzeti[])}
                onBirak={(k) => void kartiBirak(kapi, k.id)}
              />
              <Yazi tur="ikincil">
                {tamamMetni(
                  yapilanSayisi,
                  gununKartlariListesi.length,
                  suzuldu ? kaynakAdi(etkinFiltre, planAdlari) : null,
                )}
              </Yazi>
              {gununKartlariListesi.length === 0 ? (
                <View style={stiller.bos}>
                  <Yazi tur="ikincil">{bosGunMetni(secili, bugunGun, suzuldu)}</Yazi>
                </View>
              ) : (
                <View style={stiller.liste}>
                  {gununKartlariListesi.map((kart) => (
                    <KartSatiri
                      key={kart.id}
                      kart={kart}
                      planAdlari={planAdlari}
                      yapildi={seciliYapilanlar.has(kart.id)}
                      onIsaretle={() => void isaretle(kapi, kart.id, secili, !seciliYapilanlar.has(kart.id))}
                      onAc={() => kartiAc(kart, secili)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {!veri.yukleniyor && gorunum === 'hafta' && (
            <HaftaGorunumu gunler={haftaGunleri} bugunGun={bugunGun} onGunuAc={gunuAc} onKartiAc={kartiAc} />
          )}

          <Dugme tur="vurgu" etiket="+ Kart ekle" onPress={() => form.ac({ tur: 'yeni', gun: secili })} />
        </>
      )}

      <TakvimSayfasi
        gorunur={takvim.acik}
        acilis={takvim.acilis}
        secili={secili}
        bugunGun={bugunGun}
        sayi={takvimSayisi}
        onSec={(g) => {
          gunuAc(g);
          setTakvim((t) => ({ ...t, acik: false }));
        }}
        onKapat={() => setTakvim((t) => ({ ...t, acik: false }))}
      />
      {form.oge}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  liste: { gap: 12 },
  bos: { paddingVertical: 16, alignItems: 'center' },
});
