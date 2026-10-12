// Planlar (`02` Y-1, PL-1…PL-3, P-1, G-6; `05` §6; `10` madde 5).
//
// Plan içinde iki tür kart vardır: **düzenli** (tekrarlı) kartlar ve **adımlar**
// (tek seferlik ya da tarihsiz). Ürün sahibinin kararları:
// - Düzenli kartlar planın bitiş gününde durur (kart.bitis = plan.bitis).
// - "Planı bitir" planı `bitti` yapar; kartları ajandada görünmez.

import { alanBul, PUAN_SOZLERI, type AlanAnahtari, type Etkinlik, type HazirPaket } from './alanlar';
import { gorunurMu, seri, tekrarMetni } from './gorunurluk';
import { yeniKart, type Blok, type Kart, type Kayit } from './kart';
import { gunEkle, gunFarki, gunKisa, kisaTarih, type Gun } from './tarih';

export type PlanDurumu = 'etkin' | 'bitti';

export interface GununSorusu {
  metin: string;
  /** 1'in altındaki uç yazısı ("Hiç"). */
  alt: string;
  /** 5'in altındaki uç yazısı ("Çok"). */
  ust: string;
}

export interface Plan {
  id: string;
  ad: string;
  alan: AlanAnahtari;
  kaynak: 'kendim' | 'koc';
  neden: string;
  hedef: string;
  baslangic: Gun;
  /** null = bitiş yok. */
  bitis: Gun | null;
  /** Plan açılırken alanın puanı (0 = puan verilmemiş). */
  baslangicPuani: number;
  gununSorusu: GununSorusu | null;
  durum: PlanDurumu;
}

export type BlokTaslagi = Omit<Blok, 'kartId' | 'sira'>;

export const PLAN_ADI_HATASI = 'Önce plana bir ad ver.';

// ---- Süre --------------------------------------------------------------------

export type SureSecimi = '4hafta' | '8hafta' | 'yok';

export function sureBitisi(secim: SureSecimi, bugunGun: Gun): Gun | null {
  if (secim === '4hafta') return gunEkle(bugunGun, 28);
  if (secim === '8hafta') return gunEkle(bugunGun, 56);
  return null;
}

/** Hazır paketin bitişi: bugün + hafta × 7. */
export function paketBitisi(paket: HazirPaket, bugunGun: Gun): Gun {
  return gunEkle(bugunGun, paket.hafta * 7);
}

/** "8 Kasım (28 gün)" · "(bugün)" · "(geçti)" */
export function bitisMetni(bitis: Gun, bugunGun: Gun): string {
  const kalan = gunFarki(bugunGun, bitis);
  const ek = kalan > 0 ? `${kalan} gün` : kalan === 0 ? 'bugün' : 'geçti';
  return `${kisaTarih(bitis)} (${ek})`;
}

/** "Bitiş: 30 Ekim (19 gün)" ya da "Bitiş tarihi yok" (`05` §6). */
export function sureMetni(bitis: Gun | null, bugunGun: Gun): string {
  return bitis ? `Bitiş: ${bitisMetni(bitis, bugunGun)}` : 'Bitiş tarihi yok';
}

/** "İş · Bitiş: 30 Ekim (19 gün)" */
export function planMetaMetni(plan: Pick<Plan, 'alan' | 'bitis'>, bugunGun: Gun): string {
  return `${alanBul(plan.alan)?.ad ?? ''} · ${sureMetni(plan.bitis, bugunGun)}`;
}

// ---- Plan başlatma -----------------------------------------------------------

/** "Her gün · 07:30" */
export function etkinlikMetni(et: Pick<Etkinlik, 'tekrar' | 'saat'>): string {
  return `${tekrarMetni(et.tekrar)} · ${et.saat}`;
}

export const VIDEO_TALIMATI = 'Videoyu açıp birlikte uygula.';

function etkinlikBloklari(et: Etkinlik, kimlik: () => string): BlokTaslagi[] {
  const bos = (tur: Blok['tur']): BlokTaslagi => ({
    id: kimlik(),
    tur,
    ad: '',
    metin: '',
    birim: '',
    dakika: null,
    maddeler: [],
    dosya: null,
  });
  const b = et.blok;
  switch (b.tur) {
    case 'sayac':
      return [{ ...bos('sayac'), dakika: b.dakika }];
    case 'video':
      // Bağlantı yok (`09`); kişi Düzenle'den yapıştırır.
      return [bos('video'), { ...bos('talimat'), metin: VIDEO_TALIMATI }];
    case 'olcum':
      return [{ ...bos('olcum'), ad: b.ad, birim: b.birim }];
    case 'talimat':
      return [{ ...bos('talimat'), metin: b.metin }];
    case 'gunnot':
      return [bos('gunnot')];
  }
}

/** Etkinlikten düzenli kart: bugünden başlar, planın bitişinde durur. */
export function etkinliktenKart(
  et: Etkinlik,
  plan: Pick<Plan, 'id' | 'bitis'>,
  bugunGun: Gun,
  kimlik: () => string,
  sira = 0,
): { kart: Kart; bloklar: BlokTaslagi[] } {
  return {
    kart: yeniKart(kimlik(), {
      baslik: et.baslik,
      tarih: bugunGun,
      saat: et.saat,
      tekrar: et.tekrar,
      bitis: plan.bitis,
      planId: plan.id,
      sira,
    }),
    bloklar: etkinlikBloklari(et, kimlik),
  };
}

/** Adımlar kutusu: her satıra bir iş; boş satırlar atlanır. */
export function adimlariAyir(metin: string): string[] {
  return metin
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

/** Tarihsiz adım (PL-2). */
export function adimKarti(id: string, baslik: string, planId: string, sira = 0): Kart {
  return yeniKart(id, { baslik: baslik.trim(), tarih: null, tarihsiz: true, planId, sira });
}

// ---- Adımlar -----------------------------------------------------------------

export interface AdimSatiri<T extends Kart> {
  kart: T;
  /** "Bugün · 14:00", "15 Ekim", "Gecikti · 9 Ekim"; tarihsizde boş. */
  ne: string;
  gecikti: boolean;
}

export interface Adimlar<T extends Kart> {
  siradakiler: AdimSatiri<T>[];
  tarihsizler: AdimSatiri<T>[];
  bitenler: AdimSatiri<T>[];
  toplam: number;
}

function gunEtiketi(gun: Gun, bugunGun: Gun): string {
  const fark = gunFarki(bugunGun, gun);
  if (fark === 0) return 'Bugün';
  if (fark === 1) return 'Yarın';
  return kisaTarih(gun);
}

function adimNe(k: Kart, bugunGun: Gun, bitti: boolean): { ne: string; gecikti: boolean } {
  if (k.tarihsiz || !k.tarih) return { ne: '', gecikti: false };
  const gecikti = !bitti && k.tarih < bugunGun;
  const gun = gecikti ? `Gecikti · ${kisaTarih(k.tarih)}` : gunEtiketi(k.tarih, bugunGun);
  return { ne: k.saat ? `${gun} · ${k.saat}` : gun, gecikti };
}

const tarihSirasi = (k: Kart) => `${k.tarih ?? '9999'}|${k.saat ?? '99:99'}|${String(k.sira).padStart(16, '0')}`;

/**
 * Planın adımları (`05` §6): tarihli yapılmamışlar (tarih + saat sırası),
 * tarihsizler, bitenler. Adımın bittiği kartın `yapildi` kısa yolundan okunur.
 */
export function adimlar<T extends Kart>(planKartlari: readonly T[], bugunGun: Gun): Adimlar<T> {
  const tumu = planKartlari.filter((k) => !k.tekrar);
  const satir = (kart: T): AdimSatiri<T> => ({ kart, ...adimNe(kart, bugunGun, kart.yapildi) });
  const sirala = (a: T, b: T) => tarihSirasi(a).localeCompare(tarihSirasi(b));
  return {
    siradakiler: tumu.filter((k) => !k.yapildi && !k.tarihsiz).sort(sirala).map(satir),
    tarihsizler: tumu
      .filter((k) => !k.yapildi && k.tarihsiz)
      .sort((a, b) => a.sira - b.sira)
      .map(satir),
    bitenler: tumu.filter((k) => k.yapildi).sort(sirala).map(satir),
    toplam: tumu.length,
  };
}

// ---- İlerleme ve sıradaki iş (Devam edenler, Planlarım) ----------------------

export interface PlanIlerlemesi {
  bugun: { yapilan: number; toplam: number } | null;
  adim: { biten: number; toplam: number } | null;
}

export function ilerleme(
  planKartlari: readonly Kart[],
  bugunYapilanlar: ReadonlySet<string>,
  bugunGun: Gun,
): PlanIlerlemesi {
  const duzenli = planKartlari.filter((k) => k.tekrar);
  const bugunkuler = duzenli.filter((k) => gorunurMu(k, bugunGun, bugunGun));
  const adimKartlari = planKartlari.filter((k) => !k.tekrar);
  return {
    bugun:
      duzenli.length > 0
        ? { yapilan: bugunkuler.filter((k) => bugunYapilanlar.has(k.id)).length, toplam: bugunkuler.length }
        : null,
    adim:
      adimKartlari.length > 0
        ? { biten: adimKartlari.filter((k) => k.yapildi).length, toplam: adimKartlari.length }
        : null,
  };
}

/** "0 / 1 bugün", "2 / 7 adım", "0 / 1 bugün · 1 / 3 adım"; hiçbiri yoksa "—". */
export function ilerlemeMetni(i: PlanIlerlemesi): string {
  const parcalar: string[] = [];
  if (i.bugun) parcalar.push(`${i.bugun.yapilan} / ${i.bugun.toplam} bugün`);
  if (i.adim) parcalar.push(`${i.adim.biten} / ${i.adim.toplam} adım`);
  return parcalar.join(' · ') || '—';
}

/**
 * Devam edenler'deki sıradaki iş (`05` §6): önce bugün yapılmamış ilk düzenli
 * kart, yoksa ilk tarihli adım, yoksa ilk tarihsiz adım.
 */
export function siradakiMetni(
  planKartlari: readonly Kart[],
  bugunYapilanlar: ReadonlySet<string>,
  bugunGun: Gun,
): string {
  const bugunkuler = planKartlari
    .filter((k) => k.tekrar && gorunurMu(k, bugunGun, bugunGun))
    .sort((a, b) => (a.saat ?? '99:99').localeCompare(b.saat ?? '99:99'));
  const duzenli = bugunkuler.find((k) => !bugunYapilanlar.has(k.id));
  if (duzenli) return `Sıradaki: ${duzenli.saat ? `${duzenli.saat} ` : ''}${duzenli.baslik}`;

  const a = adimlar(planKartlari, bugunGun);
  const tarihli = a.siradakiler[0];
  if (tarihli?.kart.tarih) return `${gunEtiketi(tarihli.kart.tarih, bugunGun)}: ${tarihli.kart.baslik}`;
  const tarihsiz = a.tarihsizler[0];
  if (tarihsiz) return `Sıradaki adım: ${tarihsiz.kart.baslik}`;
  return bugunkuler.length > 0 ? 'Bugün tamam ✓' : 'Sırada bir şey yok';
}

export const DEVAM_EN_COK = 3;
export const PLAN_YOK_METNI = "Henüz planın yok. Yaşam Tarzım'dan başlayabilirsin.";

export function fazlaPlanMetni(adet: number): string {
  return `+${adet} plan daha`;
}

// ---- Alan --------------------------------------------------------------------

/** Alan kutusunun alt satırı: "2 plan" / "İlerlemek istiyorum" / "Plan yok". */
export function alanAltSatiri(planSayisi: number, ilerlemek: boolean): string {
  if (planSayisi > 0) return `${planSayisi} plan`;
  return ilerlemek ? 'İlerlemek istiyorum' : 'Plan yok';
}

export function puanSozu(puan: number): string {
  return PUAN_SOZLERI[puan] ?? '';
}

// ---- Plan ekranı: Bugün ve Gelişim -------------------------------------------

export type BugunDurumu = 'yapildi' | 'bekliyor' | 'yok';

export function bugunDurumu(kart: Kart, bugunYapilanlar: ReadonlySet<string>, bugunGun: Gun): BugunDurumu {
  if (!gorunurMu(kart, bugunGun, bugunGun)) return 'yok';
  return bugunYapilanlar.has(kart.id) ? 'yapildi' : 'bekliyor';
}

export const BUGUN_DURUMU_METNI: Record<BugunDurumu, string> = {
  yapildi: 'Bugün yapıldı',
  bekliyor: 'Bugün bekliyor',
  yok: 'Bugün yok',
};

/** "2 → 3"; puan verilmemişse "—". */
export function puanDegisimi(baslangic: number, simdi: number): string {
  const p = (n: number) => (n > 0 ? String(n) : '—');
  return `${p(baslangic)} → ${p(simdi)}`;
}

/** Düzenli kartların şu anki serilerinin en büyüğü. */
export function planEnUzunSerisi(
  duzenliKartlar: readonly Kart[],
  yapilanGunler: ReadonlyMap<string, ReadonlySet<Gun>>,
  bugunGun: Gun,
): number {
  return duzenliKartlar.reduce(
    (enBuyuk, k) => Math.max(enBuyuk, seri(k, yapilanGunler.get(k.id) ?? new Set(), bugunGun)),
    0,
  );
}

/**
 * Son ölçümler: her ölçüm bloğunun son değeri; birden çok değer varsa ilki de
 * yazılır ("15 tekrar (ilk: 11)").
 */
export function sonOlcumler(
  bloklar: readonly Pick<Blok, 'id' | 'kartId' | 'tur' | 'ad' | 'birim'>[],
  kayitlar: readonly Kayit[],
): { ad: string; deger: string }[] {
  const sonuc: { ad: string; deger: string }[] = [];
  for (const b of bloklar) {
    if (b.tur !== 'olcum') continue;
    const degerler = kayitlar
      .filter((k) => k.kartId === b.kartId && (k.degerler[b.id] ?? '').trim() !== '')
      .sort((a, c) => a.tarih.localeCompare(c.tarih))
      .map((k) => k.degerler[b.id]!.trim());
    if (degerler.length === 0) continue;
    const birim = b.birim ? ` ${b.birim}` : '';
    const son = `${degerler[degerler.length - 1]}${birim}`;
    sonuc.push({ ad: b.ad || 'Ölçüm', deger: degerler.length > 1 ? `${son} (ilk: ${degerler[0]})` : son });
  }
  return sonuc;
}

export interface AdimOzeti {
  cubukMetni: string;
  oran: number;
  kutular: { etiket: string; deger: string }[];
}

export function adimOzeti(a: Adimlar<Kart>, bugunGun: Gun): AdimOzeti {
  const biten = a.bitenler.length;
  const geciken = a.siradakiler.filter((s) => s.kart.tarih !== null && s.kart.tarih < bugunGun).length;
  return {
    cubukMetni: `${biten} / ${a.toplam} adım bitti`,
    oran: a.toplam > 0 ? biten / a.toplam : 0,
    kutular: [
      { etiket: 'Adımlar', deger: `${biten} / ${a.toplam} bitti` },
      { etiket: 'Tarihsiz', deger: `${a.tarihsizler.length} adım` },
      { etiket: 'Geciken', deger: `${geciken} adım` },
    ],
  };
}

// ---- Günün sorusu ------------------------------------------------------------

export const SORU_VARSAYILAN_ALT = 'Hiç';
export const SORU_VARSAYILAN_UST = 'Çok';

export function cevapMetni(deger: number): string {
  return `Cevabın: ${deger} / 5`;
}

export interface SoruCubugu {
  gun: Gun;
  etiket: string;
  deger: number | null;
}

/** Son 7 gün (bugün en sağda) ve ortalama. */
export function soruGrafigi(
  cevaplar: ReadonlyMap<Gun, number>,
  bugunGun: Gun,
): { cubuklar: SoruCubugu[]; ortalamaMetni: string } {
  const cubuklar: SoruCubugu[] = [];
  for (let i = 6; i >= 0; i--) {
    const gun = gunEkle(bugunGun, -i);
    cubuklar.push({ gun, etiket: i === 0 ? 'Bugün' : gunKisa(gun), deger: cevaplar.get(gun) ?? null });
  }
  const dolu = cubuklar.map((c) => c.deger).filter((d): d is number => d !== null);
  const ortalamaMetni = dolu.length
    ? `Son 7 günde ortalama ${(dolu.reduce((a, b) => a + b, 0) / dolu.length).toFixed(1).replace('.', ',')} / 5`
    : 'Henüz cevap yok';
  return { cubuklar, ortalamaMetni };
}

/** Giriş'teki Günün sorusu: soru tanımlı ilk etkin plan. */
export function sorulanPlan<T extends Pick<Plan, 'durum' | 'gununSorusu'>>(planlar: readonly T[]): T | null {
  return planlar.find((p) => p.durum === 'etkin' && p.gununSorusu !== null) ?? null;
}
