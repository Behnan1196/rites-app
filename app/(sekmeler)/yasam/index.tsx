// Yaşam Tarzım (pilot 20 Ekim): Alanlarım (iki sütun; puan kişinin kendi
// değerlendirmesi), Programlarım (uygulananlar, sonra öbürleri), Kütüphanem.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AltSayfa } from '@/bilesen/AltSayfa';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { AcKapa } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi, ProgramSatiri, PuanNoktalari } from '@/bilesen/yasam/parcalar';
import { useProgramFormu } from '@/bilesen/yasam/ProgramFormu';
import { useProgramlar } from '@/bilesen/yasam/useProgramlar';
import { alanAdiHatasi, type Alan } from '@/mantik/alanlar';
import { kutuphaneSayiMetni } from '@/mantik/kutuphane';
import { alanAltSatiri, alanlarMetni, yildizMetni } from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { kutuphaneSayisi } from '@/veri/kutuphane';
import { alanDurumuYaz, ozelAlanEkle, varsayilanAlanDurumu } from '@/veri/programlar';
import { useVeri } from '@/veri/VeriSaglayici';

/** Uygulanmayan programlardan Yaşam Tarzım'da gösterilen en çok sayı; fazlası Kütüphanem'de. */
const OBURLERI_EN_COK = 3;

export default function YasamTarzim() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { yukleniyor, ozetler, durumlar, alanlar } = useProgramlar();
  const [secimAcik, setSecimAcik] = useState(false);
  const [yeniAlan, setYeniAlan] = useState<string | null>(null);
  const [alanHatasi, setAlanHatasi] = useState<string | null>(null);
  const kayitSayisi = useSorgu(['kutuphane', 'plan'], (o) => kutuphaneSayisi(o), []);
  const programFormu = useProgramFormu((id) => router.push({ pathname: '/yasam/program/[id]', params: { id } }));

  const durum = (a: Alan) => durumlar?.get(a.anahtar) ?? varsayilanAlanDurumu(a.anahtar);
  const uygulananlar = ozetler.filter((o) => o.durum === 'uygulaniyor');
  const oburleri = ozetler.filter((o) => o.durum !== 'uygulaniyor');

  const alanEkle = async () => {
    const h = alanAdiHatasi(yeniAlan ?? '', alanlar);
    if (h) {
      setAlanHatasi(h);
      return;
    }
    try {
      await ozelAlanEkle(kapi, yeniAlan ?? '', '', yeniKimlik);
      setYeniAlan(null);
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    }
  };

  return (
    <EkranKabi baslik="Yaşam Tarzım" altBaslik="Hayatının alanları ve denediğin programlar.">
      <View style={stiller.basliklar}>
        <Yazi tur="bolumBasligi" accessibilityRole="header">
          Alanlarım
        </Yazi>
        <Dugme tur="yazi" etiket="Düzenle" onPress={() => setSecimAcik(true)} />
      </View>

      {!yukleniyor && (
        <>
          <View style={stiller.izgara}>
            {alanlar
              .filter((a) => durum(a).acik)
              .map((a) => {
                const d = durum(a);
                const buAlan = ozetler.filter((o) => o.program.alanlar.includes(a.anahtar));
                const uygulanan = buAlan.filter((o) => o.durum === 'uygulaniyor').length;
                const alt = alanAltSatiri(uygulanan, buAlan.length, d.ilerlemek);
                const altRenk = uygulanan > 0 ? renk.ana : d.ilerlemek ? renk.vurguYazi : renk.ikincil;
                return (
                  <Pressable
                    key={a.anahtar}
                    onPress={() => router.push({ pathname: '/yasam/alan/[alan]', params: { alan: a.anahtar } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${a.ad}, ${d.puan > 0 ? `puan ${d.puan} / 5` : 'puan verilmedi'}, ${alt}`}
                    style={({ pressed }) => [stiller.alanKutusu, pressed && { opacity: 0.75 }]}
                  >
                    <AlanSimgesi alan={a.anahtar} />
                    <Yazi tur="kartBasligi" numberOfLines={2}>
                      {a.ad}
                    </Yazi>
                    <PuanNoktalari puan={d.puan} />
                    <Yazi kalinlik="kalin" renk={altRenk} numberOfLines={2}>
                      {alt}
                    </Yazi>
                  </Pressable>
                );
              })}
          </View>

          <View style={stiller.basliklar}>
            <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.programlarim}>
              Programlarım
            </Yazi>
          </View>
          {ozetler.length === 0 && (
            <Yazi tur="ikincil">
              Program, birlikte uyguladığın kartlardır: bir egzersiz düzeni, bir beslenme denemesi, haftada bir eski bir
              arkadaşını aramak… Bir tane kur, kartlarını ekle, başlat.
            </Yazi>
          )}
          {uygulananlar.length > 0 && (
            <View style={stiller.liste}>
              {uygulananlar.map((o) => (
                <ProgramSatiri
                  key={o.program.id}
                  ad={o.program.ad}
                  meta={[o.durumMetni, o.siradaki].filter(Boolean).join('\n')}
                  hap={o.bugun}
                  onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: o.program.id } })}
                />
              ))}
            </View>
          )}
          {oburleri.length > 0 && (
            <View style={stiller.liste}>
              {uygulananlar.length > 0 && (
                <Yazi kalinlik="kalin" renk={renk.ikincil} style={stiller.altBaslik}>
                  Başlatmaya hazır, ara verilen ve biten
                </Yazi>
              )}
              {oburleri.slice(0, OBURLERI_EN_COK).map((o) => (
                <ProgramSatiri
                  key={o.program.id}
                  ad={o.program.ad}
                  meta={[o.durumMetni, alanlarMetni(o.program.alanlar)].filter(Boolean).join(' · ')}
                  yildiz={yildizMetni(o.program.yildiz)}
                  onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: o.program.id } })}
                />
              ))}
              {oburleri.length > OBURLERI_EN_COK && (
                <Dugme
                  tur="yazi"
                  etiket={`Bütün programlar (${ozetler.length}) · Kütüphanem`}
                  onPress={() => router.push('/yasam/kutuphane')}
                />
              )}
            </View>
          )}
          <Dugme tur="vurgu" etiket="+ Yeni program" onPress={() => programFormu.ac({ tur: 'yeni' })} />

          <Pressable
            onPress={() => router.push('/yasam/kutuphane')}
            accessibilityRole="button"
            accessibilityLabel={`Kütüphanem, programlar ve ${kutuphaneSayiMetni(kayitSayisi.veri ?? 0)}`}
            style={({ pressed }) => [stiller.kutuphane, pressed && { opacity: 0.75 }]}
          >
            <View style={stiller.kutuphaneSimge}>
              <Ionicons name="library-outline" size={22} color={renk.ana} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">Kütüphanem</Yazi>
              <Yazi tur="ikincil">{`${ozetler.length} program · ${kutuphaneSayiMetni(kayitSayisi.veri ?? 0)} · Rites önerileri`}</Yazi>
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>
        </>
      )}

      {programFormu.oge}

      <AltSayfa
        gorunur={secimAcik}
        onKapat={() => {
          setSecimAcik(false);
          setYeniAlan(null);
        }}
        baslik="Alanları seç"
        sagKapat="Bitti"
      >
        <View style={stiller.secimListesi}>
          {alanlar.map((a) => (
            <View key={a.anahtar} style={stiller.secimSatiri}>
              <AlanSimgesi alan={a.anahtar} />
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin">{a.ad}</Yazi>
                {!!a.aciklama && <Yazi tur="ikincil">{a.aciklama}</Yazi>}
              </View>
              <AcKapa
                acik={durum(a).acik}
                etiket={a.ad}
                onDegis={(acik) => void alanDurumuYaz(kapi, a.anahtar, { acik })}
              />
            </View>
          ))}
        </View>
        {yeniAlan === null ? (
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Kendi alanını ekle" onPress={() => setYeniAlan('')} />
        ) : (
          <View style={stiller.yeniAlan}>
            <GirisAlani
              etiket="Yeni alanın adı"
              value={yeniAlan}
              onChangeText={(t) => {
                setYeniAlan(t);
                setAlanHatasi(null);
              }}
              placeholder="Örneğin: Bahçe, Aile bütçesi"
              hata={alanHatasi}
              returnKeyType="done"
              onSubmitEditing={() => void alanEkle()}
              autoFocus
            />
            <View style={stiller.satir}>
              <Dugme tur="yazi" etiket="Vazgeç" onPress={() => setYeniAlan(null)} />
              <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Alanı ekle" onPress={() => void alanEkle()} />
            </View>
          </View>
        )}
        <Yazi tur="ikincil">
          Hazır alanlar yol göstermek için; istediğini kapatır, kendi alanlarını eklersin. Puanı alana dokunarak
          verirsin.
        </Yazi>
      </AltSayfa>
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  basliklar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kutuphane: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 64,
  },
  kutuphaneSimge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  alanKutusu: {
    width: '48.5%',
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: 14,
    gap: 10,
  },
  programlarim: { marginTop: 8 },
  altBaslik: { marginTop: 4 },
  liste: { gap: 10 },
  secimListesi: { gap: 4 },
  secimSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: renk.satirCizgi,
  },
  yeniAlan: { gap: 8 },
  satir: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  esnek: { flex: 1 },
});
