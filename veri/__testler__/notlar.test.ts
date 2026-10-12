/**
 * @jest-environment node
 */
import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { kartAyrinti, kartiBirak, kartlariBuguneAl, tumKartlar, yeniKartKaydet } from '../kartlar';
import { notEkle, notlariOku, notlariSirala, notMetniniDegistir, notSil, notuAjandayaAl } from '../notlar';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';
import { yeniKart } from '@/mantik/kart';

let kapi: Kapi;
let oku: Okuyucu;
let n = 0;
const idUret = () => `id${++n}`;

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  n = 0;
});

describe('notlar (gerçek SQLite)', () => {
  it('yeni not en üste eklenir; boş not kaydedilmez', async () => {
    await notEkle(kapi, { id: 'a', metin: 'Eczaneye uğra' }, '2026-10-12T08:00:00Z');
    await notEkle(kapi, { id: 'b', metin: '  Torunun doğum günü hediyesi ' }, '2026-10-12T09:00:00Z');
    await notEkle(kapi, { id: 'c', metin: '   ' });
    const notlar = await notlariOku(oku);
    expect(notlar.map((x) => [x.id, x.metin])).toEqual([
      ['b', 'Torunun doğum günü hediyesi'],
      ['a', 'Eczaneye uğra'],
    ]);
  });

  it('düzenle, sırala, sil', async () => {
    for (const id of ['a', 'b', 'c']) await notEkle(kapi, { id, metin: id });
    await notlariSirala(kapi, ['a', 'c', 'b']);
    expect((await notlariOku(oku)).map((x) => x.id)).toEqual(['a', 'c', 'b']);
    await notMetniniDegistir(kapi, 'c', 'yeni metin');
    await notMetniniDegistir(kapi, 'a', '  ');
    await notSil(kapi, 'b');
    expect((await notlariOku(oku)).map((x) => [x.id, x.metin])).toEqual([
      ['a', 'a'],
      ['c', 'yeni metin'],
    ]);
  });

  it('notu ajandaya al: bugüne bloksuz, saatsiz kart olur, not silinir', async () => {
    await notEkle(kapi, { id: 'a', metin: 'Eczaneye uğra' });
    const [not] = await notlariOku(oku);
    const kartId = await notuAjandayaAl(kapi, not!, '2026-10-12', idUret);
    expect(await notlariOku(oku)).toHaveLength(0);
    const a = await kartAyrinti(oku, kartId);
    expect(a!.kart).toMatchObject({ baslik: 'Eczaneye uğra', tarih: '2026-10-12', saat: null, tekrar: null });
    expect(a!.bloklar).toHaveLength(0);
  });

  it('sesli not ajandaya alınınca kaydı Dosya bloğu olarak taşınır', async () => {
    await notEkle(kapi, { id: 's', metin: 'Sesli not', sesli: true, sesYolu: 'file:///ses.m4a' });
    const [not] = await notlariOku(oku);
    const kartId = await notuAjandayaAl(kapi, not!, '2026-10-12', idUret);
    const a = await kartAyrinti(oku, kartId);
    expect(a!.bloklar.map((b) => [b.tur, b.ad, b.dosya])).toEqual([['dosya', 'Sesli not', 'file:///ses.m4a']]);
  });
});

describe('geçmişten kalanlar yazma', () => {
  it('bugüne al ve bırak', async () => {
    const dun = yeniKart('d', { baslik: 'Elektrik', tarih: '2026-10-11' });
    const once = yeniKart('o', { baslik: 'Koli', tarih: '2026-10-09' });
    await yeniKartKaydet(kapi, dun, [], idUret);
    await yeniKartKaydet(kapi, once, [], idUret);
    await kartlariBuguneAl(kapi, [dun], '2026-10-12');
    await kartiBirak(kapi, 'o');
    const kartlar = await tumKartlar(oku);
    expect(kartlar.find((k) => k.id === 'd')!.tarih).toBe('2026-10-12');
    expect(kartlar.find((k) => k.id === 'o')).toMatchObject({ tarih: '2026-10-09', birakildi: true });
  });
});
