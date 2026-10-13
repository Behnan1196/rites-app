// Yaşam Tarzım (Y-1): Alanlarım (iki sütun), Kütüphanem · N kayıt ve Planlarım.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AltSayfa } from '@/bilesen/AltSayfa';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { AcKapa } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi, PlanSatiri, PuanNoktalari } from '@/bilesen/yasam/parcalar';
import { usePlanlar } from '@/bilesen/yasam/usePlanlar';
import { ALANLAR } from '@/mantik/alanlar';
import { kutuphaneSayiMetni } from '@/mantik/kutuphane';
import { alanAltSatiri } from '@/mantik/plan';
import { useSorgu } from '@/veri/kancalar';
import { kutuphaneSayisi } from '@/veri/kutuphane';
import { alanDurumuYaz, varsayilanAlanDurumu } from '@/veri/planlar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function YasamTarzim() {
  const { kapi } = useVeri();
  const { yukleniyor, ozetler, durumlar } = usePlanlar();
  const [secimAcik, setSecimAcik] = useState(false);
  const kayitSayisi = useSorgu(['kutuphane'], (o) => kutuphaneSayisi(o), []);

  const durum = (a: (typeof ALANLAR)[number]) => durumlar?.get(a.anahtar) ?? varsayilanAlanDurumu(a.anahtar);
  const etkinler = ozetler.filter((o) => o.plan.durum === 'etkin');

  return (
    <EkranKabi baslik="Yaşam Tarzım" altBaslik="Hayatının alanları ve onlar için planların.">
      <View style={stiller.basliklar}>
        <Yazi tur="bolumBasligi" accessibilityRole="header">
          Alanlarım
        </Yazi>
        <Dugme tur="yazi" etiket="Düzenle" onPress={() => setSecimAcik(true)} />
      </View>

      {!yukleniyor && (
        <>
          <View style={stiller.izgara}>
            {ALANLAR.filter((a) => durum(a).acik).map((a) => {
              const d = durum(a);
              const planSayisi = etkinler.filter((o) => o.plan.alan === a.anahtar).length;
              const alt = alanAltSatiri(planSayisi, d.ilerlemek);
              const altRenk = planSayisi > 0 ? renk.ana : d.ilerlemek ? renk.vurguYazi : renk.ikincil;
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

          <Pressable
            onPress={() => router.push('/yasam/kutuphane')}
            accessibilityRole="button"
            accessibilityLabel={`Kütüphanem, ${kutuphaneSayiMetni(kayitSayisi.veri ?? 0)}`}
            style={({ pressed }) => [stiller.kutuphane, pressed && { opacity: 0.75 }]}
          >
            <View style={stiller.kutuphaneSimge}>
              <Ionicons name="library-outline" size={22} color={renk.ana} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">Kütüphanem</Yazi>
              <Yazi tur="ikincil">{kutuphaneSayiMetni(kayitSayisi.veri ?? 0)}</Yazi>
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>

          <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.planlarim}>
            Planlarım
          </Yazi>
          {etkinler.length === 0 ? (
            <Yazi tur="ikincil">Henüz planın yok. Bir alana dokunarak başla.</Yazi>
          ) : (
            <View style={stiller.liste}>
              {etkinler.map((o) => (
                <PlanSatiri
                  key={o.plan.id}
                  ad={o.plan.ad}
                  meta={o.meta}
                  hap={o.ilerleme}
                  onPress={() => router.push({ pathname: '/yasam/plan/[id]', params: { id: o.plan.id } })}
                />
              ))}
            </View>
          )}
        </>
      )}

      <AltSayfa gorunur={secimAcik} onKapat={() => setSecimAcik(false)} baslik="Alanları seç" sagKapat="Bitti">
        <View style={stiller.secimListesi}>
          {ALANLAR.map((a) => (
            <View key={a.anahtar} style={stiller.secimSatiri}>
              <AlanSimgesi alan={a.anahtar} />
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin">{a.ad}</Yazi>
                <Yazi tur="ikincil">{a.aciklama}</Yazi>
              </View>
              <AcKapa
                acik={durum(a).acik}
                etiket={a.ad}
                onDegis={(acik) => void alanDurumuYaz(kapi, a.anahtar, { acik })}
              />
            </View>
          ))}
        </View>
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
  kutuphaneSimge: { width: 44, height: 44, borderRadius: 22, backgroundColor: renk.anaAcik, alignItems: 'center', justifyContent: 'center' },
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
  planlarim: { marginTop: 8 },
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
  esnek: { flex: 1 },
});
