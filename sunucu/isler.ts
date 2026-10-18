// İş (pilot 18 Ekim): sunucu çağrıları. Yazma yalnız işlevlerle.

import type { GrupIsi, IsEylemi } from '@/mantik/isler';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export interface IsTanimi {
  baslik: string;
  tarih: Gun | null;
  kime: string | null;
}

export async function isleriOku(): Promise<GrupIsi[]> {
  const { data, error } = await sunucuGerekli().rpc('islerim');
  if (error) throw error;
  return (data ?? []) as GrupIsi[];
}

export async function isEkle(grup: string, t: IsTanimi): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('is_ekle', {
    p_grup: grup,
    p_baslik: t.baslik.trim(),
    p_tarih: t.tarih,
    p_kime: t.kime,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function isDuzenle(id: string, t: IsTanimi): Promise<void> {
  const { error } = await sunucuGerekli().rpc('is_duzenle', {
    p_is: id,
    p_baslik: t.baslik.trim(),
    p_tarih: t.tarih,
    p_kime: t.kime,
  });
  if (error) throw new Error(error.message);
}

export async function isYanitla(id: string, eylem: IsEylemi): Promise<void> {
  const { error } = await sunucuGerekli().rpc('is_yanitla', { p_is: id, p_eylem: eylem });
  if (error) throw new Error(error.message);
}

export async function isSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('grup_is').delete().eq('id', id);
  if (error) throw error;
}
