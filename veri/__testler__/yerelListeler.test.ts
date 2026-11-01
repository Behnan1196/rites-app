/**
 * @jest-environment node
 */
import { yeniKart } from '@/mantik/kart';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { tumKartlar, yeniKartKaydet, type BlokTaslagi } from '../kartlar';
import { yayinOlustur } from '../yayin';
import {
  listeKartlariniTasi,
  tarihliYerelMaddeler,
  yerelListeEkle,
  yerelListeKur,
  yerelListeOku,
  yerelListeleriOku,
  yerelListeSil,
  yerelMaddeDegistir,
  yerelMaddeEkle,
} from '../yerelListeler';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
let sayac = 0;
const idUret = () => `id${++sayac}`;
const blok = (id: string, d: Partial<BlokTaslagi> = {}): BlokTaslagi => ({
  id,
  tur: 'adimlar',
  ad: '',
  metin: '',
  birim: '',
  dakika: null,
  maddeler: ['Çit', 'Çim', 'Gübre'],
  dosya: null,
  ...d,
});

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  sayac = 0;
});

describe('Listelerim veri katmanı (P-58)', () => {
  it('liste ve maddeler; tarihli madde ajandaya', async () => {
    const id = await yerelListeEkle(kapi, ' Market ', 'yapilacak', idUret);
    expect(id.startsWith('y-')).toBe(true);
    await yerelMaddeEkle(kapi, id, 'Süt', '2 lt', idUret);
    await yerelMaddeEkle(kapi, id, 'Ekmek', '', idUret);
    const l = (await yerelListeOku(oku, id))!;
    expect(l.liste.ad).toBe('Market');
    expect(l.liste.cesit).toBe('yapilacak');
    expect(l.maddeler.map((m) => m.miktar)).toEqual(['2 lt', '']);
    expect(l.maddeler.map((m) => m.metin)).toEqual(['Süt', 'Ekmek']);
    await yerelMaddeDegistir(kapi, l.maddeler[0]!.id, { yapildi: true });
    await yerelMaddeDegistir(kapi, l.maddeler[1]!.id, { tarih: '2026-10-30' });
    expect((await yerelListeleriOku(oku))[0]).toMatchObject({ ad: 'Market', maddeSayisi: 2, kalan: 1 });
    expect(await tarihliYerelMaddeler(oku)).toEqual([
      { id: l.maddeler[1]!.id, metin: 'Ekmek', yapildi: false, tarih: '2026-10-30', liste: id, listeAdi: 'Market' },
    ]);
    await yerelListeSil(kapi, id);
    expect(await yerelListeleriOku(oku)).toEqual([]);
  });

  it('P-86: günlük kontrolde dünkü işaret kalan sayılır; madde yerinde düzeltilir', async () => {
    const id = await yerelListeEkle(kapi, 'Çıkmadan önce', 'gunluk', idUret);
    await yerelMaddeEkle(kapi, id, 'Ocak', '', idUret);
    await yerelMaddeEkle(kapi, id, 'Kapı', '', idUret);
    const l = (await yerelListeOku(oku, id))!;
    const d = new Date();
    const bugun = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await yerelMaddeDegistir(kapi, l.maddeler[0]!.id, { yapildi: true, yapildiGun: '2020-01-01' });
    await yerelMaddeDegistir(kapi, l.maddeler[1]!.id, { yapildi: true, yapildiGun: bugun, metin: 'Kapıyı kilitle' });
    expect((await yerelListeleriOku(oku))[0]).toMatchObject({ cesit: 'gunluk', maddeSayisi: 2, kalan: 1 });
    const l2 = (await yerelListeOku(oku, id))!;
    expect(l2.maddeler.map((m) => [m.metin, m.yapildiGun])).toEqual([
      ['Ocak', '2020-01-01'],
      ['Kapıyı kilitle', bugun],
    ]);
  });

  it('P-60: paylaşmayı bırakınca maddeleriyle kişisel liste kurulur', async () => {
    const id = await yerelListeKur(
      kapi,
      'Tatil',
      'yapilacak',
      [
        { metin: 'Bilet', yapildi: true, tarih: null, miktar: '' },
        { metin: 'Valiz', yapildi: false, tarih: '2026-11-02', miktar: '' },
      ],
      idUret,
    );
    const l = (await yerelListeOku(oku, id))!;
    expect(l.liste.ad).toBe('Tatil');
    expect(l.maddeler.map((m) => [m.metin, m.yapildi, m.tarih])).toEqual([
      ['Bilet', true, null],
      ['Valiz', false, '2026-11-02'],
    ]);
  });

  it('yalnız listeden ibaret tek seferlik kart taşınır, bir kez', async () => {
    await yeniKartKaydet(kapi, yeniKart('k1', { baslik: 'Bahçe', tarih: '2026-11-01' }), [blok('b1')], idUret);
    await yeniKartKaydet(
      kapi,
      yeniKart('k2', {
        baslik: 'Sabah',
        tarih: '2026-10-20',
        tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
      }),
      [blok('b2', { tur: 'liste' })],
      idUret,
    );
    await yeniKartKaydet(
      kapi,
      yeniKart('k3', { baslik: 'Not', tarih: '2026-10-20' }),
      [blok('b3', { tur: 'talimat', metin: 'x', maddeler: [] })],
      idUret,
    );
    expect(await listeKartlariniTasi(kapi, oku, '2026-10-27', idUret)).toBe(1);
    expect((await tumKartlar(oku)).map((k) => k.id).sort()).toEqual(['k2', 'k3']);
    const [l] = await yerelListeleriOku(oku);
    expect(l).toMatchObject({ ad: 'Bahçe', maddeSayisi: 3, kalan: 3 });
    expect((await tarihliYerelMaddeler(oku)).map((m) => m.tarih)).toEqual(['2026-11-01', '2026-11-01', '2026-11-01']);
    expect(await listeKartlariniTasi(kapi, oku, '2026-10-27', idUret)).toBe(0);
  });
});
