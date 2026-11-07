// P-110: kişisel liste maddeleri kart olan bir karttır; dokununca kartın ekranı açılır
// (Ajandada göster, paylaş, sil ⋯ menüsünde). Listeler (P-58, P-60): önce kişisel listeler (telefonda;
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
import { cesitTanimi } from '@/mantik/listeCesidi';
import { ajandadaMi } from '@/mantik/aliskanlik';
import { listeCesidindenRutin, listeOzetMetni, rutinCesidi, rutindenListeCesidi } from '@/mantik/rutinAdimlari';
import { useOturum } from '@/sunucu/oturum';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { listeKartiKur, listeKartlariniOku } from '@/veri/listeKartlari';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Listeler() {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const oturum = useOturum();
  const { ben, listeler, ad, baglanamiyor } = useListeler(oturum);
  const yereller = useSorgu(['kart'], (o) => listeKartlariniOku(o, bugunGun), [bugunGun]).veri ?? [];
  const [yeniYerel, setYeniYerel] = useState(false);
  const ac = (id: string) => router.push({ pathname: '/giris/liste/[id]', params: { id } });
  const kartAc = (id: string) => router.push({ pathname: '/kart/[id]', params: { id, geri: 'Listeler' } });

  return (
    <EkranKabi geri="Giriş" baslik="Listeler" altBaslik="Yapılacaklar, market, günlük kontroller, notlar.">
      {yereller.map(({ kart: l, yapilan, toplam }) => {
        const tanim = cesitTanimi(rutindenListeCesidi(rutinCesidi(l)));
        const ozet = listeOzetMetni(rutinCesidi(l), yapilan, toplam);
        const ajandada = ajandadaMi(l);
        return (
          <Pressable
            key={l.id}
            onPress={() => kartAc(l.id)}
            accessibilityRole="button"
            accessibilityLabel={`${l.baslik}, ${tanim.ad}, ${ozet}${ajandada ? ', ajandada' : ''}`}
            style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
          >
            <View style={stiller.simge}>
              <Ionicons name={tanim.ikon} size={22} color={kaynakRenk.liste.serit} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{l.baslik}</Yazi>
              <Yazi tur="ikincil">{`${tanim.ad} · ${ozet}${ajandada ? ' · ajandada' : ''}`}</Yazi>
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>
        );
      })}
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
          void listeKartiKur(kapi, oku, adi, listeCesidindenRutin(cesit), bugunGun, yeniKimlik)
            .then(kartAc)
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
