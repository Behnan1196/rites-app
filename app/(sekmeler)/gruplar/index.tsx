// Gruplar: Seni eklemek isteyenler, Seni gruba çağıranlar, Kişilerim, + Kişi ekle
// (9. görev); Gruplarım, + Grup kur (10. görev).
// Ortak listeler Giriş'ten açılır (`04`). Ücretsiz sınır göstergesi Ayarlar → Üyelik'te.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { GrupDavetleri } from '@/bilesen/gruplar/GrupDavetleri';
import { GrupKurSayfasi } from '@/bilesen/gruplar/GrupKurSayfasi';
import { KisiEkleSayfasi } from '@/bilesen/gruplar/KisiEkleSayfasi';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { grupSayiMetni } from '@/mantik/gruplar';
import {
  BAGLANAMIYOR,
  DURUM_METNI,
  ekledigimSayi,
  kisiBasHarf,
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
  const grup = useGruplar(oturum);
  const [ekleAcik, setEkleAcik] = useState(0);
  const [grupKurAcik, setGrupKurAcik] = useState(0);
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
          {(baglanamiyor || grup.baglanamiyor) && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}

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

          <GrupDavetleri davetler={grup.davetler} ad={grup.ad} onYanit={() => void grup.yenile()} />

          <View style={stiller.baslikSatiri}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Kişilerim
            </Yazi>
            <Yazi tur="ikincil">{`${kisiler.length} kişi`}</Yazi>
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

          <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
            Gruplarım
          </Yazi>
          {grup.gruplar.length === 0 && !grup.yukleniyor && <Yazi tur="ikincil">Henüz bir grubun yok.</Yazi>}
          {grup.gruplar.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push({ pathname: '/gruplar/grup/[id]', params: { id: g.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${g.ad}, ${grupSayiMetni(g, ben)}`}
              style={({ pressed }) => [stiller.grup, pressed && { opacity: 0.75 }]}
            >
              <View style={stiller.grupSimge}>
                <Ionicons name="people-outline" size={22} color={renk.ana} />
              </View>
              <View style={stiller.esnek}>
                <Yazi tur="kartBasligi">{g.ad}</Yazi>
                <Yazi tur="ikincil">{grupSayiMetni(g, ben)}</Yazi>
              </View>
              <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
            </Pressable>
          ))}
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Grup kur" onPress={() => setGrupKurAcik((n) => n + 1)} />
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

      {grupKurAcik > 0 && (
        <GrupKurSayfasi
          key={grupKurAcik}
          onKapat={() => setGrupKurAcik(0)}
          kisiler={kisiler}
          onKuruldu={() => void grup.yenile()}
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
  bolumArasi: { marginTop: 8 },
  grup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 72,
  },
  grupSimge: { width: 44, height: 44, borderRadius: 22, backgroundColor: renk.anaAcik, alignItems: 'center', justifyContent: 'center' },
});
