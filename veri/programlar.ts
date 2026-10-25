// Programlar ve alanlar: okuma ve (yazma kapısı üzerinden) yazma (pilot 20 Ekim).
// Programın kartları `program_kart`ta durur (bloklar JSON); uygulanırken ajandaya
// düşen kartlar `kart.plan_id = program`, `kart.bag = program:<programKartı>` taşır.

import { yeniKartSirasi } from '@/mantik/ajanda';
import {
  alanBul,
  hazirAlanAnahtarlari,
  OZEL_ONEK,
  ozelAlanlariAyarla,
  varsayilanAcikMi,
  type AlanAnahtari,
  type OzelAlan,
} from '@/mantik/alanlar';
import { hatirlatmaCoz, hatirlatmaYaz, type Blok, type Kart } from '@/mantik/kart';
import type { KutuphaneBlogu } from '@/mantik/kutuphane';
import {
  ajandaKarti,
  durdurmaFarki,
  etkinDurum,
  karttanIcerik,
  programBagCoz,
  programBagi,
  programBitisi,
  PROGRAM_BAGI,
  type Program,
  type ProgramDurumu,
  type ProgramKarti,
} from '@/mantik/program';
import { gecerliSes } from '@/mantik/sesler';
import { gunEkle, type Gun } from '@/mantik/tarih';

import type { Kapi, Okuyucu, Yazici } from './kapi';
import { bloklariYazY, kartAyrinti, kartEkleY, kartSatirdan, type KartOzeti, type KimlikUretici } from './kartlar';

function json<T>(metin: string | null, varsayilan: T): T {
  if (metin === null) return varsayilan;
  try {
    return JSON.parse(metin) as T;
  } catch {
    return varsayilan;
  }
}

// ---- Satırlar ------------------------------------------------------------------

interface ProgramSatiri {
  id: string;
  ad: string;
  alanlar: string;
  neden: string;
  sure: number | null;
  durum: string;
  baslangic: string | null;
  yildiz: number;
  degerlendirme: string;
  kaynak: string;
  olusturma: string;
}

interface ProgramKartSatiri {
  id: string;
  program_id: string;
  sira: number;
  gun: number;
  baslik: string;
  kisa: string;
  saat: string | null;
  hatirlatma: string | null;
  alarm: number;
  alarm_sesi?: string | null;
  cesit?: string | null;
  tekrar: string | null;
  bloklar: string;
}

const DURUMLAR: readonly ProgramDurumu[] = ['hazir', 'uygulaniyor', 'ara', 'bitti'];

function programSatirdan(s: ProgramSatiri): Program {
  return {
    id: s.id,
    ad: s.ad,
    alanlar: json<string[]>(s.alanlar, []),
    neden: s.neden,
    sure: s.sure,
    durum: (DURUMLAR as readonly string[]).includes(s.durum) ? (s.durum as ProgramDurumu) : 'hazir',
    baslangic: s.baslangic,
    yildiz: s.yildiz,
    degerlendirme: s.degerlendirme,
    kaynak: s.kaynak,
    olusturma: s.olusturma,
  };
}

function programKartSatirdan(s: ProgramKartSatiri): ProgramKarti {
  return {
    id: s.id,
    programId: s.program_id,
    sira: s.sira,
    gun: s.gun,
    baslik: s.baslik,
    kisa: s.kisa,
    saat: s.saat,
    hatirlatma: hatirlatmaCoz(s.hatirlatma),
    alarm: s.alarm === 1,
    alarmSesi: gecerliSes(s.alarm_sesi),
    tekrar: json(s.tekrar, null),
    bloklar: json<KutuphaneBlogu[]>(s.bloklar, []),
    cesit: s.cesit ?? null,
  };
}

// ---- Okuma -----------------------------------------------------------------------

export async function programlariOku(oku: Okuyucu): Promise<Program[]> {
  return (await oku.hepsi<ProgramSatiri>('SELECT * FROM program ORDER BY olusturma DESC, rowid DESC')).map(
    programSatirdan,
  );
}

export async function programOku(oku: Okuyucu, id: string): Promise<Program | null> {
  const s = await oku.ilk<ProgramSatiri>('SELECT * FROM program WHERE id = ?', [id]);
  return s ? programSatirdan(s) : null;
}

/** Programın kartları, gün ve sıraya göre. */
export async function programKartlariOku(oku: Okuyucu, programId: string): Promise<ProgramKarti[]> {
  return (
    await oku.hepsi<ProgramKartSatiri>('SELECT * FROM program_kart WHERE program_id = ? ORDER BY gun, sira', [
      programId,
    ])
  ).map(programKartSatirdan);
}

/** Bütün programların kartları (kütüphanede arama için). */
export async function tumProgramKartlari(oku: Okuyucu): Promise<ProgramKarti[]> {
  return (await oku.hepsi<ProgramKartSatiri>('SELECT * FROM program_kart ORDER BY gun, sira')).map(programKartSatirdan);
}

/** Programa bağlı bütün ajanda kartları (geçmiş uygulamalar da). */
export async function programAjandaKartlari(oku: Okuyucu, programId?: string): Promise<KartOzeti[]> {
  const satirlar = await oku.hepsi<Parameters<typeof kartSatirdan>[0]>(
    `SELECT k.*, (SELECT COUNT(*) FROM blok b WHERE b.kart_id = k.id) AS blok_sayisi FROM kart k
     WHERE ${programId ? 'k.plan_id = ?' : 'k.plan_id IS NOT NULL'} ORDER BY k.sira`,
    programId ? [programId] : [],
  );
  return satirlar.map(kartSatirdan);
}

/** Program ekranı Gelişim için: kartların ölçüm blokları, kayıtları ve yapılanlar. */
export async function programKayitlari(
  oku: Okuyucu,
  programId: string,
  ilk: Gun,
): Promise<{
  olcumler: Pick<Blok, 'id' | 'kartId' | 'tur' | 'ad' | 'birim'>[];
  kayitlar: { kartId: string; tarih: Gun; yapildi: boolean; degerler: Record<string, string> }[];
}> {
  const bloklar = await oku.hepsi<{ id: string; kart_id: string; tur: string; ad: string; birim: string }>(
    `SELECT b.id, b.kart_id, b.tur, b.ad, b.birim FROM blok b JOIN kart k ON k.id = b.kart_id
     WHERE k.plan_id = ? AND b.tur = 'olcum' ORDER BY k.sira, b.sira`,
    [programId],
  );
  const kayitlar = await oku.hepsi<{ kart_id: string; tarih: string; yapildi: number; degerler: string }>(
    `SELECT r.kart_id, r.tarih, r.yapildi, r.degerler FROM kayit r JOIN kart k ON k.id = r.kart_id
     WHERE k.plan_id = ? AND r.tarih >= ? ORDER BY r.tarih`,
    [programId, ilk],
  );
  return {
    olcumler: bloklar.map((b) => ({ id: b.id, kartId: b.kart_id, tur: 'olcum' as const, ad: b.ad, birim: b.birim })),
    kayitlar: kayitlar.map((r) => ({
      kartId: r.kart_id,
      tarih: r.tarih,
      yapildi: r.yapildi === 1,
      degerler: json<Record<string, string>>(r.degerler, {}),
    })),
  };
}

// ---- Alanlar ---------------------------------------------------------------------

export interface AlanDurumu {
  acik: boolean;
  /** 0 = puan verilmemiş. */
  puan: number;
  ilerlemek: boolean;
}

export function varsayilanAlanDurumu(alan: AlanAnahtari): AlanDurumu {
  return { acik: varsayilanAcikMi(alan), puan: 0, ilerlemek: false };
}

interface AlanSatiri {
  alan: string;
  acik: number;
  puan: number;
  ilerlemek: number;
  ad: string | null;
  aciklama: string;
}

/** Kişinin eklediği alanlar (eklendiği sırayla); `mantik/alanlar`a da bildirilir. */
export async function ozelAlanlariOku(oku: Okuyucu): Promise<OzelAlan[]> {
  const satirlar = await oku.hepsi<AlanSatiri>(
    "SELECT * FROM alan_durumu WHERE alan LIKE 'ozel-%' AND ad IS NOT NULL ORDER BY sira, rowid",
  );
  const liste = satirlar.map((s) => ({ anahtar: s.alan, ad: s.ad!, aciklama: s.aciklama }));
  ozelAlanlariAyarla(liste);
  return liste;
}

/** Bütün alanların durumu (hazırlar ve kişinin eklediği alanlar); kaydı olmayan varsayılanla. */
export async function alanDurumlari(oku: Okuyucu): Promise<Map<AlanAnahtari, AlanDurumu>> {
  const satirlar = await oku.hepsi<AlanSatiri>('SELECT * FROM alan_durumu');
  const ozeller = await ozelAlanlariOku(oku);
  const sonuc = new Map<AlanAnahtari, AlanDurumu>(
    [...hazirAlanAnahtarlari(), ...ozeller.map((o) => o.anahtar)].map((a) => [a, varsayilanAlanDurumu(a)]),
  );
  for (const s of satirlar) {
    if (sonuc.has(s.alan)) sonuc.set(s.alan, { acik: s.acik === 1, puan: s.puan, ilerlemek: s.ilerlemek === 1 });
  }
  return sonuc;
}

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

/** Alanın puanı ya da Yaşam'da görünürlüğü. (`ilerlemek` 22 Ekim'den beri arayüzde yok; sütun durur.) */
export function alanDurumuYaz(kapi: Kapi, alan: AlanAnahtari, degisiklik: Partial<AlanDurumu>): Promise<void> {
  return kapi.yaz(['plan'], (y) => alanDurumuYazY(y, alan, degisiklik));
}

/** Kişinin kendi alanı; Yaşam'da açık gelir. Döner: alanın anahtarı. */
export async function ozelAlanEkle(kapi: Kapi, ad: string, aciklama: string, kimlik: KimlikUretici): Promise<string> {
  const anahtar = OZEL_ONEK + kimlik();
  await kapi.yaz(['plan'], (y) =>
    y.calistir(
      `INSERT INTO alan_durumu (alan, acik, puan, ilerlemek, ad, aciklama, sira)
       VALUES (?, 1, 0, 0, ?, ?, (SELECT COALESCE(MAX(sira), 0) + 1 FROM alan_durumu))`,
      [anahtar, ad.trim(), aciklama.trim()],
    ),
  );
  return anahtar;
}

export function ozelAlanYaz(kapi: Kapi, anahtar: AlanAnahtari, ad: string, aciklama: string): Promise<void> {
  return kapi.yaz(['plan'], (y) =>
    y.calistir('UPDATE alan_durumu SET ad = ?, aciklama = ? WHERE alan = ?', [ad.trim(), aciklama.trim(), anahtar]),
  );
}

/** Kişinin eklediği alanı siler; programların etiketlerinden de çıkar. */
export function ozelAlanSil(kapi: Kapi, anahtar: AlanAnahtari): Promise<void> {
  return kapi.yaz(['plan', 'kutuphane'], async (y) => {
    await y.calistir('DELETE FROM alan_durumu WHERE alan = ?', [anahtar]);
    for (const tablo of ['program', 'kutuphane'] as const) {
      const satirlar = await y.hepsi<{ id: string; alanlar: string }>(
        `SELECT id, alanlar FROM ${tablo} WHERE alanlar LIKE ?`,
        [`%${anahtar}%`],
      );
      for (const s of satirlar) {
        const yeni = json<string[]>(s.alanlar, []).filter((a) => a !== anahtar);
        await y.calistir(`UPDATE ${tablo} SET alanlar = ? WHERE id = ?`, [JSON.stringify(yeni), s.id]);
      }
    }
  });
}

// ---- Yazma yardımcıları ------------------------------------------------------------

async function programKartiEkleY(y: Yazici, k: ProgramKarti) {
  await y.calistir(
    `INSERT INTO program_kart (id, program_id, sira, gun, baslik, kisa, saat, hatirlatma, alarm, alarm_sesi, tekrar, bloklar, cesit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      k.id,
      k.programId,
      k.sira,
      k.gun,
      k.baslik,
      k.kisa,
      k.saat,
      hatirlatmaYaz(k.hatirlatma),
      k.alarm ? 1 : 0,
      gecerliSes(k.alarmSesi),
      k.tekrar ? JSON.stringify(k.tekrar) : null,
      JSON.stringify(k.bloklar),
      k.cesit ?? null,
    ],
  );
}

async function programKartiGuncelleY(y: Yazici, k: ProgramKarti) {
  await y.calistir(
    `UPDATE program_kart SET sira = ?, gun = ?, baslik = ?, kisa = ?, saat = ?, hatirlatma = ?, alarm = ?, alarm_sesi = ?, tekrar = ?, bloklar = ?, cesit = ?
     WHERE id = ?`,
    [
      k.sira,
      k.gun,
      k.baslik,
      k.kisa,
      k.saat,
      hatirlatmaYaz(k.hatirlatma),
      k.alarm ? 1 : 0,
      gecerliSes(k.alarmSesi),
      k.tekrar ? JSON.stringify(k.tekrar) : null,
      JSON.stringify(k.bloklar),
      k.cesit ?? null,
      k.id,
    ],
  );
}

async function programOkuY(y: Yazici, id: string): Promise<Program | null> {
  const s = await y.ilk<ProgramSatiri>('SELECT * FROM program WHERE id = ?', [id]);
  return s ? programSatirdan(s) : null;
}

async function alanlariAcY(y: Yazici, alanlar: readonly AlanAnahtari[]) {
  for (const a of alanlar) if (alanBul(a)) await alanDurumuYazY(y, a, { acik: true });
}

/** Program kartlarından ajanda kartları yazar (`ilkGun`den önceye düşmez). */
async function ajandayaYazY(
  y: Yazici,
  p: Program,
  kartlar: readonly ProgramKarti[],
  ilkGun: Gun,
  idUret: KimlikUretici,
  simdi: string,
) {
  const mevcut = await y.hepsi<{ sira: number; saat: string | null }>('SELECT sira, saat FROM kart');
  for (const pk of kartlar) {
    const a = ajandaKarti(pk, p, ilkGun, idUret);
    if (!a) continue;
    const sira = yeniKartSirasi(mevcut, a.kart.saat);
    mevcut.push({ sira, saat: a.kart.saat });
    await kartEkleY(y, { ...a.kart, sira }, simdi);
    await bloklariYazY(y, a.kart.id, a.bloklar, idUret);
  }
}

interface AjandaSatiri {
  id: string;
  tarih: string | null;
  tekrar: string | null;
  bitis: string | null;
  yapildi: number;
}

/** Bağlı ajanda kartlarında gelecek yapılmamışları siler, başlamış dizileri dün bitirir; bağ kopar. */
async function ajandadanKaldirY(y: Yazici, kosul: string, params: (string | number)[], bugunGun: Gun) {
  const satirlar = await y.hepsi<AjandaSatiri>(
    `SELECT id, tarih, tekrar, bitis, yapildi FROM kart WHERE ${kosul}`,
    params,
  );
  const fark = durdurmaFarki(
    satirlar.map((s) => ({
      id: s.id,
      tarih: s.tarih,
      tekrar: json(s.tekrar, null),
      bitis: s.bitis,
      yapildi: s.yapildi === 1,
    })),
    bugunGun,
  );
  for (const id of fark.sil) {
    await y.calistir('DELETE FROM kayit WHERE kart_id = ?', [id]);
    await y.calistir('DELETE FROM blok WHERE kart_id = ?', [id]);
    await y.calistir('DELETE FROM kart WHERE id = ?', [id]);
  }
  const dun = gunEkle(bugunGun, -1);
  for (const id of fark.bitir) await y.calistir('UPDATE kart SET bitis = ? WHERE id = ?', [dun, id]);
  const kalan = satirlar.map((s) => s.id).filter((id) => !fark.sil.includes(id));
  for (const id of kalan) await y.calistir('UPDATE kart SET bag = NULL WHERE id = ?', [id]);
}

// ---- Program ---------------------------------------------------------------------

/** Yeni program (hazır); kartlarıyla birlikte. Etiketli alanlar Yaşam'da açılır. */
export function programKur(kapi: Kapi, p: Program, kartlar: readonly ProgramKarti[] = []): Promise<void> {
  return kapi.yaz(['plan'], async (y) => {
    await y.calistir(
      `INSERT INTO program (id, ad, alanlar, neden, sure, durum, baslangic, yildiz, degerlendirme, kaynak, olusturma)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.ad,
        JSON.stringify(p.alanlar),
        p.neden,
        p.sure,
        p.durum,
        p.baslangic,
        p.yildiz,
        p.degerlendirme,
        p.kaynak,
        p.olusturma,
      ],
    );
    for (const k of kartlar) await programKartiEkleY(y, k);
    await alanlariAcY(y, p.alanlar);
  });
}

/**
 * Ad, alanlar, açıklama, süre. Uygulanırken süre değişirse ajandadaki dizilerin
 * bitişi yeni son güne taşınır.
 */
export function programBilgisiYaz(
  kapi: Kapi,
  id: string,
  bilgi: Pick<Program, 'ad' | 'alanlar' | 'neden' | 'sure'>,
): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    const eski = await programOkuY(y, id);
    if (!eski) return;
    await y.calistir('UPDATE program SET ad = ?, alanlar = ?, neden = ?, sure = ? WHERE id = ?', [
      bilgi.ad.trim(),
      JSON.stringify(bilgi.alanlar),
      bilgi.neden.trim(),
      bilgi.sure,
      id,
    ]);
    await alanlariAcY(y, bilgi.alanlar);
    if (eski.durum === 'uygulaniyor' && eski.sure !== bilgi.sure) {
      const yeniBitis = programBitisi({ baslangic: eski.baslangic, sure: bilgi.sure });
      await y.calistir(
        `UPDATE kart SET bitis = ? WHERE plan_id = ? AND bag LIKE '${PROGRAM_BAGI}%' AND tekrar IS NOT NULL`,
        [yeniBitis, id],
      );
    }
  });
}

/** "Başlat" / "Yeniden başlat": kartlar `baslangic`tan itibaren ajandaya düşer. */
export function programBaslat(
  kapi: Kapi,
  id: string,
  baslangic: Gun,
  bugunGun: Gun,
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    const p = await programOkuY(y, id);
    if (!p) return;
    // Önceki uygulamadan bağlı kalan kart varsa (ör. süresi kendiliğinden bitmiş) bağı kopar.
    await ajandadanKaldirY(y, `plan_id = ? AND bag LIKE '${PROGRAM_BAGI}%'`, [id], bugunGun);
    const yeni: Program = { ...p, durum: 'uygulaniyor', baslangic };
    await y.calistir("UPDATE program SET durum = 'uygulaniyor', baslangic = ? WHERE id = ?", [baslangic, id]);
    const kartlar = (
      await y.hepsi<ProgramKartSatiri>('SELECT * FROM program_kart WHERE program_id = ? ORDER BY gun, sira', [id])
    ).map(programKartSatirdan);
    await ajandayaYazY(y, yeni, kartlar, baslangic, idUret, simdi);
    await alanlariAcY(y, p.alanlar);
  });
}

/** "Ara ver" ya da "Bitir": gelecekteki yapılmamış kartlar ajandadan kalkar; geçmiş kalır. */
export function programiDurdur(kapi: Kapi, id: string, durum: 'ara' | 'bitti', bugunGun: Gun): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    await ajandadanKaldirY(y, `plan_id = ? AND bag LIKE '${PROGRAM_BAGI}%'`, [id], bugunGun);
    await y.calistir('UPDATE program SET durum = ? WHERE id = ?', [durum, id]);
  });
}

/** Değerlendirme (1–5 yıldız ve not). Süresi geçmiş program burada "bitti" olarak kapanır. */
export function programiDegerlendir(
  kapi: Kapi,
  id: string,
  yildiz: number,
  degerlendirme: string,
  bugunGun: Gun,
): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    const p = await programOkuY(y, id);
    if (!p) return;
    if (p.durum === 'uygulaniyor' && etkinDurum(p, bugunGun) === 'bitti') {
      await ajandadanKaldirY(y, `plan_id = ? AND bag LIKE '${PROGRAM_BAGI}%'`, [id], bugunGun);
      await y.calistir("UPDATE program SET durum = 'bitti' WHERE id = ?", [id]);
    }
    await y.calistir('UPDATE program SET yildiz = ?, degerlendirme = ? WHERE id = ?', [
      Math.max(0, Math.min(5, Math.round(yildiz))),
      degerlendirme.trim(),
      id,
    ]);
  });
}

/** Programı siler. Ajandadaki gelecek kartları kalkar; geçmiştekiler sıradan kart olarak kalır. */
export function programSil(kapi: Kapi, id: string, bugunGun: Gun): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    await ajandadanKaldirY(y, `plan_id = ? AND bag LIKE '${PROGRAM_BAGI}%'`, [id], bugunGun);
    await y.calistir('UPDATE kart SET plan_id = NULL WHERE plan_id = ?', [id]);
    await y.calistir('DELETE FROM program_kart WHERE program_id = ?', [id]);
    await y.calistir('DELETE FROM program WHERE id = ?', [id]);
  });
}

// ---- Programın kartları --------------------------------------------------------------

/**
 * Programa kart ekler (en sona). Program uygulanıyorsa kart o günden sonra
 * ajandaya da düşer.
 */
export function programKartiEkle(
  kapi: Kapi,
  programId: string,
  icerik: Omit<ProgramKarti, 'id' | 'programId' | 'sira'>,
  bugunGun: Gun,
  idUret: KimlikUretici,
  simdi: string = new Date().toISOString(),
): Promise<string> {
  const id = idUret();
  return kapi
    .yaz(['plan', 'kart'], async (y) => {
      const p = await programOkuY(y, programId);
      if (!p) return;
      const enBuyuk = await y.ilk<{ s: number | null }>(
        'SELECT MAX(sira) AS s FROM program_kart WHERE program_id = ?',
        [programId],
      );
      const pk: ProgramKarti = { ...icerik, id, programId, sira: (enBuyuk?.s ?? 0) + 1 };
      await programKartiEkleY(y, pk);
      if (etkinDurum(p, bugunGun) === 'uygulaniyor' && p.baslangic) {
        await ajandayaYazY(y, p, [pk], p.baslangic > bugunGun ? p.baslangic : bugunGun, idUret, simdi);
      }
    })
    .then(() => id);
}

/** Programın kartını düzenler (uygulanmıyorken; uygulanırken ajandadaki kart düzenlenir). */
export function programKartiYaz(kapi: Kapi, pk: ProgramKarti): Promise<void> {
  return kapi.yaz(['plan'], (y) => programKartiGuncelleY(y, pk));
}

/** Programdan çıkarır; ajandadaki karşılığının gelecek günleri de kalkar. */
export function programKartiSil(kapi: Kapi, pkId: string, bugunGun: Gun): Promise<void> {
  return kapi.yaz(['plan', 'kart'], async (y) => {
    await ajandadanKaldirY(y, 'bag = ?', [programBagi(pkId)], bugunGun);
    await y.calistir('DELETE FROM program_kart WHERE id = ?', [pkId]);
  });
}

/**
 * Ajandadaki kartı programa ekler. Program uygulanıyorsa kart programın parçası
 * olur (ajandada aynı kart kalır); değilse programa kopyası eklenir.
 */
export async function karttanProgramaEkle(
  kapi: Kapi,
  oku: Okuyucu,
  kartId: string,
  programId: string,
  bugunGun: Gun,
  idUret: KimlikUretici,
): Promise<'baglandi' | 'kopyalandi' | null> {
  const a = await kartAyrinti(oku, kartId);
  const p = await programOku(oku, programId);
  if (!a || !p) return null;
  const uygulaniyor = etkinDurum(p, bugunGun) === 'uygulaniyor' && !!p.baslangic;
  const icerik = karttanIcerik(a.kart, a.bloklar, uygulaniyor ? p.baslangic : null);
  const pkId = idUret();
  await kapi.yaz(['plan', 'kart'], async (y) => {
    const enBuyuk = await y.ilk<{ s: number | null }>('SELECT MAX(sira) AS s FROM program_kart WHERE program_id = ?', [
      programId,
    ]);
    await programKartiEkleY(y, { ...icerik, id: pkId, programId, sira: (enBuyuk?.s ?? 0) + 1 });
    if (uygulaniyor) {
      await y.calistir('UPDATE kart SET plan_id = ?, bag = ? WHERE id = ?', [programId, programBagi(pkId), kartId]);
      const bitis = programBitisi(p);
      if (a.kart.tekrar && bitis && (!a.kart.bitis || a.kart.bitis > bitis)) {
        await y.calistir('UPDATE kart SET bitis = ? WHERE id = ?', [bitis, kartId]);
      }
    }
    await alanlariAcY(y, p.alanlar);
  });
  return uygulaniyor ? 'baglandi' : 'kopyalandi';
}

/**
 * Ajandadaki program kartı düzenlenince programdaki karşılığı da değişir
 * (başlık, açıklama, saat, hatırlatma, tekrar, bloklar; tek seferlik kartta gün de).
 */
export async function programaYansit(kapi: Kapi, oku: Okuyucu, kartId: string): Promise<void> {
  const a = await kartAyrinti(oku, kartId);
  const pkId = programBagCoz(a?.kart.bag ?? null);
  if (!a || !pkId || !a.kart.planId) return;
  const p = await programOku(oku, a.kart.planId);
  const eski = (await oku.ilk<ProgramKartSatiri>('SELECT * FROM program_kart WHERE id = ?', [pkId])) ?? null;
  if (!p || !eski) return;
  const icerik = karttanIcerik(a.kart, a.bloklar, p.baslangic);
  const onceki = programKartSatirdan(eski);
  await programKartiYaz(kapi, {
    ...onceki,
    ...icerik,
    gun: a.kart.tekrar ? onceki.gun : icerik.gun,
  });
}

/** Ajandadaki kart programın kartı mı (programın adı için). */
export function programKartiMi(kart: Pick<Kart, 'planId' | 'bag'>): boolean {
  return !!kart.planId && !!programBagCoz(kart.bag);
}
