// Planlar, alan durumları ve Günün sorusu cevapları: okuma ve (yazma kapısı
// üzerinden) yazma. Plan başlatma tek işlemdir: plan, düzenli kartlar ve
// adımlar birlikte yazılır ya da hiçbiri yazılmaz.

import { ALAN_ANAHTARLARI, varsayilanAcikMi, type AlanAnahtari } from '@/mantik/alanlar';
import type { Kart } from '@/mantik/kart';
import type { BlokTaslagi, GununSorusu, Plan, PlanDurumu } from '@/mantik/plan';
import type { Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu, Yazici } from './kapi';
import { bloklariYazY, isaretle, kartEkleY, type KimlikUretici } from './kartlar';

interface PlanSatiri {
  id: string;
  ad: string;
  alan: string;
  kaynak: string;
  neden: string;
  hedef: string;
  baslangic: string;
  bitis: string | null;
  baslangic_puani: number;
  gunun_sorusu: string | null;
  durum: string;
}

function soruOku(metin: string | null): GununSorusu | null {
  if (!metin) return null;
  try {
    const s = JSON.parse(metin) as Partial<GununSorusu>;
    return s.metin ? { metin: s.metin, alt: s.alt ?? '', ust: s.ust ?? '' } : null;
  } catch {
    return null;
  }
}

function planSatirdan(s: PlanSatiri): Plan {
  return {
    id: s.id,
    ad: s.ad,
    alan: s.alan as AlanAnahtari,
    kaynak: s.kaynak === 'koc' ? 'koc' : 'kendim',
    neden: s.neden,
    hedef: s.hedef,
    baslangic: s.baslangic,
    bitis: s.bitis,
    baslangicPuani: s.baslangic_puani,
    gununSorusu: soruOku(s.gunun_sorusu),
    durum: s.durum as PlanDurumu,
  };
}

// ---- Okuma -------------------------------------------------------------------

/** Bütün planlar, açılış sırasıyla. */
export async function planlariOku(oku: Okuyucu): Promise<Plan[]> {
  return (await oku.hepsi<PlanSatiri>('SELECT * FROM plan ORDER BY olusturma, rowid')).map(planSatirdan);
}

export async function planOku(oku: Okuyucu, id: string): Promise<Plan | null> {
  const s = await oku.ilk<PlanSatiri>('SELECT * FROM plan WHERE id = ?', [id]);
  return s ? planSatirdan(s) : null;
}

export interface AlanDurumu {
  acik: boolean;
  /** 0 = puan verilmemiş. */
  puan: number;
  ilerlemek: boolean;
}

export function varsayilanAlanDurumu(alan: AlanAnahtari): AlanDurumu {
  return { acik: varsayilanAcikMi(alan), puan: 0, ilerlemek: false };
}

/** Bütün alanların durumu; kaydı olmayan alan varsayılanla gelir. */
export async function alanDurumlari(oku: Okuyucu): Promise<Map<AlanAnahtari, AlanDurumu>> {
  const satirlar = await oku.hepsi<{ alan: string; acik: number; puan: number; ilerlemek: number }>(
    'SELECT * FROM alan_durumu',
  );
  const sonuc = new Map<AlanAnahtari, AlanDurumu>(ALAN_ANAHTARLARI.map((a) => [a, varsayilanAlanDurumu(a)]));
  for (const s of satirlar) {
    if (sonuc.has(s.alan as AlanAnahtari)) {
      sonuc.set(s.alan as AlanAnahtari, { acik: s.acik === 1, puan: s.puan, ilerlemek: s.ilerlemek === 1 });
    }
  }
  return sonuc;
}

/** Bir planın cevapları: gün → 1–5. */
export async function soruCevaplari(oku: Okuyucu, planId: string, ilk: Gun, son: Gun): Promise<Map<Gun, number>> {
  const satirlar = await oku.hepsi<{ tarih: string; deger: number }>(
    'SELECT tarih, deger FROM soru_cevap WHERE plan_id = ? AND tarih >= ? AND tarih <= ?',
    [planId, ilk, son],
  );
  return new Map(satirlar.map((s) => [s.tarih, s.deger]));
}

// ---- Yazma -------------------------------------------------------------------

async function alanDurumuYazY(y: Yazici, alan: AlanAnahtari, degisiklik: Partial<AlanDurumu>) {
  const s = await y.ilk<{ acik: number; puan: number; ilerlemek: number }>(
    'SELECT acik, puan, ilerlemek FROM alan_durumu WHERE alan = ?',
    [alan],
  );
  const eski: AlanDurumu = s
    ? { acik: s.acik === 1, puan: s.puan, ilerlemek: s.ilerlemek === 1 }
    : varsayilanAlanDurumu(alan);
  const yeni = { ...eski, ...degisiklik };
  await y.calistir(
    `INSERT INTO alan_durumu (alan, acik, puan, ilerlemek) VALUES (?, ?, ?, ?)
     ON CONFLICT (alan) DO UPDATE SET acik = excluded.acik, puan = excluded.puan, ilerlemek = excluded.ilerlemek`,
    [alan, yeni.acik ? 1 : 0, yeni.puan, yeni.ilerlemek ? 1 : 0],
  );
}

/** Alanın puanı, "ilerlemek istiyorum" ya da Yaşam'da görünürlüğü. */
export function alanDurumuYaz(kapi: Kapi, alan: AlanAnahtari, degisiklik: Partial<AlanDurumu>): Promise<void> {
  return kapi.yaz(['plan'], (y) => alanDurumuYazY(y, alan, degisiklik));
}

export interface PlanBaslatma {
  plan: Plan;
  duzenliler: readonly { kart: Kart; bloklar: readonly BlokTaslagi[] }[];
  adimlar: readonly Kart[];
}

/** Planı başlatır (PL-1). Plan açılan alan Yaşam'da görünür olur. */
export function planBaslat(
  kapi: Kapi,
  { plan, duzenliler, adimlar }: PlanBaslatma,
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    await y.calistir(
      `INSERT INTO plan (id, ad, alan, kaynak, neden, hedef, baslangic, bitis, baslangic_puani, gunun_sorusu, durum, olusturma)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plan.id,
        plan.ad,
        plan.alan,
        plan.kaynak,
        plan.neden,
        plan.hedef,
        plan.baslangic,
        plan.bitis,
        plan.baslangicPuani,
        plan.gununSorusu ? JSON.stringify(plan.gununSorusu) : null,
        plan.durum,
        simdi,
      ],
    );
    for (const d of duzenliler) {
      await kartEkleY(y, d.kart, simdi);
      await bloklariYazY(y, d.kart.id, d.bloklar, idUret);
    }
    for (const a of adimlar) await kartEkleY(y, a, simdi);
    await alanDurumuYazY(y, plan.alan, { acik: true });
  });
}

/** Bilgiler sekmesinde yerinde düzenlenenler. */
export function planBilgisiYaz(
  kapi: Kapi,
  planId: string,
  bilgi: Partial<Pick<Plan, 'neden' | 'hedef' | 'gununSorusu'>>,
): Promise<void> {
  return kapi.yaz(['plan'], async (y) => {
    if (bilgi.neden !== undefined) await y.calistir('UPDATE plan SET neden = ? WHERE id = ?', [bilgi.neden, planId]);
    if (bilgi.hedef !== undefined) await y.calistir('UPDATE plan SET hedef = ? WHERE id = ?', [bilgi.hedef, planId]);
    if (bilgi.gununSorusu !== undefined) {
      await y.calistir('UPDATE plan SET gunun_sorusu = ? WHERE id = ?', [
        bilgi.gununSorusu ? JSON.stringify(bilgi.gununSorusu) : null,
        planId,
      ]);
    }
  });
}

/** "Planı bitir": plan `bitti` olur; kartları ajandada görünmez, kayıtlar kalır. */
export function planiBitir(kapi: Kapi, planId: string): Promise<void> {
  return kapi.yaz(['plan', 'kart'], (y) => y.calistir("UPDATE plan SET durum = 'bitti' WHERE id = ?", [planId]));
}

/** Plan ekranında "+ Yeni adım": tarihsiz adım. */
export function adimEkle(kapi: Kapi, adim: Kart, simdi: string = new Date().toISOString()): Promise<void> {
  return kapi.yaz(['kart'], (y) => kartEkleY(y, adim, simdi));
}

/** "Ajandaya al" (`05` §6): `tarih = bugün`, `tarihsiz = false`. */
export function adimiAjandayaAl(kapi: Kapi, kartId: string, bugunGun: Gun): Promise<void> {
  return kapi.yaz(['kart'], (y) =>
    y.calistir('UPDATE kart SET tarih = ?, tarihsiz = 0, guncelleme = ? WHERE id = ?', [
      bugunGun,
      new Date().toISOString(),
      kartId,
    ]),
  );
}

/**
 * Adımın işaret kutusu. Tarihli adım kendi gününün kaydına yazılır (ajandadaki
 * işaretle aynı); tarihsiz adımın günü olmadığından yalnız kısa yolu değişir.
 */
export function adimIsaretle(kapi: Kapi, adim: Kart, yapildi: boolean): Promise<void> {
  if (adim.tarih && !adim.tarihsiz) return isaretle(kapi, adim.id, adim.tarih, yapildi);
  return kapi.yaz(['kart'], (y) => y.calistir('UPDATE kart SET yapildi = ? WHERE id = ?', [yapildi ? 1 : 0, adim.id]));
}

/** Günün sorusu cevabı; `null` cevabı siler ("Değiştir"). */
export function soruCevapla(kapi: Kapi, planId: string, gun: Gun, deger: number | null): Promise<void> {
  return kapi.yaz(['plan'], (y) =>
    deger === null
      ? y.calistir('DELETE FROM soru_cevap WHERE plan_id = ? AND tarih = ?', [planId, gun])
      : y.calistir(
          `INSERT INTO soru_cevap (plan_id, tarih, deger) VALUES (?, ?, ?)
           ON CONFLICT (plan_id, tarih) DO UPDATE SET deger = excluded.deger`,
          [planId, gun, deger],
        ),
  );
}
