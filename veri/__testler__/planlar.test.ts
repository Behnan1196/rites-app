/**
 * @jest-environment node
 */
import { alanBul } from '@/mantik/alanlar';
import { etkinliktenKart, adimKarti, type Plan } from '@/mantik/plan';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { gunYapilanlari, planKartlari, planKayitlari, kayitDegistir, tumKartlar } from '../kartlar';
import {
  adimEkle, adimiAjandayaAl, adimIsaretle, alanDurumlari, alanDurumuYaz, planBaslat, planBilgisiYaz, planiBitir,
  planlariOku, planOku, soruCevapla, soruCevaplari,
} from '../planlar';
import { yayinOlustur, type Konu } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

const BUGUN = '2026-10-11';
let kapi: Kapi;
let oku: Okuyucu;
let duyurulan: Konu[][];
let n = 0;
const idUret = () => `id${++n}`;

const plan = (d: Partial<Plan> = {}): Plan => ({
  id: 'p1', ad: 'Sabah planım', alan: 'hareket', kaynak: 'kendim', neden: '', hedef: '', baslangic: BUGUN,
  bitis: '2026-11-08', baslangicPuani: 2, gununSorusu: null, durum: 'etkin', ...d,
});

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  const yayin = yayinOlustur();
  duyurulan = [];
  yayin.abone(['plan', 'kart'], (k) => duyurulan.push([...k].sort()));
  kapi = kapiOlustur(db, yayin);
  oku = okuyucuOlustur(db);
  n = 0;
});

async function baslat() {
  const [esneme, tai] = alanBul('hareket')!.etkinlikler;
  const p = plan();
  await planBaslat(
    kapi,
    {
      plan: p,
      duzenliler: [etkinliktenKart(esneme!, p, BUGUN, idUret), etkinliktenKart(tai!, p, BUGUN, idUret)],
      adimlar: [adimKarti('a1', 'Mat al', 'p1', 1), adimKarti('a2', 'Video seç', 'p1', 2)],
    },
    idUret,
  );
}

describe('planlar (gerçek SQLite)', () => {
  it('plan başlatma tek işlemde yazar; alan Yaşam\'da açılır', async () => {
    await alanDurumuYaz(kapi, 'ogrenme', { puan: 4 });
    expect((await alanDurumlari(oku)).get('ogrenme')).toEqual({ acik: false, puan: 4, ilerlemek: false });
    await baslat();
    expect(await planlariOku(oku)).toEqual([plan()]);
    const kartlar = await planKartlari(oku, 'p1');
    expect(kartlar.map((k) => [k.baslik, k.blokSayisi, k.tarihsiz, k.bitis])).toEqual([
      ['Sabah esnemesi', 1, false, '2026-11-08'],
      ['Tai chi, 8 hareket', 2, false, '2026-11-08'],
      ['Mat al', 0, true, null],
      ['Video seç', 0, true, null],
    ]);
    expect((await alanDurumlari(oku)).get('hareket')).toEqual({ acik: true, puan: 0, ilerlemek: false });
    expect(duyurulan.at(-1)).toEqual(['kart', 'plan']);
  });

  it('başlatma yarıda kalırsa hiçbir şey yazılmaz', async () => {
    const p = plan();
    const bozuk = { ...etkinliktenKart(alanBul('hareket')!.etkinlikler[0]!, p, BUGUN, idUret) };
    await expect(
      planBaslat(kapi, { plan: p, duzenliler: [bozuk, bozuk], adimlar: [] }, idUret),
    ).rejects.toThrow();
    expect(await planlariOku(oku)).toEqual([]);
    expect(await tumKartlar(oku)).toEqual([]);
  });

  it('bilgiler, Günün sorusu ve cevaplar', async () => {
    await baslat();
    const soru = { metin: 'Bu sabah kendini ne kadar dinç hissettin?', alt: 'Hiç', ust: 'Çok' };
    await planBilgisiYaz(kapi, 'p1', { neden: 'Dinç uyanmak', gununSorusu: soru });
    expect(await planOku(oku, 'p1')).toMatchObject({ neden: 'Dinç uyanmak', hedef: '', gununSorusu: soru });
    await soruCevapla(kapi, 'p1', BUGUN, 3);
    await soruCevapla(kapi, 'p1', BUGUN, 4);
    await soruCevapla(kapi, 'p1', '2026-10-09', 2);
    expect(await soruCevaplari(oku, 'p1', '2026-10-05', BUGUN)).toEqual(new Map([['2026-10-09', 2], [BUGUN, 4]]));
    await soruCevapla(kapi, 'p1', BUGUN, null);
    expect((await soruCevaplari(oku, 'p1', BUGUN, BUGUN)).size).toBe(0);
    await planBilgisiYaz(kapi, 'p1', { gununSorusu: null });
    expect((await planOku(oku, 'p1'))!.gununSorusu).toBeNull();
  });

  it('adımlar: ekle, işaretle, ajandaya al', async () => {
    await baslat();
    await adimEkle(kapi, adimKarti('a3', 'Ayakkabı', 'p1', 3));
    await adimIsaretle(kapi, (await planKartlari(oku, 'p1')).find((k) => k.id === 'a1')!, true);
    let kartlar = await planKartlari(oku, 'p1');
    expect(kartlar.find((k) => k.id === 'a1')!.yapildi).toBe(true);
    await adimiAjandayaAl(kapi, 'a2', BUGUN);
    kartlar = await planKartlari(oku, 'p1');
    const a2 = kartlar.find((k) => k.id === 'a2')!;
    expect([a2.tarih, a2.tarihsiz]).toEqual([BUGUN, false]);
    await adimIsaretle(kapi, a2, true);
    expect((await gunYapilanlari(oku, BUGUN)).has('a2')).toBe(true);
    expect((await planKartlari(oku, 'p1')).find((k) => k.id === 'a2')!.yapildi).toBe(true);
  });

  it('Planı bitir: kartlar ajandadan kalkar, planda ve kayıtlarda durur', async () => {
    await baslat();
    const tai = (await planKartlari(oku, 'p1'))[1]!;
    const olcumsuz = await planKayitlari(oku, 'p1');
    expect(olcumsuz.olcumler).toEqual([]);
    await kayitDegistir(kapi, tai.id, BUGUN, (k) => ({ ...k, yapildi: true }));
    expect(await tumKartlar(oku)).toHaveLength(4);
    await planiBitir(kapi, 'p1');
    expect(await tumKartlar(oku)).toHaveLength(0);
    expect(await planKartlari(oku, 'p1')).toHaveLength(4);
    expect((await planKayitlari(oku, 'p1')).kayitlar).toHaveLength(1);
    expect((await planOku(oku, 'p1'))!.durum).toBe('bitti');
  });
});
