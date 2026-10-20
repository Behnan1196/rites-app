// İçerik kataloğunun telefondaki kopyası (`ayar`: katalog, katalog_denendi) ve
// gizlenen öneriler (pilot 20 Ekim).

import { katalogAyarla, katalogCoz, type Katalog } from '@/mantik/katalog';

import { ayarOku } from './ayar';
import type { Kapi, Okuyucu, SqlDeger } from './kapi';

/** Telefonda saklı katalog (varsa) şu anki katalog olur. */
export async function sakliKataloguYukle(oku: Okuyucu): Promise<Katalog | null> {
  const k = katalogCoz(await ayarOku(oku, 'katalog'));
  katalogAyarla(k);
  return k;
}

const ayarYazY = (anahtar: string, deger: unknown): [string, SqlDeger[]] => [
  'INSERT INTO ayar (anahtar, deger) VALUES (?, ?) ON CONFLICT(anahtar) DO UPDATE SET deger = excluded.deger',
  [anahtar, JSON.stringify(deger)],
];

/** Yeni katalog: saklanır, şu anki katalog olur; alanları ve önerileri gösteren ekranlar tazelenir. */
export async function katalogKaydet(kapi: Kapi, k: Katalog, simdi: string = new Date().toISOString()): Promise<void> {
  await kapi.yaz(['ayar', 'plan', 'kutuphane'], async (y) => {
    await y.calistir(...ayarYazY('katalog', k));
    await y.calistir(...ayarYazY('katalog_denendi', simdi));
  });
  katalogAyarla(k);
}

/** İndirme denendi (değişiklik yok ya da bağlanamadı): yalnız zaman yazılır. */
export function katalogDenendi(kapi: Kapi, simdi: string = new Date().toISOString()): Promise<void> {
  return kapi.yaz(['ayar'], (y) => y.calistir(...ayarYazY('katalog_denendi', simdi)));
}

/** Gizlenen öneri: program `p:<id>`, kart `k:<id>`. */
export async function gizliOneriler(oku: Okuyucu): Promise<Set<string>> {
  return new Set((await ayarOku(oku, 'gizli_oneriler')) ?? []);
}

export function oneriGizle(kapi: Kapi, anahtar: string, gizle: boolean): Promise<void> {
  return kapi.yaz(['ayar', 'kutuphane'], async (y) => {
    const s = await y.ilk<{ deger: string }>("SELECT deger FROM ayar WHERE anahtar = 'gizli_oneriler'");
    let liste: string[] = [];
    try {
      liste = s ? (JSON.parse(s.deger) as string[]) : [];
    } catch {
      liste = [];
    }
    const yeni = gizle ? [...new Set([...liste, anahtar])] : liste.filter((x) => x !== anahtar);
    await y.calistir(...ayarYazY('gizli_oneriler', yeni));
  });
}
