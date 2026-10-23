// Zamanlayıcı kur (pilot 23 Ekim; "Süre sonra"nın yerine): alttan sayfa.
// Üstte seçilen süre büyük rakamlarla; hazır süreler (1·3·5·10·15·30 dk) ve
// saat / dakika / saniye tekerleği; ad isteğe bağlı; Bildirim ya da Alarm
// (destekleniyorsa varsayılan Alarm). "Başlat" saniyesiyle kurar.

import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ALARM_ACIKLAMASI } from '@/mantik/alarm';
import {
  bitisHesapla,
  geriSayimMetni,
  sureBirlestir,
  sureParcala,
  VARSAYILAN_ZAMANLAYICI_MS,
  ZAMANLAYICI_SURELERI,
  zamanlayiciSuresiMetni,
} from '@/mantik/zamanlayici';
import { zamanlayiciKur } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { yeniKimlik } from '@/veri/kimlik';
import { useSimdiMs } from '@/veri/useSimdi';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { SesSecici } from '../SesSecici';
import { renk } from '../tema';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Yazi } from '../Yazi';
import { Tekerlek } from './Tekerlek';

/** Son kurulan süre; sayfa bir dahaki sefere onunla açılır (oturum boyunca). */
let sonSure = VARSAYILAN_ZAMANLAYICI_MS;

function ZamanlayiciSayfasi({ gorunur, onKapat }: { gorunur: boolean; onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const simdiMs = useSimdiMs();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const [ms, setMs] = useState(sonSure);
  const [ad, setAd] = useState('');
  const [alarmSecimi, setAlarmSecimi] = useState<boolean | null>(null);
  const [ses, setSes] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  // Zamanlayıcı varsayılan olarak alarmdır (gözden kaçmamalı); kişi seçtiyse o.
  const alarm = alarmDestegi && (alarmSecimi ?? true);
  const p = sureParcala(ms);
  const parcaDegis = (f: Partial<typeof p>) => setMs(sureBirlestir({ ...p, ...f }));
  const caldigiSaat = useMemo(() => bitisHesapla(simdiMs, ms).saat, [simdiMs, ms]);

  const baslat = async () => {
    if (calisiyor || ms <= 0) return;
    setCalisiyor(true);
    try {
      const adi = ad.trim() || zamanlayiciSuresiMetni(ms);
      const b = await zamanlayiciKur(kapi, { id: yeniKimlik(), ad: adi, ms, alarm, ses });
      sonSure = ms;
      await bildirimIzni(true);
      kisaMesaj(`Başladı: ${adi} · bitiş ${b.saat}`);
      onKapat();
    } catch (e) {
      console.error('Zamanlayıcı kurulamadı', e);
      kisaMesaj('Kurulamadı. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Zamanlayıcı"
      solVazgec
      sagEylem={{ etiket: 'Başlat', onPress: () => void baslat(), pasif: calisiyor || ms <= 0 }}
      degisti={ad.trim() !== ''}
    >
      <View style={stiller.ust}>
        <Yazi
          kalinlik="kalin"
          style={stiller.buyuk}
          accessibilityLabel={`Süre ${zamanlayiciSuresiMetni(ms)}`}
          accessibilityLiveRegion="polite"
        >
          {geriSayimMetni(ms)}
        </Yazi>
        <Yazi tur="ikincil">{ms > 0 ? `Çalacağı saat: ${caldigiSaat}` : 'Bir süre seç'}</Yazi>
      </View>

      <View style={stiller.cipler}>
        {ZAMANLAYICI_SURELERI.map((dk) => (
          <SecenekHapi
            key={dk}
            etiket={`${dk} dk`}
            secili={ms === dk * 60_000}
            onPress={() => setMs(dk * 60_000)}
            style={stiller.cip}
          />
        ))}
      </View>

      <View style={stiller.tekerlekler}>
        <Tekerlek deger={p.sa} adet={24} birim="sa" erisimEtiketi="Saat" onDegis={(sa) => parcaDegis({ sa })} />
        <Tekerlek deger={p.dk} adet={60} birim="dk" erisimEtiketi="Dakika" onDegis={(dk) => parcaDegis({ dk })} />
        <Tekerlek deger={p.sn} adet={60} birim="sn" erisimEtiketi="Saniye" onDegis={(sn) => parcaDegis({ sn })} />
      </View>

      <GirisAlani
        etiket="Ad (isteğe bağlı)"
        value={ad}
        onChangeText={setAd}
        placeholder={`Örneğin: Ocağın altı (boş kalırsa "${zamanlayiciSuresiMetni(ms)}")`}
        returnKeyType="done"
      />

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Nasıl uyarsın?
        </Yazi>
        <View style={stiller.ikili}>
          <SecenekHapi etiket="Bildirim" secili={!alarm} onPress={() => setAlarmSecimi(false)} style={stiller.esnek} />
          {alarmDestegi && (
            <SecenekHapi
              etiket="Alarm"
              secili={alarm}
              onPress={() => {
                setAlarmSecimi(true);
                void izinIste();
              }}
              style={stiller.esnek}
            />
          )}
        </View>
        {alarm ? (
          <Yazi tur="ikincil">{ALARM_ACIKLAMASI}</Yazi>
        ) : (
          <>
            <Yazi kalinlik="kalin">Ses</Yazi>
            <SesSecici ses={ses} onDegis={setSes} />
          </>
        )}
      </Bolum>
    </AltSayfa>
  );
}

/** `const z = useZamanlayiciSayfasi(); z.ac(); {z.oge}` */
export function useZamanlayiciSayfasi() {
  const [durum, setDurum] = useState<{ no: number; acik: boolean } | null>(null);
  const ac = useCallback(() => setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true })), []);
  const oge = durum ? (
    <ZamanlayiciSayfasi
      key={durum.no}
      gorunur={durum.acik}
      onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))}
    />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  ust: { alignItems: 'center', gap: 2 },
  buyuk: { fontSize: 56, lineHeight: 64, color: renk.yazi, fontVariant: ['tabular-nums'] },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cip: { minWidth: 72 },
  tekerlekler: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: renk.yuzey,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: 6,
  },
  ikili: { flexDirection: 'row', gap: 8 },
  esnek: { flex: 1 },
});
