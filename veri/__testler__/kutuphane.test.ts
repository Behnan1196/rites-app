/**
 * @jest-environment node
 */
import { kartIcerigi, type KutuphaneKaydi } from '@/mantik/kutuphane';
import { yeniKart } from '@/mantik/kart';
import { YEDEK_TABLOLARI } from '@/mantik/yedek';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { isaretle, tumKartlar, yeniKartKaydet } from '../kartlar';
import { kutuphaneKaydiOku, kutuphanedenCikar, kutuphaneSayisi, kutuphaneyeKaydet, kutuphaneyiOku } from '../kutuphane';
import { yayinOlustur, type Konu } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
let duyurulan: Konu[][];
let n = 0;
const idUret = () => `b${++n}`;

const kayit = (id: string, olusturma: string): KutuphaneKaydi => ({
  id, tur: 'kart', baslik: `Kart ${id}`, alanlar: ['beslenme', 'zihin'], etiketTur: 'Tarif', kaynak: 'Kendim', paylasilabilir: true, olusturma,
  icerik: kartIcerigi(yeniKart('x', { baslik: `Kart ${id}` }), [{ tur: 'liste', ad: 'M', metin: '', birim: '', dakika: null, maddeler: ['a'] }]),
});

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  const yayin = yayinOlustur();
  duyurulan = [];
  yayin.abone(['kutuphane', 'kart'], (k) => duyurulan.push([...k].sort()));
  kapi = kapiOlustur(db, yayin);
  oku = okuyucuOlustur(db);
});

it('kaydeder, en yeni üstte okur, çıkarır', async () => {
  await kutuphaneyeKaydet(kapi, kayit('L1', '2026-10-13T08:00:00Z'));
  await kutuphaneyeKaydet(kapi, kayit('L2', '2026-10-13T09:00:00Z'));
  const liste = await kutuphaneyiOku(oku);
  expect(liste.map((k) => k.id)).toEqual(['L2', 'L1']);
  expect(liste[0]).toEqual(kayit('L2', '2026-10-13T09:00:00Z'));
  expect(await kutuphaneSayisi(oku)).toBe(2);
  expect((await kutuphaneKaydiOku(oku, 'L1'))?.baslik).toBe('Kart L1');
  await kutuphanedenCikar(kapi, 'L1');
  expect(await kutuphaneKaydiOku(oku, 'L1')).toBeNull();
  expect(duyurulan).toEqual([['kutuphane'], ['kutuphane'], ['kutuphane']]);
});

it('"Ajandamdan kaldır": kart, blokları ve kayıtları aynı işlemde silinir', async () => {
  await yeniKartKaydet(kapi, yeniKart('k1', { baslik: 'Enginar', tarih: '2026-10-13' }), [{ id: 'x', tur: 'talimat', ad: '', metin: 'a', birim: '', dakika: null, maddeler: [], dosya: null }], idUret);
  await isaretle(kapi, 'k1', '2026-10-13', true);
  duyurulan = [];
  await kutuphaneyeKaydet(kapi, kayit('L1', '2026-10-13T08:00:00Z'), 'k1');
  expect(await tumKartlar(oku)).toEqual([]);
  expect(await oku.hepsi('SELECT * FROM blok')).toEqual([]);
  expect(await oku.hepsi('SELECT * FROM kayit')).toEqual([]);
  expect(duyurulan).toEqual([['kart', 'kutuphane']]);
});

it('yedeğe girer', () => {
  expect(YEDEK_TABLOLARI).toContain('kutuphane');
});
