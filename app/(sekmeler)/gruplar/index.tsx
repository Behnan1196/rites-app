// Gruplar: Seni eklemek isteyenler, Seni gruba çağıranlar, Kişilerim, + Kişi ekle
// (9. görev); Gruplarım (bana bekleyen yanıt sayısıyla), + Grup kur (10. görev);
// yalnız eskiden kişilerle açılmış listeler (pilot 19 Ekim: listelerin yeri grup);
// Kişilerim. Ücretsiz sınır göstergesi Ayarlar → Üyelik'te.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { GrupDavetleri } from '@/bilesen/gruplar/GrupDavetleri';
import { KisiIstekleri } from '@/bilesen/gruplar/KisiIstekleri';
import { GrupKurSayfasi } from '@/bilesen/gruplar/GrupKurSayfasi';
import { KisiEkleSayfasi } from '@/bilesen/gruplar/KisiEkleSayfasi';
import { useGrupBekleyenleri } from '@/bilesen/gruplar/useGrupBekleyenleri';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { Katman } from '@/bilesen/Katman';
import { OrtakListeSatiri } from '@/bilesen/listeler/OrtakListeSatiri';
import { useListeler } from '@/bilesen/listeler/useListeler';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { grupBasinaBekleyen } from '@/mantik/grupBekleyenler';
import { grupSayiMetni } from '@/mantik/gruplar';
import { BAGLANAMIYOR, DURUM_METNI, ekledigimSayi, kisiBasHarf, UCRETSIZ_SINIR, type Kisi } from '@/mantik/kisiler';
import { baglantiyiSil, davetiSil } from '@/sunucu/kisiler';
import { useOturum } from '@/sunucu/oturum';
import { kisiSil } from '@/veri/kisiler';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Gruplar() {
  const oturum = useOturum();
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { ben, kisiler, istekler, baglanamiyor, yenile } = useKisiler(oturum);
  const grup = useGruplar(oturum);
  const bekleyen = useGrupBekleyenleri();
  const bekleyenSayilari = grupBasinaBekleyen(bekleyen.bekleyenler);
  const bekleyenYenile = bekleyen.yenile;
  useFocusEffect(
    useCallback(() => {
      void bekleyenYenile();
    }, [bekleyenYenile]),
  );
  const [ekleAcik, setEkleAcik] = useState(0);
  const [grupKurAcik, setGrupKurAcik] = useState(0);
  const [silinecek, setSilinecek] = useState<Kisi | null>(null);
  const liste = useListeler(oturum);
  // Pilot 19 Ekim: listelerin yeri grup; burada yalnız eskiden kişilerle açılmış (gruba açık olmayan) listeler.
  const kisiListeleri = liste.listeler.filter((l) => l.gruplar.length === 0);
  const ekledigim = ekledigimSayi(kisiler);

  const hata = (e: unknown) => {
    console.warn(e);
    kisaMesaj(BAGLANAMIYOR);
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
          {(baglanamiyor || grup.baglanamiyor || liste.baglanamiyor) && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}

          <KisiIstekleri ben={ben} istekler={istekler} onYanit={() => void yenile()} />

          <GrupDavetleri
            davetler={grup.davetler}
            ad={grup.ad}
            onYanit={() => {
              void grup.yenile();
              void bekleyen.yenile();
            }}
          />

          <Yazi tur="bolumBasligi" accessibilityRole="header">
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
                {!!bekleyenSayilari.get(g.id) && (
                  <Yazi
                    kalinlik="kalin"
                    renk={renk.vurguYazi}
                  >{`Senden ${bekleyenSayilari.get(g.id)} yanıt bekleniyor`}</Yazi>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
            </Pressable>
          ))}
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Grup kur" onPress={() => setGrupKurAcik((n) => n + 1)} />

          {kisiListeleri.length > 0 && (
            <>
              <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
                Kişilerle listeler
              </Yazi>
              <Yazi tur="ikincil">Yeni listeler gruplarda açılır (grup → + Ekle → Yapılacak → Liste).</Yazi>
            </>
          )}
          {kisiListeleri.map((l) => (
            <OrtakListeSatiri
              key={l.id}
              liste={l}
              ben={ben}
              ad={liste.ad}
              onPress={() => router.push({ pathname: '/gruplar/liste/[id]', params: { id: l.id } })}
            />
          ))}

          <View style={[stiller.baslikSatiri, stiller.bolumArasi]}>
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
  grupSimge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
