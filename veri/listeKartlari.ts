// Listeler (pilot 7 Kasım, P-110): Giriş → Listeler'deki kişisel liste, maddeleri kart olan bir
// karttır (`kart.listede`, çeşidi `kart.rutin`). Ajandada yalnız "Ajandada göster" ile
// (listenin günleri kartın tekrarı). Adımlar'da bir maddeye gün verilirse madde o gün
// ajandada tek başına görünür (tekrarsız adım). Paylaşınca maddeler yazı olarak ortak listeye
// gider ve kart silinir. Eski Listelerim (`yerel_liste`) bir kez bu yapıya çevrilir.

import { listeCesidindenRutin, RUTIN_BILGI, RUTIN_GUNLUK, type RutinCesidi } from '@/mantik/rutinAdimlari';
import { yeniKart, type Kart } from '@/mantik/kart';
import { bosTablo, tabloYaz } from '@/mantik/tablo';
import type { Gun } from '@/mantik/tarih';

import { ayarOku, ayarYaz } from './ayar';
import type { Kapi, Okuyucu } from './kapi';
import {
  isaretle,
  kartAyrinti,
  kartlariSil,
  tumKartlar,
  yeniKartKaydet,
  type KartOzeti,
  type KimlikUretici,
} from './kartlar';
import { rutinAdimiEkle, rutinAdimlari, rutinYapilanlari } from './rutinler';

const HER_GUN = { gunSayisi: null, gunler: null, desen: 'hergun' as const };

export interface ListeKarti {
  kart: KartOzeti;
  yapilan: number;
  toplam: number;
  /** P-120: tabloysa satır sayısı. */
  tablo: number | null;
}

/** Listeler'deki listeler (sırasıyla) ve bugünkü ilerlemeleri. */
export async function listeKartlariniOku(oku: Okuyucu, gun: Gun): Promise<ListeKarti[]> {
  const hepsi = await tumKartlar(oku);
  const sonuc: ListeKarti[] = [];
  for (const k of hepsi.filter((x) => x.listede && !x.ust)) {
    const adimlar = hepsi.filter((x) => x.ust === k.id);
    const yapilanlar = await rutinYapilanlari(oku, k, gun);
    const t = k.rutin
      ? null
      : await oku.ilk<{ maddeler: string }>("SELECT maddeler FROM blok WHERE kart_id = ? AND tur = 'tablo' LIMIT 1", [
          k.id,
        ]);
    sonuc.push({
      kart: k,
      toplam: adimlar.length,
      yapilan: adimlar.filter((a) => yapilanlar.has(a.id)).length,
      tablo: t ? (JSON.parse(t.maddeler || '[]') as unknown[]).length : null,
    });
  }
  return sonuc;
}

/** Yeni liste (her gün; ajandada değil); kimliğini döner. */
export async function listeKartiKur(
  kapi: Kapi,
  oku: Okuyucu,
  ad: string,
  cesit: RutinCesidi,
  bugunGun: Gun,
  idUret: KimlikUretici,
  maddeler: readonly { metin: string; yapildi?: boolean; yapildiGun?: Gun | null; tarih?: Gun | null }[] = [],
  aciklama = '',
): Promise<string> {
  const id = idUret();
  const kart: Kart = yeniKart(id, {
    baslik: ad.trim(),
    kisa: aciklama,
    tarih: bugunGun,
    tekrar: HER_GUN,
    rutin: cesit,
    // P-120: Günlük kontrol zamana bağlıdır; Listeler'de değil ajandada durur.
    ...(cesit === RUTIN_GUNLUK ? {} : { listede: true, ajandada: false }),
  });
  await yeniKartKaydet(kapi, kart, [], idUret);
  for (const m of maddeler) {
    const adim = await rutinAdimiEkle(kapi, oku, kart, m.metin, bugunGun, idUret);
    if (m.tarih) await adimGunuYaz(kapi, oku, adim, m.tarih);
    if (!m.yapildi || cesit === RUTIN_BILGI) continue;
    // Günlük kontrolde yalnız bugünün işareti; Adımlar'da yapıldığı gün.
    if (cesit === RUTIN_GUNLUK) {
      if (m.yapildiGun === bugunGun) await isaretle(kapi, adim, bugunGun, true);
    } else await isaretle(kapi, adim, m.yapildiGun ?? m.tarih ?? bugunGun, true);
  }
  return id;
}

/** P-120: Listeler'de yeni tablo (sütun adlarıyla); kimliğini döner. */
export async function tabloKartiKur(
  kapi: Kapi,
  ad: string,
  sutunlar: readonly string[],
  bugunGun: Gun,
  idUret: KimlikUretici,
  isaret = false,
): Promise<string> {
  const id = idUret();
  const t = tabloYaz(bosTablo([...sutunlar], isaret));
  await yeniKartKaydet(
    kapi,
    yeniKart(id, { baslik: ad.trim(), tarih: bugunGun, listede: true, ajandada: false }),
    [{ id: idUret(), tur: 'tablo', ad: '', metin: t.metin, birim: '', dakika: null, maddeler: [], dosya: null }],
    idUret,
  );
  return id;
}

/** Kartın listesini Listeler'e taşır (ajandada görünmeye devam eder) ya da Listeler'den çıkarır. */
export function listedeYaz(kapi: Kapi, kartId: string, listede: boolean): Promise<void> {
  return kapi.yaz(['kart'], (y) =>
    y.calistir('UPDATE kart SET listede = ?, ajandada = ? WHERE id = ?', [listede ? 1 : 0, listede ? 1 : null, kartId]),
  );
}

/**
 * Adımlar'da maddeye gün: madde o gün ajandada tek başına görünür (tekrarsız kart). `null`
 * gününü kaldırır (yeniden listenin günlerini izler).
 */
export async function adimGunuYaz(kapi: Kapi, oku: Okuyucu, adimId: string, gun: Gun | null): Promise<void> {
  const a = await kartAyrinti(oku, adimId);
  if (!a?.kart.ust) return;
  const ust = gun ? null : ((await kartAyrinti(oku, a.kart.ust))?.kart ?? null);
  await kapi.yaz(['kart'], (y) =>
    gun
      ? y.calistir('UPDATE kart SET tekrar = NULL, tarih = ? WHERE id = ?', [gun, adimId])
      : y.calistir('UPDATE kart SET tekrar = ?, tarih = ? WHERE id = ?', [
          JSON.stringify(HER_GUN),
          ust?.tarih ?? a.kart.tarih,
          adimId,
        ]),
  );
}

/** Paylaşmak için: maddeler yazı olarak (işaret ve günleriyle). */
export async function listeMaddeleri(
  oku: Okuyucu,
  kart: Pick<Kart, 'id' | 'rutin'>,
  gun: Gun,
): Promise<{ metin: string; yapildi: boolean; yapildiGun: Gun | null; tarih: Gun | null }[]> {
  const adimlar = await rutinAdimlari(oku, kart.id);
  const yapilanlar = await rutinYapilanlari(oku, kart, gun);
  return adimlar.map((a) => ({
    metin: a.baslik,
    yapildi: yapilanlar.has(a.id),
    yapildiGun: yapilanlar.has(a.id) ? gun : null,
    tarih: a.tekrar === null ? a.tarih : null,
  }));
}

/** Listeyi siler (maddeleriyle). */
export function listeKartiSil(kapi: Kapi, kartId: string): Promise<void> {
  return kartlariSil(kapi, [kartId]);
}

/** Bir kez: eski Listelerim (`yerel_liste`) liste kartlarına çevrilir; çevrilen sayısını döner. */
export async function yerelListeleriKartaCevir(
  kapi: Kapi,
  oku: Okuyucu,
  bugunGun: Gun,
  idUret: KimlikUretici,
): Promise<number> {
  if (await ayarOku(oku, 'listeler_karta')) return 0;
  const listeler = await oku.hepsi<{ id: string; ad: string; aciklama: string; cesit: string }>(
    'SELECT id, ad, aciklama, cesit FROM yerel_liste ORDER BY sira, olusturma',
  );
  for (const l of listeler) {
    const maddeler = await oku.hepsi<{
      metin: string;
      yapildi: number;
      yapildi_gun: string | null;
      tarih: string | null;
    }>('SELECT metin, yapildi, yapildi_gun, tarih FROM yerel_madde WHERE liste = ? ORDER BY sira', [l.id]);
    const cesit = listeCesidindenRutin(
      (['yapilacak', 'gunluk', 'not'] as const).find((c) => c === l.cesit) ?? 'yapilacak',
    );
    await listeKartiKur(
      kapi,
      oku,
      l.ad,
      cesit,
      bugunGun,
      idUret,
      maddeler.map((m) => ({ metin: m.metin, yapildi: m.yapildi === 1, yapildiGun: m.yapildi_gun, tarih: m.tarih })),
      l.aciklama,
    );
    await kapi.yaz(['liste'], async (y) => {
      await y.calistir('DELETE FROM yerel_madde WHERE liste = ?', [l.id]);
      await y.calistir('DELETE FROM yerel_liste WHERE id = ?', [l.id]);
    });
  }
  await ayarYaz(kapi, 'listeler_karta', true);
  return listeler.length;
}
