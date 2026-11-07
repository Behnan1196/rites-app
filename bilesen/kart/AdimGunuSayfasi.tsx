// Adımlar listesinde maddeye gün (P-110; Listelerim'deki gibi): o gün madde ajandada tek
// başına görünür. "Tarih yok" maddeyi yeniden listenin günlerine bağlar.

import { StyleSheet, View } from 'react-native';

import { zamanSecenekleri } from '@/mantik/listeler';
import type { Gun } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';

export function AdimGunuSayfasi({
  baslik,
  gun,
  onSec,
  onKapat,
}: {
  baslik: string;
  /** Maddenin günü (yoksa null). */
  gun: Gun | null;
  onSec: (gun: Gun | null) => void;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={baslik} sagKapat="Tamam">
      <Yazi kalinlik="kalin">Ne zaman?</Yazi>
      <View style={stiller.cipler}>
        {zamanSecenekleri(bugunGun).map((z) => (
          <SecenekHapi key={z.etiket} etiket={z.etiket} secili={gun === z.tarih} onPress={() => onSec(z.tarih)} />
        ))}
      </View>
      <Yazi tur="ikincil">Ya da bir tarih seç</Yazi>
      <AyTakvimi secili={gun} bugunGun={bugunGun} onSec={(g) => onSec(g)} />
      <Yazi tur="ikincil">Günü olan madde o gün ajandanda görünür.</Yazi>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
