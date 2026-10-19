// Oylama aç (pilot 18 Ekim; 19 Ekim'den beri yalnız seçenekli oylama — gün
// oylaması Buluşma'da "Günü oylayalım"): soru (örneklerle), 2–10 seçenek, tek ya
// da birden çok seçim, isteğe bağlı son gün.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { KARAR_NOTU, KARAR_ORNEKLERI, kararFormuHatasi, kararHatasi } from '@/mantik/karar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { gunEkle, type Gun } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { useKararlar } from './Kararlar';

export function KararFormu({ grup, onKapat }: { grup: { id: string; ad: string }; onKapat: () => void }) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { kur } = useKararlar();
  const [soru, setSoru] = useState('');
  const [metinler, setMetinler] = useState<string[]>(['', '']);
  const [coklu, setCoklu] = useState(false);
  const [sonGun, setSonGun] = useState<Gun | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const secenekler = metinler.filter((m) => m.trim()).map((m) => ({ metin: m.trim(), gun: null, saat: null }));
  const degisti = soru.trim() !== '' || metinler.some((m) => m.trim());

  const kaydet = async () => {
    const h = kararFormuHatasi(soru, 'metin', secenekler);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      await kur(grup.id, { soru, tur: 'metin', coklu, sonGun, yer: '', secenekler });
      kisaMesaj('Oylama açıldı');
      onKapat();
    } catch (e) {
      setHata(kararHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const SON_GUNLER: { etiket: string; gun: Gun | null }[] = [
    { etiket: 'Yok', gun: null },
    { etiket: 'Yarın', gun: gunEkle(bugunGun, 1) },
    { etiket: '3 gün sonra', gun: gunEkle(bugunGun, 3) },
    { etiket: '1 hafta sonra', gun: gunEkle(bugunGun, 7) },
  ];

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={`${grup.ad} · Oylama`}
      solVazgec
      degisti={degisti}
      altAlan={<Dugme etiket="Oylamayı aç" onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        <GirisAlani
          etiket="Soru"
          value={soru}
          onChangeText={(t) => {
            setSoru(t);
            setHata(null);
          }}
          placeholder="Örneğin: Ne yiyelim?"
          returnKeyType="done"
        />
        <View style={stiller.cipler}>
          {KARAR_ORNEKLERI.map((o) => (
            <SecenekHapi
              key={o}
              etiket={o}
              erisimEtiketi={`Soru: ${o}`}
              secili={soru.trim() === o}
              onPress={() => {
                setSoru(o);
                setHata(null);
              }}
            />
          ))}
        </View>

        <Bolum>
          <Yazi kalinlik="kalin">Seçenekler</Yazi>
          {metinler.map((m, i) => (
            <View key={i} style={stiller.satir}>
              <TextInput
                value={m}
                onChangeText={(t) => {
                  setHata(null);
                  setMetinler((l) => l.map((x, j) => (j === i ? t : x)));
                }}
                placeholder={`${i + 1}. seçenek`}
                placeholderTextColor={renk.soluk}
                accessibilityLabel={`${i + 1}. seçenek`}
                style={[stiller.girdi, yazi('normal')]}
              />
              {metinler.length > 2 && (
                <Pressable
                  onPress={() => setMetinler((l) => l.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}. seçeneği sil`}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={22} color={renk.ikincil} />
                </Pressable>
              )}
            </View>
          ))}
          {metinler.length < 10 && (
            <Dugme tur="yazi" etiket="+ Seçenek ekle" onPress={() => setMetinler((l) => [...l, ''])} />
          )}
        </Bolum>

        <Bolum>
          <Yazi kalinlik="kalin">Kaç seçenek işaretlenebilir?</Yazi>
          <View style={stiller.cipler}>
            <SecenekHapi etiket="Tek seçim" secili={!coklu} onPress={() => setCoklu(false)} />
            <SecenekHapi etiket="Birden çok" secili={coklu} onPress={() => setCoklu(true)} />
          </View>
        </Bolum>

        <Bolum>
          <Yazi kalinlik="kalin">Son gün</Yazi>
          <View style={stiller.cipler}>
            {SON_GUNLER.map((s) => (
              <SecenekHapi
                key={s.etiket}
                etiket={s.etiket}
                secili={sonGun === s.gun}
                onPress={() => setSonGun(s.gun)}
              />
            ))}
          </View>
          <Yazi tur="ikincil">Son günden sonra oy verilmez; kararı yine sen verirsin.</Yazi>
        </Bolum>

        {!!hata && <Yazi renk={renk.hata}>{hata}</Yazi>}
        <Yazi tur="ikincil">{KARAR_NOTU}</Yazi>
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  girdi: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: 12,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
  },
});
