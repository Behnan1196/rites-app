// Gruplardan bana bekleyenler (Gelenler, Giriş kutusu, Gruplar sekmesi).

import { useCallback, useMemo } from 'react';

import { banaBekleyenler, gizliyeEkle } from '@/mantik/grupBekleyenler';
import { useOturum } from '@/sunucu/oturum';
import { ayarOku, ayarYaz } from '@/veri/ayar';
import { useSorgu } from '@/veri/kancalar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { useBulusmalar } from './Bulusmalar';
import { useIsler } from './Isler';
import { useKararlar } from './Kararlar';
import { useRutinler } from './Rutinler';

export function useGrupBekleyenleri() {
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const bugunGun = useBugun();
  const { kapi } = useVeri();
  const { isler, yenile: isYenile } = useIsler();
  const { bulusmalar, yenile: bulusmaYenile } = useBulusmalar();
  const { kararlar, yenile: kararYenile } = useKararlar();
  const { rutinler, yenile: rutinYenile } = useRutinler();
  const gizli = useSorgu(['ayar'], async (o) => (await ayarOku(o, 'gelen_gizli')) ?? [], []).veri;
  const bekleyenler = useMemo(
    () => (ben ? banaBekleyenler({ isler, bulusmalar, kararlar, rutinler }, ben, bugunGun, new Set(gizli ?? [])) : []),
    [ben, isler, bulusmalar, kararlar, rutinler, bugunGun, gizli],
  );
  const gizle = useCallback(
    (anahtar: string) => ayarYaz(kapi, 'gelen_gizli', gizliyeEkle(gizli ?? [], anahtar)),
    [kapi, gizli],
  );
  /** Ekran öne gelince sunucudan tazele. */
  const yenile = useCallback(
    () => Promise.all([isYenile(), bulusmaYenile(), kararYenile(), rutinYenile()]).then(() => undefined),
    [isYenile, bulusmaYenile, kararYenile, rutinYenile],
  );
  return { ben, bekleyenler, gizle, yenile };
}
