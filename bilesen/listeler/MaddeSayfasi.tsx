// Madde sayfası (GR-4): Kime? (Kimse / Sen / listenin üyeleri), Ne zaman?
// (Tarih yok / Bugün / Yarın / tarih seç). Seçim anında kaydedilir; "Tamam" kapatır.

import { StyleSheet, View } from 'react-native';

import type { AdBulucu } from '@/mantik/gruplar';
import { kimeSecenekleri, MADDE_NOTU, zamanSecenekleri, type Madde, type OrtakListe } from '@/mantik/listeler';
import type { Gun } from '@/mantik/tarih';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { Bolum, SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';

export function MaddeSayfasi({
  madde,
  liste,
  ben,
  ad,
  bugunGun,
  onDegis,
  onSil,
  onKapat,
}: {
  madde: Madde;
  liste: OrtakListe;
  ben: string;
  ad: AdBulucu;
  bugunGun: Gun;
  onDegis: (d: { kime?: string | null; tarih?: Gun | null }) => void;
  onSil: () => void;
  onKapat: () => void;
}) {
  const zamanlar = zamanSecenekleri(bugunGun);
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={madde.metin} sagKapat="Tamam">
      <Bolum>
        <Yazi kalinlik="kalin">Kime?</Yazi>
        <View style={stiller.cipler}>
          {kimeSecenekleri(liste, ben, ad).map((s) => (
            <SecenekHapi
              key={s.id ?? 'kimse'}
              etiket={s.etiket}
              secili={madde.kime === s.id}
              onPress={() => onDegis({ kime: s.id })}
            />
          ))}
        </View>
      </Bolum>
      <Bolum>
        <Yazi kalinlik="kalin">Ne zaman?</Yazi>
        <View style={stiller.cipler}>
          {zamanlar.map((z) => (
            <SecenekHapi
              key={z.etiket}
              etiket={z.etiket}
              secili={madde.tarih === z.tarih}
              onPress={() => onDegis({ tarih: z.tarih })}
            />
          ))}
        </View>
        <Yazi tur="ikincil">Ya da bir tarih seç</Yazi>
        <AyTakvimi secili={madde.tarih} bugunGun={bugunGun} onSec={(tarih) => onDegis({ tarih })} />
      </Bolum>
      <Yazi tur="ikincil">{MADDE_NOTU}</Yazi>
      <Dugme tur="tehlike" etiket="Maddeyi sil" onPress={onSil} />
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
