// Yapılacak ekle (pilot 19 Ekim: İş ile Liste tek yerde) / iş düzenle.
// - Tek iş: ne iş (örneklerle), Kime? (Herkes ya da gruptan biri), Ne zaman?;
// - Liste: ad (örneklerle); gruba açılır, maddeler liste ekranında eklenir.
// Düzenlemede "İşi sil".

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IS_NOTU, IS_ORNEKLERI, isFormuHatasi, isHatasi, type GrupIsi } from '@/mantik/isler';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { LISTE_ORNEKLERI, listeHatasi } from '@/mantik/listeler';
import { listeOlustur } from '@/sunucu/listeler';
import { gunEkle, uzunTarih, type Gun } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { BolumluDugme } from '../BolumluDugme';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';
import { useIsler } from './Isler';

export function IsFormu({
  grup,
  uyeler,
  mevcut,
  onKapat,
  onListeOlustu,
}: {
  grup: { id: string; ad: string };
  /** Benim dışımdaki üyeler. */
  uyeler: { id: string; ad: string }[];
  mevcut?: GrupIsi;
  onKapat: () => void;
  /** Liste kurulunca (grup tazelensin). */
  onListeOlustu?: () => void;
}) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { ekle, duzenle, sil } = useIsler();
  const [baslik, setBaslik] = useState(mevcut?.baslik ?? '');
  const [tur, setTur] = useState<'is' | 'liste'>('is');
  const liste = !mevcut && tur === 'liste';
  const [kime, setKime] = useState<string | null>(mevcut && mevcut.durum !== 'reddedildi' ? mevcut.kime : null);
  const [tarih, setTarih] = useState<Gun | null>(mevcut?.tarih ?? null);
  const [takvim, setTakvim] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [silSorusu, setSilSorusu] = useState(false);
  const yarin = gunEkle(bugunGun, 1);

  const degisti = mevcut
    ? baslik.trim() !== mevcut.baslik || kime !== mevcut.kime || tarih !== mevcut.tarih
    : baslik.trim() !== '';

  const listeyiKur = async () => {
    if (!baslik.trim()) {
      setHata('Listeye bir ad ver.');
      return;
    }
    setCalisiyor(true);
    try {
      const id = await listeOlustur(baslik, [grup.id], []);
      kisaMesaj(`${baslik.trim()} listesi açıldı`);
      onListeOlustu?.();
      onKapat();
      router.push({ pathname: '/gruplar/liste/[id]', params: { id, geri: grup.ad } });
    } catch (e) {
      setHata(listeHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const kaydet = async () => {
    if (liste) {
      await listeyiKur();
      return;
    }
    const h = isFormuHatasi(baslik);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      const t = { baslik, tarih, kime };
      const kimAdi = uyeler.find((u) => u.id === kime)?.ad;
      if (mevcut) await duzenle(mevcut, t);
      else await ekle(grup.id, t);
      kisaMesaj(kimAdi ? `İstendi: ${kimAdi}` : 'Herkese açıldı');
      onKapat();
    } catch (e) {
      setHata(isHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const silOnayli = async () => {
    if (!mevcut) return;
    setCalisiyor(true);
    try {
      await sil(mevcut);
      kisaMesaj(`Silindi: ${mevcut.baslik}`);
      onKapat();
    } catch (e) {
      console.warn(e);
      setHata(BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={mevcut ? (mevcut.durum === 'reddedildi' ? 'Başkasına ver' : 'İşi düzenle') : `${grup.ad} · Yapılacak`}
      solVazgec
      degisti={degisti}
      onay={
        silSorusu && mevcut
          ? {
              baslik: `${mevcut.baslik} silinsin mi?`,
              aciklama: 'Grubun herkesi için silinir; alanın ajandasındaki kartı da kalkar.',
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void silOnayli() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
              ],
            }
          : null
      }
      altAlan={
        <Dugme
          etiket={liste ? 'Listeyi aç' : kime ? 'İste' : 'Herkese aç'}
          onPress={() => void kaydet()}
          pasif={calisiyor}
        />
      }
    >
      <View style={stiller.kap}>
        {!mevcut && (
          <BolumluDugme
            secenekler={[
              { deger: 'is', etiket: 'Tek iş' },
              { deger: 'liste', etiket: 'Liste' },
            ]}
            secili={tur}
            erisimEtiketi="Yapılacak türü"
            onSec={(t) => {
              setTur(t);
              setHata(null);
            }}
          />
        )}
        <GirisAlani
          etiket={liste ? 'Listenin adı' : 'Ne iş?'}
          value={baslik}
          onChangeText={(t) => {
            setBaslik(t);
            setHata(null);
          }}
          placeholder={liste ? 'Örneğin: Tatil hazırlığı' : 'Örneğin: Eczaneye uğra'}
          hata={hata}
          returnKeyType="done"
        />
        {!mevcut && (
          <View style={stiller.cipler}>
            {(liste ? LISTE_ORNEKLERI : IS_ORNEKLERI).map((o) => (
              <SecenekHapi
                key={o}
                etiket={o}
                erisimEtiketi={`Ad: ${o}`}
                secili={baslik.trim() === o}
                onPress={() => {
                  setBaslik(o);
                  setHata(null);
                }}
              />
            ))}
          </View>
        )}

        {liste ? (
          <Yazi tur="ikincil">
            Liste grubun herkesine açılır. Maddeleri listede eklersin; her maddeye Kime? ve Ne zaman? verilebilir.
          </Yazi>
        ) : (
          <>
            <Bolum>
              <Yazi kalinlik="kalin">Kime?</Yazi>
              <View style={stiller.cipler}>
                <SecenekHapi etiket="Herkes" secili={kime === null} onPress={() => setKime(null)} />
                {uyeler.map((u) => (
                  <SecenekHapi
                    key={u.id}
                    etiket={u.ad}
                    erisimEtiketi={`${u.ad} kişisinden iste`}
                    secili={kime === u.id}
                    onPress={() => setKime(u.id)}
                  />
                ))}
              </View>
              <Yazi tur="ikincil">
                {kime ? 'O kişi kabul ederse ajandasına düşer.' : 'Gruptan isteyen "Ben alırım" der.'}
              </Yazi>
            </Bolum>

            <Bolum>
              <Yazi kalinlik="kalin">{tarih ? `Ne zaman? ${uzunTarih(tarih)}` : 'Ne zaman?'}</Yazi>
              <View style={stiller.cipler}>
                <SecenekHapi
                  etiket="Tarih yok"
                  secili={tarih === null}
                  onPress={() => (setTarih(null), setTakvim(false))}
                />
                <SecenekHapi
                  etiket="Bugün"
                  secili={tarih === bugunGun}
                  onPress={() => (setTarih(bugunGun), setTakvim(false))}
                />
                <SecenekHapi
                  etiket="Yarın"
                  secili={tarih === yarin}
                  onPress={() => (setTarih(yarin), setTakvim(false))}
                />
                <SecenekHapi
                  etiket="Başka gün"
                  secili={takvim || (tarih !== null && tarih !== bugunGun && tarih !== yarin)}
                  onPress={() => setTakvim(true)}
                />
              </View>
              {takvim && <AyTakvimi secili={tarih} bugunGun={bugunGun} onSec={setTarih} />}
              {tarih === null && <Yazi tur="ikincil">Tarih yoksa alanın ajandasına aldığı güne düşer.</Yazi>}
            </Bolum>

            <Yazi tur="ikincil">{IS_NOTU}</Yazi>
          </>
        )}
        {mevcut && <Dugme tur="tehlike" etiket="İşi sil" onPress={() => setSilSorusu(true)} />}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
