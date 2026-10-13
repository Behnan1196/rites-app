// Kütüphanem (L-2): arama, alan süzgeci, tür süzgeci; her kayıtta etiketler ve
// kaynak. Planlar da kartlarla birlikte görünür (L-3).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { SecenekHapi } from '@/bilesen/Secim';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { alanAdi, ALAN_ANAHTARLARI, type AlanAnahtari } from '@/mantik/alanlar';
import {
  BOS_KUTUPHANE,
  etiketMetni,
  kayitAltMetni,
  kutuphaneSuz,
  SUZGECTE_YOK,
  suzgecSecenekleri,
  type EtiketTuru,
} from '@/mantik/kutuphane';
import { useSorgu } from '@/veri/kancalar';
import { kutuphaneyiOku } from '@/veri/kutuphane';

export default function Kutuphanem() {
  const veri = useSorgu(['kutuphane'], (o) => kutuphaneyiOku(o), []);
  const [sorgu, setSorgu] = useState('');
  const [alan, setAlan] = useState<AlanAnahtari | null>(null);
  const [tur, setTur] = useState<EtiketTuru | null>(null);

  const kayitlar = useMemo(() => veri.veri ?? [], [veri.veri]);
  const secenekler = useMemo(() => suzgecSecenekleri(kayitlar, ALAN_ANAHTARLARI), [kayitlar]);
  // Seçili süzgecin kaydı kalmadıysa "Tümü".
  const etkinAlan = alan && secenekler.alanlar.includes(alan) ? alan : null;
  const etkinTur = tur && secenekler.turler.includes(tur) ? tur : null;
  const sonuc = useMemo(
    () => kutuphaneSuz(kayitlar, { sorgu, alan: etkinAlan, tur: etkinTur }),
    [kayitlar, sorgu, etkinAlan, etkinTur],
  );

  return (
    <EkranKabi geri="Yaşam Tarzım" baslik="Kütüphanem" altBaslik="Sakladığın kartlar ve planlar.">
      {!veri.yukleniyor && kayitlar.length === 0 ? (
        <Yazi tur="ikincil">{BOS_KUTUPHANE}</Yazi>
      ) : (
        <>
          <GirisAlani
            etiket="Kütüphanede ara"
            etiketGizli
            value={sorgu}
            onChangeText={setSorgu}
            placeholder="Ara"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {secenekler.alanlar.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipler}>
              <SecenekHapi etiket="Tümü" secili={!etkinAlan} onPress={() => setAlan(null)} />
              {secenekler.alanlar.map((a) => (
                <SecenekHapi key={a} etiket={alanAdi(a)} secili={etkinAlan === a} onPress={() => setAlan(a)} />
              ))}
            </ScrollView>
          )}
          {secenekler.turler.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipler}>
              <SecenekHapi etiket="Tüm türler" secili={!etkinTur} onPress={() => setTur(null)} />
              {secenekler.turler.map((t) => (
                <SecenekHapi key={t} etiket={t} secili={etkinTur === t} onPress={() => setTur(t)} />
              ))}
            </ScrollView>
          )}

          {sonuc.length === 0 && !veri.yukleniyor && <Yazi tur="ikincil">{SUZGECTE_YOK}</Yazi>}
          {sonuc.map((k) => (
            <Pressable
              key={k.id}
              onPress={() => router.push({ pathname: '/yasam/kutuphane/[id]', params: { id: k.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${k.baslik}, ${etiketMetni(k)}, ${kayitAltMetni(k)}`}
              style={({ pressed }) => [stiller.satir, k.tur === 'plan' && stiller.planSatiri, pressed && { opacity: 0.75 }]}
            >
              <View style={stiller.esnek}>
                <Yazi tur="kartBasligi">{k.baslik}</Yazi>
                <Yazi tur="ikincil">{etiketMetni(k)}</Yazi>
                <Yazi tur="etiket" kalinlik="kalin" renk={k.tur === 'plan' ? kaynakRenk.plan.yazi : renk.ikincil}>
                  {kayitAltMetni(k)}
                </Yazi>
              </View>
              <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
            </Pressable>
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
  planSatiri: { borderLeftWidth: 6, borderLeftColor: kaynakRenk.plan.serit },
  esnek: { flex: 1, gap: 2 },
});
