// Liste ekranı (GR-2, GR-4): ad, paylaşım çipleri, "Sen ve …", gruba açıksa not,
// "Ekle ve Enter'a bas", maddeler (işaret kutusu, metin, "X ekledi", Kime/Ne zaman
// etiketi). Maddeye dokununca madde sayfası. Kuran: Listeyi düzenle / Listeyi sil;
// listeye kişi olarak eklenen: Listeden ayrıl.
// Giriş (Ortak Listeler), Ajandam (sanal kart) ve Gruplar'dan (grup ekranı) açılır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';

import {
  atamaEtiketi,
  BOS_LISTE,
  ekleyenMetni,
  erisimYolu,
  GRUP_NOTU,
  paylasimKisileri,
  uyelerMetni,
  type Madde,
} from '@/mantik/listeler';
import { grupAdi } from '@/mantik/gruplar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { listedenAyril, listeyiSil } from '@/sunucu/listeler';
import { useOturum } from '@/sunucu/oturum';
import { useBugun } from '@/veri/useBugun';

import { Dugme } from '../Dugme';
import { EkranKabi } from '../EkranKabi';
import { GirisAlani } from '../GirisAlani';
import { IsaretKutusu, ListeKutusu, parcaStilleri } from '../gruplar/parcalar';
import { useGruplar } from '../gruplar/useGruplar';
import { useKisiler } from '../gruplar/useKisiler';
import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu } from '../OnayKutusu';
import { OturumGerekli } from '../oturum/OturumGerekli';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { ListeFormu } from './ListeFormu';
import { MaddeSayfasi } from './MaddeSayfasi';
import { useListeler } from './useListeler';
import { useMaddeler } from './useMaddeler';

export function ListeEkrani({ geri }: { geri: string }) {
  const { id, geri: geriParam } = useLocalSearchParams<{ id: string; geri?: string }>();
  const oturum = useOturum();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { ben, listeler, ad, yukleniyor, baglanamiyor, yenile } = useListeler(oturum);
  // Kişilerim sunucuyla eşleşsin (Yeni liste / düzenle formundaki kişiler için).
  const { kisiler } = useKisiler(oturum);
  const { gruplar } = useGruplar(oturum);
  const m = useMaddeler(id, ben);
  const [yeni, setYeni] = useState('');
  const [acikMadde, setAcikMadde] = useState<string | null>(null);
  const [duzenle, setDuzenle] = useState(0);
  const [soru, setSoru] = useState<'sil' | 'ayril' | null>(null);
  const girdi = useRef<TextInput>(null);

  const liste = listeler.find((l) => l.id === id);
  const madde = m.maddeler?.find((x) => x.id === acikMadde) ?? null;

  const ekle = () => {
    const metin = yeni.trim();
    if (!metin) return;
    setYeni('');
    void m.ekle(metin).then((ok) => {
      if (!ok) {
        kisaMesaj(BAGLANAMIYOR);
        setYeni((y) => y || metin);
      }
      void yenile();
    });
  };

  const sonuc = (ok: boolean) => {
    if (!ok) kisaMesaj(BAGLANAMIYOR);
    void yenile();
  };

  const isaretle = (x: Madde) => void m.degistir(x.id, { yapildi: !x.yapildi }).then(sonuc);

  const listeIsi = async (is: () => Promise<void>, mesaj: string) => {
    setSoru(null);
    try {
      await is();
      kisaMesaj(mesaj);
      router.back();
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };

  const yol = liste && ben ? erisimYolu(liste, ben) : null;

  return (
    <EkranKabi geri={geriParam || geri} baslik={liste?.ad ?? 'Liste'}>
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli oturum={oturum} aciklama="Ortak listelerini görmek için e-postanla devam et." />
        )
      ) : !liste ? (
        yukleniyor ? null : (
          <Yazi tur="ikincil" renk={baglanamiyor ? renk.hata : renk.ikincil}>
            {baglanamiyor ? BAGLANAMIYOR : 'Bu liste artık yok ya da sana kapandı.'}
          </Yazi>
        )
      ) : (
        <>
          {(liste.gruplar.length > 0 || paylasimKisileri(liste, ben, ad).length > 0) && (
            <View style={stiller.cipler}>
              {liste.gruplar.map((g) => (
                <View key={g.id} style={[stiller.cip, { backgroundColor: renk.vurguAcik }]}>
                  <Yazi tur="etiket" kalinlik="kalin" renk={renk.vurguYazi}>
                    {g.ad}
                  </Yazi>
                </View>
              ))}
              {paylasimKisileri(liste, ben, ad).map((k) => (
                <View key={k.id} style={[stiller.cip, { backgroundColor: renk.anaAcik }]}>
                  <Yazi tur="etiket" kalinlik="kalin" renk={renk.anaKoyu}>
                    {k.ad}
                  </Yazi>
                </View>
              ))}
            </View>
          )}
          <Yazi tur="ikincil">{uyelerMetni(liste, ben, ad)}</Yazi>
          {liste.gruplar.length > 0 && <Yazi tur="ikincil">{GRUP_NOTU}</Yazi>}
          {(baglanamiyor || m.hata) && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}

          <GirisAlani
            ref={girdi}
            etiket="Listeye ekle"
            etiketGizli
            value={yeni}
            onChangeText={setYeni}
            placeholder="Ekle ve Enter'a bas"
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={ekle}
          />

          {m.maddeler && m.maddeler.length === 0 && <Yazi tur="ikincil">{BOS_LISTE}</Yazi>}
          {m.maddeler && m.maddeler.length > 0 && (
            <ListeKutusu>
              {m.maddeler.map((x, i) => {
                const etiket = atamaEtiketi(x, ben, ad, bugunGun);
                const kim = ekleyenMetni(x, ben, ad);
                return (
                  <View key={x.id} style={[stiller.madde, i > 0 && parcaStilleri.cizgili]}>
                    <Pressable
                      onPress={() => isaretle(x)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: x.yapildi }}
                      accessibilityLabel={`${x.metin}: alındı`}
                      hitSlop={6}
                      style={stiller.isaretAlani}
                    >
                      <IsaretKutusu secili={x.yapildi} />
                    </Pressable>
                    <Pressable
                      onPress={() => setAcikMadde(x.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${x.metin}${etiket ? `, ${etiket.metin}` : ''}. Kime ve ne zaman`}
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
                        {(!!kim || etiket) && (
                          <View style={stiller.meta}>
                            {!!kim && <Yazi tur="ikincil">{kim}</Yazi>}
                            {etiket && (
                              <View
                                style={[
                                  stiller.etiket,
                                  { backgroundColor: etiket.bana ? kaynakRenk.liste.zemin : renk.zemin },
                                ]}
                              >
                                <Yazi tur="etiket" kalinlik="kalin" renk={etiket.bana ? kaynakRenk.liste.yazi : renk.ikincil}>
                                  {etiket.metin}
                                </Yazi>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={renk.soluk} />
                    </Pressable>
                  </View>
                );
              })}
            </ListeKutusu>
          )}

          {yol?.tur === 'sahip' && (
            <View style={stiller.altDugmeler}>
              <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Listeyi düzenle" onPress={() => setDuzenle((n) => n + 1)} />
              <Dugme tur="tehlike" etiket="Listeyi sil" onPress={() => setSoru('sil')} />
            </View>
          )}
          {yol?.tur === 'kisi' && (
            <Dugme tur="tehlike" etiket="Listeden ayrıl" onPress={() => setSoru('ayril')} style={stiller.altDugmeler} />
          )}
          {yol?.tur === 'grup' && (
            <Yazi tur="ikincil" style={stiller.altDugmeler}>
              {`Bu listeyi ${yol.gruplar.map(grupAdi).join(', ')} üzerinden görüyorsun.`}
            </Yazi>
          )}
        </>
      )}

      {madde && liste && ben && (
        <MaddeSayfasi
          madde={madde}
          liste={liste}
          ben={ben}
          ad={ad}
          bugunGun={bugunGun}
          onKapat={() => setAcikMadde(null)}
          onDegis={(d) => void m.degistir(madde.id, d).then(sonuc)}
          onSil={() => {
            setAcikMadde(null);
            void m.sil(madde.id).then((ok) => {
              sonuc(ok);
              if (ok) kisaMesaj(`Silindi: ${madde.metin}`);
            });
          }}
        />
      )}

      {duzenle > 0 && liste && (
        <ListeFormu
          key={duzenle}
          onKapat={() => setDuzenle(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          mevcut={liste}
          onKaydedildi={() => void yenile()}
        />
      )}

      {soru && liste && ben && (
        <Katman>
          <OnayKutusu
            baslik={soru === 'sil' ? `${liste.ad} listesi silinsin mi?` : `${liste.ad} listesinden ayrılmak istiyor musun?`}
            aciklama={
              soru === 'sil'
                ? 'Listedeki maddeler herkes için silinir.'
                : 'Listeyi kuran seni yeniden ekleyene kadar bu listeyi görmezsin.'
            }
            secenekler={[
              soru === 'sil'
                ? {
                    etiket: 'Listeyi sil',
                    tur: 'tehlike',
                    onPress: () => void listeIsi(() => listeyiSil(liste.id), `Silindi: ${liste.ad}`),
                  }
                : {
                    etiket: 'Listeden ayrıl',
                    tur: 'tehlike',
                    onPress: () => void listeIsi(() => listedenAyril(liste.id, ben), `${liste.ad} listesinden ayrıldın.`),
                  },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) },
            ]}
          />
        </Katman>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cip: { borderRadius: olcu.kose.etiket, paddingHorizontal: 12, paddingVertical: 6 },
  madde: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  isaretAlani: { width: 48, minHeight: 56, justifyContent: 'center' },
  maddeGovde: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  cizili: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2 },
  etiket: { borderRadius: olcu.kose.etiket, paddingHorizontal: 8, paddingVertical: 1 },
  altDugmeler: { marginTop: 8, gap: 10 },
});
