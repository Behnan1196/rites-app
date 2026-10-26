// Kart çeşitlerinin tasarımı (pilot 24 Ekim, P-41): yalnız tasarımcı hesaplar
// (sunucuda `tasarimci` tablosu). Tasarımcı yayında olmayanları da görür; yazdığı
// çeşit `icerik_cesit`e gider, oradan herkesin kataloğuna iner. Kişinin verisi
// buradan sunucuya gitmez: yalnız çeşidin kalıbı (ad, parçalar, zaman).

import { cesitCoz, type KartCesidi } from '@/mantik/katalog';

import { CESIT_SUTUNLARI } from './katalog';
import { sunucu } from './istemci';

export interface TasarimCesidi extends KartCesidi {
  /** Yayında mı (herkese iner mi). */
  aktif: boolean;
  sira: number;
}

/** Bu oturum tasarımcı mı? Bağlanamazsa ya da sunucu kurulmadıysa hayır. */
export async function tasarimciMiyim(): Promise<boolean> {
  if (!sunucu) return false;
  const { data, error } = await sunucu.rpc('tasarimci_miyim');
  return !error && data === true;
}

/** Bütün çeşitler, yayında olmayanlar da (sıraya göre). */
export async function tasarimCesitleri(): Promise<TasarimCesidi[]> {
  if (!sunucu) return [];
  const { data, error } = await sunucu.from('icerik_cesit').select(CESIT_SUTUNLARI).order('sira');
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown>[]).flatMap((x) => {
    const c = cesitCoz(x);
    return c ? [{ ...c, aktif: x.aktif !== false, sira: typeof x.sira === 'number' ? x.sira : 0 }] : [];
  });
}

/** Yeni çeşit ya da değişiklik. */
export async function cesitYaz(c: TasarimCesidi): Promise<void> {
  if (!sunucu) throw new Error('Sunucu ayarlı değil');
  const { error } = await sunucu.from('icerik_cesit').upsert({
    id: c.id,
    alan: c.alan,
    ad: c.ad,
    ikon: c.ikon,
    aciklama: c.aciklama,
    baslik: c.baslik,
    baslik_ipucu: c.baslikIpucu,
    saat: c.saat,
    tekrar: c.tekrar,
    bloklar: c.bloklar.map(({ dosya: _d, ...b }) => b),
    seri: c.seri,
    sira: c.sira,
    aktif: c.aktif,
  });
  if (error) throw new Error(error.message);
}
