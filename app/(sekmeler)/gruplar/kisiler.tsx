// Kişilerim (pilot 23 Ekim, P-34): Gruplar'ın en üstündeki "Kişilerim" satırından
// ya da üst satırdaki kişiler simgesinden açılır. Seni eklemek isteyenler, kişi
// listesi (Sil), + Kişi ekle. Eskiden Gruplar ekranının altındaydı.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { KisiEkleSayfasi } from '@/bilesen/gruplar/KisiEkleSayfasi';
import { KisiIstekleri } from '@/bilesen/gruplar/KisiIstekleri';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { BAGLANAMIYOR, DURUM_METNI, ekledigimSayi, kisiBasHarf, UCRETSIZ_SINIR, type Kisi } from '@/mantik/kisiler';
import { baglantiyiSil, davetiSil } from '@/sunucu/kisiler';
import { useOturum } from '@/sunucu/oturum';
import { kisiSil } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Kisilerim() {
  const oturum = useOturum();
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { ben, kisiler, istekler, baglanamiyor, yenile } = useKisiler(oturum);
  const [ekleAcik, setEkleAcik] = useState(0);
  const [silinecek, setSilinecek] = useState<Kisi | null>(null);
  const ekledigim = ekledigimSayi(kisiler);

  const sil = async (k: Kisi) => {
    setSilinecek(null);
    try {
      if (ben && k.kullaniciId) await baglantiyiSil(ben, k.kullaniciId);
      else if (k.durum === 'davet') await davetiSil(k.eposta);
      await kisiSil(kapi, k.id);
      kisaMesaj(`Silindi: ${k.ad}`);
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };

  return (
    <EkranKabi geri="Gruplar" baslik="Kişilerim" altBaslik={ben ? `${kisiler.length} kişi` : undefined}>
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli
            oturum={oturum}
            aciklama="Kişilerine kart göndermek ve onlarla ortak listeler tutmak için e-postanla devam et. Ajandan ve notların yine yalnız bu telefonda kalır."
          />
        )
      ) : (
        <>
          {baglanamiyor && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}
          <KisiIstekleri ben={ben} istekler={istekler} onYanit={() => void yenile()} />
          {kisiler.length === 0 && <Yazi tur="ikincil">Henüz kişin yok. E-postasıyla birini ekle.</Yazi>}
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
            onPress={() =>
              ekledigim >= UCRETSIZ_SINIR
                ? kisaMesaj(`Ücretsiz üyelikte en çok ${UCRETSIZ_SINIR} kişi ekleyebilirsin.`)
                : setEkleAcik((n) => n + 1)
            }
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
