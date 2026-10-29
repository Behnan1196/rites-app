// Listeler'deki kişisel liste (pilot 27 Ekim, P-58): telefonda durur. Çeşide göre (P-61):
// Yapılacaklar (tarih → ajanda; yapılan alta), Alışveriş (miktar, öneri, alınan alta,
// "Alınanları temizle"), Hazırlık (ilerleme, "Baştan başla"), Not listesi (işaretsiz).
// Maddeye dokununca: Ne kadar? (alışveriş), Ne zaman? (tarihli madde o gün ajandada),
// Maddeyi sil. Altta: Başkalarıyla paylaş, Listeyi düzenle (ad, çeşit), Listeyi sil.

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AD_ORNEKLERI,
  cesitTanimi,
  maddeSirasi,
  tarihliMi,
  VARSAYILAN_CESIT,
  type ListeCesidi,
} from '@/mantik/listeCesidi';
import { BOS_LISTE, zamanSecenekleri } from '@/mantik/listeler';
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
  yerelIsaretleriSil,
  yerelListeYaz,
  yerelMaddeDegistir,
  yerelMaddeEkle,
  yerelMaddeSil,
  yerelYapilanlariSil,
} from '@/veri/yerelListeler';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { EkranKabi } from '../EkranKabi';
import { GirisAlani } from '../GirisAlani';
import { ListeKutusu } from '../gruplar/parcalar';
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
import {
  CesitEylemi,
  CesitSecimi,
  HazirlikIlerlemesi,
  MaddeEkleAlani,
  MaddeSatiri,
  MiktarBolumu,
} from './ListeParcalari';

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
  const [acikMadde, setAcikMadde] = useState<string | null>(null);
  const [duzenle, setDuzenle] = useState<{ ad: string; cesit: ListeCesidi } | null>(null);
  const [silSorusu, setSilSorusu] = useState(false);
  const [paylas, setPaylas] = useState(0);

  const hata = (e: unknown) => {
    console.warn(e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const liste = veri.veri?.liste;
  const cesit = liste?.cesit ?? VARSAYILAN_CESIT;
  const maddeler = maddeSirasi(cesit, veri.veri?.maddeler ?? []);
  const madde = maddeler.find((m) => m.id === acikMadde) ?? null;
  const yapilanSayisi = maddeler.filter((m) => m.yapildi).length;

  /** Paylaşınca: ortak liste kurulur, maddeler oraya yazılır, bu liste telefondan silinir. */
  const tasi = async (ortakId: string) => {
    if (!ben) return;
    try {
      for (const m of maddeler) {
        const yeniMadde = await maddeEkle(ortakId, ben, m.metin, m.miktar);
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
      <Yazi tur="ikincil">
        {cesit === 'yapilacak'
          ? 'Yalnız sende. Bir maddeye gün verirsen o gün ajandanda görünür.'
          : `${cesitTanimi(cesit).ad} · yalnız sende`}
      </Yazi>
      {cesit === 'hazirlik' && <HazirlikIlerlemesi toplam={maddeler.length} hazir={yapilanSayisi} />}

      <MaddeEkleAlani
        cesit={cesit}
        listedekiler={maddeler.filter((m) => !m.yapildi).map((m) => m.metin)}
        onEkle={(metin, miktar) => void yerelMaddeEkle(kapi, id, metin, miktar).catch(hata)}
      />

      {maddeler.length === 0 && <Yazi tur="ikincil">{BOS_LISTE}</Yazi>}
      {maddeler.length > 0 && (
        <ListeKutusu>
          {maddeler.map((x, i) => (
            <MaddeSatiri
              key={x.id}
              cesit={cesit}
              metin={x.metin}
              miktar={x.miktar}
              yapildi={x.yapildi}
              cizgili={i > 0}
              erisimEki={x.tarih ? kisaGoreliTarih(x.tarih, bugunGun) : undefined}
              etiketler={
                x.tarih ? (
                  <View style={stiller.etiket}>
                    <Yazi tur="etiket" kalinlik="kalin" renk={kaynakRenk.liste.yazi}>
                      {kisaGoreliTarih(x.tarih, bugunGun)}
                    </Yazi>
                  </View>
                ) : undefined
              }
              onIsaretle={() => void yerelMaddeDegistir(kapi, x.id, { yapildi: !x.yapildi }).catch(hata)}
              onAc={() => setAcikMadde(x.id)}
            />
          ))}
        </ListeKutusu>
      )}
      <CesitEylemi
        cesit={cesit}
        yapilanSayisi={yapilanSayisi}
        onTemizle={() =>
          void yerelYapilanlariSil(kapi, id)
            .then(() => kisaMesaj('Alınanlar temizlendi'))
            .catch(hata)
        }
        onBastan={() => void yerelIsaretleriSil(kapi, id).catch(hata)}
      />

      <View style={stiller.altDugmeler}>
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="Başkalarıyla paylaş"
          onPress={() => (ben ? setPaylas((n) => n + 1) : oturumAc())}
        />
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="Listeyi düzenle"
          onPress={() => setDuzenle({ ad: liste.ad, cesit })}
        />
        <Dugme tur="tehlike" etiket="Listeyi sil" onPress={() => setSilSorusu(true)} />
      </View>

      {madde && (
        <YerelMaddeSayfasi
          madde={madde}
          cesit={cesit}
          onKapat={() => setAcikMadde(null)}
          onTarih={(tarih) => void yerelMaddeDegistir(kapi, madde.id, { tarih }).catch(hata)}
          onMiktar={(miktar) => void yerelMaddeDegistir(kapi, madde.id, { miktar }).catch(hata)}
          onSil={() => {
            setAcikMadde(null);
            void yerelMaddeSil(kapi, madde.id)
              .then(() => kisaMesaj(`Silindi: ${madde.metin}`))
              .catch(hata);
          }}
        />
      )}

      <AltSayfa
        gorunur={duzenle !== null}
        onKapat={() => setDuzenle(null)}
        baslik="Listeyi düzenle"
        solVazgec
        degisti={!!duzenle && (duzenle.ad.trim() !== liste.ad || duzenle.cesit !== cesit)}
        sagEylem={{
          etiket: 'Kaydet',
          pasif: !duzenle?.ad.trim(),
          onPress: () => {
            const d = duzenle;
            if (!d?.ad.trim()) return;
            setDuzenle(null);
            void yerelListeYaz(kapi, id, { ad: d.ad, cesit: d.cesit }).catch(hata);
          },
        }}
      >
        {duzenle && (
          <>
            <GirisAlani
              etiket="Listenin adı"
              value={duzenle.ad}
              onChangeText={(ad) => setDuzenle({ ...duzenle, ad })}
              returnKeyType="done"
            />
            <CesitSecimi secili={duzenle.cesit} onSec={(c) => setDuzenle({ ...duzenle, cesit: c })} />
          </>
        )}
      </AltSayfa>

      {paylas > 0 && (
        <ListeFormu
          key={paylas}
          onKapat={() => setPaylas(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          baslangicAdi={liste.ad}
          cesit={cesit}
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
  cesit,
  onTarih,
  onMiktar,
  onSil,
  onKapat,
}: {
  madde: YerelMadde;
  cesit: ListeCesidi;
  onTarih: (tarih: string | null) => void;
  onMiktar: (miktar: string) => void;
  onSil: () => void;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={madde.metin} sagKapat="Tamam">
      {cesit === 'alisveris' && <MiktarBolumu miktar={madde.miktar} onDegis={onMiktar} />}
      {tarihliMi(cesit) && (
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
      )}
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
  onKaydet: (ad: string, cesit: ListeCesidi) => void;
}) {
  const [ad, setAd] = useState('');
  const [cesit, setCesit] = useState<ListeCesidi>(VARSAYILAN_CESIT);
  const sifirla = () => {
    setAd('');
    setCesit(VARSAYILAN_CESIT);
  };
  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={() => {
        sifirla();
        onKapat();
      }}
      baslik="Yeni liste"
      solVazgec
      sagEylem={{
        etiket: 'Oluştur',
        pasif: !ad.trim(),
        onPress: () => {
          if (!ad.trim()) return;
          onKaydet(ad.trim(), cesit);
          sifirla();
        },
      }}
    >
      <GirisAlani etiket="Listenin adı" value={ad} onChangeText={setAd} returnKeyType="done" autoFocus />
      <View style={stiller.cipler}>
        {AD_ORNEKLERI.map((o) => (
          <SecenekHapi
            key={o.ad}
            etiket={o.ad}
            secili={ad === o.ad}
            onPress={() => {
              setAd(o.ad);
              setCesit(o.cesit);
            }}
          />
        ))}
      </View>
      <CesitSecimi secili={cesit} onSec={setCesit} />
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
