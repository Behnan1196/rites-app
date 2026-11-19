// Programlar (eski Yaşam Tarzım; pilot 20 Ekim, P-133): Programlarım (uygulananlar, sonra
// öbürleri), Rites önerileri, Kütüphanem. P-133: yaşam alanları kalktı.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { ProgramSatiri } from '@/bilesen/yasam/parcalar';
import { useProgramFormu } from '@/bilesen/yasam/ProgramFormu';
import { useProgramlar } from '@/bilesen/yasam/useProgramlar';
import { kutuphaneSayiMetni } from '@/mantik/kutuphane';
import { yildizMetni } from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { kutuphaneSayisi } from '@/veri/kutuphane';

/** Uygulanmayan programlardan Yaşam Tarzım'da gösterilen en çok sayı; fazlası Kütüphanem'de. */
const OBURLERI_EN_COK = 3;

export default function Programlar() {
  const { yukleniyor, ozetler } = useProgramlar();
  const kayitSayisi = useSorgu(['kutuphane', 'plan'], (o) => kutuphaneSayisi(o), []);
  const programFormu = useProgramFormu((id) => router.push({ pathname: '/yasam/program/[id]', params: { id } }));

  const uygulananlar = ozetler.filter((o) => o.durum === 'uygulaniyor');
  const oburleri = ozetler.filter((o) => o.durum !== 'uygulaniyor');

  return (
    <EkranKabi
      baslik="Programlar"
      altBaslik="Denediğin programlar, Rites önerileri ve kütüphanen."
      baslikSag={
        <SimgeDugmesi ikon="library-outline" etiket="Kütüphanem" onPress={() => router.push('/yasam/kutuphane')} />
      }
    >
      {!yukleniyor && (
        <>
          <View style={stiller.basliklar}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
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
                  meta={o.durumMetni}
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

          {/* P-79: öneriler Kütüphanem'den ayrı. */}
          <Pressable
            onPress={() => router.push('/yasam/oneriler')}
            accessibilityRole="button"
            accessibilityLabel="Rites önerileri, ajandana ekleyebileceğin kartlar"
            style={({ pressed }) => [stiller.kutuphane, pressed && { opacity: 0.75 }]}
          >
            <View style={stiller.kutuphaneSimge}>
              <Ionicons name="sparkles-outline" size={22} color={renk.ana} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">Rites önerileri</Yazi>
              <Yazi tur="ikincil">Ajandana ekleyip deneyebileceğin kartlar</Yazi>
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>
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
              <Yazi tur="ikincil">{`${ozetler.length} program · ${kutuphaneSayiMetni(kayitSayisi.veri ?? 0)}`}</Yazi>
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>
        </>
      )}

      {programFormu.oge}
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
