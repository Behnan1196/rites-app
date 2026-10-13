// Ortak listelerim: sunucudan, ekran öne gelince tazelenir.

import { useCallback, useMemo } from 'react';

import { adBulucu } from '@/mantik/gruplar';
import { listeleriOku } from '@/sunucu/listeler';
import type { Oturum } from '@/sunucu/oturum';
import { useSunucu } from '@/sunucu/useSunucu';
import { useSorgu } from '@/veri/kancalar';
import { kisileriOku } from '@/veri/kisiler';

export function useListeler(oturum: Oturum) {
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const yukle = useCallback(() => listeleriOku(), []);
  const s = useSunucu(ben ? yukle : null, `listeler:${ben ?? ''}`);
  const kisiler = useSorgu(['kisi'], (o) => kisileriOku(o), []);
  const listeler = useMemo(() => s.veri ?? [], [s.veri]);
  const ad = useMemo(
    () => adBulucu(ben ?? '', kisiler.veri ?? [], listeler.flatMap((l) => l.uyeler)),
    [ben, kisiler.veri, listeler],
  );
  return {
    ben,
    listeler,
    kisiler: kisiler.veri ?? [],
    ad,
    yukleniyor: s.yukleniyor,
    baglanamiyor: s.hata,
    yenile: s.yenile,
  };
}
