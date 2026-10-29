// Buluşma (pilot 18 Ekim): sunucu çağrıları. Yazma yalnız işlevlerle; silme satır
// düzeyi yetkiyle (kuran ya da grubun kurucusu).

import type { Bulusma, BulusmaYaniti } from '@/mantik/bulusma';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export interface BulusmaTanimi {
  baslik: string;
  gun: Gun;
  saat: string | null;
  yer: string;
  /** Görüntülü görüşme bağlantısı (P-62); yoksa boş. */
  baglanti?: string;
}

export async function bulusmalariOku(): Promise<Bulusma[]> {
  const { data, error } = await sunucuGerekli().rpc('bulusmalarim');
  if (error) throw error;
  return (data ?? []) as Bulusma[];
}

export async function bulusmaKur(grup: string, t: BulusmaTanimi): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('bulusma_kur', {
    p_grup: grup,
    p_baslik: t.baslik.trim(),
    p_gun: t.gun,
    p_saat: t.saat,
    p_yer: t.yer.trim(),
    p_baglanti: t.baglanti ?? '',
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function bulusmaDuzenle(id: string, t: BulusmaTanimi): Promise<void> {
  const { error } = await sunucuGerekli().rpc('bulusma_duzenle', {
    p_bulusma: id,
    p_baslik: t.baslik.trim(),
    p_gun: t.gun,
    p_saat: t.saat,
    p_yer: t.yer.trim(),
    p_baglanti: t.baglanti ?? '',
  });
  if (error) throw new Error(error.message);
}

/** null: yanıtı geri al. */
export async function bulusmaYanitla(id: string, yanit: BulusmaYaniti | null): Promise<void> {
  const { error } = await sunucuGerekli().rpc('bulusma_yanitla', { p_bulusma: id, p_yanit: yanit });
  if (error) throw new Error(error.message);
}

export async function bulusmaSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('bulusma').delete().eq('id', id);
  if (error) throw error;
}
