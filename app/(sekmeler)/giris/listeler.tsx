// Listeler (P-58, P-60): listeler yalnız burada açılır. Önce kişisel listeler (telefonda;
// yalnız sende) ve "+ Yeni liste"; listenin ekranında "Başkalarıyla paylaş" denince bir
// gruba ya da kişilere açılır ve altta "Paylaşılan listeler"de görünür (benimle
// paylaşılanlar da orada). "Paylaşmayı bırak" listeyi yeniden kişisel yapar.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OrtakListeSatiri } from '@/bilesen/listeler/OrtakListeSatiri';
import { useListeler } from '@/bilesen/listeler/useListeler';
import { YeniYerelListe } from '@/bilesen/listeler/YerelListeEkrani';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { cesitTanimi, listeOzeti } from '@/mantik/listeCesidi';
import { useOturum } from '@/sunucu/oturum';
import { useSorgu } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';
import { yerelListeEkle, yerelListeleriOku } from '@/veri/yerelListeler';

export default function Listeler() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const oturum = useOturum();
  const { ben, listeler, ad, baglanamiyor } = useListeler(oturum);
  const yereller = useSorgu(['liste'], (o) => yerelListeleriOku(o), []).veri ?? [];
  const [yeniYerel, setYeniYerel] = useState(false);
  const ac = (id: string) => router.push({ pathname: '/giris/liste/[id]', params: { id } });

  return (
    <EkranKabi geri="Giriş" baslik="Listeler" altBaslik="Yapılacaklar, market, günlük kontroller, notlar.">
      {yereller.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => ac(l.id)}
          accessibilityRole="button"
          accessibilityLabel={`${l.ad}, ${cesitTanimi(l.cesit).ad}, ${listeOzeti(l.cesit, l.maddeSayisi, l.kalan)}`}
          style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
        >
          <View style={stiller.simge}>
            <Ionicons name={cesitTanimi(l.cesit).ikon} size={22} color={kaynakRenk.liste.serit} />
          </View>
          <View style={stiller.esnek}>
            <Yazi tur="kartBasligi">{l.ad}</Yazi>
            <Yazi tur="ikincil">{`${cesitTanimi(l.cesit).ad} · ${listeOzeti(l.cesit, l.maddeSayisi, l.kalan)}`}</Yazi>
          </View>
          <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
        </Pressable>
      ))}
      {yereller.length === 0 && listeler.length === 0 && <Yazi tur="ikincil">Henüz listen yok.</Yazi>}
      <Dugme tur="vurgu" etiket="+ Yeni liste" onPress={() => setYeniYerel(true)} />

      {/* P-60: paylaşılan listeler (benim paylaştıklarım ve benimle paylaşılanlar) yalnız varsa görünür. */}
      {!!ben && (listeler.length > 0 || baglanamiyor) && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolum}>
            Paylaşılan listeler
          </Yazi>
          {baglanamiyor && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}
          {listeler.map((l) => (
            <OrtakListeSatiri key={l.id} liste={l} ben={ben} ad={ad} onPress={() => ac(l.id)} />
          ))}
        </>
      )}

      <YeniYerelListe
        gorunur={yeniYerel}
        onKapat={() => setYeniYerel(false)}
        onKaydet={(adi, cesit) => {
          setYeniYerel(false);
          void yerelListeEkle(kapi, adi, cesit)
            .then(ac)
            .catch((e: unknown) => {
              console.warn(e);
              kisaMesaj('Kaydedilemedi. Yeniden dene.');
            });
        }}
      />
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
