// Zamanlayıcı kur (pilot 23 Ekim, P-31 / P-32): form yok, kutunun içinde
// kadran açılır; 5 dk'ya ayarlı gelir. Tutamak çevrilerek 0–60 dk seçilir,
// ortadaki Başlat kurar; sağ üstteki ✕ kapatır. Ad süredir ("5 dk"); her zaman
// alarm olarak çalar (telefon alarmı desteklemiyorsa bildirim), ertele 1 dk.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { VARSAYILAN_ZAMANLAYICI_DK, zamanlayiciSuresiMetni } from '@/mantik/zamanlayici';
import { zamanlayiciKur } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { renk } from '../tema';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Kadran } from './Kadran';

export function ZamanlayiciKurucu({ onKapat }: { onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const [dk, setDk] = useState(VARSAYILAN_ZAMANLAYICI_DK);
  const [calisiyor, setCalisiyor] = useState(false);

  const baslat = async () => {
    if (calisiyor || dk <= 0) return;
    setCalisiyor(true);
    try {
      if (alarmDestegi) await izinIste();
      const ms = dk * 60_000;
      await zamanlayiciKur(kapi, {
        id: yeniKimlik(),
        ad: zamanlayiciSuresiMetni(ms),
        ms,
        alarm: alarmDestegi,
        ses: null,
      });
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
    <View>
      <Kadran dk={dk} onDegis={setDk} onBaslat={() => void baslat()} pasif={calisiyor || dk <= 0} />
      <Pressable
        onPress={onKapat}
        accessibilityRole="button"
        accessibilityLabel="Zamanlayıcıyı kapat"
        hitSlop={6}
        style={({ pressed }) => [stiller.kapat, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="close" size={24} color={renk.ikincil} />
      </Pressable>
    </View>
  );
}

const stiller = StyleSheet.create({
  kapat: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
