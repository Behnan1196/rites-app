// Birlikte rutin: kur, düzenle ya da katıl (pilot 18 Ekim).
// - kur: ad (örneklerle), haftada kaç kez, senin günlerin;
// - düzenle (kuran): ad ve hedef; "Rutini sil";
// - katıl: yalnız senin günlerin (hedef kadar gün önerilir).

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BAGLANAMIYOR } from '@/mantik/kisiler';
import {
  hedefMetni,
  onerilenGunler,
  RUTIN_NOTU,
  RUTIN_ORNEKLERI,
  rutinFormuHatasi,
  rutinHatasi,
  type Rutin,
} from '@/mantik/rutin';
import { GUN_KISA, type GunKisa } from '@/mantik/tarih';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { ArtiEksi, Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { useRutinler } from './Rutinler';

const GUN_HATASI = 'En az bir gün seç.';

export type RutinFormuKipi = { tur: 'kur' } | { tur: 'duzenle'; rutin: Rutin } | { tur: 'katil'; rutin: Rutin };

export function RutinFormu({
  grup,
  kip,
  onKapat,
}: {
  grup: { id: string; ad: string };
  kip: RutinFormuKipi;
  onKapat: () => void;
}) {
  const kisaMesaj = useKisaMesaj();
  const { kur, duzenle, katil, sil } = useRutinler();
  const mevcut = kip.tur === 'kur' ? null : kip.rutin;
  const [ad, setAd] = useState(mevcut?.ad ?? '');
  const [hedef, setHedef] = useState(mevcut?.hedef ?? 3);
  const [gunler, setGunler] = useState<GunKisa[]>(onerilenGunler(mevcut?.hedef ?? 3));
  const [gunlerElle, setGunlerElle] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [silSorusu, setSilSorusu] = useState(false);
  const gunSecilir = kip.tur !== 'duzenle';

  const hedefDegis = (h: number) => {
    const y = Math.min(7, Math.max(1, h));
    setHedef(y);
    if (!gunlerElle) setGunler(onerilenGunler(y));
  };
  const gunDegis = (g: GunKisa) => {
    setGunlerElle(true);
    setHata(null);
    setGunler((l) => (l.includes(g) ? l.filter((x) => x !== g) : GUN_KISA.filter((x) => x === g || l.includes(x))));
  };

  const degisti =
    kip.tur === 'kur'
      ? ad.trim() !== ''
      : kip.tur === 'duzenle'
        ? ad.trim() !== kip.rutin.ad || hedef !== kip.rutin.hedef
        : false;

  const kaydet = async () => {
    const h = rutinFormuHatasi(kip.tur === 'katil' ? kip.rutin.ad : ad, gunSecilir ? gunler : null);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      if (kip.tur === 'kur') {
        await kur(grup, ad, hedef, gunler);
        kisaMesaj(`${ad.trim()} kuruldu; ajandana da eklendi`);
      } else if (kip.tur === 'duzenle') {
        await duzenle(kip.rutin, ad, hedef);
        kisaMesaj('Rutin kaydedildi');
      } else {
        await katil(kip.rutin, gunler);
        kisaMesaj(`${kip.rutin.ad} rutinine katıldın; ajandana eklendi`);
      }
      onKapat();
    } catch (e) {
      setHata(rutinHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const silOnayli = async () => {
    if (kip.tur !== 'duzenle') return;
    setCalisiyor(true);
    try {
      await sil(kip.rutin);
      kisaMesaj(`Silindi: ${kip.rutin.ad}`);
      onKapat();
    } catch (e) {
      console.warn(e);
      setHata(BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const baslik =
    kip.tur === 'kur' ? `${grup.ad} · Birlikte rutin` : kip.tur === 'duzenle' ? 'Rutini düzenle' : kip.rutin.ad;
  const dugme = kip.tur === 'kur' ? 'Kur' : kip.tur === 'duzenle' ? 'Kaydet' : 'Katıl';

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={baslik}
      solVazgec
      degisti={degisti}
      onay={
        silSorusu && mevcut
          ? {
              baslik: `${mevcut.ad} silinsin mi?`,
              aciklama: 'Grubun herkesi için silinir; ajandalardaki dizisi biter, geçmiş kayıtlar kalır.',
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void silOnayli() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
              ],
            }
          : null
      }
      altAlan={<Dugme etiket={dugme} onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        {kip.tur === 'katil' ? (
          <Yazi tur="ikincil">{`${hedefMetni(kip.rutin.hedef)}. Hangi günler yapacaksın? Ajandanda o günlerde görünür; "Yaptım" dediğin günler grupta sayılır.`}</Yazi>
        ) : (
          <>
            <GirisAlani
              etiket="Ne yapılacak?"
              value={ad}
              onChangeText={(t) => {
                setAd(t);
                setHata(null);
              }}
              placeholder="Örneğin: Yürüyüş"
              hata={hata === GUN_HATASI ? null : hata}
              returnKeyType="done"
            />
            {kip.tur === 'kur' && (
              <View style={stiller.cipler}>
                {RUTIN_ORNEKLERI.map((o) => (
                  <SecenekHapi
                    key={o}
                    etiket={o}
                    erisimEtiketi={`Ad: ${o}`}
                    secili={ad.trim() === o}
                    onPress={() => {
                      setAd(o);
                      setHata(null);
                    }}
                  />
                ))}
              </View>
            )}
            <Bolum>
              <Yazi kalinlik="kalin">Haftada kaç kez?</Yazi>
              <ArtiEksi
                deger={hedefMetni(hedef)}
                onEksi={() => hedefDegis(hedef - 1)}
                onArti={() => hedefDegis(hedef + 1)}
                eksiEtiket="Bir az"
                artiEtiket="Bir çok"
              />
            </Bolum>
          </>
        )}

        {gunSecilir && (
          <Bolum>
            <Yazi kalinlik="kalin">Senin günlerin</Yazi>
            <View style={stiller.cipler}>
              {GUN_KISA.map((g) => (
                <SecenekHapi key={g} etiket={g} secili={gunler.includes(g)} onPress={() => gunDegis(g)} />
              ))}
            </View>
            {(kip.tur === 'katil' || hata === GUN_HATASI) && !!hata && <Yazi renk={renk.hata}>{hata}</Yazi>}
          </Bolum>
        )}

        {kip.tur !== 'katil' && <Yazi tur="ikincil">{RUTIN_NOTU}</Yazi>}
        {kip.tur === 'duzenle' && <Dugme tur="tehlike" etiket="Rutini sil" onPress={() => setSilSorusu(true)} />}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
