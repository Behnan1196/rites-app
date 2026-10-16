/**
 * @jest-environment node
 */
import { gorunurMu } from '@/mantik/gorunurluk';
import { yeniKart, type Kart } from '@/mantik/kart';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { adimiIsaretle, kartAyrinti, kartKayitlari, tumKartlar, yeniKartKaydet } from '../kartlar';
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

async function kartKur(k: Kart) {
  await yeniKartKaydet(
    kapi,
    k,
    [
      {
        id: 'b',
        tur: 'adimlar',
        ad: 'Taşınma',
        metin: '',
        birim: '',
        dakika: null,
        maddeler: ['Kutu al', 'Paketle'],
        dosya: null,
      },
    ],
    idUret,
  );
  return (await kartAyrinti(oku, k.id))!.bloklar[0]!.id;
}

describe('Proje adımları (gerçek SQLite)', () => {
  it('işaretler günden bağımsız kalır; hepsi bitince kart yapıldı, geri alınınca geri döner', async () => {
    const k = yeniKart('k', { baslik: 'Ofis taşınması', tarih: '2026-10-14' });
    const b = await kartKur(k);
    await adimiIsaretle(kapi, b, 0, true, '2026-10-14');
    let a = (await kartAyrinti(oku, 'k'))!;
    expect(a.bloklar[0]!.durum!.yapilan).toEqual(['2026-10-14', null]);
    expect(a.kart.adimlar).toEqual({ yapilan: 1, toplam: 2 });
    expect(a.kart.yapildi).toBe(false);

    await adimiIsaretle(kapi, b, 1, true, '2026-10-16');
    a = (await kartAyrinti(oku, 'k'))!;
    expect(a.bloklar[0]!.durum).toMatchObject({ yapilan: ['2026-10-14', '2026-10-16'], bitti: '2026-10-16' });
    expect((await kartKayitlari(oku, 'k')).find((r) => r.tarih === '2026-10-16')?.yapildi).toBe(true);

    await adimiIsaretle(kapi, b, 0, false, '2026-10-17');
    a = (await kartAyrinti(oku, 'k'))!;
    expect(a.bloklar[0]!.durum).toMatchObject({ yapilan: [null, '2026-10-16'], bitti: null });
    expect((await kartKayitlari(oku, 'k')).find((r) => r.tarih === '2026-10-16')?.yapildi).toBe(false);
  });

  it('tekrarlı kartın dizisi bitince o gün biter; geri alınınca sürer', async () => {
    const k = yeniKart('t', {
      baslik: 'Bahçe projesi',
      tarih: '2026-10-10',
      tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
    });
    const b = await kartKur(k);
    await adimiIsaretle(kapi, b, 0, true, '2026-10-15');
    await adimiIsaretle(kapi, b, 1, true, '2026-10-16');
    let kart = (await tumKartlar(oku))[0]!;
    expect(kart.bitis).toBe('2026-10-16');
    expect(gorunurMu(kart, '2026-10-17', '2026-10-17')).toBe(false);
    await adimiIsaretle(kapi, b, 1, false, '2026-10-16');
    kart = (await tumKartlar(oku))[0]!;
    expect(kart.bitis).toBeNull();
    expect(gorunurMu(kart, '2026-10-17', '2026-10-17')).toBe(true);
  });
});
