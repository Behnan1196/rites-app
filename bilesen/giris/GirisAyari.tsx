// "Giriş'te neler görünsün?" (G-7): alttan sayfa. Giriş'in altındaki bağlantı ve
// Profil → Giriş ekranı aynı sayfayı açar. Değişiklik hemen kaydedilir.
// Pilot 21 Ekim: her satırda kutunun simgesi; sıra, satıra uzun basıp sürükleyerek
// değişir (oklar kalktı; ekran okuyucuda "Yukarı / Aşağı taşı").

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  GIRIS_AYARI_ACIKLAMASI,
  hazirKutular,
  KUTULAR,
  kutulariSirala,
  kutuSirasi,
  type KutuAnahtari,
  type KutuAyari,
} from '@/mantik/giris';
import { ayarYaz } from '@/veri/ayar';
import { useAyar } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';

import { SiraliKartlar } from '../ajanda/SiraliKartlar';
import { AltSayfa } from '../AltSayfa';
import { useKisaMesaj } from '../KisaMesaj';
import { AcKapa } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { kutuRengi, KutuSimgesi } from './KutuSimgesi';

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
  const [surukleniyor, setSurukleniyor] = useState(false);
  if (!sira) return null;
  const gorunen = hazirKutular(sira).map((a, i) => ({ ...a, id: a.k, sira: i }));

  const yaz = (yeni: KutuAyari[]) =>
    ayarYaz(kapi, 'giris_kutulari', yeni).catch((e: unknown) => {
      console.error('Giriş ayarı kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    });

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Giriş'te neler görünsün?"
      sagKapat="Bitti"
      kaydirilabilir={!surukleniyor}
    >
      <Yazi tur="ikincil">{GIRIS_AYARI_ACIKLAMASI}</Yazi>
      <SiraliKartlar
        kartlar={gorunen}
        aralik={8}
        onSurukleme={setSurukleniyor}
        onSira={(kimlikler) => void yaz(kutulariSirala(sira, kimlikler as KutuAnahtari[]))}
        satir={(a, surukle) => {
          const t = KUTULAR.find((x) => x.k === a.k)!;
          return (
            <Pressable
              onLongPress={surukle.onUzunBas}
              delayLongPress={300}
              onPressOut={surukle.onBirak}
              accessibilityActions={surukle.eylemler}
              onAccessibilityAction={surukle.onEylem}
              accessibilityLabel={`${t.ad}. ${t.aciklama}`}
              accessibilityHint="Sırasını değiştirmek için uzun basıp sürükle"
              style={stiller.satir}
            >
              <View style={[stiller.simge, { backgroundColor: kutuRengi(a.k).zemin }]}>
                <KutuSimgesi k={a.k} />
              </View>
              <View style={stiller.esnek}>
                <Yazi kalinlik="kalin">{t.ad}</Yazi>
                <Yazi tur="ikincil">{t.aciklama}</Yazi>
              </View>
              <AcKapa
                acik={a.acik}
                etiket={t.ad}
                onDegis={(acik) => void yaz(sira.map((x) => (x.k === a.k ? { ...x, acik } : x)))}
              />
            </Pressable>
          );
        }}
      />
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
  },
  simge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  esnek: { flex: 1, paddingRight: 4 },
});
