/**
 * @jest-environment node
 */
import { alanBul } from '@/mantik/alanlar';
import { yeniKart } from '@/mantik/kart';
import { etkinliktenKart, type Plan } from '@/mantik/plan';

import { animsaticiEkle, animsaticilariOku } from '../animsaticilar';
import { ayarOku, ayarYaz } from '../ayar';
import { GOCLER, gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { kartAyrinti, kayitDegistir, tumKartlar, yeniKartKaydet } from '../kartlar';
import { notEkle, notlariOku } from '../notlar';
import { planBaslat, planlariOku } from '../planlar';
import { yedegiYaz, yedekVerisi } from '../yedek';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

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
    const p: Plan = {
      id: 'p1', ad: 'Sabah', alan: 'hareket', kaynak: 'kendim', neden: '', hedef: '', baslangic: BUGUN,
      bitis: null, baslangicPuani: 0, gununSorusu: null, durum: 'etkin',
    };
    await planBaslat(a.kapi, { plan: p, duzenliler: [etkinliktenKart(alanBul('hareket')!.etkinlikler[0]!, p, BUGUN, id)], adimlar: [] }, id);
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
    expect(await planlariOku(b.oku)).toEqual(await planlariOku(a.oku));
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
    expect(await planlariOku(b.oku)).toEqual([]);
  });
});
