// Grup ekranındaki "+ Ekle" (pilot 19 Ekim: sadeleşti): ana türler — Yapılacak, Kart ver (P-62)
// (tek iş; P-60: liste Giriş → Listeler'de), Buluşma (gün belli ya da günü oylayarak), Birlikte rutin;
// az kullanılanlar "Diğer" altında: Nöbet / sıra, Oylama.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AltSayfa } from '../AltSayfa';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export type GrupEklemeTuru = 'yapilacak' | 'kart' | 'bulusma' | 'rutin' | 'nobet' | 'karar';

type Tur = { tur: GrupEklemeTuru; ad: string; aciklama: string; ikon: keyof typeof Ionicons.glyphMap };

const ANA: Tur[] = [
  {
    tur: 'yapilacak',
    ad: 'Yapılacak',
    aciklama: 'Bir iş: birine ver ya da herkese aç.',
    ikon: 'checkbox-outline',
  },
  {
    tur: 'kart',
    ad: 'Kart ver',
    aciklama: 'Kütüphanendeki ya da önerilerdeki bir kartı birinin ajandasına koy; yaptığı günleri görürsün.',
    ikon: 'gift-outline',
  },
  {
    tur: 'bulusma',
    ad: 'Buluşma',
    aciklama: 'Gün, saat, yer öner ya da günü birlikte seçin.',
    ikon: 'calendar-outline',
  },
  {
    tur: 'rutin',
    ad: 'Birlikte rutin',
    aciklama: '"Haftada 3 yürüyüş" gibi ortak hedef; kim kaç kez yaptı görünür.',
    ikon: 'repeat-outline',
  },
];

const DIGER: Tur[] = [
  {
    tur: 'nobet',
    ad: 'Nöbet / sıra',
    aciklama: 'Bulaşık, çöp gibi dönüşümlü iş; sırası gelenin ajandasına düşer.',
    ikon: 'swap-horizontal-outline',
  },
  {
    tur: 'karar',
    ad: 'Oylama',
    aciklama: '"Ne yiyelim?" gibi; herkes oy verir, sonucu sen seçersin.',
    ikon: 'stats-chart-outline',
  },
];

export function GrubaEkleSayfasi({
  grupAdi,
  onSec,
  onKapat,
}: {
  grupAdi: string;
  onSec: (tur: GrupEklemeTuru) => void;
  onKapat: () => void;
}) {
  const [diger, setDiger] = useState(false);
  const satir = (t: Tur) => (
    <Pressable
      key={t.tur}
      onPress={() => onSec(t.tur)}
      accessibilityRole="button"
      accessibilityLabel={`${t.ad}. ${t.aciklama}`}
      style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.simge}>
        <Ionicons name={t.ikon} size={24} color={renk.ana} />
      </View>
      <View style={stiller.esnek}>
        <Yazi tur="kartBasligi">{t.ad}</Yazi>
        <Yazi tur="ikincil">{t.aciklama}</Yazi>
      </View>
    </Pressable>
  );
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={`${grupAdi} · ekle`} sagKapat="Kapat">
      <View style={stiller.kap}>
        {ANA.map(satir)}
        <Pressable
          onPress={() => setDiger((d) => !d)}
          accessibilityRole="button"
          accessibilityState={{ expanded: diger }}
          style={stiller.digerBaslik}
          hitSlop={6}
        >
          <Yazi kalinlik="kalin" renk={renk.ana}>
            Diğer
          </Yazi>
          <Ionicons name={diger ? 'chevron-up' : 'chevron-down'} size={20} color={renk.ana} />
        </Pressable>
        {diger && DIGER.map(satir)}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 12 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  simge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1, gap: 2 },
  digerBaslik: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, alignSelf: 'flex-start' },
});
