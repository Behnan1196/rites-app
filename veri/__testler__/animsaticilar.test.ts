/**
 * @jest-environment node
 */
import type { Animsatici } from '@/mantik/animsatici';

import {
  animsaticiEkle,
  animsaticiGuncelle,
  animsaticilariOku,
  animsaticiSil,
  durdur,
  eskiGunleriSil,
  ertele,
  gunDurumlari,
} from '../animsaticilar';
import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

const BUGUN = '2026-10-12';
let kapi: Kapi;
let oku: Okuyucu;
const goz: Animsatici = {
  id: 'g',
  ad: ' Göz damlası ',
  saatler: ['20:00', '08:00'],
  gunler: [0, 1, 2, 3, 4, 5, 6],
  sesli: false,
  erteleDk: 5,
  alarm: true,
  bitis: null,
};

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
});

describe('anımsatıcılar (gerçek SQLite)', () => {
  it('eklenir, okunur (saatler sıralı), silinince günleri de gider', async () => {
    await animsaticiEkle(kapi, goz);
    expect(await animsaticilariOku(oku)).toEqual([{ ...goz, ad: 'Göz damlası', saatler: ['08:00', '20:00'] }]);
    await durdur(kapi, 'g', BUGUN, '08:00');
    await animsaticiSil(kapi, 'g');
    expect(await animsaticilariOku(oku)).toEqual([]);
    expect(await gunDurumlari(oku, BUGUN)).toEqual([]);
  });

  it('durdur ve ertele yalnız bugünü tutar; eski günler silinir', async () => {
    await animsaticiEkle(kapi, goz);
    await ertele(kapi, 'g', '2026-10-11', '20:00', '20:05');
    await ertele(kapi, 'g', BUGUN, '08:00', '08:05');
    await ertele(kapi, 'g', BUGUN, '08:00', '08:10');
    expect(await gunDurumlari(oku, '2026-10-11')).toEqual([]);
    expect(await gunDurumlari(oku, BUGUN)).toEqual([
      { animsaticiId: 'g', saat: '08:00', durduruldu: false, ertelenenSaat: '08:10' },
    ]);
    await durdur(kapi, 'g', BUGUN, '08:00');
    expect((await gunDurumlari(oku, BUGUN))[0]).toMatchObject({ durduruldu: true, ertelenenSaat: '08:10' });
    await eskiGunleriSil(kapi, '2026-10-13');
    expect(await gunDurumlari(oku, BUGUN)).toEqual([]);
  });

  it('düzenlenir; kalkan saatin bugünkü durumu silinir', async () => {
    await animsaticiEkle(kapi, goz);
    await ertele(kapi, 'g', BUGUN, '08:00', '08:05');
    await ertele(kapi, 'g', BUGUN, '20:00', '20:05');
    await animsaticiGuncelle(kapi, {
      ...goz,
      ad: 'Tansiyon',
      saatler: ['20:00', '09:00'],
      gunler: [0, 1, 2, 3, 4],
      alarm: false,
    });
    expect(await animsaticilariOku(oku)).toEqual([
      { ...goz, ad: 'Tansiyon', saatler: ['09:00', '20:00'], gunler: [0, 1, 2, 3, 4], alarm: false, bitis: null },
    ]);
    expect((await gunDurumlari(oku, BUGUN)).map((d) => d.saat)).toEqual(['20:00']);
  });

  it('Süre sonra: durdurulunca ve bir saatten eskiyse silinir; eski gün değerleri çevrilir', async () => {
    const bitis = '2026-10-12T11:52:40.000Z';
    await animsaticiEkle(kapi, { ...goz, id: 'o', ad: 'Ocak', saatler: ['14:52'], gunler: [], bitis });
    await animsaticiEkle(kapi, {
      ...goz,
      id: 'p',
      ad: 'Pasta',
      saatler: ['15:00'],
      gunler: [],
      bitis: '2026-10-12T12:00:00.000Z',
    });
    expect((await animsaticilariOku(oku)).find((a) => a.id === 'o')?.bitis).toBe(bitis);
    await durdur(kapi, 'o', BUGUN, '14:52');
    expect((await animsaticilariOku(oku)).map((a) => a.id)).toEqual(['p']);
    await eskiGunleriSil(kapi, BUGUN, Date.parse('2026-10-12T12:30:00.000Z'));
    expect((await animsaticilariOku(oku)).map((a) => a.id)).toEqual(['p']);
    await eskiGunleriSil(kapi, BUGUN, Date.parse('2026-10-12T13:01:00.000Z'));
    expect(await animsaticilariOku(oku)).toEqual([]);
  });
});
