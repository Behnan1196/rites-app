// Birlikte rutin (pilot 18 Ekim): sunucu çağrıları. Yazma yalnız işlevlerle.

import type { Rutin } from '@/mantik/rutin';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export async function rutinleriOku(ilk: Gun): Promise<Rutin[]> {
  const { data, error } = await sunucuGerekli().rpc('rutinlerim', { p_ilk: ilk });
  if (error) throw error;
  return (data ?? []) as Rutin[];
}

export async function rutinKur(grup: string, ad: string, hedef: number): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('rutin_kur', { p_grup: grup, p_ad: ad.trim(), p_hedef: hedef });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function rutinDuzenle(id: string, ad: string, hedef: number): Promise<void> {
  const { error } = await sunucuGerekli().rpc('rutin_duzenle', { p_rutin: id, p_ad: ad.trim(), p_hedef: hedef });
  if (error) throw new Error(error.message);
}

export async function rutineKatil(id: string, katil: boolean): Promise<void> {
  const { error } = await sunucuGerekli().rpc('rutine_katil', { p_rutin: id, p_katil: katil });
  if (error) throw new Error(error.message);
}

export async function rutinIsaretle(id: string, gun: Gun, yapildi: boolean): Promise<void> {
  const { error } = await sunucuGerekli().rpc('rutin_isaretle', { p_rutin: id, p_gun: gun, p_yapildi: yapildi });
  if (error) throw new Error(error.message);
}

export async function rutinSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('rutin').delete().eq('id', id);
  if (error) throw error;
}
