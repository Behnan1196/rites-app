// Giriş kutularının simgeleri (pilot 21 Ekim): kutunun başlığındaki modül düğmesi
// ve "Giriş'te neler görünsün?" listesi aynı simgeyi kullanır.

import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import type { KutuAnahtari } from '@/mantik/giris';

import { renk } from '../tema';

/** Kutunun simgesinin arka rengi ve kendi rengi (Anımsatıcılar kehribar, öbürleri ana renk). */
export function kutuRengi(k: KutuAnahtari): { zemin: string; simge: string } {
  return k === 'animsatici'
    ? { zemin: renk.vurguAcik, simge: renk.vurguYazi }
    : { zemin: renk.anaAcik, simge: renk.ana };
}

export function KutuSimgesi({ k, renkler, boyut = 24 }: { k: KutuAnahtari; renkler?: string; boyut?: number }) {
  const r = renkler ?? kutuRengi(k).simge;
  switch (k) {
    case 'not':
      return <MaterialCommunityIcons name="note-multiple-outline" size={boyut} color={r} />;
    case 'gelenler':
      return <Ionicons name="file-tray-outline" size={boyut} color={r} />;
    case 'bugun':
      return <Ionicons name="calendar-outline" size={boyut} color={r} />;
    case 'animsatici':
      return <Ionicons name="notifications-outline" size={boyut} color={r} />;
    case 'devam':
      return <Ionicons name="leaf-outline" size={boyut} color={r} />;
    case 'olcum':
      return <Ionicons name="speedometer-outline" size={boyut} color={r} />;
    case 'soru':
      return <Ionicons name="help-circle-outline" size={boyut} color={r} />;
    case 'su':
      return <Ionicons name="water-outline" size={boyut} color={r} />;
    case 'ortak':
      return <Ionicons name="list-outline" size={boyut} color={r} />;
  }
}
