// Yeni plan (PL-1). Tam ekran (`10` madde 6): sol üstte "‹ [Alan]"; içine bir
// şey yazılmışsa çıkarken "Yazdıkların silinsin mi?" sorar. Hazır paket
// seçildiyse form dolu gelir.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AltSayfa } from '@/bilesen/AltSayfa';
import { AyTakvimi } from '@/bilesen/AyTakvimi';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { GirisAlani } from '@/bilesen/GirisAlani';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { Bolum, SecenekHapi } from '@/bilesen/Secim';
import { renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { alanBul, type Alan } from '@/mantik/alanlar';
import {
  adimKarti,
  adimlariAyir,
  bitisMetni,
  etkinlikMetni,
  etkinliktenKart,
  paketBitisi,
  PLAN_ADI_HATASI,
  sureBitisi,
  type Plan,
  type SureSecimi,
} from '@/mantik/plan';
import type { Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { alanDurumlari, planBaslat } from '@/veri/planlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function YeniPlanEkrani() {
  const { alan: anahtar, paket } = useLocalSearchParams<{ alan: string; paket?: string }>();
  const alan = alanBul(anahtar ?? '');
  if (!alan) {
    return (
      <EkranKabi geri="Yaşam Tarzım">
        <Yazi tur="ikincil">Bu alan bulunamadı.</Yazi>
      </EkranKabi>
    );
  }
  return <YeniPlanFormu alan={alan} paketId={paket ?? null} />;
}

type Sure = SureSecimi | 'tarih';

interface Form {
  ad: string;
  neden: string;
  hedef: string;
  sure: Sure;
  /** Seçilen bitiş (sure = 'tarih'). */
  tarih: Gun | null;
  secilenler: string[];
  adimlar: string;
}

function ilkForm(alan: Alan, paketId: string | null, bugunGun: Gun): Form {
  const paket = alan.paketler.find((p) => p.id === paketId);
  if (paket) {
    const bitis = paketBitisi(paket, bugunGun);
    const hafta = paket.hafta === 4 ? '4hafta' : paket.hafta === 8 ? '8hafta' : null;
    return {
      ad: paket.ad,
      neden: '',
      hedef: '',
      sure: hafta ?? 'tarih',
      tarih: hafta ? null : bitis,
      secilenler: [...paket.etkinlikler],
      adimlar: '',
    };
  }
  return { ad: '', neden: '', hedef: '', sure: '4hafta', tarih: null, secilenler: [], adimlar: '' };
}

function YeniPlanFormu({ alan, paketId }: { alan: Alan; paketId: string | null }) {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const navigation = useNavigation();

  const [ilk] = useState(() => ilkForm(alan, paketId, bugunGun));
  const [form, setForm] = useState<Form>(ilk);
  const [hata, setHata] = useState<string | null>(null);
  const [takvimAcik, setTakvimAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  /** Çıkış isteği bekleyen gezinme eylemi ("Yazdıkların silinsin mi?"). */
  const [bekleyen, setBekleyen] = useState<Parameters<typeof navigation.dispatch>[0] | null>(null);

  const durumlar = useSorgu(['plan'], (oku) => alanDurumlari(oku), []);

  const degisti = useMemo(() => JSON.stringify(form) !== JSON.stringify(ilk), [form, ilk]);
  const bitis = form.sure === 'tarih' ? form.tarih : sureBitisi(form.sure, bugunGun);

  // Geri, sekmeye dokunma ya da kaydırma: yazılanlar varsa önce sor.
  const degistiRef = useRef(degisti);
  const kaydedildiRef = useRef(false);
  useEffect(() => {
    degistiRef.current = degisti;
  }, [degisti]);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!degistiRef.current || kaydedildiRef.current) return;
        e.preventDefault();
        setBekleyen(e.data.action);
      }),
    [navigation],
  );

  const guncelle = (alanlar: Partial<Form>) => setForm((f) => ({ ...f, ...alanlar }));
  const etkinlikSec = (id: string) =>
    setForm((f) => ({
      ...f,
      secilenler: f.secilenler.includes(id) ? f.secilenler.filter((x) => x !== id) : [...f.secilenler, id],
    }));

  const baslat = async () => {
    if (form.ad.trim() === '') {
      setHata(PLAN_ADI_HATASI);
      return;
    }
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      const plan: Plan = {
        id: yeniKimlik(),
        ad: form.ad.trim(),
        alan: alan.anahtar,
        kaynak: 'kendim',
        neden: form.neden.trim(),
        hedef: form.hedef.trim(),
        baslangic: bugunGun,
        bitis,
        baslangicPuani: durumlar.veri?.get(alan.anahtar)?.puan ?? 0,
        gununSorusu: null,
        durum: 'etkin',
      };
      const sira = Date.now();
      const duzenliler = alan.etkinlikler
        .filter((e) => form.secilenler.includes(e.id))
        .map((e, i) => etkinliktenKart(e, plan, bugunGun, yeniKimlik, sira + i));
      const adimlar = adimlariAyir(form.adimlar).map((baslik, i) =>
        adimKarti(yeniKimlik(), baslik, plan.id, sira + 100 + i),
      );
      await planBaslat(kapi, { plan, duzenliler, adimlar }, yeniKimlik);
      kaydedildiRef.current = true;
      router.replace({ pathname: '/yasam/plan/[id]', params: { id: plan.id, sekme: 'plan' } });
    } catch (e) {
      console.error('Plan kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <>
      {/* Yazılanlar varken kenardan kaydırarak geri gitme kapalı; "‹" düğmesi sorar. */}
      <Stack.Screen options={{ gestureEnabled: !degisti }} />
      <EkranKabi geri={alan.ad} baslik="Yeni plan" altBaslik={`${alan.ad} · Kendi planın`}>
        <GirisAlani
          etiket="Plan adı"
          value={form.ad}
          onChangeText={(ad) => {
            guncelle({ ad });
            if (hata) setHata(null);
          }}
          placeholder="Örneğin: Sabah planım, Ofis taşınması"
          hata={hata}
          returnKeyType="done"
        />
        <GirisAlani
          etiket="Neden? (isteğe bağlı)"
          value={form.neden}
          onChangeText={(neden) => guncelle({ neden })}
          placeholder="Örneğin: Daha dinç uyanmak"
          returnKeyType="done"
        />
        <GirisAlani
          etiket="Hedef (isteğe bağlı)"
          value={form.hedef}
          onChangeText={(hedef) => guncelle({ hedef })}
          placeholder="Örneğin: Her sabah 15 dakika hareket"
          returnKeyType="done"
        />

        <Bolum>
          <Yazi kalinlik="kalin" accessibilityRole="header">
            Ne zamana kadar?
          </Yazi>
          <View style={stiller.haplar}>
            {(
              [
                ['4hafta', '4 hafta'],
                ['8hafta', '8 hafta'],
                ['yok', 'Bitiş yok'],
              ] as const
            ).map(([k, etiket]) => (
              <SecenekHapi
                key={k}
                etiket={etiket}
                secili={form.sure === k}
                onPress={() => guncelle({ sure: k, tarih: null })}
                style={stiller.esit}
              />
            ))}
          </View>
          <Pressable
            onPress={() => setTakvimAcik(true)}
            accessibilityRole="button"
            accessibilityLabel={`Ya da bir tarih seç${form.sure === 'tarih' && form.tarih ? `: ${bitisMetni(form.tarih, bugunGun)}` : ''}`}
            style={({ pressed }) => [stiller.tarihSec, form.sure === 'tarih' && stiller.tarihSecili, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="calendar-outline" size={22} color={renk.ana} />
            <Yazi kalinlik={form.sure === 'tarih' ? 'kalin' : 'normal'} style={stiller.esnek}>
              {form.sure === 'tarih' && form.tarih ? bitisMetni(form.tarih, bugunGun) : 'Ya da bir tarih seç'}
            </Yazi>
          </Pressable>
          <Yazi tur="ikincil" accessibilityLiveRegion="polite">
            {bitis ? `Bitiş: ${bitisMetni(bitis, bugunGun)}` : 'Bitiş tarihi yok'}
          </Yazi>
        </Bolum>

        <View style={stiller.bolumBasligi}>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            İçine ne ekleyelim?
          </Yazi>
          <Yazi tur="ikincil">İkisini birlikte de ekleyebilirsin; sonradan da eklersin.</Yazi>
        </View>

        <View style={stiller.bolumBasligi}>
          <Yazi kalinlik="kalin">Düzenli yapacakların</Yazi>
          <Yazi tur="ikincil">{"Seçtiklerin bugünden başlayarak kendi günlerinde Ajandam'da görünür."}</Yazi>
        </View>
        <View style={stiller.etkinlikler}>
          {alan.etkinlikler.map((e) => {
            const secili = form.secilenler.includes(e.id);
            return (
              <Pressable
                key={e.id}
                onPress={() => etkinlikSec(e.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: secili }}
                accessibilityLabel={`${e.baslik}, ${etkinlikMetni(e)}`}
                style={({ pressed }) => [stiller.etkinlik, secili && stiller.etkinlikSecili, pressed && { opacity: 0.8 }]}
              >
                <View style={[stiller.kare, secili && stiller.kareDolu]}>
                  {secili && <Ionicons name="checkmark" size={18} color={renk.yuzey} />}
                </View>
                <View style={stiller.esnek}>
                  <Yazi kalinlik="kalin">{e.baslik}</Yazi>
                  <Yazi tur="ikincil">{etkinlikMetni(e)}</Yazi>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={stiller.bolumBasligi}>
          <GirisAlani
            etiket="Adımlar (tek seferlik işler, her satıra bir tane)"
            value={form.adimlar}
            onChangeText={(adimlar) => guncelle({ adimlar })}
            placeholder={'Teklif al\nKoli sipariş et\nMasaları ölç'}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
          />
          <Yazi tur="ikincil">Adımlar önce tarihsiz durur; istediğini sonra ajandana alırsın.</Yazi>
        </View>

        <Dugme tur="vurgu" etiket="Planı başlat" onPress={() => void baslat()} pasif={calisiyor} />
      </EkranKabi>

      <AltSayfa gorunur={takvimAcik} onKapat={() => setTakvimAcik(false)} baslik="Bitiş tarihi" sagKapat="Tamam">
        <AyTakvimi
          secili={form.sure === 'tarih' ? form.tarih : bitis}
          bugunGun={bugunGun}
          onSec={(tarih) => guncelle({ sure: 'tarih', tarih })}
        />
      </AltSayfa>

      {bekleyen && (
        <Katman>
          <OnayKutusu
            baslik="Yazdıkların silinsin mi?"
            secenekler={[
              { etiket: 'Devam et', tur: 'ana', onPress: () => setBekleyen(null) },
              {
                etiket: 'Sil ve kapat',
                tur: 'tehlike',
                onPress: () => {
                  const eylem = bekleyen;
                  setBekleyen(null);
                  kaydedildiRef.current = true;
                  navigation.dispatch(eylem);
                },
              },
            ]}
          />
        </Katman>
      )}
    </>
  );
}

const stiller = StyleSheet.create({
  haplar: { flexDirection: 'row', gap: 8 },
  esit: { flex: 1, paddingHorizontal: 6 },
  tarihSec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: renk.yuzey,
  },
  tarihSecili: { borderColor: renk.ana },
  esnek: { flex: 1 },
  bolumBasligi: { gap: 4 },
  etkinlikler: { gap: 8 },
  etkinlik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    backgroundColor: renk.yuzey,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  etkinlikSecili: { borderColor: renk.ana },
  kare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: renk.soluk,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renk.yuzey,
  },
  kareDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
});
