// Söyleneni yazıya çevirme (pilot 21 Ekim; iPhone'un konuşma tanıması,
// expo-speech-recognition). Türkçe; telefon destekliyorsa tanıma telefonun içinde
// yapılır (ses dışarı gitmez), desteklemiyorsa klavyedeki dikte gibi Apple'ın
// tanımasına gider. Yazılan, yazı kutusundaki metnin sonuna eklenir; kişi düzeltip
// kaydeder.

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useRef, useState } from 'react';

export type DikteSorunu = 'izinYok' | 'yok' | 'hata';

const DIL = 'tr-TR';

function birlestir(onceki: string, yeni: string): string {
  const a = onceki.trimEnd();
  const b = yeni.trim();
  if (!b) return onceki;
  return a ? `${a} ${b}` : b;
}

export function useDikte(onMetin: (metin: string) => void) {
  const [dinliyor, setDinliyor] = useState(false);
  const [sorun, setSorun] = useState<DikteSorunu | null>(null);
  const bas = useRef('');
  const yerelDenendi = useRef(false);

  const basla = (yerel: boolean) => {
    ExpoSpeechRecognitionModule.start({
      lang: DIL,
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
      requiresOnDeviceRecognition: yerel,
    });
  };

  useSpeechRecognitionEvent('start', () => setDinliyor(true));
  useSpeechRecognitionEvent('end', () => setDinliyor(false));
  useSpeechRecognitionEvent('result', (e) => {
    const metin = e.results[0]?.transcript ?? '';
    onMetin(birlestir(bas.current, metin));
  });
  useSpeechRecognitionEvent('error', (e) => {
    // Telefonun içinde Türkçe tanıma yoksa bir kez Apple'ın tanımasıyla dene.
    if (yerelDenendi.current && (e.error === 'language-not-supported' || e.error === 'service-not-allowed')) {
      yerelDenendi.current = false;
      basla(false);
      return;
    }
    setDinliyor(false);
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    setSorun(e.error === 'not-allowed' ? 'izinYok' : 'hata');
  });

  /** Dinlemeyi başlatır; `mevcut` metnin sonuna eklenir. */
  const baslat = async (mevcut: string): Promise<DikteSorunu | null> => {
    setSorun(null);
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return 'yok';
      const izin = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!izin.granted) return 'izinYok';
      bas.current = mevcut;
      const yerel = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      yerelDenendi.current = yerel;
      basla(yerel);
      setDinliyor(true);
      return null;
    } catch (e) {
      console.warn('Dikte başlatılamadı', e);
      return 'hata';
    }
  };

  /** Dinlemeyi bitirir; o ana kadar yazılan kalır. */
  const bitir = () => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.warn(e);
    }
    setDinliyor(false);
  };

  return { dinliyor, sorun, baslat, bitir };
}
