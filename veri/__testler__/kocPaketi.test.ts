/**
 * @jest-environment node
 */
import { antrenmanOzeti } from '@/mantik/antrenman';
import { durumlariOku, gununOgunleri, ogunYaz, planOku } from '@/mantik/beslenme';
import { bosKayit } from '@/mantik/kart';
import { ORNEK_PAKET } from '@/mantik/kocPaketi';

import { antrenmanAdimlari } from '../antrenman';
import { ayarOku } from '../ayar';
import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { kartAyrinti, tumKartlar } from '../kartlar';
import { kocKartKimlikleri, ornegiKaldir, paketiKur } from '../kocPaketi';
import { adimBolumuYaz } from '../rutinler';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
let sayac = 0;
const idUret = () => `id${++sayac}`;
const PZT = '2026-11-16';

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  sayac = 0;
});

describe('Örnek koç paketi (P-134)', () => {
  it('kurulur: üç antrenman (bölümlü, setli), beslenme planı, koç bilgisi; kaldırılınca hepsi gider', async () => {
    await paketiKur(kapi, ORNEK_PAKET, PZT, idUret);
    const { antrenmanlar, beslenme } = await kocKartKimlikleri(oku);
    expect(antrenmanlar).toHaveLength(3);
    expect(beslenme).not.toBeNull();
    const koc = await ayarOku(oku, 'koc');
    expect(koc?.antrenman?.ad).toBe('Ali Kaya');
    expect(koc?.bitis).toBe('2026-12-13');

    const a = (await kartAyrinti(oku, antrenmanlar[0]!))!.kart;
    expect(a).toMatchObject({ baslik: 'Bacak ve kalça', kaynak: 'koc', kilitli: true, rutin: 1 });
    const adimlar = await antrenmanAdimlari(oku, a, PZT);
    expect(adimlar.map((x) => x.bolum ?? 'ana')).toEqual(['isinma', 'isinma', 'ana', 'ana', 'ana', 'ana', 'soguma']);
    expect(adimlar[2]!.bloklar[0]!.tur).toBe('setler');
    expect(antrenmanOzeti(adimlar, PZT).egzersiz).toBe(7);

    const b = (await kartAyrinti(oku, beslenme!))!;
    const plan = planOku(b.bloklar[0]!.metin);
    expect(gununOgunleri(plan, PZT).map((o) => o.ad)).toEqual(['Kahvaltı', 'Öğle', 'Ara öğün', 'Akşam']);
    expect(gununOgunleri(plan, '2026-11-17')[0]!.icerik).toContain('Yulaf');

    await ornegiKaldir(kapi, oku);
    expect(await tumKartlar(oku)).toHaveLength(0);
    expect(await ayarOku(oku, 'koc')).toBeNull();
  });

  it('kendi listende egzersizin bölümü değişir', async () => {
    await paketiKur(kapi, ORNEK_PAKET, PZT, idUret);
    const { antrenmanlar } = await kocKartKimlikleri(oku);
    const a = (await kartAyrinti(oku, antrenmanlar[0]!))!.kart;
    const ilk = (await antrenmanAdimlari(oku, a, PZT))[2]!;
    await adimBolumuYaz(kapi, ilk.id, 'soguma');
    const sonra = await antrenmanAdimlari(oku, a, PZT);
    // Soğuma bölümüne geçti; bölüm içinde listedeki sırası (esnemeden önce).
    expect(sonra.map((x) => x.id).slice(-2)).toEqual([ilk.id, sonra[sonra.length - 1]!.id]);
    expect(sonra[sonra.length - 2]!.bolum).toBe('soguma');
  });
});

describe('Beslenme kaydı (P-134)', () => {
  it('bütün öğünler işaretlenince Yaptım; biri geri alınınca kalkar', () => {
    const ogunler = [{ id: 'a' }, { id: 'b' }];
    let k = bosKayit('k', PZT);
    k = ogunYaz(k, 'p', ogunler, 'a', { d: 'yedi' });
    expect(k.yapildi).toBe(false);
    k = ogunYaz(k, 'p', ogunler, 'b', { d: 'farkli', ne: 'lahmacun', m: 'cok' });
    expect(k.yapildi).toBe(true);
    expect(durumlariOku(k, 'p').b).toEqual({ d: 'farkli', ne: 'lahmacun', m: 'cok' });
    k = ogunYaz(k, 'p', ogunler, 'a', null);
    expect(k.yapildi).toBe(false);
    expect(durumlariOku(k, 'p').a).toBeUndefined();
  });
});
