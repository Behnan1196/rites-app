// Gruplar (GR-1): sunucu çağrıları. Yazma yalnız işlevlerle; çıkarma, ayrılma ve
// silme satır düzeyi yetkiyle.

import type { Grup } from '@/mantik/gruplar';

import { sunucuGerekli } from './istemci';

export async function gruplariOku(): Promise<Grup[]> {
  const { data, error } = await sunucuGerekli().rpc('gruplarim');
  if (error) throw error;
  return (data ?? []) as Grup[];
}

export async function grupKur(ad: string, uyeler: string[]): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('grup_kur', { p_ad: ad.trim(), p_uyeler: uyeler });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function grubaCagir(grup: string, kisi: string): Promise<void> {
  const { error } = await sunucuGerekli().rpc('gruba_cagir', { p_grup: grup, p_kisi: kisi });
  if (error) throw new Error(error.message);
}

export async function grupDaveteYanit(grup: string, katil: boolean): Promise<void> {
  const { error } = await sunucuGerekli().rpc('grup_davetini_yanitla', { p_grup: grup, p_katil: katil });
  if (error) throw new Error(error.message);
}

/** Kuran başkasını çıkarır; üye kendini çıkarırsa gruptan ayrılır. */
export async function gruptanCikar(grup: string, kisi: string): Promise<void> {
  const { error } = await sunucuGerekli().from('grup_uye').delete().eq('grup', grup).eq('kullanici', kisi);
  if (error) throw error;
}

export async function grubuSil(grup: string): Promise<void> {
  const { error } = await sunucuGerekli().from('grup').delete().eq('id', grup);
  if (error) throw error;
}
