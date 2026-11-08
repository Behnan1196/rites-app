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
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AcilirMenu, type MenuOgesi } from '@/bilesen/AcilirMenu';
import { SiraliKartlar, type SurukleIslemleri } from '@/bilesen/ajanda/SiraliKartlar';
import { useBulusmalar } from '@/bilesen/gruplar/Bulusmalar';
import { GorusmeyeKatil } from '@/bilesen/gruplar/BulusmaKarti';
import { useKartVer } from '@/bilesen/gruplar/KartVerSayfasi';
import { BirakSorusu } from '@/bilesen/gruplar/VerilenKartParcalari';
import { BlokUygulama, OlcumSadeBaglami } from '@/bilesen/kart/BlokUygulama';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { KartZamanSatiri } from '@/bilesen/kart/KartZamani';
import { ParcaSeridi } from '@/bilesen/kart/ParcaSeridi';
import { ParcaAyarSayfasi } from '@/bilesen/kart/ParcaAyarSayfasi';
import { BlokSecici } from '@/bilesen/kart/BlokSecici';
import { OlcumSecici } from '@/bilesen/kart/OlcumSecici';
import { RutinAdimlari } from '@/bilesen/kart/RutinAdimlari';
import { ListeCesidiSecici } from '@/bilesen/kart/ListeCesidiSecici';
import { AdimGunuSayfasi } from '@/bilesen/kart/AdimGunuSayfasi';
import { ListeyiPaylas, ListeyiSilSorusu } from '@/bilesen/listeler/ListeKartiIslemleri';
import { useOturumAc } from '@/bilesen/oturum/OturumSayfasi';
import { adimGunuYaz, listedeYaz } from '@/veri/listeKartlari';
import { adimlarListeParcasi, RUTIN_BILGI, RUTIN_GUNLUK, RUTIN_KALICI, rutinCesidi } from '@/mantik/rutinAdimlari';
import { rutinAdimiIsaretle, rutinAdimlari, rutinYap } from '@/veri/rutinler';
import { olcumParcalariMi } from '@/mantik/gidisat';
import { SERIT_PARCALARI } from '@/mantik/parcaSecimi';
import { ajandadaMi, aliskanlikMi, programKartiMi } from '@/mantik/aliskanlik';
import type { ParcaTaslagi } from '@/mantik/blokTaslak';
import { useUzman } from '@/bilesen/useUzman';
import { seritOgeleri, type SeritOgesi } from '@/mantik/parcaSecimi';
import { aciklamaVarMi, BOS_ACIKLAMA, metinDoluMu } from '@/mantik/zenginMetin';
import { isaretleriDuzelt } from '@/mantik/maddeDuzeltme';
import { dosyayiSakla } from '@/veri/dosyalar';
import { AciklamaAlani, MaddeEkle, SatirIciBaslik, SatirIciZengin } from '@/bilesen/kart/SatirIci';
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
import { gunBasligi, kisaGoreliTarih } from '@/mantik/ajanda';
import { cesitBul } from '@/mantik/cesit';
import { gorunurMu } from '@/mantik/gorunurluk';
import {
  ARAC_BLOKLARI,
  bosKayit,
  maddeliListeMi,
  type Blok,
  type BlokTuru,
  type Kayit,
  type SabitAlan,
} from '@/mantik/kart';
import { bagCoz } from '@/mantik/bulusma';
import { verilenBagCoz } from '@/mantik/kartVerme';
import {
  aciklamaDegisir,
  ayarliParcaMi,
  baslikDegisir,
  kilitAyariGorunur,
  parcaDegisir,
  sabitDegistir,
} from '@/mantik/gorunumDegisimi';
import { kartPaketi } from '@/mantik/paylasim';
import { useOturum } from '@/sunucu/oturum';
import { type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import {
  blokEkle,
  blokIcerikYaz,
  blokMaddesiYaz,
  ajandadaYaz,
  aliskanlikYaz,
  blokSabitYaz,
  blokYaz,
  blokSil,
  blokSiralariniYaz,
  bloklarinYeriniDegistir,
  kartSabitleriYaz,
  isaretle,
  kartAyrinti,
  kartlariSil,
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

/** P-77: kart görünümünde ayar sayfası olan parçalar (talimat ve video yerinde düzeltilir). */
const AYARLI: readonly BlokTuru[] = [
  'liste',
  'adimlar',
  'bilgi',
  'listebag',
  'olcum',
  'adet',
  'puan',
  'gunnot',
  'sayac',
  'dosya',
  'foto',
];

export default function KartGorunumu() {
  const {
    id,
    gun: gunParam,
    geri,
    olcumlerimden,
  } = useLocalSearchParams<{ id: string; gun?: string; geri?: string; olcumlerimden?: string }>();
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
  /** P-76: parçanın ⋯ menüsü (görünümde): değişebilir, Yukarı / Aşağı, Karttan kaldır. */
  const [blokMenusu, setBlokMenusu] = useState<string | null>(null);
  /** P-77: Kur'a gitmeden: parça ayarı (yeni ya da var olan), Daha seçicisi, başlık ve zaman izinleri. */
  const [parcaAyari, setParcaAyari] = useState<{ blok: ParcaTaslagi; yeni: boolean } | null>(null);
  const [seciciAcik, setSeciciAcik] = useState(false);
  const [zamanMenusu, setZamanMenusu] = useState(false);
  /** P-83: kartın sonundaki "+ Ekle" açıkken parça seçenekleri görünür. */
  const [ekleAcik, setEkleAcik] = useState(false);
  const [olcumSecici, setOlcumSecici] = useState(false);
  /** P-105: listenin çeşidi (yeni liste ya da var olanın çeşidi). */
  const [listeCesidi, setListeCesidi] = useState(false);
  /** P-110: Listeler'deki listenin paylaşımı ve silinmesi; Adımlar'da maddenin günü. */
  const [listePaylas, setListePaylas] = useState(false);
  const [listeSil, setListeSil] = useState(false);
  const [adimGunu, setAdimGunu] = useState(false);
  /** P-112: başlık yazılırken Yaptım kutusu gizlenir. */
  const [baslikYaziliyor, setBaslikYaziliyor] = useState(false);
  const oturumAc = useOturumAc();
  /** P-101: rutinin adımı sürüklenirken ekran kaymasın. */
  const [surukleniyor, setSurukleniyor] = useState(false);
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
      // P-93: rutinin adımıysa rutin.
      const rutin = ayrinti.kart.ust ? ((await kartAyrinti(oku, ayrinti.kart.ust))?.kart ?? null) : null;
      // P-105: dışarı giderken (paylaş, ver, kütüphane) adımlar liste parçası olur.
      const adimlar = ayrinti.kart.rutin ? await rutinAdimlari(oku, ayrinti.kart.id) : [];
      return {
        ...ayrinti,
        kayitlar: await kartKayitlari(oku, id),
        program,
        rutin,
        adimlar,
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

  const { kart, bloklar, kayitlar, program, rutin, adimlar } = veri.veri;
  const disaBloklar = adimlarListeParcasi(kart, bloklar, adimlar);

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
  const bilgiMi = rutinCesidi(kart) === RUTIN_BILGI || (!!rutin && rutinCesidi(rutin) === RUTIN_BILGI);
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
  /** P-77: Daha'dan parça: ayarı olan (ölçüm, puan, zamanlayıcı…) önce kurulur; öbürleri doğrudan eklenir. */
  const dahadanEkle = (tur: BlokTuru) => {
    const yeni: ParcaTaslagi = {
      id: yeniKimlik(),
      tur,
      ad: '',
      metin: '',
      birim: '',
      dakika: tur === 'sayac' ? 10 : null,
      maddeler: [],
      dosya: null,
    };
    if (AYARLI.includes(tur)) setParcaAyari({ blok: yeni, yeni: true });
    else icerikKaydet(blokEkle(kapi, kart.id, yeni));
  };
  /** P-72: şeritten parça: açıklama yerinde yazılır; fotoğraf önce seçilir; öbürleri boş eklenir. */
  const parcaEkle = async (o: SeritOgesi) => {
    // P-87: Ölçüm önce hazırları ve Sayarak · Sayı · Puan'ı gösterir.
    if (o === 'olcum') {
      setOlcumSecici(true);
      return;
    }
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
    // P-105: listenin maddeleri kart olur; önce çeşidi sorulur (Adımlar · Günlük kontrol · Bilgi listesi).
    if (o === 'liste') {
      setListeCesidi(true);
      return;
    }
    icerikKaydet(blokEkle(kapi, kart.id, { id: yeniKimlik(), tur: o }));
  };
  // P-38: tek yerleşim: önce "Ne yapacaksın" (talimat, video, liste, zamanlayıcı…), sonra o günün kaydı.
  const yapilacaklar = bloklar.filter((b) => !BLOK_TURLERI[b.tur].kayit || ARAC_BLOKLARI.includes(b.tur));
  const kaydedilecekler = bloklar.filter((b) => BLOK_TURLERI[b.tur].kayit && !ARAC_BLOKLARI.includes(b.tur));
  const eklenecek = seritOgeleri({
    aciklamaVar: aciklamaVarMi(kart.kisa) || aciklamaYaziliyor || !aciklamaDegisir(kart),
    uzman,
    // P-105: listesi olan (ya da bir listenin maddesi olan) karta ikinci liste eklenmez.
    mevcut: [...bloklar.map((b) => b.tur), ...(kart.rutin || kart.ust ? (['liste'] as const) : [])],
  });
  /**
   * P-109: Kur menünün sonunda (silmeden önce); normal kullanıcıda adı "Gelişmiş".
   * P-104: rutinin adımının menüsü sade: yalnız Kur ve Rutinden kaldır.
   */
  const KUR = uzman ? 'Kur: ayarlar ve sıra' : 'Gelişmiş ayarlar';
  const menuOgeleri = (ogeler: MenuOgesi[], kur: MenuOgesi | null): MenuOgesi[] => {
    const i = ogeler.findIndex((o) => o.tehlike);
    const hepsi = !kur ? ogeler : i < 0 ? [...ogeler, kur] : [...ogeler.slice(0, i), kur, ...ogeler.slice(i)];
    return kart.ust
      ? hepsi.filter((o) =>
          [KUR, 'Listeden kaldır', 'Gün ver', 'Alışkanlık olarak izle', 'Alışkanlıktan çıkar'].includes(o.etiket),
        )
      : hepsi;
  };
  const kayitDegis = (degistir: (k: Kayit) => Kayit) => void kayitDegistir(kapi, kart.id, gun, degistir);

  /** Bir parça (başlığı, içeriği); `surukle` varsa başlığa uzun basınca sürüklenir (P-115). */
  const parcaGoster = (b: Blok, surukle?: SurukleIslemleri) => {
    const tur = BLOK_TURLERI[b.tur];
    // P-69: listede simge ve "Liste" yazısı yok; yalnız varsa liste adı.
    const listeMi = maddeliListeMi(b.tur);
    const ad = listeMi ? b.ad : tur.ad;
    const sabitSimge = ayarliParcaMi(b.tur) && !parcaDegisir(kart, b);
    return (
      <Pressable
        key={`${b.id}-${gun}`}
        style={[stiller.parca, !!surukle && stiller.suruklenir]}
        onLongPress={duzenlenir ? () => setBlokMenusu(b.id) : undefined}
        accessible={false}
      >
        {/* P-83: sade başlık: yalnız parçanın adı (simge, tür başlığı ve ⋯ yok). Ada dokununca
                            ya da parçaya uzun basınca parçanın menüsü. Kayıt parçalarının (Sayarak, Ölçüm…)
                            adı kendi içinde; başlıkları yok, menüleri uzun basınca. */}
        {!tur.kayit && (
          <Pressable
            onPress={duzenlenir ? () => setBlokMenusu(b.id) : undefined}
            // P-115: başlığa uzun basıp sürükleyerek sıra değişir (dokununca menü).
            onLongPress={surukle ? surukle.onUzunBas : duzenlenir ? () => setBlokMenusu(b.id) : undefined}
            delayLongPress={300}
            onPressOut={surukle?.onBirak}
            accessibilityActions={surukle?.eylemler}
            onAccessibilityAction={surukle?.onEylem}
            disabled={!duzenlenir}
            accessibilityRole={duzenlenir ? 'button' : 'header'}
            accessibilityLabel={duzenlenir ? `${ad || 'Liste'}: seçenekler` : ad || 'Liste'}
            accessibilityHint={surukle ? 'Sırasını değiştirmek için uzun basıp sürükle' : undefined}
            hitSlop={6}
            style={({ pressed }) => [stiller.blokBasligi, pressed && { opacity: 0.6 }]}
          >
            <Yazi kalinlik="kalin" renk={renk.ikincil} style={stiller.blokAdi} numberOfLines={1}>
              {ad || 'Liste'}
            </Yazi>
            {sabitSimge && <SabitSimgesi />}
            {duzenlenir && <Ionicons name="chevron-down" size={16} color={renk.soluk} />}
          </Pressable>
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
          <BlokUygulama
            blok={b}
            gun={gun}
            kayit={kayit}
            kayitlar={kayitlar}
            onKayit={kayitDegis}
            onMaddeDuzelt={
              parcaDegisir(kart, b)
                ? (i, yeni) => {
                    icerikKaydet(blokMaddesiYaz(kapi, b.id, i, yeni));
                    // P-86: günlük listede silinen maddenin o günkü işareti de gider.
                    if (yeni === null && b.tur === 'liste')
                      kayitDegis((k) => ({
                        ...k,
                        isaretler: {
                          ...k.isaretler,
                          [b.id]: isaretleriDuzelt(k.isaretler[b.id] ?? [], i, null),
                        },
                      }));
                  }
                : undefined
            }
          />
        )}
        {parcaDegisir(kart, b) && listeMi && (
          <MaddeEkle
            onEkle={(madde) => icerikKaydet(blokIcerikYaz(kapi, b.id, { maddeler: [...b.maddeler, madde] }))}
          />
        )}
      </Pressable>
    );
  };

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
          <SimgeDugmesi ikon="ellipsis-horizontal" etiket="Diğer işlemler" onPress={() => setMenuAcik(true)} />
        </View>
      </View>

      <ScrollView
        scrollEnabled={!surukleniyor}
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps={kart.olcumlerim ? 'never' : 'handled'}
      >
        <OlcumSadeBaglami.Provider value={!!kart.olcumlerim}>
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
              <View style={stiller.baslikSatiri}>
                {/* P-112: Bilgi listesinde (ve maddelerinde) Yaptım yok. */}
                {isaretlenir && !baslikYaziliyor && !bilgiMi && (
                  <Pressable
                    onPress={() =>
                      void (kart.ust
                        ? rutinAdimiIsaretle(kapi, oku, kart.ust, kart.id, gun, !kayit.yapildi)
                        : isaretle(kapi, kart.id, gun, !kayit.yapildi))
                    }
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
                    onDuzenleme={setBaslikYaziliyor}
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
              {/* P-83: başlığın altında tek, sessiz zaman satırı; dokununca tek Zaman sayfası. */}
              {/* P-93: rutinin adımının kendi zamanı yok; rutinin günlerini izler. */}
              {/* P-110: Listeler'deki liste ajandada değilse zamanı yok. */}
              {!kart.ust && (!kart.listede || ajandadaMi(kart)) && (
                <KartZamanSatiri kart={kart} bloklar={bloklar} gun={gun} />
              )}
              {!!rutin && (
                <Pressable
                  onPress={() =>
                    // Listeden açıldıysa geri; ajandadan açıldıysa liste açılır.
                    router.canGoBack() && geri === rutin.baslik
                      ? router.back()
                      : router.push({ pathname: '/kart/[id]', params: { id: rutin.id, gun } })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Liste: ${rutin.baslik}, aç`}
                  style={stiller.planEtiketi}
                  hitSlop={8}
                >
                  <Yazi tur="etiket" kalinlik="kalin" renk={renk.ana}>
                    {`Liste: ${rutin.baslik}${kart.tekrar === null && kart.tarih ? ` · ${kisaGoreliTarih(kart.tarih, bugunGun)}` : ''} ›`}
                  </Yazi>
                </Pressable>
              )}
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

            {/* P-93: rutinin adımları. */}
            {kart.rutin && (
              <View style={[stiller.bolum, stiller.cizgili, stiller.anaBolum]}>
                <RutinAdimlari
                  rutin={kart}
                  gun={gun}
                  duzenlenir={duzenlenir}
                  isaretlenir={isaretlenir}
                  onSurukleme={setSurukleniyor}
                  onCesit={duzenlenir ? () => setListeCesidi(true) : undefined}
                />
              </View>
            )}

            {/* P-73: Kayıt ve seri kutusu kartta yok; alışkanlıkların gidişatı ayrı ekranda düşünülecek. */}
            {[
              // P-69: "Ne yapacaksın" başlığı yok (açıklama da yukarıda); günün kaydında gün başlığı kalır.
              { baslik: '', liste: yapilacaklar },
              // P-83: "Bugün" başlığı yok; başka bir günün kaydında gün yazılır.
              { baslik: gun === bugunGun ? '' : gunBasligi(gun, bugunGun), liste: kaydedilecekler },
            ].map(
              (bolum) =>
                bolum.liste.length > 0 && (
                  <View
                    key={bolum.liste === yapilacaklar ? 'icerik' : 'kayit'}
                    style={[stiller.bolum, stiller.cizgili, stiller.anaBolum]}
                  >
                    {!!bolum.baslik && (
                      <Yazi tur="kutuBasligi" accessibilityRole="header">
                        {bolum.baslik}
                      </Yazi>
                    )}
                    {bolum.liste === yapilacaklar && duzenlenir ? (
                      // P-115: parçalar başlığa uzun basıp sürüklenerek sıralanır.
                      <SiraliKartlar
                        kartlar={bolum.liste}
                        aralik={16}
                        onSurukleme={setSurukleniyor}
                        onSira={(kimlikler) => icerikKaydet(blokSiralariniYaz(kapi, kart.id, kimlikler))}
                        satir={(b, surukle) => parcaGoster(b, surukle)}
                      />
                    ) : (
                      bolum.liste.map((b) => parcaGoster(b))
                    )}
                  </View>
                ),
            )}
            {/* P-83: alttaki sabit şerit yerine kartın sonunda "+ Ekle"; dokununca parça seçenekleri. */}
            {duzenlenir && (eklenecek.ogeler.length > 0 || eklenecek.daha) && (
              <View style={[stiller.bolum, stiller.cizgili, stiller.ekleAlani]}>
                {ekleAcik ? (
                  <ParcaSeridi
                    {...eklenecek}
                    onSec={(o) => {
                      setEkleAcik(false);
                      void parcaEkle(o);
                    }}
                    onDaha={() => {
                      setEkleAcik(false);
                      setSeciciAcik(true);
                    }}
                    onKapat={() => setEkleAcik(false)}
                  />
                ) : (
                  <Pressable
                    onPress={() => setEkleAcik(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Karta ekle: açıklama, liste, fotoğraf, video"
                    hitSlop={8}
                    style={({ pressed }) => [stiller.ekle, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="add" size={20} color={renk.ana} />
                    <Yazi kalinlik="kalin" renk={renk.ana}>
                      Ekle
                    </Yazi>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {kart.kilitli && (
            <Yazi tur="ikincil">
              {verilenId
                ? `${kart.gelenKimden || 'Bir yakının'} verdi. Değiştirmene izin verdiği alanları doğrudan düzeltebilirsin. Yaptım bilgin ona gider.`
                : 'Koçundan gelen kart paylaşılamaz; kendi kütüphanene kaydedebilirsin.'}
            </Yazi>
          )}
        </OlcumSadeBaglami.Provider>
      </ScrollView>
      {blokMenusu &&
        (() => {
          const b = bloklar.find((x) => x.id === blokMenusu);
          if (!b) return null;
          // Yukarı / Aşağı: kartta görünen aynı bölümdeki komşuyla.
          const bolum = BLOK_TURLERI[b.tur].kayit && !ARAC_BLOKLARI.includes(b.tur) ? kaydedilecekler : yapilacaklar;
          const i = bolum.findIndex((x) => x.id === b.id);
          const once = bolum[i - 1];
          const sonra = bolum[i + 1];
          const tasi = (diger: string) => icerikKaydet(bloklarinYeriniDegistir(kapi, kart.id, b.id, diger));
          const ad = maddeliListeMi(b.tur) && b.ad ? b.ad : BLOK_TURLERI[b.tur].ad;
          return (
            <ElemanMenusu
              baslik={ad}
              anahtarlar={
                ayarliParcaMi(b.tur)
                  ? [
                      {
                        etiket: BLOK_TURLERI[b.tur].ad,
                        acik: !b.sabit,
                        onDegis: (acik) => icerikKaydet(blokSabitYaz(kapi, b.id, !acik)),
                      },
                    ]
                  : []
              }
              // P-115: başlığı olan parçalar sürüklenir; Yukarı / Aşağı yalnız kayıt parçalarında.
              onYukari={once && BLOK_TURLERI[b.tur].kayit ? () => tasi(once.id) : undefined}
              onAsagi={sonra && BLOK_TURLERI[b.tur].kayit ? () => tasi(sonra.id) : undefined}
              onSil={() => {
                setBlokMenusu(null);
                icerikKaydet(blokSil(kapi, b.id));
              }}
              onDuzenle={AYARLI.includes(b.tur) ? () => setParcaAyari({ blok: b, yeni: false }) : undefined}
              duzenleEtiketi={
                maddeliListeMi(b.tur)
                  ? 'Liste: maddeler ve kullanım'
                  : b.tur === 'listebag'
                    ? 'Başka liste seç'
                    : 'Ayarla'
              }
              silEtiketi="Karttan kaldır"
              onKapat={() => setBlokMenusu(null)}
            />
          );
        })()}
      {zamanMenusu &&
        (() => {
          // Eski kayıttaki tek "zaman" kilidi tarih ve saate açılır.
          const acilmis = (kart.sabitler ?? []).flatMap((x): SabitAlan[] => (x === 'zaman' ? ['tarih', 'saat'] : [x]));
          const anahtar = (alan: SabitAlan, etiket: string) => ({
            etiket,
            acik: !acilmis.includes(alan),
            onDegis: (acik: boolean) =>
              icerikKaydet(kartSabitleriYaz(kapi, kart.id, sabitDegistir(acilmis, alan, !acik))),
          });
          return (
            <ElemanMenusu
              baslik="Başlık ve zaman"
              anahtarlar={[
                anahtar('baslik', 'Başlık'),
                anahtar('tarih', 'Tarih ve süre'),
                anahtar('saat', 'Saat ve hatırlatma'),
              ]}
              onKapat={() => setZamanMenusu(false)}
            />
          );
        })()}
      <ListeCesidiSecici
        gorunur={listeCesidi}
        secili={rutinCesidi(kart)}
        onKapat={() => setListeCesidi(false)}
        onSec={(c) => {
          setListeCesidi(false);
          if (c !== rutinCesidi(kart)) icerikKaydet(rutinYap(kapi, kart.id, c));
        }}
      />
      <OlcumSecici
        gorunur={olcumSecici}
        mevcut={bloklar}
        onKapat={() => setOlcumSecici(false)}
        onHazir={(h) => {
          setOlcumSecici(false);
          icerikKaydet(
            blokEkle(kapi, kart.id, { id: yeniKimlik(), tur: h.tur, ad: h.ad, birim: h.birim, dakika: h.hedef }),
          );
        }}
        onTur={(tur) => {
          setOlcumSecici(false);
          setParcaAyari({
            blok: { id: yeniKimlik(), tur, ad: '', metin: '', birim: '', dakika: null, maddeler: [], dosya: null },
            yeni: true,
          });
        }}
      />
      <BlokSecici
        gorunur={seciciAcik}
        uzman={uzman}
        mevcut={[...bloklar.map((b) => b.tur), ...SERIT_PARCALARI]}
        onKapat={() => setSeciciAcik(false)}
        onSec={(tur) => {
          setSeciciAcik(false);
          dahadanEkle(tur);
        }}
      />
      {parcaAyari && (
        <ParcaAyarSayfasi
          blok={parcaAyari.blok}
          yeni={parcaAyari.yeni}
          cokGunlu={!!kart.tekrar}
          siklik={!!kart.olcumlerim}
          onKaydet={(t) => {
            const { id, ...alanlar } = t;
            icerikKaydet(parcaAyari.yeni ? blokEkle(kapi, kart.id, { id, ...alanlar }) : blokYaz(kapi, t));
          }}
          onKapat={() => setParcaAyari(null)}
        />
      )}
      {aciklamaMenusu && (
        <ElemanMenusu
          baslik="Açıklama"
          anahtarlar={[
            {
              etiket: 'Açıklama',
              acik: !(kart.sabitler ?? []).includes('aciklama'),
              onDegis: (acik) =>
                icerikKaydet(kartSabitleriYaz(kapi, kart.id, sabitDegistir(kart.sabitler ?? [], 'aciklama', !acik))),
            },
          ]}
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
          ogeler={menuOgeleri(
            [
              // P-87: ölçümlerin gidişatı (son 4 hafta, yan yana).
              ...(olcumParcalariMi(bloklar)
                ? [
                    {
                      etiket: 'Gidişat',
                      ikon: 'stats-chart-outline' as const,
                      onPress: () => router.push({ pathname: '/kart/gidisat/[id]', params: { id: kart.id } }),
                    },
                  ]
                : []),
              {
                etiket: 'Kütüphaneye kaydet',
                ikon: 'bookmark-outline',
                onPress: () =>
                  kutuphane.ac({ tur: 'kart', kart, bloklar: disaBloklar, alanlar: program?.alanlar ?? [] }),
              },
              // P-78: tekrarlı kart alışkanlık olarak izlenir (Giriş → Devam edenler); programın kartı zaten öyle.
              ...(duzenlenir && kart.tekrar && !programKartiMi(kart) && !kart.olcumlerim && !kart.ust
                ? [
                    {
                      etiket: kart.aliskanlik ? 'Alışkanlıktan çıkar' : 'Alışkanlık olarak izle',
                      ikon: 'leaf-outline' as const,
                      onPress: () =>
                        icerikKaydet(
                          aliskanlikYaz(kapi, kart.id, !kart.aliskanlik).then(() =>
                            kisaMesaj(
                              kart.aliskanlik
                                ? 'Artık alışkanlık değil; ajandada görünür'
                                : 'Alışkanlık: Giriş → Devam edenler’de; ajandada görünmez',
                            ),
                          ),
                        ),
                    },
                  ]
                : []),
              // P-110: Listeler'e taşı (liste ajandada görünmeye devam eder).
              ...(duzenlenir && kart.rutin && !kart.listede && !kart.ust && !kart.olcumlerim
                ? [
                    {
                      etiket: 'Listeler’e taşı',
                      ikon: 'list-outline' as const,
                      onPress: () =>
                        icerikKaydet(
                          listedeYaz(kapi, kart.id, true).then(() =>
                            kisaMesaj('Giriş → Listeler’de; ajandada da görünüyor'),
                          ),
                        ),
                    },
                  ]
                : []),
              // P-110: Günlük kontrol listesinin maddesi alışkanlık olarak izlenebilir (listenin günleriyle).
              ...(duzenlenir && kart.ust && kart.tekrar && rutin && rutinCesidi(rutin) === RUTIN_GUNLUK
                ? [
                    {
                      etiket: kart.aliskanlik ? 'Alışkanlıktan çıkar' : 'Alışkanlık olarak izle',
                      ikon: 'leaf-outline' as const,
                      onPress: () =>
                        icerikKaydet(
                          aliskanlikYaz(kapi, kart.id, !kart.aliskanlik).then(() =>
                            kisaMesaj(
                              kart.aliskanlik ? 'Artık alışkanlık değil' : 'Alışkanlık: Giriş → Devam edenler’de de',
                            ),
                          ),
                        ),
                    },
                  ]
                : []),
              // P-110: Adımlar listesinde maddeye gün (o gün ajandada).
              ...(duzenlenir && kart.ust && rutin && rutinCesidi(rutin) === RUTIN_KALICI
                ? [{ etiket: 'Gün ver', ikon: 'calendar-outline' as const, onPress: () => setAdimGunu(true) }]
                : []),
              ...(aliskanlikMi(kart) || kart.olcumlerim || (kart.listede && !kart.ust)
                ? [
                    {
                      etiket: ajandadaMi(kart) ? 'Ajandada gösterme' : 'Ajandada göster',
                      ikon: 'calendar-outline' as const,
                      onPress: () => icerikKaydet(ajandadaYaz(kapi, kart.id, !ajandadaMi(kart))),
                    },
                  ]
                : []),
              // P-83: Kur üstten menüye (parça ekle, sırala, bütün ayarlar); P-109: kilitler uzmanın.
              ...(duzenlenir && kilitAyariGorunur(uzman, kart.sabitler, bloklar)
                ? [
                    {
                      etiket: 'Başlık ve zaman izinleri',
                      ikon: 'lock-open-outline' as const,
                      onPress: () => setZamanMenusu(true),
                    },
                  ]
                : []),
              ...(!kart.planId && !kart.bag && !kart.kilitli && !kart.olcumlerim && !kart.ust && !kart.listede
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
              ...(!kart.kilitli && !kart.bag && oturum.durum === 'var' && !kart.listede
                ? [
                    {
                      etiket: 'Birine ver',
                      ikon: 'gift-outline' as const,
                      onPress: () => kartVer.ac({ paket: kartPaketi(kart, disaBloklar) }),
                    },
                  ]
                : []),
              ...(kart.kilitli
                ? []
                : [
                    // P-110: Listeler'deki liste gruplarla / kişilerle ortak liste olur.
                    kart.listede
                      ? {
                          etiket: 'Başkalarıyla paylaş',
                          ikon: 'people-outline' as const,
                          onPress: () => (oturum.durum === 'var' ? setListePaylas(true) : oturumAc()),
                        }
                      : {
                          etiket: 'Paylaş',
                          ikon: 'share-outline' as const,
                          onPress: () => paylas.ac({ kart, bloklar: disaBloklar }),
                        },
                    // P-98: Ölçümlerim yalnız Giriş → Ölçümlerim → Düzenle'den silinir (ajandadan değil).
                    ...(kart.olcumlerim && olcumlerimden !== '1'
                      ? []
                      : kart.ust
                        ? [
                            // P-101: rutinin adımı doğrudan rutinden kaldırılır (sıralama sürüklemeyle).
                            {
                              etiket: 'Listeden kaldır',
                              ikon: 'trash-outline' as const,
                              tehlike: true,
                              onPress: () =>
                                void kartlariSil(kapi, [kart.id])
                                  .then(() => {
                                    kisaMesaj(`Listeden kaldırıldı: ${kart.baslik}`);
                                    router.back();
                                  })
                                  .catch((e: unknown) => {
                                    console.error(e);
                                    kisaMesaj('Kaydedilemedi. Yeniden dene.');
                                  }),
                            },
                          ]
                        : [
                            {
                              etiket: kart.listede ? 'Listeyi sil' : 'Sil',
                              ikon: 'trash-outline' as const,
                              tehlike: true,
                              onPress: () => (kart.listede ? setListeSil(true) : kartSil.baslat(kart, gun)),
                            },
                          ]),
                  ]),
            ],
            duzenlenir ? { etiket: KUR, ikon: 'construct-outline' as const, onPress: () => duzenleAc() } : null,
          )}
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
      {listePaylas && <ListeyiPaylas kart={kart} gun={gun} onKapat={() => setListePaylas(false)} />}
      {listeSil && <ListeyiSilSorusu kart={kart} onKapat={() => setListeSil(false)} />}
      {adimGunu && (
        <AdimGunuSayfasi
          baslik={kart.baslik}
          gun={kart.tekrar === null ? kart.tarih : null}
          onKapat={() => setAdimGunu(false)}
          onSec={(g) => icerikKaydet(adimGunuYaz(kapi, oku, kart.id, g))}
        />
      )}
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
  ekleAlani: { paddingVertical: 8 },
  ekle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
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
  // Sürüklenirken gölgenin altı boş görünmesin.
  suruklenir: { backgroundColor: renk.yuzey },
});
