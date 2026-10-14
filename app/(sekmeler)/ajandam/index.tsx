// Ajandam: Gün ve Hafta görünümü, takvim, arama, kaynağa göre süzme
// (A-1 … A-8, PL-4, `05` §8).

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Sharing from 'expo-sharing';
import { Platform, StyleSheet, View } from 'react-native';

import { AramaKutusu, AramaSonuclari } from '@/bilesen/ajanda/Arama';
import { GunGezinme, HaftaSeridi } from '@/bilesen/ajanda/GunGezinme';
import { HaftaGorunumu } from '@/bilesen/ajanda/HaftaGorunumu';
import { Kalanlar } from '@/bilesen/ajanda/Kalanlar';
import { KartSatiri } from '@/bilesen/ajanda/KartSatiri';
import { KaynakSuzgeci } from '@/bilesen/ajanda/KaynakSuzgeci';
import { NotlarimBaglantisi } from '@/bilesen/ajanda/NotlarimBaglantisi';
import { TakvimSayfasi } from '@/bilesen/ajanda/TakvimSayfasi';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { useBanaVerilenler } from '@/bilesen/listeler/BanaVerilenler';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { Yazi } from '@/bilesen/Yazi';
import { bosGunMetni, gunBasligi, gununKartlari, haftaninGunleri } from '@/mantik/ajanda';
import { ara, haftaBasligi } from '@/mantik/arama';
import { kalanlar } from '@/mantik/kalanlar';
import { gizliyiSuz, kaynaklar, suzgecAcikMi, type KaynakAnahtari } from '@/mantik/kaynak';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { BAGLANTI_YOK, paylasilanAdres, paylasilanMetin, paylasimTaslagi } from '@/mantik/paylasimAl';
import { maddeKarti, maddeKartiMi, maddeYapilanlari, yapilanlariBirlestir } from '@/mantik/listeler';
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
import { videoBasligi } from '@/veri/videoBasligi';
import { useVeri } from '@/veri/VeriSaglayici';

type Gorunum = 'gun' | 'hafta';

const BOS_KUME: ReadonlySet<string> = new Set();
const BOS_PLANLAR: ReadonlyMap<string, string> = new Map();

export default function Ajandam() {
  const bugunGun = useBugun();
  const { kapi } = useVeri();
  const [secili, setSecili] = useState<Gun>(bugunGun);
  const [gorunum, setGorunum] = useState<Gorunum>('gun');
  /** Süzgeçte işareti kaldırılan (gizlenen) kaynaklar. */
  const [gizli, setGizli] = useState<ReadonlySet<KaynakAnahtari>>(new Set());
  const [suzgecAcik, setSuzgecAcik] = useState(false);
  /** null: arama kapalı. */
  const [sorgu, setSorgu] = useState<string | null>(null);
  const [takvim, setTakvim] = useState({ acik: false, acilis: 0 });
  const form = useKartFormu();
  const kisaMesaj = useKisaMesaj();
  // Ortak listelerden bana tarihle verilen maddeler (`05` §9).
  const verilenler = useBanaVerilenler();
  const maddeYenile = verilenler.yenile;
  useFocusEffect(
    useCallback(() => {
      void maddeYenile();
    }, [maddeYenile]),
  );

  // Giriş'teki "Geçmişten kalan N iş ›" ajandayı bugünün Gün görünümünde açar.
  const { gun: istenenGun, an, paylasim } = useLocalSearchParams<{ gun?: string; an?: string; paylasim?: string }>();
  useEffect(() => {
    if (istenenGun && gecerliGunMu(istenenGun)) {
      /* eslint-disable react-hooks/set-state-in-effect -- dışarıdan gelen gezinme isteği */
      setSecili(istenenGun);
      setGorunum('gun');
      setSorgu(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [istenenGun, an]);

  // Başka uygulamadan (ör. YouTube) paylaşılan bağlantı: bugünün yeni kart formu dolu açılır.
  const formAc = form.ac;
  useEffect(() => {
    if (!paylasim || Platform.OS === 'web') return;
    let iptal = false;
    const ogeler = Sharing.getSharedPayloads();
    Sharing.clearSharedPayloads();
    const adres = paylasilanAdres(ogeler);
    /* eslint-disable react-hooks/set-state-in-effect -- dışarıdan gelen paylaşım */
    setSecili(bugunGun);
    setGorunum('gun');
    setSorgu(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (!adres) {
      if (ogeler.length > 0) kisaMesaj(BAGLANTI_YOK);
      return;
    }
    void videoBasligi(adres).then((baslik) => {
      if (!iptal) formAc({ tur: 'yeni', gun: bugunGun, taslak: paylasimTaslagi(adres, baslik, paylasilanMetin(ogeler)) });
    });
    return () => {
      iptal = true;
    };
  }, [paylasim]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const yerelKartlar = veri.veri?.kartlar;
  const kartlar = useMemo(
    () => (yerelKartlar ? [...yerelKartlar, ...verilenler.maddeler.map(maddeKarti)] : undefined),
    [yerelKartlar, verilenler.maddeler],
  );
  const planAdlari = veri.veri?.planAdlari ?? BOS_PLANLAR;
  const yerelYapilanlar = veri.veri?.yapilanlar;
  const yapilanlarHaritasi = useMemo(
    () => yapilanlariBirlestir(yerelYapilanlar, maddeYapilanlari(verilenler.maddeler)),
    [yerelYapilanlar, verilenler.maddeler],
  );
  const yapilanlar = (g: Gun) => yapilanlarHaritasi?.get(g) ?? BOS_KUME;

  // Süzme: menüde yalnız kartı olan kaynaklar; işareti kaldırılanlar gizlenir.
  const kaynakListesi = useMemo(() => kaynaklar(kartlar ?? []), [kartlar]);
  const suzulmus = useMemo(() => gizliyiSuz(kartlar ?? [], gizli), [kartlar, gizli]);
  const suzuldu = suzgecAcikMi(kaynakListesi, gizli);

  const gunlukListe = useCallback((g: Gun) => gununKartlari(suzulmus, g, bugunGun), [suzulmus, bugunGun]);
  const gununKartlariListesi = useMemo(() => gunlukListe(secili), [gunlukListe, secili]);
  const haftaGunleri = useMemo(
    () => hafta.map((g) => ({ gun: g, kartlar: gunlukListe(g), yapilanlar: yapilanlarHaritasi?.get(g) ?? BOS_KUME })),
    [hafta, gunlukListe, yapilanlarHaritasi],
  );
  const takvimSayisi = useCallback((g: Gun) => gunlukListe(g).length, [gunlukListe]);

  const seciliYapilanlar = yapilanlar(secili);
  const kalanListesi = useMemo(
    () => (yerelKartlar && secili === bugunGun ? kalanlar(yerelKartlar, bugunGun) : []),
    [yerelKartlar, secili, bugunGun],
  );

  const sonuclar = useMemo(
    () => (yerelKartlar && sorgu !== null ? ara(yerelKartlar, veri.veri?.bloklar ?? new Map(), sorgu, bugunGun) : []),
    [yerelKartlar, sorgu, veri.veri?.bloklar, bugunGun],
  );

  const buguneAl = async (liste: readonly KartOzeti[]) => {
    await kartlariBuguneAl(kapi, liste, bugunGun);
    kisaMesaj(liste.length === 1 ? `Bugüne alındı: ${liste[0]!.baslik}` : `${liste.length} kart bugüne alındı`);
  };

  const kartiAc = (kart: KartOzeti, gun: Gun) => {
    if (maddeKartiMi(kart)) {
      router.push({ pathname: '/ajandam/liste/[id]', params: { id: kart.listeId } });
      return;
    }
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
      baslikSag={
        <>
          <SimgeDugmesi ikon="search" etiket="Ajandada ara" onPress={() => setSorgu(sorgu ?? '')} />
          <SimgeDugmesi
            ikon={suzuldu ? 'funnel' : 'funnel-outline'}
            etiket={suzuldu ? 'Süzgeç açık, kaynakları seç' : 'Kaynağa göre süz'}
            secili={suzuldu}
            onPress={() => setSuzgecAcik(true)}
          />
          <SimgeDugmesi
            ikon={gorunum === 'gun' ? 'grid-outline' : 'reorder-four-outline'}
            etiket={gorunum === 'gun' ? 'Hafta görünümüne geç' : 'Gün görünümüne geç'}
            onPress={() => setGorunum(gorunum === 'gun' ? 'hafta' : 'gun')}
          />
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
          {yerelKartlar && (
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
            <HaftaSeridi gunler={hafta} secili={secili} bugunGun={bugunGun} onSec={setSecili} />
          )}

          {!veri.yukleniyor && gorunum === 'gun' && (
            <>
              <Kalanlar
                liste={kalanListesi}
                bugunGun={bugunGun}
                onBuguneAl={(liste) => void buguneAl(liste as KartOzeti[])}
                onBirak={(k) => void kartiBirak(kapi, k.id)}
              />
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
                      onIsaretle={() => {
                        const yapildi = !seciliYapilanlar.has(kart.id);
                        if (maddeKartiMi(kart)) {
                          void verilenler.isaretle(kart.maddeId, yapildi).then((ok) => ok || kisaMesaj(BAGLANAMIYOR));
                        } else void isaretle(kapi, kart.id, secili, yapildi);
                      }}
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
      {suzgecAcik && (
        <KaynakSuzgeci
          kaynaklar={kaynakListesi}
          gizli={gizli}
          planAdlari={planAdlari}
          onDegis={setGizli}
          onKapat={() => setSuzgecAcik(false)}
        />
      )}
      {form.oge}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  liste: { gap: 12 },
  bos: { paddingVertical: 16, alignItems: 'center' },
});
