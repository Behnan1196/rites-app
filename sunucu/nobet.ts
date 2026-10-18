// Nöbet / sıra (pilot 18 Ekim): sunucu çağrıları. Yazma yalnız işlevlerle.

import type { Nobet } from '@/mantik/nobet';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export interface NobetTanimi {
  ad: string;
  gunler: number[];
  sira: string[];
  baslangic: Gun;
}

export async function nobetleriOku(ilk: Gun): Promise<Nobet[]> {
  const { data, error } = await sunucuGerekli().rpc('nobetlerim', { p_ilk: ilk });
  if (error) throw error;
  return (data ?? []) as Nobet[];
}

const parametre = (t: NobetTanimi) => ({
  p_ad: t.ad.trim(),
  p_gunler: t.gunler,
  p_sira: t.sira,
  p_baslangic: t.baslangic,
});

export async function nobetKur(grup: string, t: NobetTanimi): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('nobet_kur', { p_grup: grup, ...parametre(t) });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function nobetDuzenle(id: string, t: NobetTanimi): Promise<void> {
  const { error } = await sunucuGerekli().rpc('nobet_duzenle', { p_nobet: id, ...parametre(t) });
  if (error) throw new Error(error.message);
}

export async function nobetIsaretle(id: string, gun: Gun, yapildi: boolean): Promise<void> {
  const { error } = await sunucuGerekli().rpc('nobet_isaretle', { p_nobet: id, p_gun: gun, p_yapildi: yapildi });
  if (error) throw new Error(error.message);
}

export async function nobetSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('nobet').delete().eq('id', id);
  if (error) throw error;
}
