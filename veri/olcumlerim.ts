// Ölçümlerim ile yaşam alanları (pilot 5 Kasım, P-95): alanların puanı Ölçümlerim'de tarihli bir
// ölçümdür ("Yaşam alanlarım": açık her alana 1–5, haftada bir, Pazar). Yaşam Tarzım'daki puan
// en son girilen değerdir: orada değişince bugünün ölçümü yazılır; Ölçümlerim'de en son güne
// girilen puan Yaşam Tarzım'a da yazılır. Gidişat ve program karşılaştırmasında öbür ölçümlerle
// yan yana görünür (beslenme kötü giden haftada enerjinin düşmesi gibi).

import { alanAdi, tumAlanlar, type AlanAnahtari } from '@/mantik/alanlar';
import { ALAN_PUANI_GUNU, olcumAlani, siklikYaz } from '@/mantik/olcumHazirlari';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu } from './kapi';
import { blokEkle, kartKayitlari, kayitDegistir, olcumlerimiKur, olcumlerimiOku, type KimlikUretici } from './kartlar';
import { alanDurumlari, alanDurumuYaz } from './programlar';

/** Açık alanlardan Ölçümlerim'de puanı olmayanlar (sırasıyla). */
export async function eklenecekAlanlar(oku: Okuyucu): Promise<AlanAnahtari[]> {
  const durumlar = await alanDurumlari(oku);
  const o = await olcumlerimiOku(oku);
  const var_ = new Set((o?.bloklar ?? []).map((b) => olcumAlani(b)).filter(Boolean));
  return tumAlanlar()
    .map((a) => a.anahtar)
    .filter((a) => durumlar.get(a)?.acik && !var_.has(a));
}

/**
 * "Yaşam alanlarım": açık her alan için haftalık (Pazar) puan ölçümü ekler; alanın bugünkü
 * puanı varsa bugünün değeri olarak yazılır (başlangıç). Eklenen sayısını döner.
 */
export async function alanOlcumleriniEkle(
  kapi: Kapi,
  oku: Okuyucu,
  bugunGun: Gun,
  idUret: KimlikUretici,
): Promise<number> {
  const eklenecek = await eklenecekAlanlar(oku);
  if (eklenecek.length === 0) return 0;
  const kartId = await olcumlerimiKur(kapi, oku, bugunGun, idUret);
  const durumlar = await alanDurumlari(oku);
  for (const alan of eklenecek) {
    const id = idUret();
    await blokEkle(kapi, kartId, { id, tur: 'puan', ad: alanAdi(alan), metin: siklikYaz(ALAN_PUANI_GUNU, alan) });
    const puan = durumlar.get(alan)?.puan ?? 0;
    if (puan > 0)
      await kayitDegistir(kapi, kartId, bugunGun, (k) => ({ ...k, degerler: { ...k.degerler, [id]: String(puan) } }));
  }
  return eklenecek.length;
}

/** Yaşam Tarzım'da puan değişince Ölçümlerim'de bugünün değeri (0: siler). */
export async function alanPuaniniOlcumeYaz(
  kapi: Kapi,
  oku: Okuyucu,
  alan: AlanAnahtari,
  puan: number,
  bugunGun: Gun,
): Promise<void> {
  const o = await olcumlerimiOku(oku);
  const b = o?.bloklar.find((x) => x.tur === 'puan' && olcumAlani(x) === alan);
  if (!o || !b) return;
  await kayitDegistir(kapi, o.kart.id, bugunGun, (k) => {
    const degerler = { ...k.degerler };
    if (puan > 0) degerler[b.id] = String(puan);
    else delete degerler[b.id];
    return { ...k, degerler };
  });
}

/**
 * Ölçümlerim'de alan puanı girilince: o gün bu ölçümün en son günü ise Yaşam Tarzım'daki puan
 * da o olur.
 */
export async function olcumdenAlanPuaniYaz(
  kapi: Kapi,
  oku: Okuyucu,
  kartId: string,
  blok: { id: string; metin: string },
  gun: Gun,
): Promise<void> {
  const alan = olcumAlani(blok);
  if (!alan) return;
  const kayitlar = await kartKayitlari(oku, kartId);
  const dolu = kayitlar
    .filter((k) => (k.degerler[blok.id] ?? '') !== '')
    .sort((a, b) => a.tarih.localeCompare(b.tarih));
  const son = dolu[dolu.length - 1];
  if (son && son.tarih > gun) return;
  // Bu günün değeri silindiyse kalan en son değer (o da yoksa 0).
  const puan = Number(son?.degerler[blok.id] ?? 0) || 0;
  await alanDurumuYaz(kapi, alan, { puan });
}
