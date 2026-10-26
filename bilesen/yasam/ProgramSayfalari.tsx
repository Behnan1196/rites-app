// Program ekranının alttan sayfaları: Başlat (hangi gün), Değerlendir (yıldız ve
// not), Kütüphanemden kart ekle; ajandadan ve kütüphaneden "Programa ekle".

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { kutuphaneSuz, type KutuphaneKaydi } from '@/mantik/kutuphane';
import { htmldenDuz } from '@/mantik/zenginMetin';
import { durumMetni, KENDIM, programBitisi, programFormuHatasi, YILDIZ_SOZLERI, type Program } from '@/mantik/program';
import { gunEkle, haftaGunu, kisaTarih, uzunTarih, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { kutuphaneyiOku } from '@/veri/kutuphane';
import { programKur, programlariOku } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { YildizSecici } from './parcalar';

// ---- Başlat --------------------------------------------------------------------

export function BaslatSayfasi({
  program,
  gorunur,
  onKapat,
  onBaslat,
}: {
  program: Program;
  gorunur: boolean;
  onKapat: () => void;
  onBaslat: (gun: Gun) => void;
}) {
  const bugunGun = useBugun();
  const [gun, setGun] = useState<Gun>(bugunGun);
  const pazartesi = gunEkle(bugunGun, 7 - haftaGunu(bugunGun));
  const bitis = programBitisi({ baslangic: gun, sure: program.sure });
  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik={program.baslangic ? 'Yeniden başlat' : 'Programı başlat'}
      solVazgec
      altAlan={<Dugme etiket="Başlat" onPress={() => onBaslat(gun)} />}
    >
      <Yazi kalinlik="kalin">Hangi gün başlasın?</Yazi>
      <View style={stiller.cipler}>
        <SecenekHapi etiket="Bugün" secili={gun === bugunGun} onPress={() => setGun(bugunGun)} />
        <SecenekHapi
          etiket="Yarın"
          secili={gun === gunEkle(bugunGun, 1)}
          onPress={() => setGun(gunEkle(bugunGun, 1))}
        />
        <SecenekHapi
          etiket="Pazartesi"
          altEtiket={kisaTarih(pazartesi)}
          secili={gun === pazartesi}
          onPress={() => setGun(pazartesi)}
        />
      </View>
      <AyTakvimi secili={gun} bugunGun={bugunGun} onSec={setGun} />
      <Yazi kalinlik="kalin" renk={renk.ana} accessibilityLiveRegion="polite">
        {bitis ? `${uzunTarih(gun)} – ${uzunTarih(bitis)}` : `${uzunTarih(gun)} · süresiz`}
      </Yazi>
      <Yazi tur="ikincil">
        {program.baslangic
          ? 'Kartlar baştan, bu günden itibaren ajandana düşer. Önceki uygulamanın kayıtları geçmişte kalır.'
          : 'Kartlar bu günden itibaren kendi günlerinde ajandana düşer.'}
      </Yazi>
    </AltSayfa>
  );
}

// ---- Değerlendir -----------------------------------------------------------------

export function DegerlendirSayfasi({
  program,
  gorunur,
  onKapat,
  onKaydet,
}: {
  program: Program;
  gorunur: boolean;
  onKapat: () => void;
  onKaydet: (yildiz: number, not: string) => void;
}) {
  const [yildiz, setYildiz] = useState(program.yildiz);
  const [not, setNot] = useState(program.degerlendirme);
  const degisti = yildiz !== program.yildiz || not !== program.degerlendirme;
  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Değerlendir"
      solVazgec
      degisti={degisti}
      altAlan={<Dugme etiket="Kaydet" onPress={() => onKaydet(yildiz, not)} pasif={yildiz === 0} />}
    >
      <Yazi kalinlik="kalin">{`"${program.ad}" sana nasıl geldi?`}</Yazi>
      <YildizSecici deger={yildiz} onSec={setYildiz} sozler={YILDIZ_SOZLERI} />
      <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.orta}>
        {YILDIZ_SOZLERI[yildiz] ?? ''}
      </Yazi>
      <GirisAlani
        etiket="Not (isteğe bağlı)"
        value={not}
        onChangeText={setNot}
        placeholder="Neyi değiştirirdin? Kime önerirsin?"
        multiline
        textAlignVertical="top"
        scrollEnabled={false}
      />
      <Yazi tur="ikincil">Kütüphanende programları ararken yıldızları görürsün.</Yazi>
    </AltSayfa>
  );
}

// ---- Kütüphanemden kart seç -------------------------------------------------------

export function KutuphanedenSecSayfasi({
  gorunur,
  onKapat,
  onSec,
}: {
  gorunur: boolean;
  onKapat: () => void;
  onSec: (k: KutuphaneKaydi) => void;
}) {
  const veri = useSorgu(['kutuphane'], (o) => kutuphaneyiOku(o), []);
  const [sorgu, setSorgu] = useState('');
  const kayitlar = kutuphaneSuz(veri.veri ?? [], { sorgu, alan: null, tur: null });
  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Kütüphanemden ekle" sagKapat="Kapat">
      {!veri.yukleniyor && (veri.veri ?? []).length === 0 ? (
        <Yazi tur="ikincil">
          Kütüphanende kayıtlı kart yok. Ajandadaki bir kartın menüsünden &quot;Kütüphaneye kaydet&quot; diyebilirsin.
        </Yazi>
      ) : (
        <>
          <GirisAlani
            etiket="Kütüphanede ara"
            etiketGizli
            value={sorgu}
            onChangeText={setSorgu}
            placeholder="Ara"
            returnKeyType="search"
          />
          {kayitlar.map((k) => (
            <Pressable
              key={k.id}
              onPress={() => onSec(k)}
              accessibilityRole="button"
              accessibilityLabel={`${k.baslik}, programa ekle`}
              style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
            >
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin">{k.baslik}</Yazi>
                {!!k.icerik.kisa && (
                  <Yazi tur="ikincil" numberOfLines={2}>
                    {htmldenDuz(k.icerik.kisa)}
                  </Yazi>
                )}
              </View>
              <Ionicons name="add-circle-outline" size={26} color={renk.ana} />
            </Pressable>
          ))}
        </>
      )}
    </AltSayfa>
  );
}

// ---- Programa ekle (ajandadan, kütüphaneden) -------------------------------------

/** Program seç ya da yeni program kur; seçilince `onSec(programId)`. */
export function ProgramSecSayfasi({
  baslik,
  gorunur,
  onKapat,
  onSec,
}: {
  /** Eklenen kartın başlığı. */
  baslik: string;
  gorunur: boolean;
  onKapat: () => void;
  onSec: (programId: string) => void;
}) {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const veri = useSorgu(['plan'], (o) => programlariOku(o), []);
  const [yeniAd, setYeniAd] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const programlar = [...(veri.veri ?? [])].sort(
    (a, b) => (a.durum === 'uygulaniyor' ? 0 : 1) - (b.durum === 'uygulaniyor' ? 0 : 1),
  );

  const yeniKur = async () => {
    const h = programFormuHatasi(yeniAd ?? '');
    if (h) {
      setHata(h);
      return;
    }
    try {
      const id = yeniKimlik();
      await programKur(kapi, {
        id,
        ad: (yeniAd ?? '').trim(),
        alanlar: [],
        neden: '',
        sure: null,
        durum: 'hazir',
        baslangic: null,
        yildiz: 0,
        degerlendirme: '',
        kaynak: KENDIM,
        olusturma: new Date().toISOString(),
      });
      onSec(id);
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    }
  };

  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Programa ekle" solVazgec>
      <Yazi tur="kartBasligi">{baslik}</Yazi>
      <Yazi tur="ikincil">
        Uygulanan bir programa eklersen bu kart o programın parçası olur. Başka bir programa eklersen kopyası eklenir;
        ajandandaki kart yerinde kalır.
      </Yazi>
      {programlar.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onSec(p.id)}
          accessibilityRole="button"
          accessibilityLabel={`${p.ad}, ${durumMetni(p, bugunGun)}`}
          style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
        >
          <View style={stiller.esnek}>
            <Yazi kalinlik="kalin">{p.ad}</Yazi>
            <Yazi tur="ikincil">{durumMetni(p, bugunGun)}</Yazi>
          </View>
          <Ionicons name="add-circle-outline" size={26} color={renk.ana} />
        </Pressable>
      ))}
      {yeniAd === null ? (
        <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Yeni program" onPress={() => setYeniAd('')} />
      ) : (
        <Bolum>
          <GirisAlani
            etiket="Yeni programın adı"
            value={yeniAd}
            onChangeText={(t) => {
              setYeniAd(t);
              setHata(null);
            }}
            placeholder="Örneğin: Sosyal bağlarım"
            hata={hata}
            returnKeyType="done"
            onSubmitEditing={() => void yeniKur()}
            autoFocus
          />
          <Dugme etiket="Kur ve ekle" onPress={() => void yeniKur()} />
          <Yazi tur="ikincil">Süresini ve alanlarını sonra programın ekranından seçersin.</Yazi>
        </Bolum>
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  orta: { textAlign: 'center' },
  esnek: { flex: 1, gap: 2 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 60,
  },
});
