// Ortak listeler ve maddeler (GR-2, GR-4): sunucu çağrıları.

import type { BanaVerilen, Madde, OrtakListe } from '@/mantik/listeler';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export async function listeleriOku(): Promise<OrtakListe[]> {
  const { data, error } = await sunucuGerekli().rpc('listelerim');
  if (error) throw error;
  return (data ?? []) as OrtakListe[];
}

export async function listeOlustur(ad: string, gruplar: string[], kisiler: string[]): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('liste_olustur', { p_ad: ad.trim(), p_gruplar: gruplar, p_kisiler: kisiler });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listeDuzenle(liste: string, ad: string, gruplar: string[], kisiler: string[]): Promise<void> {
  const { error } = await sunucuGerekli().rpc('liste_duzenle', {
    p_liste: liste,
    p_ad: ad.trim(),
    p_gruplar: gruplar,
    p_kisiler: kisiler,
  });
  if (error) throw new Error(error.message);
}

export async function listeyiSil(liste: string): Promise<void> {
  const { error } = await sunucuGerekli().from('liste').delete().eq('id', liste);
  if (error) throw error;
}

/** Listeye kişi olarak eklendiysen: Listeden ayrıl. */
export async function listedenAyril(liste: string, ben: string): Promise<void> {
  const { error } = await sunucuGerekli().from('liste_erisim').delete().eq('liste', liste).eq('kullanici', ben);
  if (error) throw error;
}

export async function maddeleriOku(liste: string): Promise<Madde[]> {
  const { data, error } = await sunucuGerekli()
    .from('madde')
    .select('id, liste, metin, yapildi, ekleyen, kime, tarih, sira')
    .eq('liste', liste)
    .order('sira');
  if (error) throw error;
  return (data ?? []) as Madde[];
}

export async function maddeEkle(liste: string, ben: string, metin: string): Promise<Madde> {
  const { data, error } = await sunucuGerekli()
    .from('madde')
    .insert({ liste, ekleyen: ben, metin: metin.trim() })
    .select('id, liste, metin, yapildi, ekleyen, kime, tarih, sira')
    .single();
  if (error) throw error;
  return data as Madde;
}

export async function maddeDegistir(
  id: string,
  degisiklik: Partial<{ yapildi: boolean; kime: string | null; tarih: Gun | null }>,
): Promise<void> {
  const { error } = await sunucuGerekli().from('madde').update(degisiklik).eq('id', id);
  if (error) throw error;
}

export async function maddeSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('madde').delete().eq('id', id);
  if (error) throw error;
}

export async function banaVerilenleriOku(): Promise<BanaVerilen[]> {
  const { data, error } = await sunucuGerekli().rpc('bana_verilenler');
  if (error) throw error;
  return (data ?? []) as BanaVerilen[];
}

/** Maddelerdeki değişiklikleri dinler (Supabase Realtime); dönen işlev aboneliği kapatır. */
export function maddeleriDinle(ad: string, filtre: string | null, onDegisti: () => void): () => void {
  const s = sunucuGerekli();
  const kanal = s
    .channel(ad)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'madde', ...(filtre ? { filter: filtre } : {}) }, () =>
      onDegisti(),
    )
    .subscribe();
  return () => {
    void s.removeChannel(kanal);
  };
}
