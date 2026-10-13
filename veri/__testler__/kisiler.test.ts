/**
 * @jest-environment node
 */
import { eslestir } from '@/mantik/kisiler';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { eslestirmeyiUygula, kisiEkle, kisileriOku, kisiSil } from '../kisiler';
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

describe('Kişilerim (gerçek SQLite)', () => {
  it('ekle, eşleştir, sil', async () => {
    await kisiEkle(kapi, { id: 'k1', ad: ' Ali (eşim) ', eposta: 'ali@a.com', kullaniciId: 'u1', durum: 'istek', benEkledim: true });
    await kisiEkle(kapi, { id: 'k2', ad: 'Veli', eposta: 'veli@a.com', kullaniciId: null, durum: 'davet', benEkledim: true });
    const e = eslestir(
      await kisileriOku(oku),
      [
        { diger: 'u1', eposta: 'ali@a.com', ad: 'Ali', durum: 'bagli', benIstedim: true },
        { diger: 'u9', eposta: 'elif@a.com', ad: 'Elif', durum: 'bagli', benIstedim: false },
      ],
      [],
    );
    let n = 0;
    await eslestirmeyiUygula(kapi, e, () => `y${++n}`);
    expect((await kisileriOku(oku)).map((k) => [k.ad, k.durum, k.benEkledim])).toEqual([
      ['Ali (eşim)', 'bagli', true],
      ['Elif', 'bagli', false],
    ]);
    await kisiSil(kapi, 'k1');
    expect((await kisileriOku(oku)).map((k) => k.ad)).toEqual(['Elif']);
  });
});
