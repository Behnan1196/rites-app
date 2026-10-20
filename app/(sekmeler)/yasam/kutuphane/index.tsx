// Kütüphanem (pilot 20 Ekim): programların (yıldızlarıyla) ve sakladığın kartlar;
// aralarında içerik kataloğundan gelen Rites önerileri ("Öneri" etiketiyle; kişi
// istemediğini gizler). Arama hepsinde; alan süzgeci hepsinde, tür süzgeci kartlarda.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { SecenekHapi } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { Dugme } from '@/bilesen/Dugme';
import { IlerlemeHapi, ProgramSatiri } from '@/bilesen/yasam/parcalar';
import { alanAdi, tumAlanlar, type AlanAnahtari } from '@/mantik/alanlar';
import {
  BOS_KUTUPHANE,
  etiketMetni,
  kayitAltMetni,
  kutuphaneSuz,
  SUZGECTE_YOK,
  suzgecSecenekleri,
  type EtiketTuru,
  type KutuphaneKaydi,
} from '@/mantik/kutuphane';
import { trKucuk } from '@/mantik/metin';
import {
  alanlarMetni,
  durumMetni,
  oneriAnahtari,
  oneriKartlari,
  oneriler,
  programMetni,
  programSirasi,
  sureMetni,
  yildizMetni,
} from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { gizliOneriler } from '@/veri/katalog';
import { kutuphaneyiOku } from '@/veri/kutuphane';
import { alanDurumlari, programlariOku, tumProgramKartlari } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';

const ONERI_ONEKI = 'oneri:';

export default function Kutuphanem() {
  const bugunGun = useBugun();
  const veri = useSorgu(
    ['kutuphane', 'plan', 'ayar'],
    async (o) => {
      await alanDurumlari(o); // kişinin alan adları
      return {
        gizli: await gizliOneriler(o),
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
  const [gizliGorunsun, setGizliGorunsun] = useState(false);

  const gizli = useMemo(() => veri.veri?.gizli ?? new Set<string>(), [veri.veri]);
  const gizliSayisi =
    oneriler().filter((o) => gizli.has(oneriAnahtari('program', o.id))).length +
    oneriKartlari().filter((c) => gizli.has(oneriAnahtari('kart', c.id))).length;
  /** Kişinin kartları, ardından (gizlenmemiş) öneri kartları — aynı süzgeçten geçsin diye kayıt biçiminde. */
  const kayitlar = useMemo((): KutuphaneKaydi[] => {
    const kendi = veri.veri?.kayitlar ?? [];
    const oneri = oneriKartlari()
      .filter((c) => gizliGorunsun || !gizli.has(oneriAnahtari('kart', c.id)))
      .map((c): KutuphaneKaydi => ({
        id: ONERI_ONEKI + c.id,
        tur: 'kart',
        baslik: c.baslik,
        alanlar: c.alanlar,
        etiketTur: c.tur,
        kaynak: 'Rites önerisi',
        paylasilabilir: false,
        olusturma: '',
        icerik: { ...c, hatirlatma: null },
      }));
    return [...kendi, ...oneri];
  }, [veri.veri, gizli, gizliGorunsun]);
  const programlar = useMemo(() => veri.veri?.programlar ?? [], [veri.veri]);
  const secenekler = useMemo(() => suzgecSecenekleri(kayitlar, veri.veri?.alanlar ?? []), [kayitlar, veri.veri]);
  const oneriAlanlari = new Set([...oneriler(), ...oneriKartlari()].flatMap((x) => x.alanlar));
  const programAlanlari = useMemo(() => new Set(programlar.flatMap((p) => p.alanlar)), [programlar]);
  const alanSecenekleri = (veri.veri?.alanlar ?? []).filter(
    (a) => secenekler.alanlar.includes(a) || programAlanlari.has(a) || oneriAlanlari.has(a),
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
  const oneriSonuc = oneriler().filter(
    (o) =>
      (gizliGorunsun || !gizli.has(oneriAnahtari('program', o.id))) &&
      (!etkinAlan || o.alanlar.includes(etkinAlan)) &&
      (!q ||
        trKucuk([o.ad, o.aciklama, alanlarMetni(o.alanlar), ...o.kartlar.map((k) => k.baslik)].join(' ')).includes(q)),
  );

  const tursuz = !etkinTur;
  const hicYok =
    !veri.yukleniyor && kartSonuc.length === 0 && (!tursuz || (programSonuc.length === 0 && oneriSonuc.length === 0));

  return (
    <EkranKabi
      geri="Yaşam Tarzım"
      baslik="Kütüphanem"
      altBaslik="Programların ve kartların; aralarında Rites önerileri."
    >
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

      {tursuz && programSonuc.length + oneriSonuc.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            {`Programlar (${programSonuc.length + oneriSonuc.length})`}
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
          {oneriSonuc.map((o) => (
            <ProgramSatiri
              key={o.id}
              ad={o.ad}
              meta={['Rites önerisi', alanlarMetni(o.alanlar), sureMetni(o.sure), `${o.kartlar.length} kart`]
                .filter(Boolean)
                .join(' · ')}
              hap={gizli.has(oneriAnahtari('program', o.id)) ? 'Gizli' : 'Öneri'}
              soluk
              onPress={() => router.push({ pathname: '/yasam/oneri/[id]', params: { id: o.id } })}
            />
          ))}
        </>
      )}

      <Yazi tur="bolumBasligi" accessibilityRole="header">
        {`Kartlar (${kartSonuc.length})`}
      </Yazi>
      {secenekler.turler.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipler}>
          <SecenekHapi etiket="Tüm türler" secili={!etkinTur} onPress={() => setTur(null)} />
          {secenekler.turler.map((t) => (
            <SecenekHapi key={t} etiket={t} secili={etkinTur === t} onPress={() => setTur(t)} />
          ))}
        </ScrollView>
      )}
      {!veri.yukleniyor && (veri.veri?.kayitlar ?? []).length === 0 && <Yazi tur="ikincil">{BOS_KUTUPHANE}</Yazi>}
      {kartSonuc.map((k) => {
        const oneriId = k.id.startsWith(ONERI_ONEKI) ? k.id.slice(ONERI_ONEKI.length) : null;
        return (
          <Pressable
            key={k.id}
            onPress={() =>
              oneriId
                ? router.push({ pathname: '/yasam/oneri/[id]', params: { id: oneriId, tur: 'kart' } })
                : router.push({ pathname: '/yasam/kutuphane/[id]', params: { id: k.id } })
            }
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
            {oneriId ? (
              <IlerlemeHapi metin={gizli.has(oneriAnahtari('kart', oneriId)) ? 'Gizli' : 'Öneri'} soluk />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
            )}
          </Pressable>
        );
      })}

      {gizliSayisi > 0 && (
        <Dugme
          tur="yazi"
          etiket={gizliGorunsun ? 'Gizlediğin önerileri sakla' : `Gizlediğin öneriler (${gizliSayisi})`}
          onPress={() => setGizliGorunsun((g) => !g)}
        />
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
