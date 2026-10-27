// Listelerim (P-58; önceden Ortak Listeler, GR-2): önce kişisel listeler (telefonda; yalnız
// sende), sonra ortak listeler (kişilerinle / gruplarınla; e-postayla giriş gerekir).
// "+ Yeni liste" kişisel liste kurar; listenin ekranından "Başkalarıyla paylaş" denince
// ortak listeye taşınır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { ListeFormu } from '@/bilesen/listeler/ListeFormu';
import { OrtakListeSatiri } from '@/bilesen/listeler/OrtakListeSatiri';
import { useListeler } from '@/bilesen/listeler/useListeler';
import { YeniYerelListe } from '@/bilesen/listeler/YerelListeEkrani';
import { useOturumAc } from '@/bilesen/oturum/OturumSayfasi';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { kalanSayiMetni } from '@/mantik/yerelListe';
import { useOturum } from '@/sunucu/oturum';
import { useSorgu } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';
import { yerelListeEkle, yerelListeleriOku } from '@/veri/yerelListeler';

export default function Listelerim() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const oturum = useOturum();
  const oturumAc = useOturumAc();
  const { ben, listeler, ad, yukleniyor, baglanamiyor, yenile } = useListeler(oturum);
  const { kisiler } = useKisiler(oturum);
  const { gruplar } = useGruplar(oturum);
  const yereller = useSorgu(['liste'], (o) => yerelListeleriOku(o), []).veri ?? [];
  const [yeniYerel, setYeniYerel] = useState(false);
  const [yeniOrtak, setYeniOrtak] = useState(0);
  const ac = (id: string) => router.push({ pathname: '/giris/liste/[id]', params: { id } });

  return (
    <EkranKabi geri="Giriş" baslik="Listelerim" altBaslik="Yapılacaklar, alışveriş, hazırlıklar.">
      {yereller.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => ac(l.id)}
          accessibilityRole="button"
          accessibilityLabel={`${l.ad}, ${kalanSayiMetni(l.maddeSayisi, l.kalan)}`}
          style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
        >
          <View style={stiller.simge}>
            <Ionicons name="checkbox-outline" size={22} color={kaynakRenk.liste.serit} />
          </View>
          <View style={stiller.esnek}>
            <Yazi tur="kartBasligi">{l.ad}</Yazi>
            <Yazi tur="ikincil">{kalanSayiMetni(l.maddeSayisi, l.kalan)}</Yazi>
          </View>
          <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
        </Pressable>
      ))}
      {yereller.length === 0 && <Yazi tur="ikincil">Henüz listen yok.</Yazi>}
      <Dugme tur="vurgu" etiket="+ Yeni liste" onPress={() => setYeniYerel(true)} />

      <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolum}>
        Ortak listeler
      </Yazi>
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <>
            <Yazi tur="ikincil">
              Kişilerinle ya da gruplarınla birlikte tutulan listeler. Bunun için e-postanla devam et; kendi listelerin
              yine yalnız bu telefonda kalır.
            </Yazi>
            <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="E-postanla devam et" onPress={oturumAc} />
          </>
        )
      ) : (
        <>
          {baglanamiyor && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}
          {!yukleniyor && !baglanamiyor && listeler.length === 0 && (
            <Yazi tur="ikincil">{'Henüz ortak listen yok. Bir listeni açıp "Başkalarıyla paylaş" diyebilirsin.'}</Yazi>
          )}
          {listeler.map((l) => (
            <OrtakListeSatiri key={l.id} liste={l} ben={ben} ad={ad} onPress={() => ac(l.id)} />
          ))}
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Ortak liste" onPress={() => setYeniOrtak((n) => n + 1)} />
        </>
      )}

      <YeniYerelListe
        gorunur={yeniYerel}
        onKapat={() => setYeniYerel(false)}
        onKaydet={(adi) => {
          setYeniYerel(false);
          void yerelListeEkle(kapi, adi)
            .then(ac)
            .catch((e: unknown) => {
              console.warn(e);
              kisaMesaj('Kaydedilemedi. Yeniden dene.');
            });
        }}
      />

      {yeniOrtak > 0 && (
        <ListeFormu
          key={yeniOrtak}
          onKapat={() => setYeniOrtak(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          onKaydedildi={(id) => {
            void yenile();
            ac(id);
          }}
        />
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  simge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: kaynakRenk.liste.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1, gap: 2 },
  bolum: { marginTop: 12 },
});
