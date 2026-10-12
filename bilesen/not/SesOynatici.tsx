// Sesli notu dinletme düğmesi (Dinle / Durdur).

import Ionicons from '@expo/vector-icons/Ionicons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function SesOynatici({ uri }: { uri: string }) {
  const oynatici = useAudioPlayer(uri);
  const durum = useAudioPlayerStatus(oynatici);

  // Bitince başa sar; bir sonraki dokunuş baştan çalsın.
  useEffect(() => {
    if (durum.didJustFinish) void oynatici.seekTo(0);
  }, [durum.didJustFinish, oynatici]);

  const bas = async () => {
    if (durum.playing) {
      oynatici.pause();
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    oynatici.play();
  };

  return (
    <Pressable
      onPress={() => void bas()}
      accessibilityRole="button"
      accessibilityLabel={durum.playing ? 'Durdur' : 'Sesli notu dinle'}
      style={({ pressed }) => [stiller.dugme, pressed && { opacity: 0.75 }]}
    >
      <Ionicons name={durum.playing ? 'pause' : 'play'} size={24} color={renk.yuzey} />
      <Yazi kalinlik="kalin" renk={renk.yuzey}>
        {durum.playing ? 'Durdur' : 'Dinle'}
      </Yazi>
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  dugme: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    borderRadius: olcu.kose.dugme,
    backgroundColor: renk.vurguYazi,
  },
});
