// Karar / oylama kur (pilot 18 Ekim): "Seçenekler" (Ne yiyelim? Pizza, Köfte…) ya
// da "Gün seçimi" (Piknik hangi gün? takvimden günler; isteğe bağlı saat ve yer;
// karar verilince o güne buluşma kurulur). Tek ya da birden çok seçim; isteğe
// bağlı son gün.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import {
  GUN_KARARI_NOTU,
  GUN_ORNEKLERI,
  KARAR_NOTU,
  KARAR_ORNEKLERI,
  kararFormuHatasi,
  kararHatasi,
  type KararTuru,
} from '@/mantik/karar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { gunEkle, uzunTarih, type Gun } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { BolumluDugme } from '../BolumluDugme';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { useKararlar } from './Kararlar';

export function KararFormu({ grup, onKapat }: { grup: { id: string; ad: string }; onKapat: () => void }) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { kur } = useKararlar();
  const [tur, setTur] = useState<KararTuru>('metin');
  const [soru, setSoru] = useState('');
  const [metinler, setMetinler] = useState<string[]>(['', '']);
  const [gunler, setGunler] = useState<Gun[]>([]);
  const [saatVar, setSaatVar] = useState(false);
  const [saat, setSaat] = useState<string | null>(null);
  const [yer, setYer] = useState('');
  const [coklu, setCoklu] = useState<boolean | null>(null);
  const [sonGun, setSonGun] = useState<Gun | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const cokluMu = coklu ?? tur === 'gun';
  const sonSaat = saatVar ? (saat ?? '19:00') : null;
  const secenekler =
    tur === 'gun'
      ? [...gunler].sort().map((g) => ({ metin: '', gun: g, saat: sonSaat }))
      : metinler.filter((m) => m.trim()).map((m) => ({ metin: m.trim(), gun: null, saat: null }));
  const degisti = soru.trim() !== '' || metinler.some((m) => m.trim()) || gunler.length > 0;

  const kaydet = async () => {
    const h = kararFormuHatasi(soru, tur, secenekler);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      await kur(grup.id, { soru, tur, coklu: cokluMu, sonGun, yer: tur === 'gun' ? yer : '', secenekler });
      kisaMesaj('Oylama açıldı');
      onKapat();
    } catch (e) {
      setHata(kararHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const ornekler = tur === 'gun' ? GUN_ORNEKLERI : KARAR_ORNEKLERI;
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
      baslik={`${grup.ad} · Karar`}
      solVazgec
      degisti={degisti}
      altAlan={<Dugme etiket="Oylamayı aç" onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        <BolumluDugme
          secenekler={[
            { deger: 'metin', etiket: 'Seçenekler' },
            { deger: 'gun', etiket: 'Gün seçimi' },
          ]}
          secili={tur}
          erisimEtiketi="Oylama türü"
          onSec={(t) => {
            setTur(t);
            setHata(null);
          }}
        />
        <GirisAlani
          etiket={tur === 'gun' ? 'Ne için gün seçiyorsunuz?' : 'Soru'}
          value={soru}
          onChangeText={(t) => {
            setSoru(t);
            setHata(null);
          }}
          placeholder={tur === 'gun' ? 'Örneğin: Piknik' : 'Örneğin: Ne yiyelim?'}
          returnKeyType="done"
        />
        <View style={stiller.cipler}>
          {ornekler.map((o) => (
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

        {tur === 'metin' ? (
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
        ) : (
          <>
            <Bolum>
              <Yazi kalinlik="kalin">{gunler.length ? `Günler (${gunler.length})` : 'Günler'}</Yazi>
              <Yazi tur="ikincil">Önermek istediğin günlere dokun; yeniden dokununca çıkar.</Yazi>
              <AyTakvimi
                secili={null}
                secililer={new Set(gunler)}
                bugunGun={bugunGun}
                onSec={(g) => {
                  setHata(null);
                  setGunler((l) => (l.includes(g) ? l.filter((x) => x !== g) : [...l, g]));
                }}
              />
              {gunler.length > 0 && <Yazi tur="ikincil">{[...gunler].sort().map(uzunTarih).join(' · ')}</Yazi>}
            </Bolum>
            <Bolum>
              <Yazi kalinlik="kalin">Saat</Yazi>
              <View style={stiller.cipler}>
                <SecenekHapi etiket="Saat yok" secili={!saatVar} onPress={() => setSaatVar(false)} />
                <SecenekHapi etiket="Saatli" secili={saatVar} onPress={() => setSaatVar(true)} />
              </View>
              {saatVar && <SaatSecici saat={sonSaat} onDegis={setSaat} kompakt etiket="Saat" />}
            </Bolum>
            <GirisAlani
              etiket="Yer (isteğe bağlı)"
              value={yer}
              onChangeText={setYer}
              placeholder="Örneğin: Belgrad Ormanı"
              returnKeyType="done"
            />
          </>
        )}

        <Bolum>
          <Yazi kalinlik="kalin">Kaç seçenek işaretlenebilir?</Yazi>
          <View style={stiller.cipler}>
            <SecenekHapi etiket="Tek seçim" secili={!cokluMu} onPress={() => setCoklu(false)} />
            <SecenekHapi etiket="Birden çok" secili={cokluMu} onPress={() => setCoklu(true)} />
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
        <Yazi tur="ikincil">{tur === 'gun' ? GUN_KARARI_NOTU : KARAR_NOTU}</Yazi>
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
