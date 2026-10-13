// Gelenler ve kart gönderme (L-4).

import { paketGecerliMi, type KartPaketi } from '@/mantik/paylasim';

import { sunucuGerekli } from './istemci';

export interface Gelen {
  id: string;
  kimdenId: string;
  /** Gönderenin kendi adı (Kişilerim'deki adı varsa çağıran onu kullanır). */
  kimdenAd: string;
  gonderim: string;
  paket: KartPaketi;
}

export async function gelenleriOku(): Promise<Gelen[]> {
  const s = sunucuGerekli();
  const { data, error } = await s.from('gelen').select('id, kimden, kart, gonderim').order('gonderim', { ascending: false });
  if (error) throw error;
  const satirlar = (data ?? []) as { id: string; kimden: string; kart: unknown; gonderim: string }[];
  const kimler = [...new Set(satirlar.map((x) => x.kimden))];
  const adlar = kimler.length ? await s.from('kullanici').select('id, ad, eposta').in('id', kimler) : { data: [] };
  const ad = new Map(((adlar.data ?? []) as { id: string; ad: string; eposta: string }[]).map((k) => [k.id, k.ad || k.eposta]));
  return satirlar
    .filter((x) => paketGecerliMi(x.kart))
    .map((x) => ({ id: x.id, kimdenId: x.kimden, kimdenAd: ad.get(x.kimden) ?? '', gonderim: x.gonderim, paket: x.kart as KartPaketi }));
}

export async function kartGonder(ben: string, kime: string, paket: KartPaketi): Promise<void> {
  const { error } = await sunucuGerekli().from('gelen').insert({ kimden: ben, kime, kart: paket });
  if (error) throw error;
}

export async function geleniSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('gelen').delete().eq('id', id);
  if (error) throw error;
}
