// Anımsatıcı ekle (AN-1): alttan sayfa.

import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  ANIMSATICI_BILGI,
  ERTELEME_SECENEKLERI,
  formHatasi,
  GUN_SECENEKLERI,
  HAZIR_SAATLER,
  saatleriSirala,
  VARSAYILAN_ERTELEME,
  type AnimsaticiGunleri,
} from '@/mantik/animsatici';
import { animsaticiEkle } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { AcKapa, Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

interface Form {
  ad: string;
  saatler: string[];
  yeniSaat: string;
  gunler: AnimsaticiGunleri;
  sesli: boolean;
  erteleDk: number;
}

const ILK: Form = { ad: '', saatler: ['09:00'], yeniSaat: '13:00', gunler: 'hergun', sesli: true, erteleDk: VARSAYILAN_ERTELEME };

function AnimsaticiFormu({ gorunur, onKapat }: { gorunur: boolean; onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [form, setForm] = useState<Form>(ILK);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const degisti = useMemo(() => JSON.stringify(form) !== JSON.stringify(ILK), [form]);
  const guncelle = (f: Partial<Form>) => {
    setForm((x) => ({ ...x, ...f }));
    setHata(null);
  };

  const kaydet = async () => {
    const h = formHatasi(form.ad, form.saatler);
    if (h) {
      setHata(h);
      return;
    }
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      await animsaticiEkle(kapi, {
        id: yeniKimlik(),
        ad: form.ad.trim(),
        saatler: saatleriSirala(form.saatler),
        gunler: form.gunler,
        sesli: form.sesli,
        erteleDk: form.erteleDk,
      });
      await bildirimIzni(true);
      kisaMesaj(`Anımsatıcı eklendi: ${form.ad.trim()}`);
      onKapat();
    } catch (e) {
      console.error('Anımsatıcı kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Anımsatıcı ekle"
      solVazgec
      degisti={degisti}
      altAlan={<Dugme etiket="Kaydet" onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <Yazi tur="ikincil">{ANIMSATICI_BILGI}</Yazi>
      <GirisAlani
        etiket="Neyi anımsatalım?"
        value={form.ad}
        onChangeText={(ad) => guncelle({ ad })}
        placeholder="Örneğin: Göz damlası, su iç"
        returnKeyType="done"
        hata={hata && form.ad.trim() === '' ? hata : null}
      />

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Saatler
        </Yazi>
        <View style={stiller.cipler}>
          {saatleriSirala(form.saatler).map((s) => (
            <Pressable
              key={s}
              onPress={() => guncelle({ saatler: form.saatler.filter((x) => x !== s) })}
              accessibilityRole="button"
              accessibilityLabel={`${s} saatini kaldır`}
              style={stiller.saatCipi}
            >
              <Yazi kalinlik="kalin" renk={renk.yuzey}>{`${s}  ×`}</Yazi>
            </Pressable>
          ))}
        </View>
        <View style={stiller.saatSatiri}>
          <View style={stiller.secici}>
            <SaatSecici saat={form.yeniSaat} onDegis={(yeniSaat) => guncelle({ yeniSaat })} kompakt etiket="Yeni saat" />
          </View>
          <Dugme
            tur="ikincil"
            etiket="Saat ekle"
            yaziRengi={renk.ana}
            style={stiller.ekle}
            onPress={() => guncelle({ saatler: saatleriSirala([...form.saatler, form.yeniSaat]) })}
          />
        </View>
        <View style={stiller.ikili}>
          <SecenekHapi etiket="Günde 2 kez" secili={false} onPress={() => guncelle({ saatler: [...HAZIR_SAATLER.ikiKez] })} style={stiller.esit} />
          <SecenekHapi etiket="Günde 3 kez" secili={false} onPress={() => guncelle({ saatler: [...HAZIR_SAATLER.ucKez] })} style={stiller.esit} />
        </View>
        {hata && form.ad.trim() !== '' && (
          <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
            {hata}
          </Yazi>
        )}
      </Bolum>

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Hangi günler?
        </Yazi>
        <View style={stiller.cipler}>
          {GUN_SECENEKLERI.map(([k, ad]) => (
            <SecenekHapi key={k} etiket={ad} secili={form.gunler === k} onPress={() => guncelle({ gunler: k })} />
          ))}
        </View>
      </Bolum>

      <Bolum style={stiller.satir}>
        <Yazi kalinlik="kalin" style={stiller.esnek}>
          Sesli uyar
        </Yazi>
        <AcKapa acik={form.sesli} etiket="Sesli uyar" onDegis={(sesli) => guncelle({ sesli })} />
      </Bolum>

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Ertele dersem
        </Yazi>
        <View style={stiller.cipler}>
          {ERTELEME_SECENEKLERI.map((dk) => (
            <SecenekHapi key={dk} etiket={`${dk} dk`} secili={form.erteleDk === dk} onPress={() => guncelle({ erteleDk: dk })} />
          ))}
        </View>
      </Bolum>
    </AltSayfa>
  );
}

/** `const form = useAnimsaticiFormu(); form.ac(); {form.oge}` */
export function useAnimsaticiFormu() {
  const [durum, setDurum] = useState<{ no: number; acik: boolean } | null>(null);
  const ac = useCallback(() => setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true })), []);
  const oge = durum ? (
    <AnimsaticiFormu key={durum.no} gorunur={durum.acik} onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))} />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saatCipi: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saatSatiri: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secici: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'flex-start' },
  ekle: { borderColor: renk.ana, borderWidth: 2, paddingHorizontal: 16 },
  ikili: { flexDirection: 'row', gap: 8 },
  esit: { flex: 1 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  esnek: { flex: 1 },
});
