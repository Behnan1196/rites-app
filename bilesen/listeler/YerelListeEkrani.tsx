// Listelerim'deki kişisel liste (pilot 27 Ekim, P-58): telefonda durur. "Ekle ve Enter'a bas",
// maddeler (işaret kutusu, metin, tarih etiketi). Maddeye dokununca: Ne zaman? (tarihli madde o
// gün ajandada) ve Maddeyi sil. Altta: Başkalarıyla paylaş (ortak listeye taşınır), Adını
// değiştir, Listeyi sil.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BOS_LISTE, LISTE_ORNEKLERI, zamanSecenekleri } from '@/mantik/listeler';
import { kisaGoreliTarih } from '@/mantik/ajanda';
import type { YerelMadde } from '@/mantik/yerelListe';
import { maddeDegistir, maddeEkle } from '@/sunucu/listeler';
import { useOturum } from '@/sunucu/oturum';
import { useSorgu } from '@/veri/kancalar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';
import {
  yerelListeOku,
  yerelListeSil,
  yerelListeYaz,
  yerelMaddeDegistir,
  yerelMaddeEkle,
  yerelMaddeSil,
} from '@/veri/yerelListeler';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { EkranKabi } from '../EkranKabi';
import { GirisAlani } from '../GirisAlani';
import { IsaretKutusu, ListeKutusu, parcaStilleri } from '../gruplar/parcalar';
import { useGruplar } from '../gruplar/useGruplar';
import { useKisiler } from '../gruplar/useKisiler';
import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu } from '../OnayKutusu';
import { useOturumAc } from '../oturum/OturumSayfasi';
import { Bolum, SecenekHapi } from '../Secim';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { ListeFormu } from './ListeFormu';

export function YerelListeEkrani({ id, geri }: { id: string; geri: string }) {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const oturum = useOturum();
  const oturumAc = useOturumAc();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kisiler } = useKisiler(oturum);
  const { gruplar } = useGruplar(oturum);
  const veri = useSorgu(['liste'], (o) => yerelListeOku(o, id), [id]);
  const [yeni, setYeni] = useState('');
  const [acikMadde, setAcikMadde] = useState<string | null>(null);
  const [adDegis, setAdDegis] = useState<string | null>(null);
  const [silSorusu, setSilSorusu] = useState(false);
  const [paylas, setPaylas] = useState(0);

  const hata = (e: unknown) => {
    console.warn(e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const liste = veri.veri?.liste;
  const maddeler = veri.veri?.maddeler ?? [];
  const madde = maddeler.find((m) => m.id === acikMadde) ?? null;

  const ekle = () => {
    const metin = yeni.trim();
    if (!metin) return;
    setYeni('');
    void yerelMaddeEkle(kapi, id, metin).catch(hata);
  };

  /** Paylaşınca: ortak liste kurulur, maddeler oraya yazılır, bu liste telefondan silinir. */
  const tasi = async (ortakId: string) => {
    if (!ben) return;
    try {
      for (const m of maddeler) {
        const yeniMadde = await maddeEkle(ortakId, ben, m.metin);
        if (m.yapildi || m.tarih) await maddeDegistir(yeniMadde.id, { yapildi: m.yapildi, tarih: m.tarih });
      }
      await yerelListeSil(kapi, id);
      router.replace({ pathname: '/giris/liste/[id]', params: { id: ortakId } });
    } catch (e) {
      console.warn(e);
      kisaMesaj('Maddelerin bir kısmı taşınamadı. Liste telefonda da duruyor.');
    }
  };

  if (veri.yukleniyor) return <EkranKabi geri={geri} />;
  if (!liste)
    return (
      <EkranKabi geri={geri} baslik="Liste">
        <Yazi tur="ikincil">Bu liste artık yok.</Yazi>
      </EkranKabi>
    );

  return (
    <EkranKabi geri={geri} baslik={liste.ad}>
      {!!liste.aciklama && <Yazi tur="ikincil">{liste.aciklama}</Yazi>}
      <Yazi tur="ikincil">Yalnız sende. Bir maddeye tarih verirsen o gün ajandanda görünür.</Yazi>

      <GirisAlani
        etiket="Listeye ekle"
        etiketGizli
        value={yeni}
        onChangeText={setYeni}
        placeholder="Ekle ve Enter'a bas"
        returnKeyType="done"
        submitBehavior="submit"
        onSubmitEditing={ekle}
      />

      {maddeler.length === 0 && <Yazi tur="ikincil">{BOS_LISTE}</Yazi>}
      {maddeler.length > 0 && (
        <ListeKutusu>
          {maddeler.map((x, i) => (
            <View key={x.id} style={[stiller.madde, i > 0 && parcaStilleri.cizgili]}>
              <Pressable
                onPress={() => void yerelMaddeDegistir(kapi, x.id, { yapildi: !x.yapildi }).catch(hata)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: x.yapildi }}
                accessibilityLabel={x.metin}
                hitSlop={6}
                style={stiller.isaretAlani}
              >
                <IsaretKutusu secili={x.yapildi} />
              </Pressable>
              <Pressable
                onPress={() => setAcikMadde(x.id)}
                accessibilityRole="button"
                accessibilityLabel={`${x.metin}${x.tarih ? `, ${kisaGoreliTarih(x.tarih, bugunGun)}` : ''}. Ne zaman`}
                style={({ pressed }) => [stiller.maddeGovde, pressed && { opacity: 0.7 }]}
              >
                <View style={parcaStilleri.esnek}>
                  <Yazi
                    tur="kartBasligi"
                    renk={x.yapildi ? renk.ikincil : renk.yazi}
                    style={x.yapildi && stiller.cizili}
                  >
                    {x.metin}
                  </Yazi>
                  {!!x.tarih && (
                    <View style={stiller.etiket}>
                      <Yazi tur="etiket" kalinlik="kalin" renk={kaynakRenk.liste.yazi}>
                        {kisaGoreliTarih(x.tarih, bugunGun)}
                      </Yazi>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={renk.soluk} />
              </Pressable>
            </View>
          ))}
        </ListeKutusu>
      )}

      <View style={stiller.altDugmeler}>
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="Başkalarıyla paylaş"
          onPress={() => (ben ? setPaylas((n) => n + 1) : oturumAc())}
        />
        <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Adını değiştir" onPress={() => setAdDegis(liste.ad)} />
        <Dugme tur="tehlike" etiket="Listeyi sil" onPress={() => setSilSorusu(true)} />
      </View>

      {madde && (
        <YerelMaddeSayfasi
          madde={madde}
          onKapat={() => setAcikMadde(null)}
          onTarih={(tarih) => void yerelMaddeDegistir(kapi, madde.id, { tarih }).catch(hata)}
          onSil={() => {
            setAcikMadde(null);
            void yerelMaddeSil(kapi, madde.id)
              .then(() => kisaMesaj(`Silindi: ${madde.metin}`))
              .catch(hata);
          }}
        />
      )}

      <AltSayfa
        gorunur={adDegis !== null}
        onKapat={() => setAdDegis(null)}
        baslik="Listenin adı"
        solVazgec
        sagEylem={{
          etiket: 'Kaydet',
          pasif: !adDegis?.trim(),
          onPress: () => {
            const ad = adDegis?.trim();
            if (!ad) return;
            setAdDegis(null);
            void yerelListeYaz(kapi, id, { ad }).catch(hata);
          },
        }}
      >
        <GirisAlani
          etiket="Listenin adı"
          value={adDegis ?? ''}
          onChangeText={setAdDegis}
          returnKeyType="done"
          autoFocus
        />
      </AltSayfa>

      {paylas > 0 && (
        <ListeFormu
          key={paylas}
          onKapat={() => setPaylas(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          baslangicAdi={liste.ad}
          onKaydedildi={(ortakId) => void tasi(ortakId)}
        />
      )}

      {silSorusu && (
        <Katman>
          <OnayKutusu
            baslik={`${liste.ad} listesi silinsin mi?`}
            aciklama="Listedeki maddeler de silinir."
            secenekler={[
              {
                etiket: 'Listeyi sil',
                tur: 'tehlike',
                onPress: () => {
                  setSilSorusu(false);
                  void yerelListeSil(kapi, id)
                    .then(() => {
                      kisaMesaj(`Silindi: ${liste.ad}`);
                      router.back();
                    })
                    .catch(hata);
                },
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
            ]}
          />
        </Katman>
      )}
    </EkranKabi>
  );
}

function YerelMaddeSayfasi({
  madde,
  onTarih,
  onSil,
  onKapat,
}: {
  madde: YerelMadde;
  onTarih: (tarih: string | null) => void;
  onSil: () => void;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={madde.metin} sagKapat="Tamam">
      <Bolum>
        <Yazi kalinlik="kalin">Ne zaman?</Yazi>
        <View style={stiller.cipler}>
          {zamanSecenekleri(bugunGun).map((z) => (
            <SecenekHapi
              key={z.etiket}
              etiket={z.etiket}
              secili={madde.tarih === z.tarih}
              onPress={() => onTarih(z.tarih)}
            />
          ))}
        </View>
        <Yazi tur="ikincil">Ya da bir tarih seç</Yazi>
        <AyTakvimi secili={madde.tarih} bugunGun={bugunGun} onSec={(tarih) => onTarih(tarih)} />
        <Yazi tur="ikincil">Tarihi olan madde o gün ajandanda görünür.</Yazi>
      </Bolum>
      <Dugme tur="tehlike" etiket="Maddeyi sil" onPress={onSil} />
    </AltSayfa>
  );
}

/** Yeni kişisel liste: ad ve örnek adlar. */
export function YeniYerelListe({
  gorunur,
  onKapat,
  onKaydet,
}: {
  gorunur: boolean;
  onKapat: () => void;
  onKaydet: (ad: string) => void;
}) {
  const [ad, setAd] = useState('');
  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={() => {
        setAd('');
        onKapat();
      }}
      baslik="Yeni liste"
      solVazgec
      sagEylem={{
        etiket: 'Oluştur',
        pasif: !ad.trim(),
        onPress: () => {
          if (!ad.trim()) return;
          onKaydet(ad.trim());
          setAd('');
        },
      }}
    >
      <GirisAlani etiket="Listenin adı" value={ad} onChangeText={setAd} returnKeyType="done" autoFocus />
      <View style={stiller.cipler}>
        {LISTE_ORNEKLERI.map((o) => (
          <SecenekHapi key={o} etiket={o} secili={ad === o} onPress={() => setAd(o)} />
        ))}
      </View>
      <Yazi tur="ikincil">Liste yalnız bu telefonda durur; istersen sonra başkalarıyla paylaşırsın.</Yazi>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  madde: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  isaretAlani: { width: 48, minHeight: 56, justifyContent: 'center' },
  maddeGovde: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  cizili: { textDecorationLine: 'line-through' },
  etiket: {
    alignSelf: 'flex-start',
    borderRadius: olcu.kose.etiket,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginTop: 2,
    backgroundColor: kaynakRenk.liste.zemin,
  },
  altDugmeler: { marginTop: 8, gap: 10 },
});
