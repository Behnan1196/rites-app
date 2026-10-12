/**
 * @jest-environment node
 */
import { duzenle, sil, type KartTanimi } from '@/mantik/bolme';
import { yeniKart, type Kart, type Tekrar } from '@/mantik/kart';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import {
  blokMetinleri, gunYapilanlari, isaretle, islemleriUygula, kartAyrinti, kartKayitlari, kayitDegistir, kayitVarMi, tumKartlar,
  yeniKartKaydet, type BlokTaslagi,
} from '../kartlar';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

const her = (t: Partial<Tekrar> = {}): Tekrar => ({ gunSayisi: null, gunler: null, desen: null, ...t });
const tanim = (k: Kart, d: Partial<KartTanimi> = {}): KartTanimi => ({
  baslik: k.baslik, kisa: k.kisa, tarih: k.tarih, saat: k.saat, hatirlatma: k.hatirlatma, tekrar: k.tekrar, ...d,
});
const blok = (id: string, d: Partial<BlokTaslagi> = {}): BlokTaslagi => ({
  id, tur: 'olcum', ad: 'Tekrar sayısı', metin: '', birim: 'tekrar', dakika: null, maddeler: [], dosya: null, ...d,
});

let kapi: Kapi;
let oku: Okuyucu;
let sayac = 0;
const idUret = () => `id${++sayac}`;

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  sayac = 0;
});

describe('kart veri katmanı (gerçek SQLite)', () => {
  it('kart ve blokları yazılır, okunur', async () => {
    const k = yeniKart('k1', {
      baslik: 'Direnç egzersizi', tarih: '2026-10-05', saat: '18:00', tekrar: her({ gunler: ['Pzt', 'Çar', 'Cum'] }),
      atlanan: ['2026-10-07'], hatirlatma: 'saatinde',
    });
    await yeniKartKaydet(kapi, k, [blok('f1'), blok('f2', { tur: 'liste', maddeler: ['a', 'b'] })], idUret);
    const kartlar = await tumKartlar(oku);
    expect(kartlar).toHaveLength(1);
    expect(kartlar[0]).toEqual({ ...k, blokSayisi: 2 });
    const ayrinti = await kartAyrinti(oku, 'k1');
    expect(ayrinti!.bloklar.map((b) => [b.id, b.tur, b.sira, b.maddeler])).toEqual([
      ['id1', 'olcum', 0, []],
      ['id2', 'liste', 1, ['a', 'b']],
    ]);
    expect(await blokMetinleri(oku)).toEqual(new Map([['k1', 'Tekrar sayısı Tekrar sayısı a b']]));
  });

  it('işaretleme o günün kaydına yazar; tek seferlik kartın kısa yolu eşitlenir', async () => {
    const tek = yeniKart('t', { baslik: 'Fatura', tarih: '2026-10-12' });
    const dizi = yeniKart('d', { baslik: 'Yürüyüş', tarih: '2026-10-01', tekrar: her() });
    await yeniKartKaydet(kapi, tek, [], idUret);
    await yeniKartKaydet(kapi, dizi, [], idUret);
    await isaretle(kapi, 't', '2026-10-12', true);
    await isaretle(kapi, 'd', '2026-10-12', true);
    expect(await gunYapilanlari(oku, '2026-10-12')).toEqual(new Set(['t', 'd']));
    expect(await gunYapilanlari(oku, '2026-10-13')).toEqual(new Set());
    const kartlar = await tumKartlar(oku);
    expect(kartlar.find((k) => k.id === 't')!.yapildi).toBe(true);
    expect(kartlar.find((k) => k.id === 'd')!.yapildi).toBe(false);
    await isaretle(kapi, 't', '2026-10-12', false);
    expect((await tumKartlar(oku)).find((k) => k.id === 't')!.yapildi).toBe(false);
  });

  it('kayıt değerleri günlere ayrı yazılır', async () => {
    await yeniKartKaydet(kapi, yeniKart('d', { baslik: 'x', tarih: '2026-10-01', tekrar: her() }), [blok('f1')], idUret);
    await kayitDegistir(kapi, 'd', '2026-10-07', (k) => ({ ...k, degerler: { id1: '14' } }));
    await kayitDegistir(kapi, 'd', '2026-10-09', (k) => ({ ...k, degerler: { id1: '15' }, yapildi: true }));
    const kayitlar = await kartKayitlari(oku, 'd');
    expect(kayitlar.map((k) => [k.tarih, k.degerler, k.yapildi])).toEqual([
      ['2026-10-07', { id1: '14' }, false],
      ['2026-10-09', { id1: '15' }, true],
    ]);
  });

  it('düzenlemede bloklar güncellenir, eklenir, çıkarılanlar silinir', async () => {
    const k = yeniKart('k', { baslik: 'x', tarih: '2026-10-12' });
    await yeniKartKaydet(kapi, k, [blok('a'), blok('b')], idUret); // id1, id2
    const s = duzenle(k, '2026-10-12', tanim(k, { baslik: 'y' }), null, idUret);
    await islemleriUygula(kapi, s.islemler, [blok('id2', { ad: 'Kilo' }), blok('gecici')], idUret);
    const a = await kartAyrinti(oku, 'k');
    expect(a!.kart.baslik).toBe('y');
    expect(a!.bloklar.map((b) => [b.id, b.ad, b.sira])).toEqual([
      ['id2', 'Kilo', 0],
      ['id3', 'Tekrar sayısı', 1],
    ]);
  });

  it('tek seferlik kartın günü değişince kaydı da taşınır', async () => {
    const k = yeniKart('k', { baslik: 'x', tarih: '2026-10-11' });
    await yeniKartKaydet(kapi, k, [], idUret);
    await isaretle(kapi, 'k', '2026-10-11', true);
    const s = duzenle(k, '2026-10-11', tanim(k, { tarih: '2026-10-12' }), null, idUret);
    await islemleriUygula(kapi, s.islemler, [], idUret);
    expect(await gunYapilanlari(oku, '2026-10-12')).toEqual(new Set(['k']));
    expect(await gunYapilanlari(oku, '2026-10-11')).toEqual(new Set());
  });

  it('"Bu gün ve sonrası": sonraki kayıtlar yeni karta, blok anahtarları çevrilerek taşınır', async () => {
    const k = yeniKart('eski', { baslik: 'Direnç', tarih: '2026-10-01', tekrar: her() });
    await yeniKartKaydet(kapi, k, [blok('f')], idUret); // blok id1
    await kayitDegistir(kapi, 'eski', '2026-10-10', (r) => ({ ...r, yapildi: true, degerler: { id1: '14' } }));
    await kayitDegistir(kapi, 'eski', '2026-10-12', (r) => ({ ...r, yapildi: true, degerler: { id1: '15' } }));
    const s = duzenle(k, '2026-10-12', tanim(k, { saat: '18:00' }), 'buGunVeSonrasi', idUret); // yeni kart id2
    await islemleriUygula(kapi, s.islemler, [blok('id1')], idUret); // yeni blok id3
    const eskiKayit = await kartKayitlari(oku, 'eski');
    const yeniKayit = await kartKayitlari(oku, 'id2');
    expect(eskiKayit.map((r) => [r.tarih, r.degerler])).toEqual([['2026-10-10', { id1: '14' }]]);
    expect(yeniKayit.map((r) => [r.tarih, r.degerler, r.yapildi])).toEqual([['2026-10-12', { id3: '15' }, true]]);
    const yeni = await kartAyrinti(oku, 'id2');
    expect(yeni!.bloklar.map((b) => b.id)).toEqual(['id3']);
    expect(yeni!.kart.saat).toBe('18:00');
    expect((await kartAyrinti(oku, 'eski'))!.kart.bitis).toBe('2026-10-11');
  });

  it('"Yalnız bu gün": o günün kaydı yeni tek seferlik karta taşınır, kısa yol eşitlenir', async () => {
    const k = yeniKart('eski', { baslik: 'Direnç', tarih: '2026-10-01', tekrar: her() });
    await yeniKartKaydet(kapi, k, [], idUret);
    await isaretle(kapi, 'eski', '2026-10-12', true);
    const s = duzenle(k, '2026-10-12', tanim(k, { baslik: 'Kısa direnç' }), 'yalnizBuGun', idUret);
    await islemleriUygula(kapi, s.islemler, [], idUret);
    const yeniId = s.islemler.find((i) => i.tur === 'kartEkle')!;
    const id = yeniId.tur === 'kartEkle' ? yeniId.kart.id : '';
    expect(await gunYapilanlari(oku, '2026-10-12')).toEqual(new Set([id]));
    expect((await kartAyrinti(oku, id))!.kart.yapildi).toBe(true);
  });

  it('silme: tamamen silinince kayıtlar da gider; "sonrası" silmede geçmiş kalır', async () => {
    const k = yeniKart('d', { baslik: 'x', tarih: '2026-10-01', tekrar: her() });
    await yeniKartKaydet(kapi, k, [blok('f')], idUret);
    await isaretle(kapi, 'd', '2026-10-10', true);
    await isaretle(kapi, 'd', '2026-10-13', true);
    await islemleriUygula(kapi, sil(k, '2026-10-12', 'buGunVeSonrasi').islemler, [], idUret);
    expect((await kartKayitlari(oku, 'd')).map((r) => r.tarih)).toEqual(['2026-10-10']);
    expect(await kayitVarMi(oku, 'd')).toBe(true);
    await islemleriUygula(kapi, sil(k, '2026-10-01', null).islemler, [], idUret);
    expect(await tumKartlar(oku)).toHaveLength(0);
    expect(await kayitVarMi(oku, 'd')).toBe(false);
    expect(await kartAyrinti(oku, 'd')).toBeNull();
  });

  it('işlem yarıda hata verirse hiçbir şey yazılmaz', async () => {
    const k = yeniKart('k', { baslik: 'x', tarih: '2026-10-12' });
    await yeniKartKaydet(kapi, k, [], idUret);
    await expect(
      islemleriUygula(
        kapi,
        [
          { tur: 'kartGuncelle', kart: { ...k, baslik: 'değişti' } },
          { tur: 'kartEkle', kart: k }, // aynı kimlik: hata
        ],
        [],
        idUret,
      ),
    ).rejects.toThrow();
    expect((await kartAyrinti(oku, 'k'))!.kart.baslik).toBe('x');
  });
});
