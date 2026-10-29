// "Kart ver" sayfası (pilot 29 Ekim, P-62): kart (başlık, zaman özeti), Kime? (izin veren
// kişiler seçilir; izin istenmişse "izin bekleniyor"; izin yoksa "İzin iste"), Ne zaman
// başlasın? (Bugün · Yarın · takvim). "Ver" kartı seçilenlerin ajandasına koyar.
// Kartın ⋯ menüsünden, kütüphaneden ve grup ekranındaki + Ekle'den açılır.

import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { adBulucu, bagliKisiler } from '@/mantik/gruplar';
import { tekrarMetni } from '@/mantik/gorunurluk';
import { izinDurumu, kartVermeHatasi } from '@/mantik/kartVerme';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import type { KartPaketi } from '@/mantik/paylasim';
import { gunEkle, uzunTarih, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { kisileriOku } from '@/veri/kisiler';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { useKartVerme } from './KartVerme';

export interface KartVerHedefi {
  paket: KartPaketi;
  /** Grup ekranından: yalnız grubun üyeleri (ben hariç). Yoksa bağlı kişilerim. */
  kisiler?: readonly { id: string; ad: string }[];
}

export function useKartVer() {
  const [hedef, setHedef] = useState<(KartVerHedefi & { no: number }) | null>(null);
  const ac = useCallback((h: KartVerHedefi) => setHedef((e) => ({ ...h, no: (e?.no ?? 0) + 1 })), []);
  const oge = hedef ? <KartVerSayfasi key={hedef.no} hedef={hedef} onKapat={() => setHedef(null)} /> : null;
  return { ac, oge };
}

function KartVerSayfasi({ hedef, onKapat }: { hedef: KartVerHedefi; onKapat: () => void }) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { ben, izinler, izinIste, kartVer } = useKartVerme();
  const yerel = useSorgu(['kisi'], (o) => kisileriOku(o), []).veri ?? [];
  const ad = adBulucu(ben ?? '', yerel);
  const adaylar = hedef.kisiler ?? bagliKisiler(yerel).map((k) => ({ id: k.kullaniciId, ad: k.ad }));
  const [secili, setSecili] = useState<ReadonlySet<string>>(new Set());
  const [baslangic, setBaslangic] = useState<Gun>(bugunGun);
  const [takvim, setTakvim] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const p = hedef.paket;
  const yarin = gunEkle(bugunGun, 1);
  const zaman = [p.saat, p.tekrar ? tekrarMetni(p.tekrar) : 'Bir kez'].filter(Boolean).join(' · ');

  const iste = async (id: string, kisiAdi: string) => {
    try {
      await izinIste(id);
      kisaMesaj(`İzin istendi: ${kisiAdi}`);
    } catch (e) {
      setHata(kartVermeHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    }
  };

  const ver = async () => {
    if (secili.size === 0) {
      setHata('Kartı kime vereceğini seç.');
      return;
    }
    setCalisiyor(true);
    try {
      await kartVer([...secili], p, baslangic);
      const adlar = [...secili].map((id) => adaylar.find((a) => a.id === id)?.ad ?? ad(id));
      kisaMesaj(`Ajandasına eklendi: ${adlar.join(', ')}`);
      onKapat();
    } catch (e) {
      setHata(kartVermeHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const izinliler = ben ? adaylar.filter((a) => izinDurumu(izinler, ben, a.id).onunAjandasina === 'izinli') : [];
  const digerleri = ben ? adaylar.filter((a) => izinDurumu(izinler, ben, a.id).onunAjandasina !== 'izinli') : [];

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik="Kart ver"
      solVazgec
      degisti={secili.size > 0}
      altAlan={<Dugme etiket="Ver" onPress={() => void ver()} pasif={calisiyor || secili.size === 0} />}
    >
      <View style={stiller.kart}>
        <Yazi tur="kartBasligi">{p.baslik}</Yazi>
        {!!zaman && <Yazi tur="ikincil">{zaman}</Yazi>}
      </View>
      <Yazi tur="ikincil">
        Kart seçtiğin kişinin ajandasına düşer. İçeriği senin; saatini o değiştirebilir. Yaptım dediği günleri
        görürsün.
      </Yazi>

      <Bolum>
        <Yazi kalinlik="kalin">Kime?</Yazi>
        {adaylar.length === 0 && (
          <Yazi tur="ikincil">{"Kişilerim'de bağlı olduğun kimse yok. Önce Gruplar → Kişilerim'den birini ekle."}</Yazi>
        )}
        {izinliler.length > 0 && (
          <View style={stiller.cipler}>
            {izinliler.map((a) => (
              <SecenekHapi
                key={a.id}
                etiket={a.ad}
                secili={secili.has(a.id)}
                onPress={() => {
                  setHata(null);
                  setSecili((s) => {
                    const y = new Set(s);
                    if (y.has(a.id)) y.delete(a.id);
                    else y.add(a.id);
                    return y;
                  });
                }}
              />
            ))}
          </View>
        )}
        {digerleri.map((a) => {
          const bekliyor = !!ben && izinDurumu(izinler, ben, a.id).onunAjandasina === 'istek';
          return (
            <View key={a.id} style={stiller.izinSatiri}>
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin">{a.ad}</Yazi>
                <Yazi tur="ikincil">
                  {bekliyor ? 'İzin istendi; yanıt bekleniyor.' : 'Ajandasına kart eklemene henüz izin vermedi.'}
                </Yazi>
              </View>
              {!bekliyor && (
                <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="İzin iste" onPress={() => void iste(a.id, a.ad)} />
              )}
            </View>
          );
        })}
      </Bolum>

      <Bolum>
        <Yazi kalinlik="kalin">{`Ne zaman başlasın? ${uzunTarih(baslangic)}`}</Yazi>
        <View style={stiller.cipler}>
          <SecenekHapi
            etiket="Bugün"
            secili={baslangic === bugunGun && !takvim}
            onPress={() => (setBaslangic(bugunGun), setTakvim(false))}
          />
          <SecenekHapi
            etiket="Yarın"
            secili={baslangic === yarin && !takvim}
            onPress={() => (setBaslangic(yarin), setTakvim(false))}
          />
          <SecenekHapi
            etiket="Başka gün"
            secili={takvim || (baslangic !== bugunGun && baslangic !== yarin)}
            onPress={() => setTakvim(true)}
          />
        </View>
        {takvim && (
          <AyTakvimi secili={baslangic} bugunGun={bugunGun} onSec={(g) => g >= bugunGun && setBaslangic(g)} />
        )}
      </Bolum>
      {!!hata && (
        <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
          {hata}
        </Yazi>
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 4,
  },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  izinSatiri: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  esnek: { flex: 1 },
});
