/**
 * @jest-environment node
 */
import { yeniKart } from '@/mantik/kart';
import { rutinDurumu } from '@/mantik/rutinAdimlari';
import { ajandadaMi } from '@/mantik/aliskanlik';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { gunYapilanlari, kartAyrinti, kartlariSil, tumKartlar, yeniKartKaydet } from '../kartlar';
import { adimlarinYeriniDegistir, rutinAdimiEkle, rutinAdimiIsaretle, rutinAdimlari, rutineCevir } from '../rutinler';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
let sayac = 0;
const idUret = () => `id${++sayac}`;
const GUN = '2026-11-05';

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  sayac = 0;
});

describe('Rutin (P-93)', () => {
  it('listeli kart rutine çevrilir; adımlar ajandada görünmez; son adımda rutin yapıldı', async () => {
    await yeniKartKaydet(
      kapi,
      yeniKart('r', {
        baslik: 'Sabah rutini',
        tarih: GUN,
        tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
      }),
      [
        {
          id: 'l',
          tur: 'liste',
          ad: '',
          metin: '',
          birim: '',
          dakika: null,
          maddeler: ['Su iç', 'Esneme', 'Plank'],
          dosya: null,
        },
      ],
      idUret,
    );
    expect(await rutineCevir(kapi, oku, 'r', GUN, idUret)).toBe(3);
    const r = (await kartAyrinti(oku, 'r'))!;
    expect(r.kart.rutin).toBe(true);
    expect(r.bloklar).toHaveLength(0);
    const adimlar = await rutinAdimlari(oku, 'r');
    expect(adimlar.map((a) => a.baslik)).toEqual(['Su iç', 'Esneme', 'Plank']);
    expect(adimlar.every((a) => !ajandadaMi(a))).toBe(true);

    await adimlarinYeriniDegistir(kapi, adimlar[0]!, adimlar[1]!);
    expect((await rutinAdimlari(oku, 'r')).map((a) => a.baslik)).toEqual(['Esneme', 'Su iç', 'Plank']);

    for (const a of adimlar) await rutinAdimiIsaretle(kapi, oku, 'r', a.id, GUN, true);
    expect((await gunYapilanlari(oku, GUN)).has('r')).toBe(true);
    await rutinAdimiIsaretle(kapi, oku, 'r', adimlar[2]!.id, GUN, false);
    const yapilanlar = await gunYapilanlari(oku, GUN);
    expect(yapilanlar.has('r')).toBe(false);
    expect(rutinDurumu(await rutinAdimlari(oku, 'r'), yapilanlar)).toMatchObject({
      yapilan: 2,
      toplam: 3,
      siradaki: { baslik: 'Plank' },
    });

    await rutinAdimiEkle(kapi, oku, r.kart, 'Duş', GUN, idUret);
    expect((await rutinAdimlari(oku, 'r')).map((a) => a.baslik).at(-1)).toBe('Duş');

    await kartlariSil(kapi, ['r']);
    expect(await tumKartlar(oku)).toHaveLength(0);
  });
});
