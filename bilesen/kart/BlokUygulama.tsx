// Kart görünümünde blokların "uygulama" hali (K-7, K-12): içerik blokları
// gösterilir; kayıt blokları o günün kaydına yazar.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { adimDurumu, ilerleme, ilerlemeMetni } from '@/mantik/adimlar';
import { oncekiDeger } from '@/mantik/ajanda';
import { sesDosyasiMi } from '@/mantik/dosya';
import type { Blok, Kayit } from '@/mantik/kart';
import { youtubeVideosu } from '@/mantik/paylasimAl';
import { kisaTarih, uzunTarih, type Gun } from '@/mantik/tarih';
import { dosyayiSakla } from '@/veri/dosyalar';
import { adimiIsaretle } from '@/veri/kartlar';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { SesOynatici } from '../not/SesOynatici';
import { Bolum } from '../Secim';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';

import { gomuluOynatmaVar, YoutubeOynatici } from './YoutubeOynatici';

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
      return o.blok.metin ? <Yazi>{o.blok.metin}</Yazi> : null;
    case 'video':
      return <VideoBlogu blok={o.blok} />;
    case 'liste':
      return <ListeBlogu {...o} />;
    case 'adimlar':
      return <AdimlarBlogu blok={o.blok} gun={o.gun} />;
    case 'foto':
      return o.blok.dosya ? (
        <Image source={{ uri: o.blok.dosya }} style={stiller.foto} accessibilityLabel="Fotoğraf" />
      ) : null;
    case 'dosya':
      return <DosyaBlogu blok={o.blok} />;
    case 'sayac':
      return <Zamanlayici blok={o.blok} />;
    case 'olcum':
      return <OlcumBlogu {...o} />;
    case 'gunnot':
      return <GununNotu {...o} />;
    case 'gelfoto':
      return <GelisimFotografi {...o} />;
  }
}

function VideoBlogu({ blok }: { blok: Blok }) {
  const gecerli = /^https?:\/\//i.test(blok.metin);
  const youtube = gomuluOynatmaVar ? youtubeVideosu(blok.metin) : null;
  if (youtube)
    return (
      <View style={stiller.videoKabi}>
        <YoutubeOynatici kimlik={youtube.kimlik} baslangic={youtube.baslangic} />
        <Pressable
          onPress={() => void Linking.openURL(blok.metin)}
          accessibilityRole="link"
          hitSlop={8}
          style={stiller.disariAc}
        >
          <Ionicons name="open-outline" size={16} color={renk.ana} />
          <Yazi tur="ikincil" renk={renk.ana} kalinlik="yariKalin">
            {"YouTube'da aç"}
          </Yazi>
        </Pressable>
      </View>
    );
  return (
    <Pressable
      onPress={() => gecerli && void Linking.openURL(blok.metin)}
      disabled={!gecerli}
      accessibilityRole="link"
      accessibilityLabel="Videoyu aç"
      style={({ pressed }) => [stiller.video, pressed && { opacity: 0.85 }]}
    >
      <View style={stiller.oynat}>
        <Ionicons name="play" size={36} color={renk.yuzey} />
      </View>
      <Yazi renk={renk.yuzey} kalinlik="yariKalin">
        {gecerli ? 'Videoyu aç' : 'Video bağlantısı yok'}
      </Yazi>
    </Pressable>
  );
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
      {!!blok.ad && <Yazi tur="kartBasligi">{blok.ad}</Yazi>}
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
        <Yazi tur="kartBasligi" style={stiller.esnek}>
          {blok.ad || 'Proje adımları'}
        </Yazi>
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
      <Bolum>
        <Yazi kalinlik="kalin">{blok.ad || 'Ses kaydı'}</Yazi>
        <SesOynatici uri={uri} />
      </Bolum>
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

function Zamanlayici({ blok }: { blok: Blok }) {
  const toplam = (blok.dakika ?? 10) * 60;
  const [kalan, setKalan] = useState(toplam);
  const [calisiyor, setCalisiyor] = useState(false);

  useEffect(() => {
    if (!calisiyor) return;
    const bitis = Date.now() + kalan * 1000;
    const z = setInterval(() => {
      const yeni = Math.max(0, Math.round((bitis - Date.now()) / 1000));
      setKalan(yeni);
      if (yeni === 0) setCalisiyor(false);
    }, 250);
    return () => clearInterval(z);
    // Yalnız başlat/durdur ile kurulur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calisiyor]);

  const bitti = kalan === 0;
  return (
    <Bolum style={stiller.satir}>
      <View style={stiller.esnek}>
        <Yazi kalinlik="kalin">{blok.ad || 'Süre'}</Yazi>
        <Yazi kalinlik="kalin" style={stiller.saat} accessibilityLiveRegion="polite">
          {saatMetni(kalan)}
        </Yazi>
      </View>
      <Dugme
        etiket={calisiyor ? 'Durdur' : bitti ? 'Bitti' : 'Başlat'}
        onPress={() => setCalisiyor(!calisiyor)}
        pasif={bitti && !calisiyor}
        style={[stiller.zamanlayiciDugme, calisiyor && { backgroundColor: renk.hata }]}
      />
    </Bolum>
  );
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
      <Bolum style={stiller.satir}>
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
      </Bolum>
      {onceki && (
        <Yazi tur="ikincil" style={stiller.onceki}>
          {`Önceki: ${onceki.deger}${blok.birim ? ` ${blok.birim}` : ''} · ${uzunTarih(onceki.tarih)}`}
        </Yazi>
      )}
    </View>
  );
}

function GununNotu({ blok, kayit, onKayit }: Ozellikler) {
  const alan = useGecikmeliKayit(kayit.degerler[blok.id] ?? '', (d) =>
    onKayit((k) => ({ ...k, degerler: { ...k.degerler, [blok.id]: d } })),
  );
  return (
    <Bolum>
      <Yazi kalinlik="kalin">Günün notu</Yazi>
      <TextInput
        accessibilityLabel="Günün notu"
        value={alan.deger}
        onChangeText={alan.degis}
        onBlur={alan.birak}
        placeholder="Bugün nasıl geçti?"
        placeholderTextColor={renk.soluk}
        selectionColor={renk.ana}
        multiline
        style={[stiller.not, yazi('normal')]}
      />
    </Bolum>
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
      {foto && <Image source={{ uri: foto }} style={stiller.foto} accessibilityLabel="Bugünün fotoğrafı" />}
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
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: olcu.kose.kart, backgroundColor: renk.satirCizgi },
  videoKabi: { gap: 8 },
  disariAc: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 },
  video: {
    height: 200,
    borderRadius: olcu.kose.kart,
    backgroundColor: renk.yazi,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  oynat: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  olcumKap: { gap: 6 },
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
