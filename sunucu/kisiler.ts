// Kişiler ve bağlantılar (KS-1…KS-3): sunucu tarafı çağrıları.

import { epostaDuzelt, type KisiDurumu, type SunucuBaglantisi } from '@/mantik/kisiler';

import { sunucuGerekli } from './istemci';

interface BaglantiSatiri {
  a: string;
  b: string;
  durum: 'istek' | 'bagli';
  isteyen: string;
}

/** Benim bağlantılarım (karşı tarafın e-postası ve kendi verdiği adıyla) ve davetlerim. */
export async function baglantilariOku(ben: string): Promise<{ baglantilar: SunucuBaglantisi[]; davetler: string[] }> {
  const s = sunucuGerekli();
  const [b, d] = await Promise.all([
    s.from('baglanti').select('a, b, durum, isteyen'),
    s.from('davet').select('eposta'),
  ]);
  if (b.error) throw b.error;
  if (d.error) throw d.error;
  const satirlar = (b.data ?? []) as BaglantiSatiri[];
  const digerleri = satirlar.map((x) => (x.a === ben ? x.b : x.a));
  const kisiler = digerleri.length
    ? await s.from('kullanici').select('id, eposta, ad').in('id', digerleri)
    : { data: [] as { id: string; eposta: string; ad: string }[], error: null };
  if (kisiler.error) throw kisiler.error;
  const kim = new Map((kisiler.data ?? []).map((k) => [k.id, k]));
  return {
    baglantilar: satirlar.map((x) => {
      const diger = x.a === ben ? x.b : x.a;
      const k = kim.get(diger);
      return { diger, eposta: k?.eposta ?? '', ad: k?.ad ?? '', durum: x.durum, benIstedim: x.isteyen === ben };
    }),
    davetler: ((d.data ?? []) as { eposta: string }[]).map((x) => x.eposta),
  };
}

/** Kişi ekle: Rites'taysa bağlantı isteği, değilse davet (ve davet e-postası). */
export async function kisiyiEkle(eposta: string): Promise<{ sonuc: KisiDurumu; kullaniciId: string | null }> {
  const s = sunucuGerekli();
  const e = epostaDuzelt(eposta);
  const { data, error } = await s.rpc('kisi_ekle', { p_eposta: e });
  if (error) throw new Error(error.message);
  const sonuc = data as { sonuc: KisiDurumu; kullanici_id: string | null };
  if (sonuc.sonuc === 'davet') {
    // Davet e-postası gidemezse davet yine kayıtlıdır; kişi katılınca bağlanırsınız.
    const g = await s.functions.invoke('davet-gonder', { body: { eposta: e } });
    if (g.error) console.warn('Davet e-postası gönderilemedi', g.error);
  }
  return { sonuc: sonuc.sonuc, kullaniciId: sonuc.kullanici_id };
}

export async function istegiKabulEt(diger: string): Promise<void> {
  const { error } = await sunucuGerekli().rpc('istegi_kabul_et', { p_kisi: diger });
  if (error) throw error;
}

/** Reddet ya da Sil: bağlantı iki tarafta da kopar. */
export async function baglantiyiSil(ben: string, diger: string): Promise<void> {
  const [a, b] = ben < diger ? [ben, diger] : [diger, ben];
  const { error } = await sunucuGerekli().from('baglanti').delete().eq('a', a).eq('b', b);
  if (error) throw error;
}

export async function davetiSil(eposta: string): Promise<void> {
  const { error } = await sunucuGerekli().from('davet').delete().eq('eposta', eposta);
  if (error) throw error;
}
