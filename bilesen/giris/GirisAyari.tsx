// "Giriş'te neler görünsün?" (G-7): alttan sayfa. Giriş'in altındaki bağlantı ve
// Profil → Giriş ekranı aynı sayfayı açar. Değişiklik hemen kaydedilir.

import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GIRIS_AYARI_ACIKLAMASI, hazirKutular, KUTULAR, kutuSirasi, kutuTasi, type KutuAyari } from '@/mantik/giris';
import { ayarYaz } from '@/veri/ayar';
import { useAyar } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { useKisaMesaj } from '../KisaMesaj';
import { AcKapa } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const Baglam = createContext<{ girisAyariniAc: () => void } | null>(null);

export function GirisAyariSaglayici({ children }: { children: ReactNode }) {
  const [acik, setAcik] = useState(false);
  const girisAyariniAc = useCallback(() => setAcik(true), []);
  const deger = useMemo(() => ({ girisAyariniAc }), [girisAyariniAc]);
  return (
    <Baglam.Provider value={deger}>
      {children}
      <GirisAyari gorunur={acik} onKapat={() => setAcik(false)} />
    </Baglam.Provider>
  );
}

export function useGirisAyari() {
  const d = useContext(Baglam);
  if (!d) throw new Error('useGirisAyari, GirisAyariSaglayici içinde kullanılmalı.');
  return d;
}

/** Giriş kutularının kayıtlı sırası (yoksa varsayılan). */
export function useKutuSirasi(): KutuAyari[] | null {
  const ayar = useAyar('giris_kutulari');
  return useMemo(() => (ayar.yukleniyor ? null : kutuSirasi(ayar.veri)), [ayar]);
}

function GirisAyari({ gorunur, onKapat }: { gorunur: boolean; onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const sira = useKutuSirasi();
  if (!sira) return null;
  const gorunen = hazirKutular(sira);

  const yaz = (yeni: KutuAyari[]) =>
    ayarYaz(kapi, 'giris_kutulari', yeni).catch((e: unknown) => {
      console.error('Giriş ayarı kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    });

  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Giriş'te neler görünsün?" sagKapat="Bitti">
      <Yazi tur="ikincil">{GIRIS_AYARI_ACIKLAMASI}</Yazi>
      <View style={stiller.liste}>
        {gorunen.map((a, i) => {
          const t = KUTULAR.find((x) => x.k === a.k)!;
          return (
            <View key={a.k} style={[stiller.satir, i > 0 && stiller.cizgili]}>
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin">{t.ad}</Yazi>
                <Yazi tur="ikincil">{t.aciklama}</Yazi>
              </View>
              <Ok yon="yukari" ad={t.ad} pasif={i === 0} onPress={() => void yaz(kutuTasi(sira, a.k, -1))} />
              <Ok yon="asagi" ad={t.ad} pasif={i === gorunen.length - 1} onPress={() => void yaz(kutuTasi(sira, a.k, 1))} />
              <AcKapa
                acik={a.acik}
                etiket={t.ad}
                onDegis={(acik) => void yaz(sira.map((x) => (x.k === a.k ? { ...x, acik } : x)))}
              />
            </View>
          );
        })}
      </View>
    </AltSayfa>
  );
}

function Ok({ yon, ad, pasif, onPress }: { yon: 'yukari' | 'asagi'; ad: string; pasif: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pasif}
      accessibilityRole="button"
      accessibilityState={{ disabled: pasif }}
      accessibilityLabel={`${ad}: ${yon === 'yukari' ? 'yukarı al' : 'aşağı al'}`}
      style={({ pressed }) => [stiller.ok, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={yon === 'yukari' ? 'arrow-up' : 'arrow-down'} size={24} color={pasif ? renk.pasif : renk.ana} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  liste: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: 14,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 72, paddingVertical: 10 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  esnek: { flex: 1, paddingRight: 4 },
  ok: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
