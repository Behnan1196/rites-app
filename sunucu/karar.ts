// Karar / oylama (pilot 18 Ekim): sunucu çağrıları. Yazma yalnız işlevlerle.

import type { Karar, KararTuru, SecenekTaslagi } from '@/mantik/karar';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export interface KararTanimi {
  soru: string;
  tur: KararTuru;
  coklu: boolean;
  sonGun: Gun | null;
  yer: string;
  secenekler: SecenekTaslagi[];
}

export async function kararlariOku(): Promise<Karar[]> {
  const { data, error } = await sunucuGerekli().rpc('kararlarim');
  if (error) throw error;
  return (data ?? []) as Karar[];
}

export async function kararKur(grup: string, t: KararTanimi): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('karar_kur', {
    p_grup: grup,
    p_soru: t.soru.trim(),
    p_tur: t.tur,
    p_coklu: t.coklu,
    p_son_gun: t.sonGun,
    p_yer: t.yer.trim(),
    p_secenekler: t.secenekler,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function kararOyla(id: string, secenekler: string[]): Promise<void> {
  const { error } = await sunucuGerekli().rpc('karar_oyla', { p_karar: id, p_secenekler: secenekler });
  if (error) throw new Error(error.message);
}

/** Döner: kurulan buluşmanın kimliği (gün kararında) ya da null. */
export async function kararVer(id: string, secenek: string): Promise<string | null> {
  const { data, error } = await sunucuGerekli().rpc('karar_ver', { p_karar: id, p_secenek: secenek });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

export async function kararSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('karar').delete().eq('id', id);
  if (error) throw error;
}
