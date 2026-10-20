// Kütüphanem (pilot 20 Ekim): programların (yıldızlarıyla), sakladığın kartlar ve
// Rites önerileri. Arama hepsinde; alan süzgeci hepsinde, tür süzgeci kartlarda.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { SecenekHapi } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { ProgramSatiri } from '@/bilesen/yasam/parcalar';
import { alanAdi, tumAlanlar, type AlanAnahtari } from '@/mantik/alanlar';
import {
  BOS_KUTUPHANE,
  etiketMetni,
  kayitAltMetni,
  kutuphaneSuz,
  SUZGECTE_YOK,
  suzgecSecenekleri,
  type EtiketTuru,
} from '@/mantik/kutuphane';
import { trKucuk } from '@/mantik/metin';
import {
  alanlarMetni,
  durumMetni,
  ONERILER,
  programMetni,
  programSirasi,
  sureMetni,
  yildizMetni,
} from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { kutuphaneyiOku } from '@/veri/kutuphane';
import { alanDurumlari, programlariOku, tumProgramKartlari } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';

export default function Kutuphanem() {
  const bugunGun = useBugun();
  const veri = useSorgu(
    ['kutuphane', 'plan'],
    async (o) => {
      await alanDurumlari(o); // kişinin alan adları
      return {
        kayitlar: await kutuphaneyiOku(o),
        programlar: await programlariOku(o),
        programKartlari: await tumProgramKartlari(o),
        alanlar: tumAlanlar().map((a) => a.anahtar),
      };
    },
    [],
  );
  const [sorgu, setSorgu] = useState('');
  const [alan, setAlan] = useState<AlanAnahtari | null>(null);
  const [tur, setTur] = useState<EtiketTuru | null>(null);

  const kayitlar = useMemo(() => veri.veri?.kayitlar ?? [], [veri.veri]);
  const programlar = useMemo(() => veri.veri?.programlar ?? [], [veri.veri]);
  const secenekler = useMemo(() => suzgecSecenekleri(kayitlar, veri.veri?.alanlar ?? []), [kayitlar, veri.veri]);
  const programAlanlari = useMemo(() => new Set(programlar.flatMap((p) => p.alanlar)), [programlar]);
  const alanSecenekleri = (veri.veri?.alanlar ?? []).filter(
    (a) => secenekler.alanlar.includes(a) || programAlanlari.has(a),
  );
  // Seçili süzgecin kaydı kalmadıysa "Tümü".
  const etkinAlan = alan && alanSecenekleri.includes(alan) ? alan : null;
  const etkinTur = tur && secenekler.turler.includes(tur) ? tur : null;
  const q = trKucuk(sorgu.trim());

  const kartSonuc = useMemo(
    () => kutuphaneSuz(kayitlar, { sorgu, alan: etkinAlan, tur: etkinTur }),
    [kayitlar, sorgu, etkinAlan, etkinTur],
  );
  const programSonuc = useMemo(() => {
    const pk = veri.veri?.programKartlari ?? [];
    return programSirasi(
      programlar.filter(
        (p) =>
          (!etkinAlan || p.alanlar.includes(etkinAlan)) &&
          (!q ||
            programMetni(
              p,
              pk.filter((k) => k.programId === p.id),
            ).includes(q)),
      ),
      bugunGun,
    );
  }, [programlar, veri.veri, etkinAlan, q, bugunGun]);
  const oneriSonuc = ONERILER.filter(
    (o) =>
      (!etkinAlan || o.alan === etkinAlan) &&
      (!q || trKucuk([o.ad, o.aciklama, alanAdi(o.alan), ...o.kartlar.map((k) => k.baslik)].join(' ')).includes(q)),
  );
  const tursuz = !etkinTur;
  const hicYok =
    !veri.yukleniyor && kartSonuc.length === 0 && (!tursuz || (programSonuc.length === 0 && oneriSonuc.length === 0));

  return (
    <EkranKabi geri="Yaşam Tarzım" baslik="Kütüphanem" altBaslik="Programların, sakladığın kartlar ve Rites önerileri.">
      <GirisAlani
        etiket="Kütüphanede ara"
        etiketGizli
        value={sorgu}
        onChangeText={setSorgu}
        placeholder="Ara"
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {alanSecenekleri.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipler}>
          <SecenekHapi etiket="Tüm alanlar" secili={!etkinAlan} onPress={() => setAlan(null)} />
          {alanSecenekleri.map((a) => (
            <SecenekHapi key={a} etiket={alanAdi(a)} secili={etkinAlan === a} onPress={() => setAlan(a)} />
          ))}
        </ScrollView>
      )}

      {hicYok && <Yazi tur="ikincil">{SUZGECTE_YOK}</Yazi>}

      {tursuz && programSonuc.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            {`Programlarım (${programSonuc.length})`}
          </Yazi>
          {programSonuc.map((p) => (
            <ProgramSatiri
              key={p.id}
              ad={p.ad}
              meta={[durumMetni(p, bugunGun), alanlarMetni(p.alanlar)].filter(Boolean).join(' · ')}
              yildiz={yildizMetni(p.yildiz)}
              onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: p.id } })}
            />
          ))}
        </>
      )}

      <Yazi tur="bolumBasligi" accessibilityRole="header">
        {`Kartlarım (${kartSonuc.length})`}
      </Yazi>
      {secenekler.turler.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipler}>
          <SecenekHapi etiket="Tüm türler" secili={!etkinTur} onPress={() => setTur(null)} />
          {secenekler.turler.map((t) => (
            <SecenekHapi key={t} etiket={t} secili={etkinTur === t} onPress={() => setTur(t)} />
          ))}
        </ScrollView>
      )}
      {!veri.yukleniyor && kayitlar.length === 0 && <Yazi tur="ikincil">{BOS_KUTUPHANE}</Yazi>}
      {kartSonuc.map((k) => (
        <Pressable
          key={k.id}
          onPress={() => router.push({ pathname: '/yasam/kutuphane/[id]', params: { id: k.id } })}
          accessibilityRole="button"
          accessibilityLabel={`${k.baslik}, ${etiketMetni(k)}, ${kayitAltMetni(k)}`}
          style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
        >
          <View style={stiller.esnek}>
            <Yazi tur="kartBasligi">{k.baslik}</Yazi>
            <Yazi tur="ikincil">{etiketMetni(k)}</Yazi>
            <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
              {kayitAltMetni(k)}
            </Yazi>
          </View>
          <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
        </Pressable>
      ))}

      {tursuz && oneriSonuc.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Rites önerileri
          </Yazi>
          {oneriSonuc.map((o) => (
            <ProgramSatiri
              key={o.id}
              ad={o.ad}
              meta={`${alanAdi(o.alan)} · ${sureMetni(o.sure)} · ${o.kartlar.length} kart`}
              hap="Öneri"
              soluk
              onPress={() => router.push({ pathname: '/yasam/oneri/[id]', params: { id: o.id } })}
            />
          ))}
        </>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  cipler: { gap: 8, paddingRight: 8 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 14,
  },
  esnek: { flex: 1, gap: 2 },
});
