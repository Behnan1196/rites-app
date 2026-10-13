// Gruplarım ve beni çağıran gruplar: sunucudan, ekran öne gelince tazelenir.
// Adlar Kişilerim'deki adlarla gösterilir (`adBulucu`).

import { useCallback, useMemo } from 'react';

import { adBulucu, grupDavetleri, uyeOlduklarim, type SunucuKisisi } from '@/mantik/gruplar';
import { gruplariOku } from '@/sunucu/gruplar';
import type { Oturum } from '@/sunucu/oturum';
import { useSunucu } from '@/sunucu/useSunucu';
import { useSorgu } from '@/veri/kancalar';
import { kisileriOku } from '@/veri/kisiler';

export function useGruplar(oturum: Oturum) {
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const yukle = useCallback(() => gruplariOku(), []);
  const s = useSunucu(ben ? yukle : null, `gruplar:${ben ?? ''}`);
  const kisiler = useSorgu(['kisi'], (o) => kisileriOku(o), []);
  const gruplar = useMemo(() => s.veri ?? [], [s.veri]);
  const ad = useMemo(() => {
    const bilinenler: SunucuKisisi[] = gruplar.flatMap((g) => g.uyeler);
    return adBulucu(ben ?? '', kisiler.veri ?? [], bilinenler);
  }, [ben, kisiler.veri, gruplar]);
  return {
    ben,
    gruplar: uyeOlduklarim(gruplar),
    davetler: grupDavetleri(gruplar),
    kisiler: kisiler.veri ?? [],
    ad,
    yukleniyor: s.yukleniyor,
    baglanamiyor: s.hata,
    yenile: s.yenile,
  };
}
