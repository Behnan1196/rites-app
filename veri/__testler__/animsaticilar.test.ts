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
  zamanlayiciDevam,
  zamanlayiciErtele,
  zamanlayiciDuraklat,
  zamanlayiciKur,
  zamanlayiciUzat,
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
  ses: null,
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

describe('anımsatıcı sesi (pilot 19 Ekim)', () => {
  it('ses yazılır, okunur; bilinmeyen ses telefonun sesine döner', async () => {
    await animsaticiEkle(kapi, { ...goz, id: 's', ses: 'kus' });
    await animsaticiEkle(kapi, { ...goz, id: 't', ses: 'yok-boyle' });
    const l = await animsaticilariOku(oku);
    expect(l.find((a) => a.id === 's')?.ses).toBe('kus');
    expect(l.find((a) => a.id === 't')?.ses).toBeNull();
    await animsaticiGuncelle(kapi, { ...goz, id: 's', ses: 'zil' });
    expect((await animsaticilariOku(oku)).find((a) => a.id === 's')?.ses).toBe('zil');
  });

  it('zamanlayıcı: kurulur, duraklatılır, uzatılır, sürdürülür', async () => {
    const t0 = Date.parse('2026-10-12T10:00:00.000Z');
    const b = await zamanlayiciKur(kapi, { id: 'z', ad: ' Çay ', ms: 5 * 60_000 + 30_000, alarm: true, ses: null }, t0);
    expect(b.bitis).toBe('2026-10-12T10:05:30.000Z');
    let z = (await animsaticilariOku(oku))[0]!;
    expect(z).toMatchObject({
      ad: 'Çay',
      bitis: b.bitis,
      toplamMs: 330_000,
      duraklama: null,
      gunler: [],
      alarm: true,
      erteleDk: 5,
    });
    expect(z.saatler).toEqual([b.saat]);

    await zamanlayiciDuraklat(kapi, 'z', t0 + 30_000);
    z = (await animsaticilariOku(oku))[0]!;
    expect(z.duraklama).toBe(300_000);

    // Duraklatılmışken uzatma: kalan ve toplam büyür, duraklatılmış kalır.
    await zamanlayiciUzat(kapi, 'z', 60_000, t0 + 90_000);
    z = (await animsaticilariOku(oku))[0]!;
    expect(z).toMatchObject({ duraklama: 360_000, toplamMs: 390_000 });

    // Eski "Süre sonra" silme duraklatılmış olana dokunmaz.
    await eskiGunleriSil(kapi, BUGUN, t0 + 3 * 3600_000);
    expect(await animsaticilariOku(oku)).toHaveLength(1);

    const t1 = Date.parse('2026-10-12T11:00:00.000Z');
    await zamanlayiciDevam(kapi, 'z', t1);
    z = (await animsaticilariOku(oku))[0]!;
    expect(z).toMatchObject({ duraklama: null, bitis: '2026-10-12T11:06:00.000Z' });

    await zamanlayiciUzat(kapi, 'z', 60_000, t1 + 60_000);
    z = (await animsaticilariOku(oku))[0]!;
    expect(z).toMatchObject({ bitis: '2026-10-12T11:07:00.000Z', toplamMs: 450_000 });
  });

  it('zamanlayıcıda ertele saniyesiyle yeniden kurar, günün durumunu temizler', async () => {
    const t0 = Date.parse('2026-10-12T10:00:00.000Z');
    await zamanlayiciKur(kapi, { id: 'z', ad: '5 dk', ms: 300_000, alarm: true, ses: null }, t0);
    const z0 = (await animsaticilariOku(oku))[0]!;
    await ertele(kapi, 'z', BUGUN, z0.saatler[0]!, '23:59');
    await zamanlayiciErtele(kapi, 'z', 1, t0 + 310_000);
    const z = (await animsaticilariOku(oku))[0]!;
    expect(z).toMatchObject({ bitis: '2026-10-12T10:06:10.000Z', toplamMs: 60_000, duraklama: null });
    expect(await gunDurumlari(oku, BUGUN)).toEqual([]);
  });
});
