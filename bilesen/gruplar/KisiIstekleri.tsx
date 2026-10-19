// "Seni eklemek isteyenler": Kabul et · Reddet. Gruplar sekmesinde ve (pilot 19
// Ekim'den beri) Gelenler'de görünür; Giriş'teki Gelenler kutusu da sayar.

import { StyleSheet, View } from 'react-native';

import { BAGLANAMIYOR, kisiBasHarf, type SunucuBaglantisi } from '@/mantik/kisiler';
import { baglantiyiSil, istegiKabulEt } from '@/sunucu/kisiler';
import { yeniKimlik } from '@/veri/kimlik';
import { kisiEkle } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function KisiIstekleri({
  ben,
  istekler,
  onYanit,
}: {
  ben: string;
  istekler: readonly SunucuBaglantisi[];
  onYanit: () => void;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  if (istekler.length === 0) return null;

  const hata = (e: unknown) => {
    console.warn(e);
    kisaMesaj(BAGLANAMIYOR);
  };

  const kabul = async (r: SunucuBaglantisi) => {
    try {
      await istegiKabulEt(r.diger);
      await kisiEkle(kapi, {
        id: yeniKimlik(),
        ad: r.ad || r.eposta,
        eposta: r.eposta,
        kullaniciId: r.diger,
        durum: 'bagli',
        benEkledim: false,
      });
      kisaMesaj(`${r.ad || r.eposta} ile bağlandınız.`);
      onYanit();
    } catch (e) {
      hata(e);
    }
  };

  const reddet = async (r: SunucuBaglantisi) => {
    try {
      await baglantiyiSil(ben, r.diger);
      kisaMesaj('İstek reddedildi');
      onYanit();
    } catch (e) {
      hata(e);
    }
  };

  return (
    <View style={stiller.kap}>
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Seni eklemek isteyenler
      </Yazi>
      {istekler.map((r) => (
        <View key={r.diger} style={stiller.istek}>
          <View style={stiller.satir}>
            <View style={stiller.avatar}>
              <Yazi kalinlik="kalin" renk={renk.vurguYazi}>
                {kisiBasHarf(r.ad || r.eposta)}
              </Yazi>
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{r.ad || r.eposta}</Yazi>
              <Yazi tur="ikincil">{r.eposta}</Yazi>
              <Yazi tur="ikincil">{"Kabul edersen Kişilerim'e eklenir; kart gönderip gruba çağırabilirsiniz."}</Yazi>
            </View>
          </View>
          <View style={stiller.dugmeler}>
            <Dugme etiket="Kabul et" onPress={() => void kabul(r)} style={stiller.esnek} />
            <Dugme tur="ikincil" etiket="Reddet" onPress={() => void reddet(r)} style={stiller.esnek} />
          </View>
        </View>
      ))}
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
    gap: 12,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: renk.vurguAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', gap: 10 },
});
