// Bildirim sesi seçimi (pilot 19 Ekim): dokununca seçilir ve bir kez çalar
// (dinleyip karar verilsin). "Telefonun sesi" çalmaz.
// P-33: alarmda da kullanılır; `alarm` ile ilk seçenek "Telefonun alarm sesi".

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { SESLER, gecerliSes } from '@/mantik/sesler';

import { SecenekHapi } from './Secim';

// Gömülü ses dosyaları (Metro varlık olarak paketler).
const DOSYALAR: Record<string, number> = {
  zil: require('../assets/sesler/zil.wav'),
  can: require('../assets/sesler/can.wav'),
  yumusak: require('../assets/sesler/yumusak.wav'),
  kus: require('../assets/sesler/kus.wav'),
  bip: require('../assets/sesler/bip.wav'),
};

export function SesSecici({
  ses,
  onDegis,
  alarm = false,
}: {
  ses: string | null | undefined;
  onDegis: (ses: string | null) => void;
  alarm?: boolean;
}) {
  const oynatici = useRef<AudioPlayer | null>(null);
  useEffect(
    () => () => {
      oynatici.current?.remove();
      oynatici.current = null;
    },
    [],
  );

  const dinlet = async (ad: string | null) => {
    oynatici.current?.remove();
    oynatici.current = null;
    const dosya = ad ? DOSYALAR[ad] : undefined;
    if (!dosya) return;
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const o = createAudioPlayer(dosya);
      oynatici.current = o;
      o.play();
    } catch (e) {
      console.warn('Ses çalınamadı', e);
    }
  };

  const secili = gecerliSes(ses);
  return (
    <View style={stiller.cipler}>
      {SESLER.map((s) => {
        const etiket = alarm && s.ad === null ? 'Telefonun alarm sesi' : s.etiket;
        return (
          <SecenekHapi
            key={s.ad ?? 'telefon'}
            etiket={etiket}
            erisimEtiketi={`${alarm ? 'Alarm sesi' : 'Ses'}: ${etiket}`}
            secili={secili === s.ad}
            onPress={() => {
              onDegis(s.ad);
              void dinlet(s.ad);
            }}
          />
        );
      })}
    </View>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
