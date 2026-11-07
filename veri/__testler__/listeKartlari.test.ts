/**
 * @jest-environment node
 */
import { gununKartlari } from '@/mantik/ajanda';
import { ajandadaMi } from '@/mantik/aliskanlik';
import { RUTIN_GUNLUK, RUTIN_KALICI } from '@/mantik/rutinAdimlari';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { ajandadaYaz, gunYapilanlari, kartAyrinti, tumKartlar } from '../kartlar';
import {
  adimGunuYaz,
  listeKartiKur,
  listeKartlariniOku,
  listeKartiSil,
  listeMaddeleri,
  yerelListeleriKartaCevir,
} from '../listeKartlari';
import { rutinAdimlari, rutinAdimiIsaretle } from '../rutinler';
import { yayinOlustur } from '../yayin';
import { yerelListeEkle, yerelMaddeDegistir, yerelMaddeEkle, yerelListeleriOku, yerelListeOku } from '../yerelListeler';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
let sayac = 0;
const idUret = () => `id${++sayac}`;
const GUN = '2026-11-07';

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  sayac = 0;
});

const ajandaninKartlari = async (gun: string) =>
  gununKartlari(
    (await tumKartlar(oku)).filter((k) => ajandadaMi(k)),
    gun,
    GUN,
  ).map((k) => k.baslik);

describe('Listeler kart (P-110)', () => {
  it('liste ajandada değil; Ajandada göster ile görünür; gün verilen madde o gün görünür', async () => {
    const id = await listeKartiKur(kapi, oku, 'Takviyeler', RUTIN_GUNLUK, GUN, idUret, [
      { metin: 'D vitamini' },
      { metin: 'Omega 3' },
    ]);
    expect(await ajandaninKartlari(GUN)).toEqual([]);
    await ajandadaYaz(kapi, id, true);
    expect(await ajandaninKartlari(GUN)).toEqual(['Takviyeler']);

    const [d] = await rutinAdimlari(oku, id);
    await rutinAdimiIsaretle(kapi, oku, id, d!.id, GUN, true);
    expect((await listeKartlariniOku(oku, GUN))[0]).toMatchObject({ yapilan: 1, toplam: 2 });

    const isler = await listeKartiKur(kapi, oku, 'İşler', RUTIN_KALICI, GUN, idUret, [{ metin: 'Elektrikçiyi ara' }]);
    const [e] = await rutinAdimlari(oku, isler);
    await adimGunuYaz(kapi, oku, e!.id, '2026-11-10');
    expect(await ajandaninKartlari('2026-11-10')).toEqual(['Takviyeler', 'Elektrikçiyi ara']);
    expect(await ajandaninKartlari('2026-11-09')).not.toContain('Elektrikçiyi ara');
    expect((await listeMaddeleri(oku, (await kartAyrinti(oku, isler))!.kart, GUN))[0]).toMatchObject({
      metin: 'Elektrikçiyi ara',
      tarih: '2026-11-10',
    });
    await adimGunuYaz(kapi, oku, e!.id, null);
    expect(await ajandaninKartlari('2026-11-10')).not.toContain('Elektrikçiyi ara');

    await listeKartiSil(kapi, isler);
    expect(await rutinAdimlari(oku, isler)).toHaveLength(0);
  });

  it('eski Listelerim bir kez çevrilir (çeşit, işaret, gün)', async () => {
    const market = await yerelListeEkle(kapi, 'Market', 'yapilacak', idUret);
    await yerelMaddeEkle(kapi, market, 'Süt', '', idUret);
    await yerelMaddeEkle(kapi, market, 'Ekmek', '', idUret);
    const m = (await yerelListeOku(oku, market))!.maddeler;
    await yerelMaddeDegistir(kapi, m[0]!.id, { yapildi: true, yapildiGun: '2026-11-05' });
    await yerelMaddeDegistir(kapi, m[1]!.id, { tarih: '2026-11-09' });

    expect(await yerelListeleriKartaCevir(kapi, oku, GUN, idUret)).toBe(1);
    expect(await yerelListeleriKartaCevir(kapi, oku, GUN, idUret)).toBe(0);
    expect(await yerelListeleriOku(oku)).toHaveLength(0);

    const [l] = await listeKartlariniOku(oku, GUN);
    expect(l).toMatchObject({ kart: { baslik: 'Market', rutin: RUTIN_KALICI, listede: true }, yapilan: 1, toplam: 2 });
    expect((await gunYapilanlari(oku, '2026-11-05')).size).toBe(1);
    expect(await ajandaninKartlari('2026-11-09')).toEqual(['Ekmek']);
  });
});
