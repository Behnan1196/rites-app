// Listeler'de yeni liste (pilot 13 Kasım, P-120): ad, örnek adlar ve çeşit: Adımlar · Bilgi
// listesi · Tablo (2–3 sütun). Günlük kontrol burada yok: her gün yapılacak listeler ajandada.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AD_ORNEKLERI, cesitTanimi, type ListeCesidi } from '@/mantik/listeCesidi';
import { EN_COK_SUTUN, sutunlariDuzelt, TABLO_ORNEKLERI } from '@/mantik/tablo';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

export type YeniListeSecimi = { tur: 'liste'; cesit: ListeCesidi } | { tur: 'tablo'; sutunlar: string[] };

type Cesit = 'yapilacak' | 'not' | 'tablo';
const CESITLER: readonly { cesit: Cesit; ad: string; aciklama: string }[] = [
  { cesit: 'yapilacak', ad: cesitTanimi('yapilacak').ad, aciklama: cesitTanimi('yapilacak').aciklama },
  { cesit: 'not', ad: cesitTanimi('not').ad, aciklama: cesitTanimi('not').aciklama },
  { cesit: 'tablo', ad: 'Tablo', aciklama: 'İki ya da üç sütun: ürün, son fiyat, yer gibi. Sütuna göre sıralanır.' },
];
const ORNEKLER: readonly { ad: string; cesit: Cesit; sutunlar?: string[] }[] = [
  ...AD_ORNEKLERI.filter((o) => o.cesit !== 'gunluk').map((o) => ({ ad: o.ad, cesit: o.cesit as Cesit })),
  ...TABLO_ORNEKLERI.map((o) => ({ ad: o.ad, cesit: 'tablo' as const, sutunlar: o.sutunlar })),
];
const BOS_SUTUNLAR = ['', ''];

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
  const [sutunlar, setSutunlar] = useState<string[]>(BOS_SUTUNLAR);
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
      <GirisAlani etiket="Listenin adı" value={ad} onChangeText={setAd} returnKeyType="done" autoFocus />
      <View style={stiller.cipler}>
        {ORNEKLER.map((o) => (
          <SecenekHapi
            key={o.ad}
            etiket={o.ad}
            secili={ad === o.ad}
            onPress={() => {
              setAd(o.ad);
              setCesit(o.cesit);
              if (o.sutunlar) setSutunlar(o.sutunlar);
            }}
          />
        ))}
      </View>
      <Bolum>
        <Yazi kalinlik="kalin">Ne tür bir liste?</Yazi>
        <View style={stiller.cipler}>
          {CESITLER.map((c) => (
            <SecenekHapi key={c.cesit} etiket={c.ad} secili={cesit === c.cesit} onPress={() => setCesit(c.cesit)} />
          ))}
        </View>
        <Yazi tur="ikincil">{CESITLER.find((c) => c.cesit === cesit)!.aciklama}</Yazi>
      </Bolum>
      {cesit === 'tablo' && (
        <Bolum>
          <Yazi kalinlik="kalin">Sütunlar</Yazi>
          {sutunlar.map((s, i) => (
            <GirisAlani
              key={i}
              etiket={`${i + 1}. sütun`}
              value={s}
              placeholder={['Ürün', 'Son fiyat', 'Yer'][i]}
              onChangeText={(t) => setSutunlar((l) => l.map((x, j) => (j === i ? t : x)))}
            />
          ))}
          {sutunlar.length < EN_COK_SUTUN && (
            <Dugme
              tur="ikincil"
              yaziRengi={renk.ana}
              etiket="+ Sütun ekle"
              onPress={() => setSutunlar((l) => [...l, ''])}
            />
          )}
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
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
