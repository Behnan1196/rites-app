// Nöbet kur / düzenle (pilot 18 Ekim): ad (örneklerle), günler, sıra (gruptan
// kişiler; dokunma sırası sıradır). Günler ya da sıra değişince sıra bugünden
// yeniden başlar.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { NOBET_NOTU, NOBET_ORNEKLERI, nobetFormuHatasi, nobetHatasi, type Nobet } from '@/mantik/nobet';
import { GUN_KISA } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { useNobetler } from './Nobetler';

export function NobetFormu({
  grup,
  uyeler,
  mevcut,
  onKapat,
}: {
  grup: { id: string; ad: string };
  /** Grubun üyeleri (ad: Kişilerim'deki adla). */
  uyeler: { id: string; ad: string }[];
  mevcut?: Nobet;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { kur, duzenle, sil } = useNobetler();
  const [ad, setAd] = useState(mevcut?.ad ?? '');
  const [gunler, setGunler] = useState<number[]>(mevcut?.gunler ?? [0, 1, 2, 3, 4, 5, 6]);
  const [sira, setSira] = useState<string[]>(mevcut?.sira ?? []);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [silSorusu, setSilSorusu] = useState(false);

  const siraDegisti =
    !!mevcut &&
    (gunler.join() !== [...mevcut.gunler].sort((a, b) => a - b).join() || sira.join() !== mevcut.sira.join());
  const degisti = mevcut ? siraDegisti || ad.trim() !== mevcut.ad : ad.trim() !== '' || sira.length > 0;
  const adBul = (id: string) => uyeler.find((u) => u.id === id)?.ad ?? 'Eski üye';
  // Gruptan ayrılmış biri sırada kalmışsa çıkarılabilsin diye listede görünür.
  const secenekler = [
    ...uyeler,
    ...sira.filter((id) => !uyeler.some((u) => u.id === id)).map((id) => ({ id, ad: adBul(id) })),
  ];

  const kaydet = async () => {
    const h = nobetFormuHatasi(mevcut ? ad || mevcut.ad : ad, gunler, sira);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      const t = { ad, gunler, sira, baslangic: mevcut && !siraDegisti ? mevcut.baslangic : bugunGun };
      if (mevcut) {
        await duzenle(mevcut, t);
        kisaMesaj(siraDegisti ? 'Kaydedildi; sıra bugünden yeniden başladı' : 'Nöbet kaydedildi');
      } else {
        await kur(grup.id, t);
        kisaMesaj(`${ad.trim()} nöbeti kuruldu`);
      }
      onKapat();
    } catch (e) {
      setHata(nobetHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const silOnayli = async () => {
    if (!mevcut) return;
    setCalisiyor(true);
    try {
      await sil(mevcut);
      kisaMesaj(`Silindi: ${mevcut.ad}`);
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
      baslik={mevcut ? 'Nöbeti düzenle' : `${grup.ad} · Nöbet`}
      solVazgec
      degisti={degisti}
      onay={
        silSorusu && mevcut
          ? {
              baslik: `${mevcut.ad} silinsin mi?`,
              aciklama: 'Grubun herkesi için silinir; ajandalardaki gelecek günleri de kalkar.',
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void silOnayli() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
              ],
            }
          : null
      }
      altAlan={<Dugme etiket={mevcut ? 'Kaydet' : 'Kur'} onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        <GirisAlani
          etiket="Ne iş?"
          value={ad}
          onChangeText={(t) => {
            setAd(t);
            setHata(null);
          }}
          placeholder="Örneğin: Bulaşık"
          returnKeyType="done"
        />
        {!mevcut && (
          <View style={stiller.cipler}>
            {NOBET_ORNEKLERI.map((o) => (
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
          <Yazi kalinlik="kalin">Hangi günler?</Yazi>
          <View style={stiller.cipler}>
            {GUN_KISA.map((g, i) => (
              <SecenekHapi
                key={g}
                etiket={g}
                secili={gunler.includes(i)}
                onPress={() => {
                  setHata(null);
                  setGunler((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i].sort((a, b) => a - b)));
                }}
              />
            ))}
          </View>
        </Bolum>

        <Bolum>
          <Yazi kalinlik="kalin">Sıra</Yazi>
          <Yazi tur="ikincil">Dokunduğun sırayla eklenir; yeniden dokununca çıkar.</Yazi>
          <View style={stiller.cipler}>
            {secenekler.map((u) => {
              const i = sira.indexOf(u.id);
              return (
                <SecenekHapi
                  key={u.id}
                  etiket={i >= 0 ? `${i + 1}. ${u.ad}` : u.ad}
                  erisimEtiketi={i >= 0 ? `${u.ad}, sırada ${i + 1}.` : `${u.ad}, sıraya ekle`}
                  secili={i >= 0}
                  onPress={() => {
                    setHata(null);
                    setSira((l) => (l.includes(u.id) ? l.filter((x) => x !== u.id) : [...l, u.id]));
                  }}
                />
              );
            })}
          </View>
          {sira.length > 0 && <Yazi tur="ikincil">{`Sıra: ${sira.map(adBul).join(' → ')} → baştan`}</Yazi>}
        </Bolum>

        {!!hata && <Yazi renk={renk.hata}>{hata}</Yazi>}
        <Yazi tur="ikincil">{NOBET_NOTU}</Yazi>
        {mevcut && <Dugme tur="tehlike" etiket="Nöbeti sil" onPress={() => setSilSorusu(true)} />}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
