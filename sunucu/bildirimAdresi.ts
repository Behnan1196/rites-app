// Telefonun bildirim adresi (pilot 19 Ekim): sunucu Gelenler'e bir şey düşünce buraya bildirim gönderir.

import { sunucuGerekli } from './istemci';

export async function bildirimAdresiYaz(jeton: string, acik: boolean): Promise<void> {
  const { error } = await sunucuGerekli().rpc('bildirim_adresi_yaz', { p_jeton: jeton, p_acik: acik });
  if (error) throw new Error(error.message);
}
