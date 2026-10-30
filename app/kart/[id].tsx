// Kart görünümü (K-7, K-12, K-13): tam ekran, alt menü görünmez. Pilot 21 Ekim: tek
// uzun kart; başlık bölümü (başlık, zaman, program, kısa açıklama), seri, sonra her
// blok kendi bölümünde, türünün simgesi ve adıyla. Kart hangi
// günden açıldıysa o günün kaydını gösterir ve ona yazar.
// Pilot 16 Ekim: alttaki "Yaptım" çubuğu kalktı (yapıldı işareti ajandadaki
// satırda); Kütüphaneye kaydet · Paylaş · Sil sağ üstteki "⋯" menüsünde.
// P-38 (24 Ekim): tek yerleşim: "Ne yapacaksın" (içerik, zamanlayıcı, kronometre) ve o
// günün kaydı ("Bugün"). Yaptım yalnız ajandadaki satırda; kişi kendisi işaretler.
// P-36 (24 Ekim, 50+ kullanıcı için sade): yine tek bir yazılı "Düzenle"; kalemler ve
// "Kartın yapısı" kalktı. Boş kartta "+ Karta bir şey ekle". Seri istisnası seri satırının
// altındaki "Seriyi gösterme / göster"den.
// P-62 (29 Ekim): verilen kart (bağ `verilen:`) kilitli; menüde Saati değiştir · Hatırlatma ·
// Bırak. Kendi kartında menüde "Birine ver".
// P-63 (29 Ekim): düzenleme formuyla uyumlu üst bölüm: solda çeşit, sağda zaman rozeti (dokununca
// tarih ve saat; kart buradan taşınır); altında Yaptım kutusu ve başlık (daha küçük yazı).
// P-65: kartı tasarlayan açık bıraktıysa başlıkta ve içerik parçalarında "Değiştir" (yalnız o parça);
// sabitse küçük kilit.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AcilirMenu } from '@/bilesen/AcilirMenu';
import { Dugme } from '@/bilesen/Dugme';
import { useBulusmalar } from '@/bilesen/gruplar/Bulusmalar';
import { GorusmeyeKatil } from '@/bilesen/gruplar/BulusmaKarti';
import { useKartVer } from '@/bilesen/gruplar/KartVerSayfasi';
import { BirakSorusu } from '@/bilesen/gruplar/VerilenKartParcalari';
import { BlokUygulama } from '@/bilesen/kart/BlokUygulama';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { KartZamanSatiri, type KartZamaniAcici } from '@/bilesen/kart/KartZamani';
import { ParcaSeridi } from '@/bilesen/kart/ParcaSeridi';
import { seritHatirlatmaMetni } from '@/bilesen/kart/Zamanlama';
import { useUzman } from '@/bilesen/useUzman';
import { seritOgeleri, type SeritOgesi } from '@/mantik/parcaSecimi';
import { aciklamaVarMi, BOS_ACIKLAMA, metinDoluMu } from '@/mantik/zenginMetin';
import { dosyayiSakla } from '@/veri/dosyalar';
import { AciklamaAlani, MaddeEkle, SatirIciAd, SatirIciBaslik, SatirIciZengin } from '@/bilesen/kart/SatirIci';
import { ElemanMenusu } from '@/bilesen/kart/ElemanMenusu';
import { VideolarDuzenleyici } from '@/bilesen/kart/Videolar';
import { blokVideolari, videolarBlogu } from '@/mantik/video';
import { programBagCoz } from '@/mantik/program';
import { useKartSil } from '@/bilesen/kart/KartSil';
import { useKutuphaneyeKaydet } from '@/bilesen/kutuphane/KaydetSayfasi';
import { usePaylas } from '@/bilesen/paylasim/PaylasSayfasi';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { BLOK_TURLERI } from '@/bilesen/kart/blokTurleri';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { kaynakAnahtari, kaynakTuru } from '@/mantik/kaynak';
import { Yazi } from '@/bilesen/Yazi';
import { gunBasligi } from '@/mantik/ajanda';
import { cesitBul } from '@/mantik/cesit';
import { gorunurMu } from '@/mantik/gorunurluk';
import { ARAC_BLOKLARI, bosKayit, type Kayit } from '@/mantik/kart';
import { bagCoz } from '@/mantik/bulusma';
import { verilenBagCoz } from '@/mantik/kartVerme';
import { aciklamaDegisir, ayarliParcaMi, baslikDegisir, parcaDegisir, saatDegisir } from '@/mantik/gorunumDegisimi';
import { kartPaketi } from '@/mantik/paylasim';
import { useOturum } from '@/sunucu/oturum';
import { type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import {
  blokEkle,
  blokIcerikYaz,
  isaretle,
  kartAyrinti,
  kartKayitlari,
  kartMetniYaz,
  kayitDegistir,
} from '@/veri/kartlar';
import { karttanProgramaEkle, programaYansit, programOku } from '@/veri/programlar';
import { ProgramSecSayfasi } from '@/bilesen/yasam/ProgramSayfalari';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function KartGorunumu() {
  const { id, gun: gunParam, geri } = useLocalSearchParams<{ id: string; gun?: string; geri?: string }>();
  const geriYazisi = geri || 'Ajandam';
  const bugunGun = useBugun();
  const gun: Gun = gunParam ?? bugunGun;
  const kenar = useSafeAreaInsets();
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [programSec, setProgramSec] = useState(0);
  const oturum = useOturum();
  const kartVer = useKartVer();
  const { bulusmalar } = useBulusmalar();
  const [birakSorusu, setBirakSorusu] = useState(false);
  // P-72: kartın altındaki şerit: açıklama yerinde yazılır, hatırlatma zaman sayfasında.
  const [aciklamaYaziliyor, setAciklamaYaziliyor] = useState(false);
  const [aciklamaMenusu, setAciklamaMenusu] = useState(false);
  const zamanAcici = useRef<KartZamaniAcici>(null);
  const uzman = useUzman();

  const form = useKartFormu((sonuc) => {
    if (sonuc.silindi) router.back();
    else if (sonuc.yeniKartId) router.setParams({ id: sonuc.yeniKartId });
  });

  const paylas = usePaylas();
  const [menuAcik, setMenuAcik] = useState(false);
  const kartSil = useKartSil(() => router.back());
  const kutuphane = useKutuphaneyeKaydet(({ kaldirildi }) => {
    if (kaldirildi) router.back();
  });
  const veri = useSorgu(
    ['kart', 'plan'],
    async (oku) => {
      const ayrinti = await kartAyrinti(oku, id);
      if (!ayrinti) return null;
      const program = ayrinti.kart.planId ? await programOku(oku, ayrinti.kart.planId) : null;
      return {
        ...ayrinti,
        kayitlar: await kartKayitlari(oku, id),
        program,
      };
    },
    [id],
  );

  // Kart başka yerden silindiyse geri dön.
  const yok = !veri.yukleniyor && veri.veri === null;
  useEffect(() => {
    if (yok && router.canGoBack()) router.back();
  }, [yok]);

  if (veri.yukleniyor || !veri.veri) return <View style={[stiller.kap, { paddingTop: kenar.top }]} />;

  const { kart, bloklar, kayitlar, program } = veri.veri;

  const programaEkle = async (programId: string) => {
    setProgramSec(0);
    try {
      const sonuc = await karttanProgramaEkle(kapi, oku, kart.id, programId, bugunGun, yeniKimlik);
      kisaMesaj(sonuc === 'baglandi' ? 'Kart artık programın parçası' : 'Programa eklendi');
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    }
  };
  const kayit: Kayit = kayitlar.find((k) => k.tarih === gun) ?? bosKayit(kart.id, gun);
  // Ajandadaki gibi: kendi kartında şerit yok; program, grup, gelen… kartında kaynağın rengi.
  const kaynak = kaynakTuru(kaynakAnahtari(kart));
  const serit = kaynak === 'kendim' ? null : kaynakRenk[kaynak].serit;
  const cesit = cesitBul(kart.cesit ?? null);
  const isaretlenir = gorunurMu(kart, gun, bugunGun);
  const duzenlenir = !kart.kilitli;
  const verilenId = verilenBagCoz(kart.bag);
  // P-62: buluşmanın görüntülü görüşme bağlantısı.
  const bulusmaId = bagCoz(kart.bag)?.id;
  const gorusme = bulusmaId ? bulusmalar.find((b) => b.id === bulusmaId)?.baglanti : undefined;
  const duzenleAc = (blokEkle = false) => form.ac({ tur: 'duzenle', kart, bloklar, gun, blokEkle });
  /** P-66: görünümde doğrudan düzeltme; içerik kartındır (bütün günler). Programın kartıysa programa da yansır. */
  const icerikKaydet = (is: Promise<void>) =>
    void is
      .then(() => (programBagCoz(kart.bag) ? programaYansit(kapi, oku, kart.id) : undefined))
      .catch((e: unknown) => {
        console.error('Kaydedilemedi', e);
        kisaMesaj('Kaydedilemedi. Yeniden dene.');
      });
  /** P-72: şeritten parça: açıklama yerinde yazılır; fotoğraf önce seçilir; öbürleri boş eklenir. */
  const parcaEkle = async (o: SeritOgesi) => {
    if (o === 'aciklama') {
      // P-75: boş da olsa kartta kalır.
      setAciklamaYaziliyor(true);
      if (!aciklamaVarMi(kart.kisa)) icerikKaydet(kartMetniYaz(kapi, kart.id, { kisa: BOS_ACIKLAMA }));
      return;
    }
    if (o === 'foto') {
      const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      const secilen = sonuc.canceled ? undefined : sonuc.assets[0];
      if (!secilen) return;
      const dosya = await dosyayiSakla(secilen.uri, secilen.fileName ?? undefined);
      icerikKaydet(blokEkle(kapi, kart.id, { id: yeniKimlik(), tur: 'foto', dosya }));
      return;
    }
    // Tek seferlik kartta işaretleri kalan liste (formdaki gibi).
    const tur = o === 'liste' && !kart.tekrar ? 'adimlar' : o;
    icerikKaydet(blokEkle(kapi, kart.id, { id: yeniKimlik(), tur }));
  };
  // P-38: tek yerleşim: önce "Ne yapacaksın" (talimat, video, liste, zamanlayıcı…), sonra o günün kaydı.
  const yapilacaklar = bloklar.filter((b) => !BLOK_TURLERI[b.tur].kayit || ARAC_BLOKLARI.includes(b.tur));
  const kaydedilecekler = bloklar.filter((b) => BLOK_TURLERI[b.tur].kayit && !ARAC_BLOKLARI.includes(b.tur));
  const kayitDegis = (degistir: (k: Kayit) => Kayit) => void kayitDegistir(kapi, kart.id, gun, degistir);

  return (
    <View style={[stiller.kap, { paddingTop: kenar.top }]}>
      <View style={stiller.ust}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={`${geriYazisi} ekranına dön`}
          style={stiller.geri}
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={22} color={renk.ana} />
          <Yazi renk={renk.ana} style={stiller.ustYazi}>
            {geriYazisi}
          </Yazi>
        </Pressable>
        <View style={stiller.ustSag}>
          {duzenlenir && (
            <Dugme tur="yazi" etiket="Kur" erisimIpucu="Parça ekle, sırala, ayarlar" onPress={() => duzenleAc()} />
          )}
          <SimgeDugmesi ikon="ellipsis-horizontal" etiket="Diğer işlemler" onPress={() => setMenuAcik(true)} />
        </View>
      </View>

      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        <View style={stiller.kart}>
          {serit && <View style={[stiller.kaynakSeridi, { backgroundColor: serit }]} />}
          <View style={[stiller.bolum, stiller.baslikAlani]}>
            {!!cesit && (
              <View style={stiller.cesitAdi}>
                <Ionicons
                  name={(cesit.ikon as React.ComponentProps<typeof Ionicons>['name'] | null) ?? 'leaf-outline'}
                  size={20}
                  color={renk.ikincil}
                />
                <Yazi tur="etiket" kalinlik="kalin" numberOfLines={1}>
                  {cesit.ad}
                </Yazi>
              </View>
            )}
            {/* P-67: zaman satırı: Tarih · Saat · Süre · Hatırlatma (izinler ayrı). */}
            <KartZamanSatiri ref={zamanAcici} kart={kart} bloklar={bloklar} gun={gun} />
            <View style={stiller.baslikSatiri}>
              {isaretlenir && (
                <Pressable
                  onPress={() => void isaretle(kapi, kart.id, gun, !kayit.yapildi)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: kayit.yapildi }}
                  accessibilityLabel={
                    kayit.yapildi ? `${kart.baslik}: yapıldı` : `${kart.baslik}: yapıldı olarak işaretle`
                  }
                  hitSlop={8}
                  style={stiller.isaretAlani}
                >
                  <View style={[stiller.isaret, kayit.yapildi && stiller.isaretDolu]}>
                    {kayit.yapildi && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
                  </View>
                </Pressable>
              )}
              {baslikDegisir(kart) ? (
                <SatirIciBaslik
                  baslik={kart.baslik}
                  onKaydet={(baslik) => icerikKaydet(kartMetniYaz(kapi, kart.id, { baslik }))}
                />
              ) : (
                <>
                  <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.esnek}>
                    {kart.baslik}
                  </Yazi>
                  <SabitSimgesi />
                </>
              )}
            </View>
            {!!program && (
              <Pressable
                onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: program.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Program: ${program.ad}, aç`}
                style={stiller.planEtiketi}
                hitSlop={8}
              >
                <Yazi tur="etiket" kalinlik="kalin" renk={kaynakRenk.plan.yazi}>
                  {`Program: ${program.ad} ›`}
                </Yazi>
              </Pressable>
            )}
            {/* P-75: açıklama başlık satırlı öğe (Açıklama · Aa · ⋯); boşken de yerinde kalır. */}
            {(aciklamaVarMi(kart.kisa) || aciklamaYaziliyor) && (
              <AciklamaAlani
                key={aciklamaYaziliyor ? 'yaziliyor' : 'durgun'}
                metin={kart.kisa}
                ilkDuzenleme={aciklamaYaziliyor}
                degisir={aciklamaDegisir(kart)}
                onKaydet={(kisa) =>
                  icerikKaydet(kartMetniYaz(kapi, kart.id, { kisa: metinDoluMu(kisa) ? kisa : BOS_ACIKLAMA }))
                }
                onMenu={duzenlenir ? () => setAciklamaMenusu(true) : undefined}
              />
            )}
            {!!gorusme && <GorusmeyeKatil baglanti={gorusme} />}
          </View>

          {/* P-73: Kayıt ve seri kutusu kartta yok; alışkanlıkların gidişatı ayrı ekranda düşünülecek. */}
          {[
            // P-69: "Ne yapacaksın" başlığı yok (açıklama da yukarıda); günün kaydında gün başlığı kalır.
            { baslik: '', liste: yapilacaklar },
            { baslik: gun === bugunGun ? 'Bugün' : gunBasligi(gun, bugunGun), liste: kaydedilecekler },
          ].map(
            (bolum) =>
              bolum.liste.length > 0 && (
                <View key={bolum.baslik || 'icerik'} style={[stiller.bolum, stiller.cizgili, stiller.anaBolum]}>
                  {!!bolum.baslik && (
                    <Yazi tur="kutuBasligi" accessibilityRole="header">
                      {bolum.baslik}
                    </Yazi>
                  )}
                  {bolum.liste.map((b) => {
                    const tur = BLOK_TURLERI[b.tur];
                    // P-69: listede simge ve "Liste" yazısı yok; yalnız varsa liste adı.
                    const listeMi = b.tur === 'liste' || b.tur === 'adimlar';
                    const ad = listeMi ? b.ad : tur.ad;
                    const sabitSimge = ayarliParcaMi(b.tur) && !parcaDegisir(kart, b);
                    const r = tur.kayit ? renk.vurguYazi : renk.ana;
                    return (
                      <View key={`${b.id}-${gun}`} style={stiller.parca}>
                        {/* Kayıt parçalarının kendi adı var ("Su", "Enerjim", soru); tür başlığı tekrar olmasın. */}
                        {/* P-74: listenin başlığı hep var: adı ya da "Liste"; değişebiliyorsa dokununca yazılır. */}
                        {!tur.kayit && listeMi && (
                          <View style={stiller.blokBasligi}>
                            {parcaDegisir(kart, b) ? (
                              <SatirIciAd
                                ad={b.ad}
                                ipucu="Liste"
                                onKaydet={(yeni) => icerikKaydet(blokIcerikYaz(kapi, b.id, { ad: yeni }))}
                              />
                            ) : (
                              <Yazi kalinlik="kalin" renk={r} style={stiller.blokAdi} numberOfLines={1}>
                                {ad || 'Liste'}
                              </Yazi>
                            )}
                            {sabitSimge && <SabitSimgesi />}
                          </View>
                        )}
                        {!tur.kayit && !listeMi && (
                          <View style={stiller.blokBasligi}>
                            <View
                              style={[
                                stiller.blokSimgesi,
                                { backgroundColor: tur.kayit ? renk.vurguAcik : renk.anaAcik },
                              ]}
                            >
                              <Ionicons name={tur.ikon} size={18} color={r} />
                            </View>
                            <Yazi kalinlik="kalin" renk={r} style={stiller.blokAdi} numberOfLines={1}>
                              {ad}
                            </Yazi>
                            {sabitSimge && <SabitSimgesi />}
                          </View>
                        )}
                        {/* P-66: kuran açık bıraktıysa talimat ve video yerinde düzeltilir, listeye madde eklenir. */}
                        {parcaDegisir(kart, b) && b.tur === 'talimat' ? (
                          <SatirIciZengin
                            metin={b.metin}
                            etiket="Talimat"
                            bosIpucu="+ Talimat yaz"
                            onKaydet={(metin) => icerikKaydet(blokIcerikYaz(kapi, b.id, { metin }))}
                          />
                        ) : parcaDegisir(kart, b) && b.tur === 'video' ? (
                          <VideolarDuzenleyici
                            videolar={blokVideolari(b)}
                            onDegis={(v) => icerikKaydet(blokIcerikYaz(kapi, b.id, videolarBlogu(v)))}
                          />
                        ) : (
                          <BlokUygulama blok={b} gun={gun} kayit={kayit} kayitlar={kayitlar} onKayit={kayitDegis} />
                        )}
                        {parcaDegisir(kart, b) && (b.tur === 'liste' || b.tur === 'adimlar') && (
                          <MaddeEkle
                            onEkle={(madde) =>
                              icerikKaydet(blokIcerikYaz(kapi, b.id, { maddeler: [...b.maddeler, madde] }))
                            }
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              ),
          )}

          {/* P-72: Kur'daki şerit kartın kendisinde de: Hatırlatma · Açıklama · Liste · Fotoğraf · Video (· Daha). */}
          <View style={stiller.seritAlani}>
            <ParcaSeridi
              {...(duzenlenir
                ? seritOgeleri({
                    aciklamaVar: aciklamaVarMi(kart.kisa) || aciklamaYaziliyor || !aciklamaDegisir(kart),
                    uzman,
                    mevcut: bloklar.map((b) => b.tur),
                  })
                : { ogeler: [], daha: false })}
              onSec={(o) => void parcaEkle(o)}
              onDaha={() => duzenleAc(true)}
              hatirlatma={{
                metin: seritHatirlatmaMetni(kart),
                ayarli: kart.hatirlatma !== null,
                alarm: !!kart.alarm,
                izin: saatDegisir(kart),
                onPress: () => zamanAcici.current?.ac('hatirlatma'),
              }}
            />
          </View>
        </View>

        {kart.kilitli && (
          <Yazi tur="ikincil">
            {verilenId
              ? `${kart.gelenKimden || 'Bir yakının'} verdi. Değiştirmene izin verdiği alanları doğrudan düzeltebilirsin. Yaptım bilgin ona gider.`
              : 'Koçundan gelen kart paylaşılamaz; kendi kütüphanene kaydedebilirsin.'}
          </Yazi>
        )}
      </ScrollView>

      {aciklamaMenusu && (
        <ElemanMenusu
          baslik="Açıklama"
          anahtarlar={[]}
          onSil={() => {
            setAciklamaMenusu(false);
            setAciklamaYaziliyor(false);
            icerikKaydet(kartMetniYaz(kapi, kart.id, { kisa: '' }));
          }}
          silEtiketi="Karttan kaldır"
          onKapat={() => setAciklamaMenusu(false)}
        />
      )}
      {menuAcik && (
        <AcilirMenu
          ust={kenar.top + 52}
          onKapat={() => setMenuAcik(false)}
          ogeler={[
            {
              etiket: 'Kütüphaneye kaydet',
              ikon: 'bookmark-outline',
              onPress: () => kutuphane.ac({ tur: 'kart', kart, bloklar, alanlar: program?.alanlar ?? [] }),
            },
            ...(!kart.planId && !kart.bag && !kart.kilitli
              ? [
                  {
                    etiket: 'Programa ekle',
                    ikon: 'albums-outline' as const,
                    onPress: () => setProgramSec((n) => n + 1),
                  },
                ]
              : []),
            ...(verilenId
              ? [
                  {
                    etiket: 'Bırak',
                    ikon: 'close-circle-outline' as const,
                    tehlike: true,
                    onPress: () => setBirakSorusu(true),
                  },
                ]
              : []),
            ...(!kart.kilitli && !kart.bag && oturum.durum === 'var'
              ? [
                  {
                    etiket: 'Birine ver',
                    ikon: 'gift-outline' as const,
                    onPress: () => kartVer.ac({ paket: kartPaketi(kart, bloklar) }),
                  },
                ]
              : []),
            ...(kart.kilitli
              ? []
              : [
                  { etiket: 'Paylaş', ikon: 'share-outline' as const, onPress: () => paylas.ac({ kart, bloklar }) },
                  {
                    etiket: 'Sil',
                    ikon: 'trash-outline' as const,
                    tehlike: true,
                    onPress: () => kartSil.baslat(kart, gun),
                  },
                ]),
          ]}
        />
      )}
      {form.oge}
      {kartVer.oge}
      {birakSorusu && verilenId && (
        <BirakSorusu
          kart={kart}
          verilenId={verilenId}
          onKapat={() => setBirakSorusu(false)}
          onBirakildi={() => router.back()}
        />
      )}
      {paylas.oge}
      {kutuphane.oge}
      {kartSil.oge}
      {programSec > 0 && (
        <ProgramSecSayfasi
          key={programSec}
          baslik={kart.baslik}
          gorunur
          onKapat={() => setProgramSec(0)}
          onSec={(pid) => void programaEkle(pid)}
        />
      )}
    </View>
  );
}

/** Görünümde değiştirilemeyen alanın yanında küçük kilit (P-65). */
function SabitSimgesi() {
  return (
    <View accessible accessibilityLabel="Bu kartta değiştirilemez" style={stiller.sabit}>
      <Ionicons name="lock-closed-outline" size={18} color={renk.soluk} />
    </View>
  );
}

const stiller = StyleSheet.create({
  ustSag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planEtiketi: {
    alignSelf: 'flex-start',
    backgroundColor: kaynakRenk.plan.zemin,
    borderRadius: olcu.kose.etiket,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  kap: { flex: 1, backgroundColor: renk.zemin },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: olcu.ekranKenari - 6,
    minHeight: 56,
  },
  geri: { flexDirection: 'row', alignItems: 'center', minHeight: olcu.enAzDokunma, paddingHorizontal: 6 },
  ustYazi: { fontSize: 18 },
  icerik: { paddingHorizontal: olcu.ekranKenari, paddingBottom: 32, gap: olcu.bolumArasi },
  baslikAlani: { gap: 6 },
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#17212B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kaynakSeridi: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  bolum: { paddingHorizontal: olcu.kartIci + 4, paddingVertical: 16, gap: 12 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  seritAlani: { paddingHorizontal: olcu.kartIci, paddingBottom: olcu.kartIci },
  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: -6 },
  cesitAdi: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  esnek: { flex: 1 },
  baslikSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  isaretAlani: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  isaret: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isaretDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  sabit: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  kisa: { marginTop: 4 },
  blokBasligi: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blokSimgesi: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  blokAdi: { flex: 1 },
  anaBolum: { gap: 16 },
  parca: { gap: 10 },
});
