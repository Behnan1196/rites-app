// Sesli not kaydı (G-2a): bir dokunuş başlatır, bir dokunuş bitirir.

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useState } from 'react';

import { dosyayiSakla } from '@/veri/dosyalar';

export type KayitSonucu = { tur: 'tamam'; uri: string } | { tur: 'izinYok' } | { tur: 'hata' };

export function useSesKaydi() {
  const kaydedici = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [dinliyor, setDinliyor] = useState(false);

  /** Kaydı başlatır. İzin yoksa ya da başlatılamazsa nedenini döndürür. */
  const baslat = async (): Promise<KayitSonucu | null> => {
    try {
      const izin = await requestRecordingPermissionsAsync();
      if (!izin.granted) return { tur: 'izinYok' };
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await kaydedici.prepareToRecordAsync();
      kaydedici.record();
      setDinliyor(true);
      return null;
    } catch (e) {
      console.error('Ses kaydı başlatılamadı', e);
      return { tur: 'hata' };
    }
  };

  /** Kaydı bitirir ve dosyayı kalıcı klasöre taşır. */
  const bitir = async (): Promise<KayitSonucu> => {
    setDinliyor(false);
    try {
      await kaydedici.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = kaydedici.uri;
      if (!uri) return { tur: 'hata' };
      return { tur: 'tamam', uri: await dosyayiSakla(uri, 'sesli-not.m4a') };
    } catch (e) {
      console.error('Ses kaydı bitirilemedi', e);
      return { tur: 'hata' };
    }
  };

  return { dinliyor, baslat, bitir };
}
