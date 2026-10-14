// YouTube video başlığını oEmbed ile alır (anahtar gerekmez). Bağlantı yoksa ya
// da 4 sn içinde cevap gelmezse null; kart yine açılır.

import { oembedAdresi, oembedBasligi, youtubeMu } from '@/mantik/paylasimAl';

export async function videoBasligi(adres: string, sure = 4000): Promise<string | null> {
  if (!youtubeMu(adres)) return null;
  const iptal = new AbortController();
  const zaman = setTimeout(() => iptal.abort(), sure);
  try {
    const yanit = await fetch(oembedAdresi(adres), { signal: iptal.signal });
    if (!yanit.ok) return null;
    return oembedBasligi(await yanit.json());
  } catch {
    return null;
  } finally {
    clearTimeout(zaman);
  }
}
