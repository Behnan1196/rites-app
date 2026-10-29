// "Ajandama kart ekleyebilir" (pilot 29 Ekim, P-62): Gelenler'de izin istekleri
// (İzin ver · Hayır) ve Kişilerim'de her bağlı kişinin altında anahtar.

import { StyleSheet, View } from 'react-native';

import type { AdBulucu } from '@/mantik/gruplar';
import { IZIN_ACIKLAMASI, izinDurumu, izinIstekleri } from '@/mantik/kartVerme';
import { BAGLANAMIYOR } from '@/mantik/kisiler';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { AcKapa } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { useKartVerme } from './KartVerme';

/** Gelenler'de: "Annem ajandana kart eklemek istiyor". */
export function AjandaIzinIstekleri({ ad }: { ad: AdBulucu }) {
  const { ben, izinler, izinVer } = useKartVerme();
  const kisaMesaj = useKisaMesaj();
  const istekler = ben ? izinIstekleri(izinler, ben) : [];
  if (istekler.length === 0) return null;
  const yanitla = async (yetkili: string, ver: boolean) => {
    try {
      await izinVer(yetkili, ver);
      kisaMesaj(ver ? `${ad(yetkili)} artık ajandana kart ekleyebilir` : 'İstek reddedildi');
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };
  return (
    <View style={stiller.kap}>
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Ajandana kart eklemek isteyenler
      </Yazi>
      {istekler.map((i) => (
        <View key={i.yetkili} style={stiller.istek}>
          <Yazi tur="kartBasligi">{`${ad(i.yetkili)} ajandana kart eklemek istiyor`}</Yazi>
          <Yazi tur="ikincil">{IZIN_ACIKLAMASI}</Yazi>
          <View style={stiller.dugmeler}>
            <Dugme etiket="İzin ver" onPress={() => void yanitla(i.yetkili, true)} style={stiller.esnek} />
            <Dugme tur="ikincil" etiket="Hayır" onPress={() => void yanitla(i.yetkili, false)} style={stiller.esnek} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Kişilerim'de bir bağlı kişinin altında: "Ajandama kart ekleyebilir". */
export function AjandaIzniAnahtari({ kisi, ad }: { kisi: string; ad: string }) {
  const { ben, izinler, izinVer } = useKartVerme();
  const kisaMesaj = useKisaMesaj();
  if (!ben) return null;
  const d = izinDurumu(izinler, ben, kisi);
  const acik = d.benimAjandama === 'izinli';
  const degis = async (ver: boolean) => {
    try {
      await izinVer(kisi, ver);
      kisaMesaj(ver ? `${ad} artık ajandana kart ekleyebilir` : `${ad} artık ajandana kart ekleyemez`);
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };
  return (
    <View style={stiller.anahtarSatiri}>
      <View style={stiller.esnek}>
        <Yazi kalinlik="kalin">Ajandama kart ekleyebilir</Yazi>
        {d.benimAjandama === 'istek' && (
          <Yazi tur="ikincil" renk={renk.vurguYazi}>
            İzin istiyor
          </Yazi>
        )}
      </View>
      <AcKapa acik={acik} onDegis={(v) => void degis(v)} etiket={`${ad} ajandama kart ekleyebilir`} />
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 12 },
  istek: {
    backgroundColor: renk.yuzey,
    borderWidth: 2,
    borderColor: renk.vurgu,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 10,
  },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', gap: 10 },
  anahtarSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10 },
});
