import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { BlokTuru } from '@/mantik/kart';

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

/** Blok türlerinin adı ve simgesi (K-6). İçerik blokları tanımdır; kayıt blokları her gün değer alır. */
export const BLOK_TURLERI: Record<BlokTuru, { ad: string; ikon: IkonAdi; kayit: boolean }> = {
  talimat: { ad: 'Talimat', ikon: 'reader-outline', kayit: false },
  video: { ad: 'Video', ikon: 'play-circle-outline', kayit: false },
  liste: { ad: 'Liste', ikon: 'checkbox-outline', kayit: false },
  foto: { ad: 'Fotoğraf', ikon: 'image-outline', kayit: false },
  dosya: { ad: 'Dosya', ikon: 'document-outline', kayit: false },
  sayac: { ad: 'Zamanlayıcı', ikon: 'timer-outline', kayit: true },
  olcum: { ad: 'Ölçüm', ikon: 'speedometer-outline', kayit: true },
  gunnot: { ad: 'Günün notu', ikon: 'chatbox-ellipses-outline', kayit: true },
  gelfoto: { ad: 'Gelişim fotoğrafı', ikon: 'camera-outline', kayit: true },
};
