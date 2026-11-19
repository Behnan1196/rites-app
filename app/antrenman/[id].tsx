// Antrenman (pilot 19 Kasım, P-133; çizim: "Rites Koçum ekranları" · Antrenman satırı): listenin
// egzersizleri tek kayan sayfada. Biten egzersiz tek satır özet, sıradaki açık (videosu, setleri,
// dinlenme sayacı), sonrakiler kapalı; kapalıya dokununca o açılır. Egzersizin adına dokununca
// açıklaması. Üstte geçen süre ve "Bitir"; bitince özet (süre, set, tekrar, yeni rekor, "Nasıl
// geçti?", not) rutinin o günkü kaydına yazılır. Görünüş sonra ayarlanacak (P-133).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AltSayfa } from '@/bilesen/AltSayfa';
import { Dugme } from '@/bilesen/Dugme';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { SetlerParcasi } from '@/bilesen/kart/SetlerParcasi';
import { VideolarGorunumu } from '@/bilesen/kart/Videolar';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { ZenginMetin } from '@/bilesen/ZenginMetin';
import {
  adimHedefi,
  antrenmanOzeti,
  antrenmanSuresi,
  gecenSure,
  setBlogu,
  siradakiAdim,
  type AntrenmanAdimi,
} from '@/mantik/antrenman';
import { bosKayit, type Kayit } from '@/mantik/kart';
import { dinlenmeMetni, hedefMetni, setleriOku, setOzeti, setHedefiOku } from '@/mantik/setler';
import { metinDoluMu } from '@/mantik/zenginMetin';
import { blokVideolari } from '@/mantik/video';
import { antrenmanAdimlari, antrenmaniKaydet } from '@/veri/antrenman';
import { useSorgu } from '@/veri/kancalar';
import { kartAyrinti, kayitDegistir } from '@/veri/kartlar';
import { rutinAdimiIsaretle } from '@/veri/rutinler';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

const simdi = () => Date.now();
const PUANLAR = [1, 2, 3, 4, 5];

export default function Antrenman() {
  const { id, gun: gunParam } = useLocalSearchParams<{ id: string; gun?: string }>();
  const bugunGun = useBugun();
  const gun = gunParam ?? bugunGun;
  const kenar = useSafeAreaInsets();
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [baslangic] = useState(simdi);
  const [gecen, setGecen] = useState(0);
  const [secili, setSecili] = useState<number | null>(null);
  const [aciklama, setAciklama] = useState<AntrenmanAdimi | null>(null);
  const [ozetAcik, setOzetAcik] = useState(false);
  const [puan, setPuan] = useState(0);
  const [not, setNot] = useState('');

  const veri = useSorgu(
    ['kart'],
    async (o) => {
      const rutin = (await kartAyrinti(o, id))?.kart;
      return rutin ? { rutin, adimlar: await antrenmanAdimlari(o, rutin, gun) } : null;
    },
    [id, gun],
  );

  useEffect(() => {
    const z = setInterval(() => setGecen(Math.round((simdi() - baslangic) / 1000)), 1000);
    return () => clearInterval(z);
  }, [baslangic]);

  const hata = (e: unknown) => {
    console.error('Kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  if (!veri.veri) return <View style={[stiller.kap, { paddingTop: kenar.top }]} />;
  const { rutin, adimlar } = veri.veri;
  const aktif = secili ?? siradakiAdim(adimlar);
  const ozet = antrenmanOzeti(adimlar, gun);

  const isaretle = (a: AntrenmanAdimi, yapildi: boolean) =>
    void rutinAdimiIsaretle(kapi, oku, rutin.id, a.id, gun, yapildi)
      .then(() => {
        // Bitince sıradaki yapılmamış egzersize geç.
        if (yapildi) setSecili(null);
      })
      .catch(hata);

  const kaydet = () => {
    void antrenmaniKaydet(kapi, rutin.id, gun, { sure: gecen, puan, not })
      .then(() => {
        setOzetAcik(false);
        kisaMesaj('Antrenman kaydedildi.');
        router.back();
      })
      .catch(hata);
  };

  return (
    <View style={[stiller.kap, { paddingTop: kenar.top }]}>
      <View style={stiller.ust}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Antrenmandan çık"
          hitSlop={8}
          style={stiller.kapat}
        >
          <Ionicons name="close" size={26} color={renk.ikincil} />
        </Pressable>
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi" numberOfLines={1}>
            {rutin.baslik}
          </Yazi>
          <Yazi tur="ikincil" accessibilityLiveRegion="polite">
            {`${gecenSure(gecen)} · ${ozet.yapilanEgzersiz}/${ozet.egzersiz} egzersiz`}
          </Yazi>
        </View>
        <Pressable
          onPress={() => setOzetAcik(true)}
          accessibilityRole="button"
          style={({ pressed }) => [stiller.bitir, pressed && { opacity: 0.7 }]}
        >
          <Yazi kalinlik="kalin" renk={renk.ana}>
            Bitir
          </Yazi>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[stiller.liste, { paddingBottom: kenar.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {adimlar.length === 0 && <Yazi tur="ikincil">Bu listede egzersiz yok.</Yazi>}
        {adimlar.map((a, i) => {
          const b = setBlogu(a);
          const hedef = adimHedefi(a);
          if (i !== aktif) {
            const k = a.kayitlar.find((x) => x.tarih === gun);
            const ozetMetni = b && k ? setOzeti(setleriOku(k, setHedefiOku(b), b.id)) : '';
            return (
              <Pressable
                key={a.id}
                onPress={() => setSecili(i)}
                accessibilityRole="button"
                accessibilityLabel={`${a.baslik}${a.yapildi ? ', yapıldı' : ''}. Açmak için dokun.`}
                style={({ pressed }) => [stiller.kapali, pressed && { opacity: 0.7 }]}
              >
                {a.yapildi ? (
                  <Ionicons name="checkmark-circle" size={24} color={renk.ana} />
                ) : (
                  <View style={stiller.bosDaire} />
                )}
                <Yazi
                  renk={a.yapildi ? renk.ikincil : renk.yazi}
                  kalinlik={a.yapildi ? 'normal' : 'yariKalin'}
                  numberOfLines={1}
                  style={stiller.esnek}
                >
                  {a.baslik}
                </Yazi>
                <Yazi tur="ikincil" numberOfLines={1}>
                  {a.yapildi ? ozetMetni || 'Yapıldı' : hedef ? hedefMetni(hedef) : ''}
                </Yazi>
              </Pressable>
            );
          }
          const kayit: Kayit = a.kayitlar.find((x) => x.tarih === gun) ?? bosKayit(a.id, gun);
          const video = a.bloklar.find((x) => x.tur === 'video');
          return (
            <View key={a.id} style={stiller.acik}>
              {video && blokVideolari(video).length > 0 && <VideolarGorunumu videolar={blokVideolari(video)} />}
              <Pressable
                onPress={() => setAciklama(a)}
                accessibilityRole="button"
                accessibilityHint="Nasıl yapıldığını gösterir"
                hitSlop={6}
                style={stiller.adSatiri}
              >
                <Yazi tur="bolumBasligi" style={stiller.esnek}>
                  {a.baslik}
                </Yazi>
                <Ionicons name="information-circle-outline" size={24} color={renk.ana} />
              </Pressable>
              {b ? (
                <SetlerParcasi
                  blok={b}
                  gun={gun}
                  kayit={kayit}
                  kayitlar={a.kayitlar}
                  onKayit={(degistir) => void kayitDegistir(kapi, a.id, gun, degistir).catch(hata)}
                  onYapildi={(y) => isaretle(a, y)}
                />
              ) : (
                <Dugme
                  tur={a.yapildi ? 'ikincil' : 'ana'}
                  etiket={a.yapildi ? 'Yapıldı · geri al' : 'Yaptım'}
                  onPress={() => isaretle(a, !a.yapildi)}
                />
              )}
            </View>
          );
        })}
        {adimlar.length > 0 && <Dugme tur="vurgu" etiket="Antrenmanı bitir" onPress={() => setOzetAcik(true)} />}
      </ScrollView>

      <AltSayfa gorunur={!!aciklama} onKapat={() => setAciklama(null)} baslik={aciklama?.baslik} sagKapat="Kapat">
        {aciklama && <Aciklama adim={aciklama} />}
      </AltSayfa>

      <AltSayfa
        gorunur={ozetAcik}
        onKapat={() => setOzetAcik(false)}
        baslik="Antrenman bitti"
        solVazgec
        sagEylem={{ etiket: 'Kaydet', onPress: kaydet }}
      >
        <Yazi tur="ikincil">{`${rutin.baslik} · ${antrenmanSuresi(gecen)}`}</Yazi>
        <View style={stiller.sayilar}>
          <Sayi deger={`${ozet.yapilanEgzersiz}/${ozet.egzersiz}`} ad="egzersiz" />
          <Sayi deger={String(ozet.set)} ad="set" />
          <Sayi deger={String(ozet.tekrar)} ad="tekrar" />
        </View>
        {ozet.rekorlar.map((r) => (
          <View key={r.ad} style={stiller.rekor}>
            <Ionicons name="trophy-outline" size={22} color={renk.vurguYazi} />
            <Yazi>
              <Yazi kalinlik="kalin">Yeni rekor: </Yazi>
              {`${r.ad} ${String(r.kg).replace('.', ',')} kg`}
            </Yazi>
          </View>
        ))}
        <Yazi kalinlik="kalin">Nasıl geçti?</Yazi>
        <View style={stiller.puanlar} accessibilityRole="radiogroup" accessibilityLabel="Nasıl geçti">
          {PUANLAR.map((n) => (
            <Pressable
              key={n}
              onPress={() => setPuan(puan === n ? 0 : n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: puan === n }}
              accessibilityLabel={n === 1 ? '1, çok zor' : n === 5 ? '5, çok iyi' : String(n)}
              style={[stiller.puan, n <= puan && stiller.puanDolu]}
            >
              <Yazi kalinlik="kalin" renk={n <= puan ? renk.yuzey : renk.yazi}>
                {String(n)}
              </Yazi>
            </Pressable>
          ))}
        </View>
        <GirisAlani
          etiket="Not (isteğe bağlı)"
          value={not}
          onChangeText={setNot}
          placeholder="Son sette dizim zorlandı…"
          multiline
        />
      </AltSayfa>
    </View>
  );
}

function Aciklama({ adim }: { adim: AntrenmanAdimi }) {
  const veri = useSorgu(['kart'], (o) => kartAyrinti(o, adim.id), [adim.id]);
  const kisa = veri.veri?.kart.kisa ?? '';
  const video = adim.bloklar.find((b) => b.tur === 'video');
  const talimat = adim.bloklar.find((b) => b.tur === 'talimat');
  const hedef = adimHedefi(adim);
  const bos = !metinDoluMu(kisa) && !talimat && !(video && blokVideolari(video).length);
  return (
    <View style={stiller.aciklama}>
      {video && blokVideolari(video).length > 0 && <VideolarGorunumu videolar={blokVideolari(video)} />}
      {hedef && (
        <Yazi tur="ikincil">{`${hedefMetni(hedef)} · dinlenme ${dinlenmeMetni(hedef.dinlenme).toLocaleLowerCase('tr')}`}</Yazi>
      )}
      {metinDoluMu(kisa) && <ZenginMetin metin={kisa} />}
      {talimat && <ZenginMetin metin={talimat.metin} />}
      {bos && (
        <Yazi tur="ikincil">
          Bu egzersizin açıklaması yok. Egzersizin kartına açıklama ya da video eklersen burada görünür.
        </Yazi>
      )}
    </View>
  );
}

function Sayi({ deger, ad }: { deger: string; ad: string }) {
  return (
    <View style={stiller.sayi}>
      <Yazi tur="bolumBasligi">{deger}</Yazi>
      <Yazi tur="ikincil">{ad}</Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { flex: 1, backgroundColor: renk.zemin },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: olcu.ekranKenari,
    paddingVertical: 10,
    backgroundColor: renk.yuzey,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  kapat: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bitir: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: olcu.kose.dugme,
    borderWidth: 2,
    borderColor: renk.ana,
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  liste: { padding: olcu.ekranKenari, gap: 10 },
  kapali: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: renk.yuzey,
  },
  bosDaire: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: renk.pasif },
  acik: {
    gap: 12,
    padding: 16,
    borderRadius: olcu.kose.kart,
    borderWidth: 2,
    borderColor: renk.ana,
    backgroundColor: renk.yuzey,
  },
  adSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  aciklama: { gap: 12 },
  sayilar: { flexDirection: 'row', gap: 10 },
  sayi: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: renk.zemin,
  },
  rekor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: renk.vurguAcik2,
  },
  puanlar: { flexDirection: 'row', justifyContent: 'space-between', maxWidth: 320 },
  puan: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: renk.vurgu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puanDolu: { backgroundColor: renk.vurgu },
});
