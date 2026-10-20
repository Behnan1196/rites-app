// Yaşam Tarzım, Alan ekranı, Kütüphanem ve Giriş'teki Devam edenler için
// programların özeti ve alanların durumu.

import { useMemo } from 'react';

import { tumAlanlar, type Alan, type AlanAnahtari } from '@/mantik/alanlar';
import {
  bugunMetni,
  durumMetni,
  etkinDurum,
  programSirasi,
  siradakiMetni,
  type Program,
  type ProgramDurumu,
} from '@/mantik/program';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, type KartOzeti } from '@/veri/kartlar';
import { alanDurumlari, programAjandaKartlari, programlariOku, type AlanDurumu } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';

export interface ProgramOzeti {
  program: Program;
  durum: ProgramDurumu;
  /** "Uygulanıyor · 9. gün / 21" */
  durumMetni: string;
  /** Bu uygulamanın ajandadaki kartları (bağlı olanlar). */
  kartlar: KartOzeti[];
  /** "1 / 2 bugün"; uygulanmıyorsa ya da bugün kart yoksa null. */
  bugun: string | null;
  /** "Sıradaki: 07:30 Esneme" */
  siradaki: string;
}

export function useProgramlar(): {
  yukleniyor: boolean;
  ozetler: ProgramOzeti[];
  durumlar: Map<AlanAnahtari, AlanDurumu> | null;
  /** Hazır dokuz alan ve kişinin eklediği alanlar. */
  alanlar: Alan[];
} {
  const bugunGun = useBugun();
  const sorgu = useSorgu(
    ['plan', 'kart'],
    async (oku) => {
      const durumlar = await alanDurumlari(oku); // kişinin alanlarını da yükler
      return {
        durumlar,
        alanlar: tumAlanlar(),
        programlar: await programlariOku(oku),
        kartlar: await programAjandaKartlari(oku),
        yapilanlar: await gunYapilanlari(oku, bugunGun),
      };
    },
    [bugunGun],
  );

  const ozetler = useMemo(() => {
    if (!sorgu.veri) return [];
    const { programlar, kartlar, yapilanlar } = sorgu.veri;
    return programSirasi(programlar, bugunGun).map((program): ProgramOzeti => {
      const durum = etkinDurum(program, bugunGun);
      const bagli = kartlar.filter((k) => k.planId === program.id && k.bag !== null);
      const uygulaniyor = durum === 'uygulaniyor';
      return {
        program,
        durum,
        durumMetni: durumMetni(program, bugunGun),
        kartlar: bagli,
        bugun: uygulaniyor ? bugunMetni(bagli, yapilanlar, bugunGun) : null,
        siradaki: uygulaniyor ? siradakiMetni(bagli, yapilanlar, bugunGun) : '',
      };
    });
  }, [sorgu.veri, bugunGun]);

  return {
    yukleniyor: sorgu.yukleniyor,
    ozetler,
    durumlar: sorgu.veri?.durumlar ?? null,
    alanlar: sorgu.veri?.alanlar ?? tumAlanlar(),
  };
}

/** Yalnız alanlar (kişinin eklediği alanlar yüklenmiş olarak) ve durumları. */
export function useAlanlar(): { alanlar: Alan[]; durumlar: Map<AlanAnahtari, AlanDurumu> | null } {
  const sorgu = useSorgu(['plan'], async (oku) => {
    const durumlar = await alanDurumlari(oku);
    return { durumlar, alanlar: tumAlanlar() };
  });
  return { alanlar: sorgu.veri?.alanlar ?? tumAlanlar(), durumlar: sorgu.veri?.durumlar ?? null };
}
