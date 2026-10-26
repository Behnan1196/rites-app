// Programlar (pilot 20 Ekim; eski "Plan"ın yerine). Program, adı olan ve
// uygulanabilen bir kart topluluğudur: alanlarla etiketlenir, süreli ("3 hafta")
// ya da süresizdir. Kartları ajandadaki kartların aynısıdır; tek farkı zamanın
// programın başlangıcına göre yazılmasıdır ("1. gün", "Her gün · 07:30").
//
// - "Başlat": seçilen günden başlayarak kartlar ajandaya düşer (kart.plan_id =
//   program, kart.bag = `program:<programKartı>`).
// - Uygulanırken programa eklenen kart o günden sonra ajandaya düşer; ajandadaki
//   kart düzenlenirse programdaki karşılığı da değişir.
// - "Ara ver" / "Bitir": gelecekteki yapılmamış kartlar ajandadan kalkar,
//   yapılanlar geçmişte kalır; program yerinde durur, yeniden başlatılabilir.
// - Uygulanmış program 1–5 yıldız ve kısa notla değerlendirilir.
// - Alan puanı programlardan bağımsızdır (kişinin kendi değerlendirmesi).

import { cesitBul } from './cesit';
import { htmldenDuz } from './zenginMetin';
import { alanAdi, type AlanAnahtari } from './alanlar';
import { katalog, type KatalogKart, type KatalogProgram } from './katalog';
import { gorunurMu, tekrarMetni } from './gorunurluk';
import { gecerliHatirlatma, yeniKart, type Blok, type Hatirlatma, type Kart, type Tekrar } from './kart';
import type { KutuphaneBlogu } from './kutuphane';
import { trKucuk } from './metin';
import { gunEkle, gunFarki, kisaTarih, type Gun } from './tarih';

export type ProgramDurumu = 'hazir' | 'uygulaniyor' | 'ara' | 'bitti';

export interface Program {
  id: string;
  ad: string;
  alanlar: AlanAnahtari[];
  /** Kısa açıklama ya da neden; boş olabilir. */
  neden: string;
  /** Gün olarak uzunluk; null = süresiz. */
  sure: number | null;
  durum: ProgramDurumu;
  /** Son (ya da süren) uygulamanın ilk günü; hiç başlamadıysa null. */
  baslangic: Gun | null;
  /** 0 = değerlendirilmedi; 1–5. */
  yildiz: number;
  degerlendirme: string;
  /** "Kendim" · "Rites önerisi" · "Gönderen: Elif" */
  kaynak: string;
  olusturma: string;
}

export interface ProgramKarti {
  id: string;
  programId: string;
  sira: number;
  /** Başlangıçtan kaç gün sonra (0 = 1. gün); tekrarlıda dizinin ilk günü. */
  gun: number;
  baslik: string;
  kisa: string;
  saat: string | null;
  hatirlatma: Hatirlatma | null;
  alarm: boolean;
  /** Alarmın sesi (P-33); yoksa telefonun alarm sesi. */
  alarmSesi?: string | null;
  tekrar: Tekrar | null;
  bloklar: KutuphaneBlogu[];
  /** İsimli kart çeşidi (P-45; `KartCesidi.id`); ajandaya geçen karta da geçer. */
  cesit?: string | null;
}

export const KENDIM = 'Kendim';
export const RITES_ONERISI = 'Rites önerisi';
export const PROGRAM_ADI_HATASI = 'Programa bir ad ver.';
export const PROGRAM_BAGI = 'program:';

// ---- Süre ve durum -----------------------------------------------------------

export const SURELER: readonly { gun: number | null; etiket: string }[] = [
  { gun: 7, etiket: '1 hafta' },
  { gun: 14, etiket: '2 hafta' },
  { gun: 21, etiket: '3 hafta' },
  { gun: 28, etiket: '4 hafta' },
  { gun: 42, etiket: '6 hafta' },
  { gun: 56, etiket: '8 hafta' },
  { gun: null, etiket: 'Süresiz' },
];

/** "3 hafta" · "10 gün" · "Süresiz" */
export function sureMetni(sure: number | null): string {
  if (sure === null) return 'Süresiz';
  return sure % 7 === 0 ? `${sure / 7} hafta` : `${sure} gün`;
}

/** Süren uygulamanın son günü; süresizde ya da başlamamışta null. */
export function programBitisi(p: Pick<Program, 'baslangic' | 'sure'>): Gun | null {
  return p.baslangic && p.sure !== null ? gunEkle(p.baslangic, p.sure - 1) : null;
}

/** Süresi geçmiş "uygulanıyor" programı bitti sayar. */
export function etkinDurum(p: Pick<Program, 'durum' | 'baslangic' | 'sure'>, bugunGun: Gun): ProgramDurumu {
  const bitis = programBitisi(p);
  if (p.durum === 'uygulaniyor' && bitis && bugunGun > bitis) return 'bitti';
  return p.durum;
}

export function uygulaniyorMu(p: Pick<Program, 'durum' | 'baslangic' | 'sure'>, bugunGun: Gun): boolean {
  return etkinDurum(p, bugunGun) === 'uygulaniyor';
}

/** Uygulamanın kaçıncı günü (1'den); başlamadıysa null. */
export function kacinciGun(p: Pick<Program, 'baslangic'>, bugunGun: Gun): number | null {
  if (!p.baslangic || bugunGun < p.baslangic) return null;
  return gunFarki(p.baslangic, bugunGun) + 1;
}

export const DURUM_ADI: Record<ProgramDurumu, string> = {
  hazir: 'Hazır',
  uygulaniyor: 'Uygulanıyor',
  ara: 'Ara verildi',
  bitti: 'Bitti',
};

/** "Uygulanıyor · 9. gün / 21" · "Başlıyor: 22 Ekim" · "Hazır · 3 hafta" · "Ara verildi" · "Bitti" */
export function durumMetni(p: Program, bugunGun: Gun): string {
  const d = etkinDurum(p, bugunGun);
  if (d === 'uygulaniyor' && p.baslangic) {
    if (bugunGun < p.baslangic) return `Başlıyor: ${kisaTarih(p.baslangic)}`;
    const n = kacinciGun(p, bugunGun);
    return `Uygulanıyor · ${n}. gün${p.sure !== null ? ` / ${p.sure}` : ''}`;
  }
  if (d === 'hazir') return `Hazır · ${sureMetni(p.sure)}`;
  return DURUM_ADI[d];
}

/** "Hareket · Beslenme" */
export function alanlarMetni(alanlar: readonly AlanAnahtari[]): string {
  return alanlar.map(alanAdi).filter(Boolean).join(' · ');
}

/** "★★★★☆"; değerlendirilmediyse boş. */
export function yildizMetni(yildiz: number): string {
  if (yildiz <= 0) return '';
  const n = Math.min(5, Math.round(yildiz));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

export const YILDIZ_SOZLERI = ['', 'İşe yaramadı', 'Pek değil', 'İdare eder', 'İyi geldi', 'Çok iyi geldi'] as const;

const DURUM_SIRASI: Record<ProgramDurumu, number> = { uygulaniyor: 0, hazir: 1, ara: 2, bitti: 3 };

/** Uygulananlar önce, sonra hazırlar, ara verilenler, bitenler; her grupta en yeni üstte. */
export function programSirasi<T extends Program>(programlar: readonly T[], bugunGun: Gun): T[] {
  return [...programlar].sort(
    (a, b) =>
      DURUM_SIRASI[etkinDurum(a, bugunGun)] - DURUM_SIRASI[etkinDurum(b, bugunGun)] ||
      b.olusturma.localeCompare(a.olusturma),
  );
}

export function programFormuHatasi(ad: string): string | null {
  return ad.trim() ? null : PROGRAM_ADI_HATASI;
}

// ---- Programın kartları ------------------------------------------------------

/** Programın kartları gün, sonra elle sıra ile. */
export function kartSirasi<T extends Pick<ProgramKarti, 'gun' | 'sira'>>(kartlar: readonly T[]): T[] {
  return [...kartlar].sort((a, b) => a.gun - b.gun || a.sira - b.sira);
}

/** "1. gün" · "Her gün · 07:30" · "Pzt Çar Cum · 18:00 · 8. günden" */
export function kartZamanMetni(k: Pick<ProgramKarti, 'gun' | 'tekrar' | 'saat'>): string {
  if (!k.tekrar) return [`${k.gun + 1}. gün`, k.saat].filter(Boolean).join(' · ');
  return [tekrarMetni(k.tekrar), k.saat, k.gun > 0 ? `${k.gun + 1}. günden` : null].filter(Boolean).join(' · ');
}

export function programBagi(programKartiId: string): string {
  return PROGRAM_BAGI + programKartiId;
}

export function programBagCoz(bag: string | null): string | null {
  return bag?.startsWith(PROGRAM_BAGI) ? bag.slice(PROGRAM_BAGI.length) || null : null;
}

function tekrarKopyasi(t: Tekrar | null): Tekrar | null {
  return t ? { ...t, gunler: t.gunler ? [...t.gunler] : null } : null;
}

export type YeniBlok = KutuphaneBlogu & { id: string };

/**
 * Programın kartından ajanda kartı. Gün `ilkGun`den önceyse (uygulanırken
 * eklenen kart) `ilkGun`e düşer. Tekrarlı kartın ilk günü programın bitişinden
 * sonraysa kart yok (null).
 */
export function ajandaKarti(
  pk: ProgramKarti,
  p: Pick<Program, 'id' | 'baslangic' | 'sure'>,
  ilkGun: Gun,
  kimlik: () => string,
  sira = 0,
): { kart: Kart; bloklar: YeniBlok[] } | null {
  if (!p.baslangic) return null;
  const istenen = gunEkle(p.baslangic, pk.gun);
  const tarih = istenen < ilkGun ? ilkGun : istenen;
  const bitis = programBitisi(p);
  if (pk.tekrar && bitis && tarih > bitis) return null;
  return {
    kart: yeniKart(kimlik(), {
      baslik: pk.baslik,
      kisa: pk.kisa,
      tarih,
      saat: pk.saat,
      hatirlatma: gecerliHatirlatma(pk.hatirlatma, pk.saat),
      alarm: pk.alarm && !!gecerliHatirlatma(pk.hatirlatma, pk.saat),
      alarmSesi: pk.alarmSesi ?? null,
      cesit: pk.cesit ?? null,
      // P-49: çeşit seriyi belirleyebilir.
      seriSay: pk.tekrar ? (cesitBul(pk.cesit)?.seri ?? null) : null,
      tekrar: tekrarKopyasi(pk.tekrar),
      bitis: pk.tekrar ? bitis : null,
      planId: p.id,
      bag: programBagi(pk.id),
      sira,
    }),
    bloklar: pk.bloklar.map((b) => ({ ...b, maddeler: [...b.maddeler], id: kimlik() })),
  };
}

type BlokBenzeri = Pick<Blok, 'tur' | 'ad' | 'metin' | 'birim' | 'dakika' | 'maddeler'> & { dosya?: string | null };

export function blokKopyasi(b: BlokBenzeri): KutuphaneBlogu {
  return {
    tur: b.tur,
    ad: b.ad,
    metin: b.metin,
    birim: b.birim,
    dakika: b.dakika,
    maddeler: [...b.maddeler],
    dosya: b.dosya ?? null,
  };
}

/** Ajanda kartının program kartı karşılığı (içerik; gün programın başlangıcına göre). */
export function karttanIcerik(
  kart: Pick<Kart, 'baslik' | 'kisa' | 'saat' | 'hatirlatma' | 'alarm' | 'alarmSesi' | 'tekrar' | 'tarih' | 'cesit'>,
  bloklar: readonly BlokBenzeri[],
  baslangic: Gun | null,
): Omit<ProgramKarti, 'id' | 'programId' | 'sira'> {
  return {
    gun: baslangic && kart.tarih ? Math.max(0, gunFarki(baslangic, kart.tarih)) : 0,
    baslik: kart.baslik,
    kisa: kart.kisa,
    saat: kart.saat,
    hatirlatma: kart.hatirlatma,
    alarm: kart.alarm,
    alarmSesi: kart.alarmSesi ?? null,
    tekrar: tekrarKopyasi(kart.tekrar),
    bloklar: bloklar.map(blokKopyasi),
    cesit: kart.cesit ?? null,
  };
}

/**
 * "Ara ver" / "Bitir": ajandadaki program kartlarından
 * - bugünden önce başlamış tekrarlıların dizisi dün biter (`bitir`);
 * - bugün ya da sonra başlayan tekrarlılar ve bugün ya da sonraki yapılmamış
 *   tek seferlikler silinir (`sil`). Yapılanlar ve geçmiş günler kalır.
 */
export function durdurmaFarki(
  kartlar: readonly Pick<Kart, 'id' | 'tarih' | 'tekrar' | 'bitis' | 'yapildi'>[],
  bugunGun: Gun,
): { bitir: string[]; sil: string[] } {
  const dun = gunEkle(bugunGun, -1);
  const sonuc = { bitir: [] as string[], sil: [] as string[] };
  for (const k of kartlar) {
    const tarih = k.tarih ?? bugunGun;
    if (k.tekrar) {
      if (tarih >= bugunGun) sonuc.sil.push(k.id);
      else if (!k.bitis || k.bitis > dun) sonuc.bitir.push(k.id);
    } else if (tarih >= bugunGun && !k.yapildi) sonuc.sil.push(k.id);
  }
  return sonuc;
}

// ---- Bugünkü ilerleme ve sıradaki iş (Programlarım, Devam edenler) ----------

/** "1 / 2 bugün"; bugün kart yoksa null. */
export function bugunMetni(
  ajandaKartlari: readonly Kart[],
  bugunYapilanlar: ReadonlySet<string>,
  bugunGun: Gun,
): string | null {
  const bugunkuler = ajandaKartlari.filter((k) => gorunurMu(k, bugunGun, bugunGun));
  if (bugunkuler.length === 0) return null;
  return `${bugunkuler.filter((k) => bugunYapilanlar.has(k.id)).length} / ${bugunkuler.length} bugün`;
}

/** "Sıradaki: 07:30 Esneme" · "Bugün tamam ✓" · "Yarın: Arkadaşını ara" · "Sırada bir şey yok" */
export function siradakiMetni(
  ajandaKartlari: readonly Kart[],
  bugunYapilanlar: ReadonlySet<string>,
  bugunGun: Gun,
): string {
  const bugunkuler = ajandaKartlari
    .filter((k) => gorunurMu(k, bugunGun, bugunGun))
    .sort((a, b) => (a.saat ?? '99:99').localeCompare(b.saat ?? '99:99'));
  const ilk = bugunkuler.find((k) => !bugunYapilanlar.has(k.id));
  if (ilk) return `Sıradaki: ${ilk.saat ? `${ilk.saat} ` : ''}${ilk.baslik}`;
  if (bugunkuler.length > 0) return 'Bugün tamam ✓';
  for (let i = 1; i <= 7; i++) {
    const g = gunEkle(bugunGun, i);
    const k = ajandaKartlari.find((x) => gorunurMu(x, g, bugunGun));
    if (k) return `${i === 1 ? 'Yarın' : kisaTarih(g)}: ${k.baslik}`;
  }
  return 'Sırada bir şey yok';
}

export const DEVAM_EN_COK = 3;
export const PROGRAM_YOK_METNI = "Uygulanan programın yok. Yaşam Tarzım'dan başlayabilirsin.";

export function fazlaProgramMetni(adet: number): string {
  return `+${adet} program daha`;
}

/** Alan kutusunun alt satırı: "1 program uygulanıyor" / "2 program" / "Program yok". */
export function alanAltSatiri(uygulanan: number, toplam: number): string {
  if (uygulanan > 0) return `${uygulanan} program uygulanıyor`;
  return toplam > 0 ? `${toplam} program` : 'Program yok';
}

// ---- Gelişim ----------------------------------------------------------------

/**
 * Son ölçümler: her ölçüm bloğunun son değeri; birden çok değer varsa ilki de
 * yazılır ("15 tekrar (ilk: 11)").
 */
export function sonOlcumler(
  bloklar: readonly Pick<Blok, 'id' | 'kartId' | 'tur' | 'ad' | 'birim'>[],
  kayitlar: readonly { kartId: string; tarih: Gun; degerler: Record<string, string> }[],
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

/**
 * Bu uygulamada yapılanlar: başlangıçtan bugüne (bitti/ara verildiyse son
 * kartın gününe) kadar görünen günlerin kaçında yapıldı. "14 / 20"
 */
export function uygulamaOzeti(
  ajandaKartlari: readonly Kart[],
  yapilanlar: readonly { kartId: string; tarih: Gun }[],
  baslangic: Gun,
  bugunGun: Gun,
): { yapilan: number; toplam: number } {
  let yapilan = 0;
  let toplam = 0;
  const yapildi = new Set(yapilanlar.map((y) => `${y.kartId}|${y.tarih}`));
  const son = bugunGun;
  for (let g = baslangic; g <= son; g = gunEkle(g, 1)) {
    for (const k of ajandaKartlari) {
      if (!gorunurMu(k, g, bugunGun)) continue;
      toplam++;
      if (yapildi.has(`${k.id}|${g}`)) yapilan++;
    }
  }
  return { yapilan, toplam };
}

// ---- Rites önerileri (içerik kataloğundan) -------------------------------------

export { VIDEO_TALIMATI } from './katalog';

export interface Oneri {
  id: string;
  alanlar: AlanAnahtari[];
  ad: string;
  aciklama: string;
  sure: number | null;
  kartlar: Omit<ProgramKarti, 'id' | 'programId'>[];
}

/** Katalogdaki kartın program kartı içeriği. */
export function oneriKartIcerigi(c: KatalogKart, gun = 0, sira = 0): Omit<ProgramKarti, 'id' | 'programId'> {
  return {
    sira,
    gun,
    baslik: c.baslik,
    kisa: c.kisa,
    saat: c.saat,
    hatirlatma: null,
    alarm: false,
    tekrar: tekrarKopyasi(c.tekrar),
    bloklar: c.bloklar.map((b) => ({ ...b, maddeler: [...b.maddeler] })),
  };
}

function programOnerisi(p: KatalogProgram, kartlar: readonly KatalogKart[]): Oneri {
  return {
    id: p.id,
    alanlar: [...p.alanlar],
    ad: p.ad,
    aciklama: p.aciklama,
    sure: p.sure,
    kartlar: p.kartlar
      .map((x, i) => {
        const c = kartlar.find((k) => k.id === x.kart);
        return c ? oneriKartIcerigi(c, x.gun, i) : null;
      })
      .filter((x): x is Omit<ProgramKarti, 'id' | 'programId'> => !!x),
  };
}

/** Şu anki katalogdaki öneri programları. */
export function oneriler(): Oneri[] {
  const k = katalog();
  return k.programlar.map((p) => programOnerisi(p, k.kartlar));
}

export function oneriBul(id: string): Oneri | undefined {
  return oneriler().find((o) => o.id === id);
}

/** Şu anki katalogdaki öneri kartları. */
export function oneriKartlari(): KatalogKart[] {
  return katalog().kartlar;
}

export function oneriKartBul(id: string): KatalogKart | undefined {
  return oneriKartlari().find((k) => k.id === id);
}

/** Gizlenen önerilerin anahtarı: program `p:<id>`, kart `k:<id>`. */
export function oneriAnahtari(tur: 'program' | 'kart', id: string): string {
  return `${tur === 'program' ? 'p' : 'k'}:${id}`;
}

/** Öneriden kişinin programı (hazır; kartlar kopyalanır). */
export function onerdenProgram(
  o: Oneri,
  kimlik: () => string,
  simdi: string = new Date().toISOString(),
): { program: Program; kartlar: ProgramKarti[] } {
  const id = kimlik();
  return {
    program: {
      id,
      ad: o.ad,
      alanlar: [...o.alanlar],
      neden: o.aciklama,
      sure: o.sure,
      durum: 'hazir',
      baslangic: null,
      yildiz: 0,
      degerlendirme: '',
      kaynak: RITES_ONERISI,
      olusturma: simdi,
    },
    kartlar: o.kartlar.map((k) => ({
      ...k,
      id: kimlik(),
      programId: id,
      tekrar: tekrarKopyasi(k.tekrar),
      bloklar: k.bloklar.map((b) => ({ ...b, maddeler: [...b.maddeler] })),
    })),
  };
}

// ---- Arama ---------------------------------------------------------------------

/** Kütüphanede arama için programın bütün metni. */
export function programMetni(
  p: Pick<Program, 'ad' | 'neden' | 'alanlar' | 'degerlendirme'>,
  kartlar: readonly ProgramKarti[],
): string {
  return trKucuk(
    [
      p.ad,
      p.neden,
      p.degerlendirme,
      alanlarMetni(p.alanlar),
      ...kartlar.flatMap((k) => [
        k.baslik,
        htmldenDuz(k.kisa),
        ...k.bloklar.flatMap((b) => [b.ad, htmldenDuz(b.metin), ...b.maddeler]),
      ]),
    ].join(' '),
  );
}
