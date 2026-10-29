// Kart verme (pilot 29 Ekim, P-62): sunucu çağrıları. İzin ve kart verme yalnız
// işlevlerle; "Yaptım" günlerini alan yazar ve siler; veren "Geri al" ile siler.

import type { AjandaIzni, VerilenKart } from '@/mantik/kartVerme';
import type { KartPaketi } from '@/mantik/paylasim';
import type { Gun } from '@/mantik/tarih';

import { sunucuGerekli } from './istemci';

export async function izinleriOku(): Promise<AjandaIzni[]> {
  const { data, error } = await sunucuGerekli().from('ajanda_izni').select('sahip, yetkili, durum');
  if (error) throw error;
  return (data ?? []) as AjandaIzni[];
}

/** Yetkili: kişiden ajandasına kart eklemek için izin ister. */
export async function izinIste(sahip: string): Promise<void> {
  const { error } = await sunucuGerekli().rpc('ajanda_izni_iste', { p_sahip: sahip });
  if (error) throw new Error(error.message);
}

/** Sahip: izin verir (istek varsa kabul eder) ya da kaldırır / reddeder. */
export async function izinVer(yetkili: string, ver: boolean): Promise<void> {
  const { error } = await sunucuGerekli().rpc('ajanda_izni_ver', { p_yetkili: yetkili, p_ver: ver });
  if (error) throw new Error(error.message);
}

/** Verdiğim ve bana verilen kartlar, "Yaptım" günleriyle. */
export async function verilenleriOku(): Promise<VerilenKart[]> {
  const { data, error } = await sunucuGerekli()
    .from('verilen_kart')
    .select('id, veren, alan, kart, baslangic, durum, olusturma, verilen_yapildi(gun)')
    .order('olusturma');
  if (error) throw error;
  type Satir = Omit<VerilenKart, 'yapilan'> & { verilen_yapildi: { gun: Gun }[] | null };
  return ((data ?? []) as Satir[]).map(({ verilen_yapildi, ...v }) => ({
    ...v,
    yapilan: (verilen_yapildi ?? []).map((y) => y.gun).sort(),
  }));
}

export async function kartVer(alan: string, kart: KartPaketi, baslangic: Gun): Promise<string> {
  const { data, error } = await sunucuGerekli().rpc('kart_ver', { p_alan: alan, p_kart: kart, p_baslangic: baslangic });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Alan: "Bırak". */
export async function kartiBirak(id: string): Promise<void> {
  const { error } = await sunucuGerekli().rpc('karti_birak', { p_kart: id });
  if (error) throw new Error(error.message);
}

/** Veren: "Geri al" (kart alanın ajandasından da kalkar). */
export async function verileniSil(id: string): Promise<void> {
  const { error } = await sunucuGerekli().from('verilen_kart').delete().eq('id', id);
  if (error) throw error;
}

export async function yaptimYaz(kart: string, gun: Gun): Promise<void> {
  const { error } = await sunucuGerekli().from('verilen_yapildi').upsert({ kart, gun }, { ignoreDuplicates: true });
  if (error) throw error;
}

export async function yaptimSil(kart: string, gun: Gun): Promise<void> {
  const { error } = await sunucuGerekli().from('verilen_yapildi').delete().eq('kart', kart).eq('gun', gun);
  if (error) throw error;
}

/** Kişilerin kendi verdiği adlar (Kişilerim'de adı yoksa). */
export async function kullaniciAdlari(idler: readonly string[]): Promise<Map<string, string>> {
  if (idler.length === 0) return new Map();
  const { data, error } = await sunucuGerekli().from('kullanici').select('id, ad, eposta').in('id', [...idler]);
  if (error) throw error;
  return new Map(((data ?? []) as { id: string; ad: string; eposta: string }[]).map((k) => [k.id, k.ad || k.eposta]));
}
