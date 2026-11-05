/**
 * @jest-environment node
 */
import { olcumAlani } from '@/mantik/olcumHazirlari';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { kartKayitlari, olcumlerimiOku } from '../kartlar';
import { alanOlcumleriniEkle, alanPuaniniOlcumeYaz, eklenecekAlanlar, olcumdenAlanPuaniYaz } from '../olcumlerim';
import { alanDurumlari, alanDurumuYaz } from '../programlar';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

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

describe('Ölçümlerim ve yaşam alanları (P-95)', () => {
  it('açık alanlar puan ölçümü olur; puan iki yönde eşitlenir', async () => {
    const acik = await eklenecekAlanlar(oku);
    expect(acik.length).toBeGreaterThan(0);
    const alan = acik[0]!;
    await alanDurumuYaz(kapi, alan, { puan: 2 });
    expect(await alanOlcumleriniEkle(kapi, oku, '2026-11-08', idUret)).toBe(acik.length);
    expect(await eklenecekAlanlar(oku)).toEqual([]);
    const o = (await olcumlerimiOku(oku))!;
    const b = o.bloklar.find((x) => olcumAlani(x) === alan)!;
    expect(b.tur).toBe('puan');
    expect((await kartKayitlari(oku, o.kart.id))[0]!.degerler[b.id]).toBe('2');

    // Yaşam Tarzım'da puan değişince bugünün ölçümü
    await alanPuaniniOlcumeYaz(kapi, oku, alan, 4, '2026-11-15');
    expect((await kartKayitlari(oku, o.kart.id)).find((k) => k.tarih === '2026-11-15')!.degerler[b.id]).toBe('4');

    // Ölçümlerim'de eski bir güne girilen puan Yaşam Tarzım'ı değiştirmez; en son gün değiştirir
    await alanDurumuYaz(kapi, alan, { puan: 4 });
    await olcumdenAlanPuaniYaz(kapi, oku, o.kart.id, b, '2026-11-08');
    expect((await alanDurumlari(oku)).get(alan)!.puan).toBe(4);
  });
});
