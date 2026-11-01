import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { BlokTuru } from '@/mantik/kart';

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

/** Blok türlerinin adı ve simgesi (K-6). İçerik blokları tanımdır; kayıt blokları her gün değer alır. */
export const BLOK_TURLERI: Record<BlokTuru, { ad: string; ikon: IkonAdi; kayit: boolean }> = {
  talimat: { ad: 'Talimat', ikon: 'reader-outline', kayit: false },
  video: { ad: 'Video', ikon: 'play-circle-outline', kayit: false },
  // P-69: liste simgesi maddelerin kutularıyla karışmasın.
  liste: { ad: 'Liste', ikon: 'list-outline', kayit: false },
  // P-51: tek Liste; işaretleri kalan liste (eski adıyla Proje adımları) de "Liste".
  adimlar: { ad: 'Liste', ikon: 'list-outline', kayit: false },
  // P-83: işaretsiz liste ve Listeler'den bağlanan liste.
  bilgi: { ad: 'Liste', ikon: 'list-outline', kayit: false },
  listebag: { ad: 'Bağlı liste', ikon: 'link-outline', kayit: false },
  foto: { ad: 'Fotoğraf', ikon: 'image-outline', kayit: false },
  dosya: { ad: 'Dosya', ikon: 'document-outline', kayit: false },
  sayac: { ad: 'Zamanlayıcı', ikon: 'timer-outline', kayit: true },
  kronometre: { ad: 'Kronometre', ikon: 'stopwatch-outline', kayit: true },
  olcum: { ad: 'Ölçüm', ikon: 'speedometer-outline', kayit: true },
  adet: { ad: 'Sayarak', ikon: 'add-circle-outline', kayit: true },
  puan: { ad: 'Puan', ikon: 'star-half-outline', kayit: true },
  gunnot: { ad: 'Günün notu', ikon: 'chatbox-ellipses-outline', kayit: true },
  gelfoto: { ad: 'Gelişim fotoğrafı', ikon: 'camera-outline', kayit: true },
};
