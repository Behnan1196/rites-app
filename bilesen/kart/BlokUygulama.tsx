// Kart görünümünde blokların "uygulama" hali (K-7, K-12): içerik blokları
// gösterilir; kayıt blokları o günün kaydına yazar.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { adimDurumu, ilerleme, ilerlemeMetni } from '@/mantik/adimlar';
import { blokVideolari } from '@/mantik/video';
import { adetDegeri, adetYaz, SIMGELI_EN_COK, simgeDokunusu } from '@/mantik/adet';
import { oncekiDeger } from '@/mantik/ajanda';
import { sesDosyasiMi } from '@/mantik/dosya';
import type { Blok, Kayit } from '@/mantik/kart';
import { cubukOranlari, kisaSure, olcumGecmisi, oncekiCevaplar, type OlcumNoktasi } from '@/mantik/karakter';
import { gunKisa, kisaTarih, uzunTarih, type Gun } from '@/mantik/tarih';
import { dosyayiSakla } from '@/veri/dosyalar';
import { adimiIsaretle } from '@/veri/kartlar';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { SesOynatici } from '../not/SesOynatici';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { VideolarGorunumu } from './Videolar';
import { ZenginMetin } from '../ZenginMetin';

import { BuyutulebilirFoto } from './BuyutulebilirFoto';

interface Ozellikler {
  blok: Blok;
  gun: Gun;
  kayit: Kayit;
  kayitlar: readonly Kayit[];
  /** O günün kaydını değiştir. */
  onKayit: (degistir: (k: Kayit) => Kayit) => void;
}

export function BlokUygulama(o: Ozellikler) {
  switch (o.blok.tur) {
    case 'talimat':
      return <ZenginMetin metin={o.blok.metin} />;
    case 'video':
      return <VideoBlogu blok={o.blok} />;
    case 'liste':
      return <ListeBlogu {...o} />;
    case 'adimlar':
      return <AdimlarBlogu blok={o.blok} gun={o.gun} />;
    case 'foto':
      return o.blok.dosya ? <BuyutulebilirFoto uri={o.blok.dosya} style={stiller.foto} etiket="Fotoğraf" /> : null;
    case 'dosya':
      return <DosyaBlogu blok={o.blok} />;
    case 'sayac':
      return <Zamanlayici {...o} />;
    case 'olcum':
      return <OlcumBlogu {...o} />;
    case 'gunnot':
      return <GununNotu {...o} />;
    case 'gelfoto':
      return <GelisimFotografi {...o} />;
    case 'kronometre':
      return <Kronometre {...o} />;
    case 'adet':
      return <AdetBlogu {...o} />;
    case 'puan':
      return <PuanBlogu {...o} />;
  }
}

/** P-39: kronometre (plank, "ne kadar dayandın?"): ileri sayar; "Dur" deyince süre o günün kaydına eklenir. */
function Kronometre({ blok, gun, kayit, kayitlar, onKayit }: Ozellikler) {
  const [gecen, setGecen] = useState(0);
  const [calisiyor, setCalisiyor] = useState(false);
  const basla = useRef(0);
  const kayitli = Number(kayit.degerler[blok.id] ?? 0) || 0;
  useEffect(() => {
    if (!calisiyor) return;
    const z = setInterval(() => setGecen(Math.round((Date.now() - basla.current) / 1000)), 250);
    return () => clearInterval(z);
  }, [calisiyor]);
  const dugmeye = () => {
    if (calisiyor) {
      const sn = Math.max(0, Math.round((Date.now() - basla.current) / 1000));
      setCalisiyor(false);
      setGecen(sn);
      if (sn > 0)
        onKayit((k) => ({
          ...k,
          degerler: { ...k.degerler, [blok.id]: String((Number(k.degerler[blok.id] ?? 0) || 0) + sn) },
        }));
      return;
    }
    basla.current = Date.now();
    setGecen(0);
    setCalisiyor(true);
  };
  return (
    <View style={stiller.zamanlayiciKap}>
      <View style={stiller.satir}>
        <View style={stiller.esnek}>
          <Yazi kalinlik="kalin">{blok.ad || 'Süre'}</Yazi>
          <Yazi kalinlik="kalin" style={stiller.saat} accessibilityLiveRegion="polite">
            {saatMetni(gecen)}
          </Yazi>
        </View>
        <Dugme
          etiket={calisiyor ? 'Dur' : gecen > 0 ? 'Yeniden' : 'Başlat'}
          onPress={dugmeye}
          style={[stiller.zamanlayiciDugme, calisiyor && { backgroundColor: renk.hata }]}
        />
      </View>
      {kayitli > 0 && <Yazi tur="ikincil">{`Bugün: ${sureMetniSn(kayitli)}`}</Yazi>}
      <OlcumGecmisi
        noktalar={olcumGecmisi(kayitlar, blok.id, gun)}
        birim=""
        baslik="Son günler"
        bicim={(n) => kisaSure(n.deger)}
      />
    </View>
  );
}

/**
 * P-39: sayarak (su bardağı): büyük − ve +; isteğe bağlı günlük hedef (`dakika` alanında).
 * P-81: hedef 12 ya da daha azsa simgeli sayaç (bardaklar dokundukça dolar; son doluya dokununca
 * bir azalır). Hedefe ulaşınca kart kendiliğinden Yaptım.
 */
function AdetBlogu({ blok, gun, kayit, kayitlar, onKayit }: Ozellikler) {
  const sayi = adetDegeri(kayit, blok.id);
  const hedef = blok.dakika && blok.dakika > 0 ? blok.dakika : null;
  // Art arda dokunuşlar kaybolmasın: değer kaydın son hâlinden hesaplanır.
  const yaz = (hesap: (eski: number) => number) =>
    onKayit((k) => adetYaz(k, blok.id, hesap(adetDegeri(k, blok.id)), hedef));
  const ad = blok.ad || 'Sayı';
  const simgeli = !!hedef && hedef <= SIMGELI_EN_COK;
  const su = /bardak|su\b/i.test(`${blok.birim} ${blok.ad}`);
  if (simgeli) {
    const tamam = sayi >= hedef!;
    return (
      <View style={stiller.olcumKap}>
        <View style={stiller.simgeUst}>
          <Yazi kalinlik="kalin" style={stiller.esnek}>
            {ad}
          </Yazi>
          <Yazi kalinlik="kalin" renk={tamam ? renk.ana : renk.ikincil} accessibilityLiveRegion="polite">
            {`${sayi} / ${hedef}${blok.birim ? ` ${blok.birim}` : ''}`}
          </Yazi>
        </View>
        <View style={stiller.simgeler} accessibilityRole="adjustable" accessibilityLabel={`${ad}: ${sayi} / ${hedef}`}>
          {Array.from({ length: Math.max(hedef!, sayi) }, (_, i) => {
            const dolu = i < sayi;
            return (
              <Pressable
                key={i}
                onPress={() => yaz((eski) => simgeDokunusu(eski, i))}
                accessibilityRole="button"
                accessibilityLabel={`${ad}: ${i + 1}`}
                hitSlop={4}
                style={({ pressed }) => [stiller.simge, pressed && { opacity: 0.6 }]}
              >
                <Ionicons
                  name={su ? (dolu ? 'water' : 'water-outline') : dolu ? 'ellipse' : 'ellipse-outline'}
                  size={30}
                  color={dolu ? (su ? renk.suDolu : renk.ana) : renk.pasif}
                />
              </Pressable>
            );
          })}
        </View>
        {sayi > hedef! && (
          <Pressable onPress={() => yaz((e) => e - 1)} accessibilityRole="button" hitSlop={6}>
            <Yazi tur="etiket" renk={renk.ikincil}>
              Bir azalt
            </Yazi>
          </Pressable>
        )}
      </View>
    );
  }
  return (
    <View style={stiller.olcumKap}>
      <Yazi kalinlik="kalin">{ad}</Yazi>
      <View style={stiller.adetSatiri}>
        <Pressable
          onPress={() => yaz((e) => e - 1)}
          disabled={sayi === 0}
          accessibilityRole="button"
          accessibilityLabel={`${ad}: bir azalt`}
          style={({ pressed }) => [stiller.adetDugme, sayi === 0 && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="remove" size={30} color={renk.ana} />
        </Pressable>
        <View style={stiller.adetOrta} accessible accessibilityLiveRegion="polite">
          <Yazi kalinlik="kalin" style={stiller.adetSayi}>
            {hedef ? `${sayi} / ${hedef}` : String(sayi)}
          </Yazi>
          {!!blok.birim && <Yazi tur="ikincil">{blok.birim}</Yazi>}
        </View>
        <Pressable
          onPress={() => yaz((e) => e + 1)}
          accessibilityRole="button"
          accessibilityLabel={`${ad}: bir ekle`}
          style={({ pressed }) => [stiller.adetDugme, stiller.adetArti, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="add" size={30} color={renk.yuzey} />
        </Pressable>
      </View>
      <OlcumGecmisi noktalar={olcumGecmisi(kayitlar, blok.id, gun)} birim={blok.birim} />
    </View>
  );
}

const PUAN_ETIKETI = ['Çok kötü', 'Kötü', 'Orta', 'İyi', 'Çok iyi'];

/** P-39: puan (1–5): enerjim, stresim, uyku kalitem. Seçili puana yeniden dokununca silinir. */
function PuanBlogu({ blok, gun, kayit, kayitlar, onKayit }: Ozellikler) {
  const secili = Number(kayit.degerler[blok.id] ?? 0) || 0;
  const ad = blok.ad || 'Puan';
  const sec = (n: number) =>
    onKayit((k) => {
      const degerler = { ...k.degerler };
      if (n === secili) delete degerler[blok.id];
      else degerler[blok.id] = String(n);
      return { ...k, degerler };
    });
  return (
    <View style={stiller.olcumKap}>
      <Yazi kalinlik="kalin">{ad}</Yazi>
      <View style={stiller.puanSatiri} accessibilityRole="radiogroup" accessibilityLabel={ad}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => sec(n)}
            accessibilityRole="radio"
            accessibilityState={{ checked: secili === n }}
            accessibilityLabel={`${n}, ${PUAN_ETIKETI[n - 1]}`}
            style={({ pressed }) => [stiller.puanDaire, n <= secili && stiller.puanDolu, pressed && { opacity: 0.7 }]}
          >
            <Yazi kalinlik="kalin" renk={n <= secili ? renk.yuzey : renk.yazi} style={stiller.puanYazi}>
              {String(n)}
            </Yazi>
          </Pressable>
        ))}
      </View>
      {secili > 0 && <Yazi tur="ikincil">{PUAN_ETIKETI[secili - 1]}</Yazi>}
      <OlcumGecmisi noktalar={olcumGecmisi(kayitlar, blok.id, gun)} birim="" />
    </View>
  );
}

/** P-53: çoklu video ("Video 1 · Video 2"), seçilen gömülü oynar. */
function VideoBlogu({ blok }: { blok: Blok }) {
  return <VideolarGorunumu videolar={blokVideolari(blok)} />;
}

function ListeBlogu({ blok, kayit, onKayit }: Ozellikler) {
  const isaretler = kayit.isaretler[blok.id] ?? [];
  const degistir = (i: number) =>
    onKayit((k) => {
      const eski = k.isaretler[blok.id] ?? [];
      const yeni = blok.maddeler.map((_, j) => (j === i ? !eski[j] : !!eski[j]));
      return { ...k, isaretler: { ...k.isaretler, [blok.id]: yeni } };
    });
  return (
    <View style={stiller.liste}>
      {blok.maddeler.map((madde, i) => {
        const isaretli = !!isaretler[i];
        return (
          <Pressable
            key={`${i}-${madde}`}
            onPress={() => degistir(i)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isaretli }}
            style={stiller.madde}
          >
            <View style={[stiller.kare, isaretli && stiller.kareDolu]}>
              {isaretli && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
            </View>
            <Yazi renk={isaretli ? renk.ikincil : renk.yazi} style={[stiller.esnek, isaretli && stiller.ustuCizili]}>
              {madde}
            </Yazi>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Proje adımları: işaretler kalıcı (güne bağlı değil); her adımın yapıldığı gün görünür. */
function AdimlarBlogu({ blok, gun }: { blok: Blok; gun: Gun }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const durum = adimDurumu(blok.durum, blok.maddeler.length);
  const { yapilan, toplam } = ilerleme(durum);
  const degistir = (i: number) => {
    const yapildi = !durum.yapilan[i];
    const bitecek = yapildi && yapilan + 1 === toplam;
    void adimiIsaretle(kapi, blok.id, i, yapildi, gun)
      .then(() => bitecek && kisaMesaj('Bütün adımlar bitti; kart yapıldı.'))
      .catch((e: unknown) => {
        console.error('Adım kaydedilemedi', e);
        kisaMesaj('Kaydedilemedi. Yeniden dene.');
      });
  };
  return (
    <View style={stiller.liste}>
      <View style={stiller.adimBaslik}>
        <View style={stiller.esnek} />
        <Yazi tur="ikincil" kalinlik="yariKalin" renk={yapilan === toplam && toplam > 0 ? renk.ana : renk.ikincil}>
          {ilerlemeMetni(durum)}
        </Yazi>
      </View>
      <View
        style={stiller.cubuk}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: toplam, now: yapilan }}
      >
        <View style={[stiller.cubukDolu, { width: `${toplam ? (yapilan / toplam) * 100 : 0}%` }]} />
      </View>
      {blok.maddeler.map((madde, i) => {
        const tarih = durum.yapilan[i];
        return (
          <Pressable
            key={`${i}-${madde}`}
            onPress={() => degistir(i)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!tarih }}
            accessibilityLabel={tarih ? `${madde}, ${kisaTarih(tarih)} yapıldı` : madde}
            style={stiller.madde}
          >
            <View style={[stiller.kare, !!tarih && stiller.kareDolu]}>
              {!!tarih && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
            </View>
            <Yazi renk={tarih ? renk.ikincil : renk.yazi} style={[stiller.esnek, !!tarih && stiller.ustuCizili]}>
              {madde}
            </Yazi>
            {!!tarih && (
              <Yazi tur="etiket" renk={renk.soluk}>
                {kisaTarih(tarih)}
              </Yazi>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function DosyaBlogu({ blok }: { blok: Blok }) {
  if (!blok.dosya) return null;
  const uri = blok.dosya;
  // Ses dosyası (ör. ajandaya alınan sesli not) kartın içinde dinlenir.
  if (sesDosyasiMi(uri)) {
    return (
      <View style={stiller.ic}>
        <Yazi kalinlik="kalin">{blok.ad || 'Ses kaydı'}</Yazi>
        <SesOynatici uri={uri} />
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => void Sharing.shareAsync(uri)}
      accessibilityRole="button"
      accessibilityLabel={`${blok.ad || 'Dosya'}, aç`}
      style={({ pressed }) => [stiller.dosya, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="document-outline" size={24} color={renk.ana} />
      <Yazi numberOfLines={1} style={stiller.esnek}>
        {blok.ad || 'Dosya'}
      </Yazi>
      <Yazi kalinlik="kalin" renk={renk.ana}>
        Aç
      </Yazi>
    </Pressable>
  );
}

function saatMetni(saniye: number): string {
  return `${String(Math.floor(saniye / 60)).padStart(2, '0')}:${String(saniye % 60).padStart(2, '0')}`;
}

/**
 * Kartın zamanlayıcısı. P-38 (24 Ekim): zamanlayıcı aynı zamanda kayıttır: durdurulunca
 * ya da bitince geçen süre o günün kaydına eklenir (saniye, `degerler[blok.id]`) ve
 * altında "Bugün: 10 dk" görünür. Kartı yapıldı saymaz; Yaptım'ı kişi işaretler.
 */
function Zamanlayici({ blok, gun, kayit, kayitlar, onKayit }: Ozellikler) {
  const toplam = (blok.dakika ?? 10) * 60;
  const [kalan, setKalan] = useState(toplam);
  const [calisiyor, setCalisiyor] = useState(false);
  const baslangicKalan = useRef(toplam);
  const kayitli = Number(kayit.degerler[blok.id] ?? 0) || 0;
  const sureyiYaz = (gecen: number) => {
    if (gecen <= 0) return;
    onKayit((k) => ({
      ...k,
      degerler: { ...k.degerler, [blok.id]: String((Number(k.degerler[blok.id] ?? 0) || 0) + gecen) },
    }));
  };

  useEffect(() => {
    if (!calisiyor) return;
    const bitis = Date.now() + kalan * 1000;
    const z = setInterval(() => {
      const yeni = Math.max(0, Math.round((bitis - Date.now()) / 1000));
      setKalan(yeni);
      if (yeni === 0) {
        setCalisiyor(false);
        sureyiYaz(baslangicKalan.current);
      }
    }, 250);
    return () => clearInterval(z);
    // Yalnız başlat/durdur ile kurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calisiyor]);

  const bitti = kalan === 0;
  return (
    <View style={stiller.zamanlayiciKap}>
      <View style={stiller.satir}>
        <View style={stiller.esnek}>
          <Yazi kalinlik="kalin">{blok.ad || 'Süre'}</Yazi>
          <Yazi kalinlik="kalin" style={stiller.saat} accessibilityLiveRegion="polite">
            {saatMetni(kalan)}
          </Yazi>
        </View>
        <Dugme
          etiket={calisiyor ? 'Durdur' : bitti ? 'Yeniden' : kalan < toplam ? 'Devam' : 'Başlat'}
          onPress={() => {
            if (calisiyor) {
              setCalisiyor(false);
              sureyiYaz(baslangicKalan.current - kalan);
              return;
            }
            const k = bitti ? toplam : kalan;
            if (bitti) setKalan(toplam);
            baslangicKalan.current = k;
            setCalisiyor(true);
          }}
          style={[stiller.zamanlayiciDugme, calisiyor && { backgroundColor: renk.hata }]}
        />
      </View>
      {kayitli > 0 && (
        <Yazi tur="ikincil" accessibilityLiveRegion="polite">
          {`Bugün: ${sureMetniSn(kayitli)}${bitti ? ' · Bitti. Yaptıysan ajandada işaretle.' : ''}`}
        </Yazi>
      )}
      <OlcumGecmisi
        noktalar={olcumGecmisi(kayitlar, blok.id, gun)}
        birim=""
        baslik="Son günler"
        bicim={(n) => kisaSure(n.deger)}
      />
    </View>
  );
}

/** Kaydedilen süre: "10 dk", "1 dk 30 sn", "45 sn". */
function sureMetniSn(sn: number): string {
  const dk = Math.floor(sn / 60);
  const s = sn % 60;
  if (dk === 0) return `${s} sn`;
  return s === 0 ? `${dk} dk` : `${dk} dk ${s} sn`;
}

/** Yazdıkça kısa bir gecikmeyle ve alandan çıkınca kaydeden yazı alanı. */
function useGecikmeliKayit(baslangic: string, kaydet: (deger: string) => void) {
  const [deger, setDeger] = useState(baslangic);
  const kaydetRef = useRef(kaydet);
  useEffect(() => {
    kaydetRef.current = kaydet;
  });
  const sonKaydedilen = useRef(baslangic);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simdiKaydet = (d: string) => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    if (d !== sonKaydedilen.current) {
      sonKaydedilen.current = d;
      kaydetRef.current(d);
    }
  };
  const degis = (d: string) => {
    setDeger(d);
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => simdiKaydet(d), 600);
  };
  // Ekrandan çıkarken bekleyen değeri kaydet.
  const degerRef = useRef(deger);
  useEffect(() => {
    degerRef.current = deger;
  });
  useEffect(
    () => () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      if (degerRef.current !== sonKaydedilen.current) kaydetRef.current(degerRef.current);
    },
    [],
  );
  return { deger, degis, birak: () => simdiKaydet(deger) };
}

function OlcumBlogu({ blok, gun, kayit, kayitlar, onKayit }: Ozellikler) {
  const alan = useGecikmeliKayit(kayit.degerler[blok.id] ?? '', (d) =>
    onKayit((k) => ({ ...k, degerler: { ...k.degerler, [blok.id]: d.trim() } })),
  );
  const onceki = oncekiDeger(kayitlar, blok.id, gun);
  return (
    <View style={stiller.olcumKap}>
      <View style={stiller.satir}>
        <Yazi kalinlik="kalin" style={stiller.esnek}>
          {blok.ad || 'Ölçüm'}
        </Yazi>
        <TextInput
          accessibilityLabel={blok.ad || 'Ölçüm'}
          value={alan.deger}
          onChangeText={alan.degis}
          onBlur={alan.birak}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={renk.soluk}
          selectionColor={renk.ana}
          style={[stiller.olcum, yazi('kalin')]}
        />
        {!!blok.birim && <Yazi tur="ikincil">{blok.birim}</Yazi>}
      </View>
      {onceki && (
        <Yazi tur="ikincil" style={stiller.onceki}>
          {`Önceki: ${onceki.deger}${blok.birim ? ` ${blok.birim}` : ''} · ${uzunTarih(onceki.tarih)}`}
        </Yazi>
      )}
      <OlcumGecmisi noktalar={olcumGecmisi(kayitlar, blok.id, gun)} birim={blok.birim} />
    </View>
  );
}

/** P-35: takip kartında ölçümün son 7 değeri (kartın içinde, küçük çubuklar). */
function OlcumGecmisi({
  noktalar,
  birim,
  baslik = 'Son ölçümler',
  bicim,
}: {
  noktalar: readonly OlcumNoktasi[];
  birim: string;
  baslik?: string;
  /** Çubuğun üstündeki yazı (süre: "10 dk"); yoksa yazıldığı gibi. */
  bicim?: (n: OlcumNoktasi) => string;
}) {
  if (noktalar.length < 2) return null;
  const oranlar = cubukOranlari(noktalar);
  const yaz = (n: OlcumNoktasi) => (bicim ? bicim(n) : n.metin);
  const ozet = noktalar.map((n) => `${uzunTarih(n.tarih)}: ${yaz(n)}${birim ? ` ${birim}` : ''}`).join(', ');
  return (
    <View style={stiller.gecmis} accessible accessibilityLabel={`Son ölçümler. ${ozet}`}>
      <Yazi tur="etiket" kalinlik="kalin">
        {baslik}
      </Yazi>
      <View style={stiller.cubuklar}>
        {noktalar.map((n, i) => (
          <View key={n.tarih} style={stiller.cubukSutun}>
            <Yazi tur="etiket" kalinlik="kalin" maxFontSizeMultiplier={1.2} numberOfLines={1}>
              {yaz(n)}
            </Yazi>
            <View style={stiller.cubukAlan}>
              <View
                style={[
                  stiller.olcumCubugu,
                  { height: `${Math.round((oranlar[i] ?? 0) * 100)}%` },
                  i === noktalar.length - 1 && stiller.cubukSon,
                ]}
              />
            </View>
            <Yazi tur="etiket" maxFontSizeMultiplier={1.2} numberOfLines={1}>
              {gunKisa(n.tarih)}
            </Yazi>
          </View>
        ))}
      </View>
    </View>
  );
}

function GununNotu({ blok, gun, kayit, kayitlar, onKayit }: Ozellikler) {
  const alan = useGecikmeliKayit(kayit.degerler[blok.id] ?? '', (d) =>
    onKayit((k) => ({ ...k, degerler: { ...k.degerler, [blok.id]: d } })),
  );
  return (
    <View style={stiller.ic}>
      {/* P-39: danışmanın sorusu varsa başlık odur. */}
      <Yazi kalinlik="kalin">{blok.metin.trim() || 'Günün notu'}</Yazi>
      <TextInput
        accessibilityLabel={blok.metin.trim() || 'Günün notu'}
        value={alan.deger}
        onChangeText={alan.degis}
        onBlur={alan.birak}
        placeholder={blok.metin.trim() ? 'Cevabını yaz' : 'Bugün nasıl geçti?'}
        placeholderTextColor={renk.soluk}
        selectionColor={renk.ana}
        multiline
        style={[stiller.not, yazi('normal')]}
      />
      {/* P-40: önceki cevaplar (en çok 3), kartın içinde. */}
      {oncekiCevaplar(kayitlar, blok.id, gun).map((c) => (
        <View key={c.tarih} style={stiller.oncekiCevap}>
          <Yazi tur="etiket" kalinlik="kalin">
            {kisaTarih(c.tarih)}
          </Yazi>
          <Yazi tur="ikincil" numberOfLines={3}>
            {c.metin}
          </Yazi>
        </View>
      ))}
    </View>
  );
}

function GelisimFotografi({ blok, kayit, onKayit }: Ozellikler) {
  const foto = kayit.fotolar[blok.id];
  const cek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    const secilen = sonuc.canceled ? undefined : sonuc.assets[0];
    if (!secilen) return;
    const uri = await dosyayiSakla(secilen.uri, secilen.fileName ?? 'foto.jpg');
    onKayit((k) => ({ ...k, fotolar: { ...k.fotolar, [blok.id]: uri } }));
  };
  return (
    <View style={stiller.gelisim}>
      <Yazi kalinlik="kalin">Gelişim fotoğrafı</Yazi>
      {foto && <BuyutulebilirFoto uri={foto} style={stiller.foto} etiket="Bugünün fotoğrafı" />}
      <Pressable
        onPress={() => void cek()}
        accessibilityRole="button"
        style={({ pressed }) => [stiller.fotoDugme, !!foto && stiller.fotoDugmeDolu, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="camera-outline" size={24} color={renk.ana} />
        <Yazi kalinlik="kalin" renk={renk.ana}>
          {foto ? 'Fotoğraf eklendi ✓ · Yeniden çek' : 'Bugünün fotoğrafını çek'}
        </Yazi>
      </Pressable>
    </View>
  );
}

const stiller = StyleSheet.create({
  adimBaslik: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cubuk: { height: 6, borderRadius: 3, backgroundColor: renk.satirCizgi, overflow: 'hidden' },
  cubukDolu: { height: 6, borderRadius: 3, backgroundColor: renk.ana },
  esnek: { flex: 1 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { gap: 10 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: olcu.kose.kart, backgroundColor: renk.satirCizgi },
  liste: { gap: 4 },
  madde: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: olcu.enAzDokunma + 4 },
  kare: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: renk.soluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kareDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  ustuCizili: { textDecorationLine: 'line-through' },
  dosya: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: olcu.kose.dugme,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  saat: { fontSize: 30, lineHeight: 38 },
  zamanlayiciDugme: { minWidth: 120 },
  zamanlayiciKap: { gap: 6 },
  adetSatiri: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  simgeUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  simgeler: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  simge: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  adetDugme: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adetArti: { backgroundColor: renk.ana },
  adetOrta: { flex: 1, alignItems: 'center' },
  adetSayi: { fontSize: 34, lineHeight: 40, fontVariant: ['tabular-nums'] },
  puanSatiri: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  puanDaire: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: renk.vurgu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puanDolu: { backgroundColor: renk.vurgu },
  puanYazi: { fontSize: 22 },
  olcumKap: { gap: 6 },
  gecmis: { gap: 6, marginTop: 6 },
  oncekiCevap: { gap: 2, borderLeftWidth: 3, borderLeftColor: renk.vurguCizgi, paddingLeft: 10 },
  cubuklar: { flexDirection: 'row', gap: 6 },
  cubukSutun: { flex: 1, alignItems: 'center', gap: 4 },
  cubukAlan: { height: 64, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  olcumCubugu: { width: '70%', borderRadius: 6, backgroundColor: renk.vurguCizgi },
  cubukSon: { backgroundColor: renk.vurgu },
  olcum: {
    width: 110,
    minHeight: 56,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
  },
  onceki: { paddingHorizontal: 8 },
  not: {
    minHeight: 90,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 12,
    padding: 12,
    fontSize: boyut.govde,
    color: renk.yazi,
    textAlignVertical: 'top',
  },
  gelisim: { gap: 10 },
  fotoDugme: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 60,
    borderRadius: olcu.kose.kart,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: renk.pasif,
    backgroundColor: renk.yuzey,
    paddingHorizontal: 12,
  },
  fotoDugmeDolu: { borderStyle: 'solid', borderColor: renk.ana },
});
