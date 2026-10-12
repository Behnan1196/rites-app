// Yaşam Tarzım, Alan ekranı ve Giriş'teki Devam edenler için planların özeti.

import { useMemo } from 'react';

import type { AlanAnahtari } from '@/mantik/alanlar';
import { ilerleme, ilerlemeMetni, planMetaMetni, siradakiMetni, type Plan } from '@/mantik/plan';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, planliKartlar, type KartOzeti } from '@/veri/kartlar';
import { alanDurumlari, planlariOku, type AlanDurumu } from '@/veri/planlar';
import { useBugun } from '@/veri/useBugun';

export interface PlanOzeti {
  plan: Plan;
  kartlar: KartOzeti[];
  /** "İş · Bitiş: 30 Ekim (19 gün)" */
  meta: string;
  /** "0 / 1 bugün · 1 / 3 adım" */
  ilerleme: string;
  /** "Sıradaki: 07:30 Tai chi" */
  siradaki: string;
}

export function usePlanlar(): {
  yukleniyor: boolean;
  ozetler: PlanOzeti[];
  durumlar: Map<AlanAnahtari, AlanDurumu> | null;
} {
  const bugunGun = useBugun();
  const sorgu = useSorgu(
    ['plan', 'kart'],
    async (oku) => ({
      planlar: await planlariOku(oku),
      kartlar: await planliKartlar(oku),
      durumlar: await alanDurumlari(oku),
      yapilanlar: await gunYapilanlari(oku, bugunGun),
    }),
    [bugunGun],
  );

  const ozetler = useMemo(() => {
    if (!sorgu.veri) return [];
    const { planlar, kartlar, yapilanlar } = sorgu.veri;
    return planlar.map((plan): PlanOzeti => {
      const pk = kartlar.filter((k) => k.planId === plan.id);
      return {
        plan,
        kartlar: pk,
        meta: planMetaMetni(plan, bugunGun),
        ilerleme: ilerlemeMetni(ilerleme(pk, yapilanlar, bugunGun)),
        siradaki: siradakiMetni(pk, yapilanlar, bugunGun),
      };
    });
  }, [sorgu.veri, bugunGun]);

  return { yukleniyor: sorgu.yukleniyor, ozetler, durumlar: sorgu.veri?.durumlar ?? null };
}
