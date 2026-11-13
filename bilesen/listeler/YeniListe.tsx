// Listeler'de yeni liste (pilot 13 Kasım, P-120). P-123: önce üç tür (Adımlar · Bilgi listesi ·
// Tablo), her birinin altında kısa açıklaması ve örnek adları (yalnız yazı); sonra listenin adı,
// tabloda sütunlar. Günlük kontrol burada yok: her gün yapılacak listeler ajandada.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ListeCesidi } from '@/mantik/listeCesidi';
import { sutunlariDuzelt, type Sutun } from '@/mantik/tablo';

import { AltSayfa } from '../AltSayfa';
import { SutunDuzenleyici } from '../kart/TabloParcasi';
import { GirisAlani } from '../GirisAlani';
import { Bolum } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export type YeniListeSecimi = { tur: 'liste'; cesit: ListeCesidi } | { tur: 'tablo'; sutunlar: Sutun[] };

type Cesit = 'yapilacak' | 'not' | 'tablo';
const CESITLER: readonly {
  cesit: Cesit;
  ad: string;
  ikon: React.ComponentProps<typeof Ionicons>['name'];
  aciklama: string;
  ornek: string;
}[] = [
  {
    cesit: 'yapilacak',
    ad: 'Adımlar',
    ikon: 'checkbox-outline',
    aciklama: 'İşaretlediğin kalır. Bir maddeye gün verirsen o gün ajandanda görünür.',
    ornek: 'Yapılacaklar · Market · Bavul · Taşınma',
  },
  {
    cesit: 'not',
    ad: 'Bilgi listesi',
    ikon: 'reader-outline',
    aciklama: 'İşaret kutusu yok; yalnız maddeler.',
    ornek: 'Okunacak kitaplar · Hediye fikirleri · İzlenecek filmler',
  },
  {
    cesit: 'tablo',
    ad: 'Tablo',
    ikon: 'grid-outline',
    aciklama: 'Beş sütuna kadar; her sütun yazı, sayı, tarih ya da işaret.',
    ornek: 'Market fiyatları · Ödünç verdiklerim · Telefonlar',
  },
];
const BOS_SUTUNLAR: Sutun[] = [
  { ad: '', tur: 'yazi' },
  { ad: '', tur: 'yazi' },
];

export function YeniListe({
  gorunur,
  onKapat,
  onKaydet,
}: {
  gorunur: boolean;
  onKapat: () => void;
  onKaydet: (ad: string, secim: YeniListeSecimi) => void;
}) {
  const [ad, setAd] = useState('');
  const [cesit, setCesit] = useState<Cesit>('yapilacak');
  // P-122: sütunların adı ve türü (Yazı · Sayı · Tarih · İşaret).
  const [sutunlar, setSutunlar] = useState<Sutun[]>(BOS_SUTUNLAR);
  const sifirla = () => {
    setAd('');
    setCesit('yapilacak');
    setSutunlar(BOS_SUTUNLAR);
  };
  const tabloSutunlari = sutunlariDuzelt(sutunlar);
  const hazir = !!ad.trim() && (cesit !== 'tablo' || !!tabloSutunlari);
  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={() => {
        sifirla();
        onKapat();
      }}
      baslik="Yeni liste"
      solVazgec
      degisti={!!ad.trim()}
      sagEylem={{
        etiket: 'Oluştur',
        pasif: !hazir,
        onPress: () => {
          if (!hazir) return;
          onKaydet(
            ad.trim(),
            cesit === 'tablo' ? { tur: 'tablo', sutunlar: tabloSutunlari! } : { tur: 'liste', cesit },
          );
          sifirla();
        },
      }}
    >
      <View style={stiller.turler} accessibilityRole="radiogroup">
        {CESITLER.map((c) => {
          const bu = cesit === c.cesit;
          return (
            <Pressable
              key={c.cesit}
              onPress={() => setCesit(c.cesit)}
              accessibilityRole="radio"
              accessibilityState={{ selected: bu }}
              accessibilityLabel={`${c.ad}. ${c.aciklama} Örnek: ${c.ornek}`}
              style={({ pressed }) => [stiller.tur, bu && stiller.turSecili, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={c.ikon} size={24} color={bu ? renk.ana : renk.ikincil} />
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin" renk={bu ? renk.ana : renk.yazi}>
                  {c.ad}
                </Yazi>
                <Yazi tur="ikincil">{c.aciklama}</Yazi>
                <Yazi tur="etiket">{c.ornek}</Yazi>
              </View>
              <Ionicons
                name={bu ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={bu ? renk.ana : renk.soluk}
              />
            </Pressable>
          );
        })}
      </View>
      <GirisAlani etiket="Listenin adı" value={ad} onChangeText={setAd} returnKeyType="done" />
      {cesit === 'tablo' && (
        <Bolum>
          <Yazi kalinlik="kalin">Sütunlar</Yazi>
          <SutunDuzenleyici liste={sutunlar} onDegis={setSutunlar} />
        </Bolum>
      )}
      <Yazi tur="ikincil">
        {cesit === 'tablo'
          ? 'Tablo yalnız bu telefonda durur.'
          : 'Liste yalnız bu telefonda durur; istersen sonra başkalarıyla paylaşırsın. Her gün yapılacak listeler (takviyeler, sabah rutini) ajandada kurulur.'}
      </Yazi>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  turler: { gap: 8 },
  tur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  turSecili: { borderColor: renk.ana, borderWidth: 2 },
  esnek: { flex: 1, gap: 2 },
});
