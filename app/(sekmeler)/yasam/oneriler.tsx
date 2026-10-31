// Rites önerileri (pilot 31 Ekim, P-79): Kütüphanem'den ayrı. Yaşam Tarzım → Rites önerileri.
// Programlar (çok kartlı öneri programları) ve Alışkanlık önerileri (eskiden tek kartlı
// programlar; süreli, saatsiz). Alan süzgeci; gizlenen öneriler altta ayrı. Öneriye dokununca
// öneri ekranı: "Programlarıma ekle" ya da "Alışkanlık olarak ekle".

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { SecenekHapi } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi, IlerlemeHapi, ProgramSatiri } from '@/bilesen/yasam/parcalar';
import { alanAdi, type AlanAnahtari } from '@/mantik/alanlar';
import { tekrarMetni } from '@/mantik/gorunurluk';
import { alanlarMetni, oneriAnahtari, oneriKartlari, oneriler, sureMetni } from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { gizliOneriler } from '@/veri/katalog';

export default function Oneriler() {
  const gizli = useSorgu(['ayar', 'kutuphane'], (o) => gizliOneriler(o), []).veri ?? new Set<string>();
  const [alan, setAlan] = useState<AlanAnahtari | null>(null);
  const [gizliGorunsun, setGizliGorunsun] = useState(false);

  const programlar = oneriler();
  const kartlar = oneriKartlari();
  const alanlar = [...new Set([...programlar, ...kartlar].flatMap((x) => x.alanlar))];
  const etkinAlan = alan && alanlar.includes(alan) ? alan : null;
  const gorunur = (tur: 'program' | 'kart', id: string, a: readonly string[]) =>
    (gizliGorunsun || !gizli.has(oneriAnahtari(tur, id))) && (!etkinAlan || a.includes(etkinAlan));
  const programSonuc = programlar.filter((p) => gorunur('program', p.id, p.alanlar));
  const kartSonuc = kartlar.filter((c) => gorunur('kart', c.id, c.alanlar));
  const gizliSayisi =
    programlar.filter((p) => gizli.has(oneriAnahtari('program', p.id))).length +
    kartlar.filter((c) => gizli.has(oneriAnahtari('kart', c.id))).length;

  return (
    <EkranKabi
      geri="Yaşam Tarzım"
      baslik="Rites önerileri"
      altBaslik="Denemek isteyebileceğin programlar ve alışkanlıklar. Eklediğin kopya senindir."
    >
      {alanlar.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipler}>
          <SecenekHapi etiket="Tüm alanlar" secili={!etkinAlan} onPress={() => setAlan(null)} />
          {alanlar.map((a) => (
            <SecenekHapi key={a} etiket={alanAdi(a)} secili={etkinAlan === a} onPress={() => setAlan(a)} />
          ))}
        </ScrollView>
      )}

      {programSonuc.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            {`Programlar (${programSonuc.length})`}
          </Yazi>
          {programSonuc.map((o) => (
            <ProgramSatiri
              key={o.id}
              ad={o.ad}
              meta={[alanlarMetni(o.alanlar), sureMetni(o.sure), `${o.kartlar.length} kart`]
                .filter(Boolean)
                .join(' · ')}
              hap={gizli.has(oneriAnahtari('program', o.id)) ? 'Gizli' : null}
              onPress={() => router.push({ pathname: '/yasam/oneri/[id]', params: { id: o.id } })}
            />
          ))}
        </>
      )}

      {kartSonuc.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            {`Alışkanlık önerileri (${kartSonuc.length})`}
          </Yazi>
          {kartSonuc.map((c) => {
            const meta = [alanlarMetni(c.alanlar), c.tekrar ? tekrarMetni(c.tekrar) : null].filter(Boolean).join(' · ');
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/yasam/oneri/[id]', params: { id: c.id, tur: 'kart' } })}
                accessibilityRole="button"
                accessibilityLabel={`${c.baslik}, ${meta}`}
                style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
              >
                <AlanSimgesi alan={c.alanlar[0] ?? ''} />
                <View style={stiller.esnek}>
                  <Yazi tur="kartBasligi">{c.baslik}</Yazi>
                  <Yazi tur="ikincil">{meta}</Yazi>
                </View>
                {gizli.has(oneriAnahtari('kart', c.id)) ? (
                  <IlerlemeHapi metin="Gizli" soluk />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
                )}
              </Pressable>
            );
          })}
        </>
      )}

      {programSonuc.length + kartSonuc.length === 0 && <Yazi tur="ikincil">Bu alanda öneri yok.</Yazi>}

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
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 14,
  },
  esnek: { flex: 1, gap: 2 },
});
