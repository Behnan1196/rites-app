// Zamanlayıcı kur (pilot 23 Ekim, P-31): form yok, kutunun içinde açılır.
// Büyük rakamlarla seçilen süre, hazır süreler (1·3·5·10·15·30 dk), saat /
// dakika / saniye tekerleği; Vazgeç ve Başlat. Ad süredir ("5 dk"); her zaman
// alarm olarak çalar (telefon alarmı desteklemiyorsa bildirim), ertele 1 dk.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
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
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Yazi } from '../Yazi';
import { Tekerlek } from './Tekerlek';

/** Son kurulan süre; bir dahaki sefere onunla açılır (oturum boyunca). */
let sonSure = VARSAYILAN_ZAMANLAYICI_MS;

export function ZamanlayiciKurucu({ onKapat }: { onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const [ms, setMs] = useState(sonSure);
  const [calisiyor, setCalisiyor] = useState(false);
  const p = sureParcala(ms);
  const parcaDegis = (f: Partial<typeof p>) => setMs(sureBirlestir({ ...p, ...f }));

  const baslat = async () => {
    if (calisiyor || ms <= 0) return;
    setCalisiyor(true);
    try {
      if (alarmDestegi) await izinIste();
      await zamanlayiciKur(kapi, {
        id: yeniKimlik(),
        ad: zamanlayiciSuresiMetni(ms),
        ms,
        alarm: alarmDestegi,
        ses: null,
      });
      sonSure = ms;
      await bildirimIzni(true);
      onKapat();
    } catch (e) {
      console.error('Zamanlayıcı kurulamadı', e);
      kisaMesaj('Kurulamadı. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <View style={stiller.kap}>
      <Yazi
        kalinlik="kalin"
        style={stiller.buyuk}
        accessibilityLabel={`Süre ${zamanlayiciSuresiMetni(ms)}`}
        accessibilityLiveRegion="polite"
      >
        {geriSayimMetni(ms)}
      </Yazi>
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
      <View style={stiller.dugmeler}>
        <Dugme tur="ikincil" etiket="Vazgeç" onPress={onKapat} style={stiller.esnek} />
        <Dugme etiket="▶  Başlat" onPress={() => void baslat()} pasif={calisiyor || ms <= 0} style={stiller.esnek} />
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 12 },
  buyuk: { fontSize: 52, lineHeight: 60, color: renk.yazi, textAlign: 'center', fontVariant: ['tabular-nums'] },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cip: { minWidth: 64 },
  tekerlekler: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: renk.zemin,
    borderRadius: 16,
    padding: 6,
  },
  dugmeler: { flexDirection: 'row', gap: 10 },
  esnek: { flex: 1 },
});
