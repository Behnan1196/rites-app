/**
 * @jest-environment node
 */
import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { paylasilanEkle, paylasilanlariOku, paylasilanSil } from '../paylasilanlar';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
});

it('paylaşılan bağlantılar eklenir (yeniden eskiye), silinir', async () => {
  await paylasilanEkle(kapi, {
    id: 'a',
    baslik: 'Yoga',
    adres: 'https://youtu.be/1',
    olusturma: '2026-10-16T08:00:00Z',
  });
  await paylasilanEkle(kapi, {
    id: 'b',
    baslik: 'Nefes',
    adres: 'https://youtu.be/2',
    olusturma: '2026-10-16T09:00:00Z',
  });
  expect((await paylasilanlariOku(oku)).map((p) => p.baslik)).toEqual(['Nefes', 'Yoga']);
  await paylasilanSil(kapi, 'b');
  expect((await paylasilanlariOku(oku)).map((p) => p.id)).toEqual(['a']);
});
