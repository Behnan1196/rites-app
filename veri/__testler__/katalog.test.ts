/**
 * @jest-environment node
 */
import { alanAdi } from '@/mantik/alanlar';
import { gomuluKatalog, katalog, katalogAyarla, katalogCoz, sadeKatalog } from '@/mantik/katalog';

import { ayarOku } from '../ayar';
import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { gizliOneriler, katalogDenendi, katalogKaydet, oneriGizle, sakliKataloguYukle } from '../katalog';
import { yayinOlustur, type Konu } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

let kapi: Kapi;
let oku: Okuyucu;
let duyurulan: Konu[][];

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  const yayin = yayinOlustur();
  duyurulan = [];
  yayin.abone(['ayar', 'plan', 'kutuphane'], (k) => duyurulan.push([...k].sort()));
  kapi = kapiOlustur(db, yayin);
  oku = okuyucuOlustur(db);
  katalogAyarla(null);
});
afterEach(() => katalogAyarla(null));

it('saklı katalog yoksa uygulamayla gelen; indirilen saklanır ve açılışta yüklenir', async () => {
  expect(await sakliKataloguYukle(oku)).toBeNull();
  expect(katalog()).toEqual(sadeKatalog(gomuluKatalog()));
  const yeni = katalogCoz({ alanlar: [{ anahtar: 'hareket', ad: 'Hareket ve güç' }] })!;
  await katalogKaydet(kapi, yeni, '2026-10-20T10:00:00Z');
  expect(duyurulan).toEqual([['ayar', 'kutuphane', 'plan']]);
  expect(alanAdi('hareket')).toBe('Hareket ve güç');
  katalogAyarla(null);
  expect(alanAdi('hareket')).toBe('Hareket');
  await sakliKataloguYukle(oku);
  expect(alanAdi('hareket')).toBe('Hareket ve güç');
  expect(await ayarOku(oku, 'katalog_denendi')).toBe('2026-10-20T10:00:00Z');
  await katalogDenendi(kapi, '2026-10-20T17:00:00Z');
  expect(await ayarOku(oku, 'katalog_denendi')).toBe('2026-10-20T17:00:00Z');
});

it('öneri gizlenir ve geri gösterilir', async () => {
  await oneriGizle(kapi, 'p:ph1', true);
  await oneriGizle(kapi, 'k:b1', true);
  await oneriGizle(kapi, 'p:ph1', true);
  expect([...(await gizliOneriler(oku))]).toEqual(['p:ph1', 'k:b1']);
  await oneriGizle(kapi, 'p:ph1', false);
  expect([...(await gizliOneriler(oku))]).toEqual(['k:b1']);
});
