/**
 * @jest-environment node
 */
import { yeniKart } from '@/mantik/kart';
import { oneriKartBul, oneriKartIcerigi, onerdenProgram, type Oneri } from '@/mantik/program';

import { animsaticiEkle, animsaticilariOku } from '../animsaticilar';
import { ayarOku, ayarYaz } from '../ayar';
import { GOCLER, gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { kartAyrinti, kayitDegistir, tumKartlar, yeniKartKaydet } from '../kartlar';
import { notEkle, notlariOku } from '../notlar';
import { ozelAlanEkle, ozelAlanlariOku, programAjandaKartlari, programBaslat, programKartlariOku, programKur, programlariOku } from '../programlar';
import { yedegiYaz, yedekVerisi } from '../yedek';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

/** P-81: katalogda hazır öneri programı kalmadı; denemeler için öneri kartlarından bir program. */
const ornekOneri = (): Oneri => ({
  id: 'ornek',
  alanlar: ['hareket'],
  ad: 'Sabah hareketi',
  aciklama: '',
  sure: 28,
  kartlar: [oneriKartIcerigi(oneriKartBul('h3')!), oneriKartIcerigi(oneriKartBul('h2')!, 0, 1)],
});


const BUGUN = '2026-10-13';
let n = 0;
const id = () => `id${++n}`;

async function yeniDb(): Promise<{ kapi: Kapi; oku: Okuyucu }> {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  return { kapi: kapiOlustur(db, yayinOlustur()), oku: okuyucuOlustur(db) };
}

describe('yedek (gerçek SQLite)', () => {
  it('bütün veri yedeğe girer ve başka telefona aynen geri yüklenir; dosya yolları çevrilir', async () => {
    const a = await yeniDb();
    await ayarYaz(a.kapi, 'ad', 'Ayşe');
    await yeniKartKaydet(
      a.kapi,
      yeniKart('k1', { baslik: 'Tarif', tarih: BUGUN }),
      [{ id: 'b', tur: 'foto', ad: '', metin: '', birim: '', dakika: null, maddeler: [], dosya: 'file:///eski/dosyalar/f.jpg' }],
      id,
    );
    await kayitDegistir(a.kapi, 'k1', BUGUN, (k) => ({ ...k, yapildi: true }));
    await notEkle(a.kapi, { id: 'n1', metin: 'Ekmek al' });
    const { program, kartlar } = onerdenProgram(ornekOneri(), id, '2026-10-13T00:00:00Z');
    await programKur(a.kapi, program, kartlar);
    await programBaslat(a.kapi, program.id, BUGUN, BUGUN, id);
    await ozelAlanEkle(a.kapi, 'Bahçe', '', id);
    await animsaticiEkle(a.kapi, { id: 'g', ad: 'Göz', saatler: ['08:00'], gunler: [0, 1, 2, 3, 4, 5, 6], sesli: true, erteleDk: 10, alarm: false, bitis: null });

    const yedek = JSON.parse(JSON.stringify(await yedekVerisi(a.oku, 'file:///eski/dosyalar')));
    expect(yedek.surum).toBe(GOCLER.length);

    const b = await yeniDb();
    await ayarYaz(b.kapi, 'ad', 'Başka');
    await yeniKartKaydet(b.kapi, yeniKart('x', { baslik: 'Silinecek', tarih: BUGUN }), [], id);
    await yedegiYaz(b.kapi, yedek, 'file:///yeni/dosyalar/');

    expect(await ayarOku(b.oku, 'ad')).toBe('Ayşe');
    expect((await tumKartlar(b.oku)).map((k) => k.id).sort()).toEqual((await tumKartlar(a.oku)).map((k) => k.id).sort());
    expect((await kartAyrinti(b.oku, 'k1'))!.bloklar[0]!.dosya).toBe('file:///yeni/dosyalar/f.jpg');
    expect(await programlariOku(b.oku)).toEqual(await programlariOku(a.oku));
    expect(await programKartlariOku(b.oku, program.id)).toEqual(await programKartlariOku(a.oku, program.id));
    expect((await programAjandaKartlari(b.oku, program.id)).length).toBe(kartlar.length);
    expect(await ozelAlanlariOku(b.oku)).toEqual(await ozelAlanlariOku(a.oku));
    expect(await animsaticilariOku(b.oku)).toEqual(await animsaticilariOku(a.oku));
    expect(await notlariOku(b.oku)).toEqual(await notlariOku(a.oku));
  });

  it('eski sürüm yedeğinde olmayan tablo boş kalır, bilinmeyen sütun atlanır', async () => {
    const b = await yeniDb();
    await yedegiYaz(
      b.kapi,
      {
        bicim: 'rites-yedek', surum: 2, olusturma: '', dosyaKlasoru: '', dosyalar: {},
        tablolar: { ayar: [{ anahtar: 'ad', deger: '"Ali"', fazla: 1 }] },
      },
      'file:///yeni/dosyalar/',
    );
    expect(await ayarOku(b.oku, 'ad')).toBe('Ali');
    expect(await programlariOku(b.oku)).toEqual([]);
  });

  it('programlardan önceki yedekte plan kartları gelmez', async () => {
    const b = await yeniDb();
    await yedegiYaz(
      b.kapi,
      {
        bicim: 'rites-yedek', surum: 14, olusturma: '', dosyaKlasoru: '', dosyalar: {},
        tablolar: {
          kart: [
            { id: 'a', baslik: 'Sıradan', tarih: BUGUN, plan_id: null, olusturma: '', guncelleme: '' },
            { id: 'p', baslik: 'Plan kartı', tarih: BUGUN, plan_id: 'eski', olusturma: '', guncelleme: '' },
          ],
          kayit: [{ kart_id: 'p', tarih: BUGUN, yapildi: 1 }],
          kutuphane: [{ id: 'L', tur: 'plan', baslik: 'x', alanlar: '[]', etiket_tur: 'Rutin', kaynak: '', icerik: '{}', olusturma: '' }],
        },
      },
      'file:///yeni/dosyalar/',
    );
    expect((await tumKartlar(b.oku)).map((k) => k.id)).toEqual(['a']);
    expect(await b.oku.hepsi('SELECT * FROM kayit')).toEqual([]);
    expect(await b.oku.hepsi('SELECT * FROM kutuphane')).toEqual([]);
  });
});
