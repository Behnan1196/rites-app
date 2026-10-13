// Gelenler: sunucudan okunur; gönderenin adı Kişilerim'deki adıysa o yazılır.

import { useCallback, useMemo } from 'react';

import { gelenleriOku } from '@/sunucu/gelenler';
import type { Oturum } from '@/sunucu/oturum';
import { useSunucu } from '@/sunucu/useSunucu';
import { useSorgu } from '@/veri/kancalar';
import { kisileriOku } from '@/veri/kisiler';

export function useGelenler(oturum: Oturum) {
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const yukle = useCallback(() => gelenleriOku(), []);
  const s = useSunucu(ben ? yukle : null, ben ?? '');
  const kisiler = useSorgu(['kisi'], (o) => kisileriOku(o), []);
  const gelenler = useMemo(
    () =>
      (s.veri ?? []).map((g) => ({
        ...g,
        kimdenAd: kisiler.veri?.find((k) => k.kullaniciId === g.kimdenId)?.ad ?? g.kimdenAd,
      })),
    [s.veri, kisiler.veri],
  );
  return { ben, gelenler, yukleniyor: s.yukleniyor, baglanamiyor: s.hata, yenile: s.yenile };
}
