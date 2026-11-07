// Alışkanlıklar (pilot 31 Ekim, P-78): Giriş → Devam edenler ve gidişat ekranı için süren
// alışkanlıklar, son 90 günün Yaptım günleri, seri ve programı.

import { useMemo } from 'react';

import { aliskanlikMi, kisaGidisat, surenAliskanlikMi } from '@/mantik/aliskanlik';
import { gorunurMu, seri } from '@/mantik/gorunurluk';
import type { Program } from '@/mantik/program';
import { gunEkle, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunlerinYapilanlari, tumKartlar, type KartOzeti } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';

import { useProgramlar } from '../yasam/useProgramlar';

export interface AliskanlikOzeti {
  /** Listenin maddesiyse günleri listenin günleri (P-110). */
  kart: KartOzeti;
  /** P-110: listenin maddesiyse listenin adı. */
  liste: string | null;
  /** Son 90 günün Yaptım günleri. */
  yapilan: ReadonlySet<Gun>;
  /** Bugün kartın günü mü (Giriş'te bugünün satırı). */
  bugunVar: boolean;
  yapildi: boolean;
  seri: number;
  /** "5 gün üst üste · 12/21. gün" */
  kisa: string;
  /** Programın kartıysa program. */
  program: Program | null;
}

const PENCERE = 90;

export function useAliskanliklar(): { yukleniyor: boolean; aliskanliklar: AliskanlikOzeti[] } {
  const bugunGun = useBugun();
  const { ozetler } = useProgramlar();
  const veri = useSorgu(
    ['kart', 'plan'],
    async (oku) => ({
      kartlar: await tumKartlar(oku),
      gunler: await gunlerinYapilanlari(oku, gunEkle(bugunGun, -PENCERE), bugunGun),
    }),
    [bugunGun],
  );
  const aliskanliklar = useMemo(() => {
    if (!veri.veri) return [];
    const { kartlar, gunler } = veri.veri;
    const kartinProgrami = new Map<string, Program>();
    for (const o of ozetler) for (const k of o.kartlar) kartinProgrami.set(k.id, o.program);
    // P-110: listenin maddesi listenin günlerini izler.
    const ustler = new Map(kartlar.map((k) => [k.id, k]));
    return kartlar
      .filter((k) => aliskanlikMi(k))
      .map((k) => {
        const ust = k.ust ? ustler.get(k.ust) : undefined;
        return {
          kart: ust ? { ...k, tarih: ust.tarih, tekrar: ust.tekrar, bitis: ust.bitis, atlanan: ust.atlanan } : k,
          liste: ust?.baslik ?? null,
        };
      })
      .filter(({ kart }) => surenAliskanlikMi(kart, bugunGun))
      .map(({ kart, liste }): AliskanlikOzeti => {
        const yapilan = new Set<Gun>();
        for (const [gun, kume] of gunler) if (kume.has(kart.id)) yapilan.add(gun);
        const s = seri(kart, yapilan, bugunGun);
        return {
          kart,
          liste,
          yapilan,
          bugunVar: gorunurMu(kart, bugunGun, bugunGun),
          yapildi: yapilan.has(bugunGun),
          seri: s,
          kisa: kisaGidisat(kart, yapilan, bugunGun, s),
          program: kartinProgrami.get(kart.id) ?? null,
        };
      })
      .sort((a, b) => Number(b.bugunVar) - Number(a.bugunVar) || a.kart.sira - b.kart.sira);
  }, [veri.veri, ozetler, bugunGun]);
  return { yukleniyor: veri.yukleniyor, aliskanliklar };
}
