// Buluşma ekle / düzenle (pilot 18 Ekim): ad (örneklerle), gün (takvim), isteğe
// bağlı saat ve yer. Düzenlemede kuran için "Buluşmayı sil".

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BULUSMA_NOTU, BULUSMA_ORNEKLERI, bulusmaFormuHatasi, bulusmaHatasi, type Bulusma } from '@/mantik/bulusma';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { uzunTarih, type Gun } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';
import { useBulusmalar } from './Bulusmalar';

export function BulusmaFormu({
  grup,
  mevcut,
  onKapat,
}: {
  grup: { id: string; ad: string };
  mevcut?: Bulusma;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { kur, duzenle, sil } = useBulusmalar();
  const [baslik, setBaslik] = useState(mevcut?.baslik ?? '');
  const [gun, setGun] = useState<Gun | null>(mevcut?.gun ?? null);
  const [saat, setSaat] = useState<string | null>(mevcut?.saat ?? null);
  const [saatVar, setSaatVar] = useState(mevcut ? mevcut.saat !== null : true);
  const [yer, setYer] = useState(mevcut?.yer ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [silSorusu, setSilSorusu] = useState(false);

  const sonSaat = saatVar ? (saat ?? '19:00') : null;
  const degisti = mevcut
    ? baslik.trim() !== mevcut.baslik || gun !== mevcut.gun || sonSaat !== mevcut.saat || yer.trim() !== mevcut.yer
    : baslik.trim() !== '' || gun !== null || yer.trim() !== '';
  const zamanDegisti = !!mevcut && (gun !== mevcut.gun || sonSaat !== mevcut.saat);

  const kaydet = async () => {
    const h = bulusmaFormuHatasi(baslik, gun);
    if (h || !gun) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      const t = { baslik, gun, saat: sonSaat, yer };
      if (mevcut) {
        await duzenle(mevcut, t);
        kisaMesaj(zamanDegisti ? 'Kaydedildi; herkes yeniden yanıtlayacak' : 'Buluşma kaydedildi');
      } else {
        await kur(grup, t);
        kisaMesaj(`${baslik.trim()} önerildi; ajandana da eklendi`);
      }
      onKapat();
    } catch (e) {
      setHata(bulusmaHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
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
      baslik={mevcut ? 'Buluşmayı düzenle' : `${grup.ad} · Buluşma`}
      solVazgec
      degisti={degisti}
      onay={
        silSorusu
          ? {
              baslik: `${mevcut?.baslik ?? 'Buluşma'} silinsin mi?`,
              aciklama: 'Grubun herkesi için silinir; ajandalardaki kartı da kalkar.',
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void silOnayli() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
              ],
            }
          : null
      }
      altAlan={<Dugme etiket={mevcut ? 'Kaydet' : 'Öner'} onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        <GirisAlani
          etiket="Ne yapılacak?"
          value={baslik}
          onChangeText={(t) => {
            setBaslik(t);
            setHata(null);
          }}
          placeholder="Örneğin: Akşam yemeği"
          hata={hata}
          returnKeyType="done"
        />
        {!mevcut && (
          <View style={stiller.cipler}>
            {BULUSMA_ORNEKLERI.map((o) => (
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

        <Bolum>
          <Yazi kalinlik="kalin">{gun ? `Gün: ${uzunTarih(gun)}` : 'Gün'}</Yazi>
          <AyTakvimi
            secili={gun}
            bugunGun={bugunGun}
            onSec={(g) => {
              setGun(g);
              setHata(null);
            }}
          />
        </Bolum>

        <Bolum>
          <Yazi kalinlik="kalin">Saat</Yazi>
          <View style={stiller.cipler}>
            <SecenekHapi etiket="Saatli" secili={saatVar} onPress={() => setSaatVar(true)} />
            <SecenekHapi etiket="Saat yok" secili={!saatVar} onPress={() => setSaatVar(false)} />
          </View>
          {saatVar && <SaatSecici saat={sonSaat} onDegis={setSaat} kompakt etiket="Saat" />}
        </Bolum>

        <GirisAlani
          etiket="Yer (isteğe bağlı)"
          value={yer}
          onChangeText={setYer}
          placeholder="Örneğin: Bizde, Moda sahili"
          returnKeyType="done"
        />
        <Yazi tur="ikincil">{BULUSMA_NOTU}</Yazi>
        {mevcut && <Dugme tur="tehlike" etiket="Buluşmayı sil" onPress={() => setSilSorusu(true)} />}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
