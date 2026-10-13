// Gruplar (9. görev bölümü): Seni eklemek isteyenler, ücretsiz sınır, Kişilerim,
// + Kişi ekle. Gruplarım ve ortak listeler 10. görevde.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { KisiEkleSayfasi } from '@/bilesen/gruplar/KisiEkleSayfasi';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import {
  BAGLANAMIYOR,
  DURUM_METNI,
  ekledigimSayi,
  kalanKisiMetni,
  kisiBasHarf,
  SINIR_ACIKLAMASI,
  UCRETSIZ_SINIR,
  type Kisi,
} from '@/mantik/kisiler';
import { baglantiyiSil, davetiSil, istegiKabulEt } from '@/sunucu/kisiler';
import { useOturum } from '@/sunucu/oturum';
import { yeniKimlik } from '@/veri/kimlik';
import { kisiEkle, kisiSil } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Gruplar() {
  const oturum = useOturum();
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { ben, kisiler, istekler, baglanamiyor, yenile } = useKisiler(oturum);
  const [ekleAcik, setEkleAcik] = useState(0);
  const [silinecek, setSilinecek] = useState<Kisi | null>(null);
  const ekledigim = ekledigimSayi(kisiler);

  const hata = (e: unknown) => {
    console.warn(e);
    kisaMesaj(BAGLANAMIYOR);
  };

  const kabul = async (diger: string, ad: string, eposta: string) => {
    try {
      await istegiKabulEt(diger);
      await kisiEkle(kapi, { id: yeniKimlik(), ad: ad || eposta, eposta, kullaniciId: diger, durum: 'bagli', benEkledim: false });
      kisaMesaj(`${ad || eposta} ile bağlandınız.`);
      void yenile();
    } catch (e) {
      hata(e);
    }
  };

  const sil = async (k: Kisi) => {
    setSilinecek(null);
    try {
      if (ben && k.kullaniciId) await baglantiyiSil(ben, k.kullaniciId);
      else if (k.durum === 'davet') await davetiSil(k.eposta);
      await kisiSil(kapi, k.id);
      kisaMesaj(`Silindi: ${k.ad}`);
    } catch (e) {
      hata(e);
    }
  };

  return (
    <EkranKabi baslik="Gruplar" altBaslik="Kişilerin ve birlikte yürüttüğün gruplar.">
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli
            oturum={oturum}
            aciklama="Kişilerine kart göndermek ve onlarla ortak listeler tutmak için e-postanla devam et. Ajandan ve notların yine yalnız bu telefonda kalır."
          />
        )
      ) : (
        <>
          {baglanamiyor && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}

          {istekler.length > 0 && (
            <>
              <Yazi tur="bolumBasligi" accessibilityRole="header">
                Seni eklemek isteyenler
              </Yazi>
              {istekler.map((r) => (
                <View key={r.diger} style={stiller.istek}>
                  <View style={stiller.satir}>
                    <View style={[stiller.avatar, { backgroundColor: renk.vurguAcik }]}>
                      <Yazi kalinlik="kalin" renk={renk.vurguYazi}>
                        {kisiBasHarf(r.ad || r.eposta)}
                      </Yazi>
                    </View>
                    <View style={stiller.esnek}>
                      <Yazi tur="kartBasligi">{r.ad || r.eposta}</Yazi>
                      <Yazi tur="ikincil">{r.eposta}</Yazi>
                    </View>
                  </View>
                  <View style={stiller.dugmeler}>
                    <Dugme etiket="Kabul et" onPress={() => void kabul(r.diger, r.ad, r.eposta)} style={stiller.esnek} />
                    <Dugme
                      tur="ikincil"
                      etiket="Reddet"
                      onPress={() => void baglantiyiSil(ben, r.diger).then(yenile, hata)}
                      style={stiller.esnek}
                    />
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={stiller.baslikSatiri}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Kişilerim
            </Yazi>
            <Yazi tur="ikincil">{`${kisiler.length} kişi`}</Yazi>
          </View>

          <View style={stiller.kutu}>
            <View style={stiller.baslikSatiri}>
              <Yazi tur="ikincil">Eklediğin kişiler (ücretsiz)</Yazi>
              <Yazi tur="bolumBasligi">{`${ekledigim} / ${UCRETSIZ_SINIR}`}</Yazi>
            </View>
            <View style={stiller.cubuklar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {Array.from({ length: UCRETSIZ_SINIR }, (_, i) => (
                <View key={i} style={[stiller.cubuk, { backgroundColor: i < ekledigim ? renk.ana : renk.cizgi }]} />
              ))}
            </View>
            <Yazi tur="ikincil">{`${kalanKisiMetni(ekledigim)} ${SINIR_ACIKLAMASI}`}</Yazi>
          </View>

          {kisiler.length > 0 && (
            <View style={stiller.liste}>
              {kisiler.map((k, i) => (
                <View key={k.id} style={[stiller.satir, stiller.kisi, i > 0 && stiller.cizgili]}>
                  <View style={stiller.avatar}>
                    <Yazi kalinlik="kalin" renk={renk.ana}>
                      {kisiBasHarf(k.ad)}
                    </Yazi>
                  </View>
                  <View style={stiller.esnek}>
                    <Yazi tur="kartBasligi">{k.ad}</Yazi>
                    <Yazi tur="ikincil">{k.eposta}</Yazi>
                    <Yazi kalinlik="kalin" renk={k.durum === 'bagli' ? renk.ana : renk.vurguYazi}>
                      {DURUM_METNI[k.durum]}
                    </Yazi>
                  </View>
                  <Dugme tur="tehlike" etiket="Sil" onPress={() => setSilinecek(k)} />
                </View>
              ))}
            </View>
          )}

          <Dugme
            etiket="+ Kişi ekle"
            onPress={() => (ekledigim >= UCRETSIZ_SINIR ? kisaMesaj(`Ücretsiz üyelikte en çok ${UCRETSIZ_SINIR} kişi ekleyebilirsin.`) : setEkleAcik((n) => n + 1))}
          />
        </>
      )}

      {ekleAcik > 0 && (
        <KisiEkleSayfasi
          key={ekleAcik}
          gorunur
          onKapat={() => setEkleAcik(0)}
          kisiler={kisiler}
          ekledigim={ekledigim}
          onEklendi={() => void yenile()}
        />
      )}

      {silinecek && (
        <Katman>
          <OnayKutusu
            baslik={`${silinecek.ad} silinsin mi?`}
            aciklama="Bağlantınız iki tarafta da kopar."
            secenekler={[
              { etiket: 'Sil', tur: 'tehlike', onPress: () => void sil(silinecek) },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilinecek(null) },
            ]}
          />
        </Katman>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
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
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', gap: 10 },
  baslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 10,
  },
  cubuklar: { flexDirection: 'row', gap: 8 },
  cubuk: { flex: 1, height: 10, borderRadius: 5 },
  liste: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingLeft: olcu.kartIci,
    paddingRight: 4,
  },
  kisi: { paddingVertical: 14 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
});
