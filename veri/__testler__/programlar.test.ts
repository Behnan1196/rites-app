/**
 * @jest-environment node
 */
import { alanAdi } from '@/mantik/alanlar';
import { yeniKart } from '@/mantik/kart';
import { oneriler, onerdenProgram, type Program, type ProgramKarti } from '@/mantik/program';

import { gocleriUygula } from '../gocler';
import { kapiOlustur, okuyucuOlustur, type Kapi, type Okuyucu } from '../kapi';
import { kartAyrinti, kayitDegistir, tumKartlar, yeniKartKaydet } from '../kartlar';
import {
  alanDurumlari,
  alanDurumuYaz,
  karttanProgramaEkle,
  ozelAlanEkle,
  ozelAlanlariOku,
  ozelAlanSil,
  programAjandaKartlari,
  programaYansit,
  programBaslat,
  programBilgisiYaz,
  programiDegerlendir,
  programiDurdur,
  programKartiEkle,
  programKartiSil,
  programKartlariOku,
  programKayitlari,
  programKur,
  programlariOku,
  programOku,
  programSil,
} from '../programlar';
import { yayinOlustur } from '../yayin';
import { sqljsVeriTabani } from './sqljsVeriTabani';

const BUGUN = '2026-10-20';
const herGun = { gunSayisi: null, gunler: null, desen: 'hergun' as const };
let kapi: Kapi;
let oku: Okuyucu;
let n = 0;
const idUret = () => `id${++n}`;

const program = (d: Partial<Program> = {}): Program => ({
  id: 'p1',
  ad: 'Direnç egzersizi',
  alanlar: ['hareket', 'beslenme'],
  neden: 'Kas kaybını önlemek',
  sure: 21,
  durum: 'hazir',
  baslangic: null,
  yildiz: 0,
  degerlendirme: '',
  kaynak: 'Kendim',
  olusturma: '2026-10-01T00:00:00Z',
  ...d,
});

const icerik = (d: Partial<ProgramKarti> = {}): Omit<ProgramKarti, 'id' | 'programId' | 'sira'> => ({
  gun: 0,
  baslik: 'Araştırma videosu',
  kisa: '',
  saat: null,
  hatirlatma: null,
  alarm: false,
  tekrar: null,
  bloklar: [{ tur: 'video', ad: '', metin: 'https://youtu.be/x', birim: '', dakika: null, maddeler: [], dosya: null }],
  ...d,
});

beforeEach(async () => {
  const db = await sqljsVeriTabani();
  await gocleriUygula(db);
  kapi = kapiOlustur(db, yayinOlustur());
  oku = okuyucuOlustur(db);
  n = 0;
});

async function kurVeDoldur() {
  await programKur(kapi, program());
  await programKartiEkle(kapi, 'p1', icerik(), BUGUN, idUret);
  await programKartiEkle(
    kapi,
    'p1',
    icerik({
      baslik: 'Direnç çalışması',
      tekrar: { gunSayisi: null, gunler: ['Pzt', 'Çar', 'Cum'], desen: null },
      saat: '18:00',
      bloklar: [{ tur: 'olcum', ad: 'Tekrar', metin: '', birim: 'tekrar', dakika: null, maddeler: [], dosya: null }],
    }),
    BUGUN,
    idUret,
  );
}

describe('programlar (gerçek SQLite)', () => {
  it('kurulur, kartları eklenir; hazırken ajandaya bir şey düşmez; alanlar açılır', async () => {
    await alanDurumuYaz(kapi, 'beslenme', { acik: false });
    await kurVeDoldur();
    expect(await programlariOku(oku)).toEqual([program()]);
    expect((await programKartlariOku(oku, 'p1')).map((k) => [k.baslik, k.sira])).toEqual([
      ['Araştırma videosu', 1],
      ['Direnç çalışması', 2],
    ]);
    expect(await tumKartlar(oku)).toEqual([]);
    expect((await alanDurumlari(oku)).get('beslenme')?.acik).toBe(true);
  });

  it('başlatınca kartlar ajandaya düşer; ara verince gelecek kalkar, geçmiş kalır', async () => {
    await kurVeDoldur();
    await programBaslat(kapi, 'p1', '2026-10-19', BUGUN, idUret);
    const p = (await programOku(oku, 'p1'))!;
    expect(p).toMatchObject({ durum: 'uygulaniyor', baslangic: '2026-10-19' });
    const kartlar = await programAjandaKartlari(oku, 'p1');
    expect(kartlar.map((k) => [k.baslik, k.tarih, k.bitis, k.planId])).toEqual([
      ['Araştırma videosu', '2026-10-19', null, 'p1'],
      ['Direnç çalışması', '2026-10-19', '2026-11-08', 'p1'],
    ]);
    const tekrarli = kartlar.find((k) => k.tekrar)!;
    expect((await kartAyrinti(oku, tekrarli.id))!.bloklar.map((b) => b.tur)).toEqual(['olcum']);

    // Uygulanırken eklenen kart bugünden başlar.
    await programKartiEkle(kapi, 'p1', icerik({ baslik: 'Kreatin', tekrar: herGun }), BUGUN, idUret);
    expect((await programAjandaKartlari(oku, 'p1')).find((k) => k.baslik === 'Kreatin')!.tarih).toBe(BUGUN);

    await programiDurdur(kapi, 'p1', 'ara', BUGUN);
    const kalan = await programAjandaKartlari(oku, 'p1');
    expect(kalan.map((k) => [k.baslik, k.bitis, k.bag])).toEqual([
      ['Araştırma videosu', null, null],
      ['Direnç çalışması', '2026-10-19', null],
    ]);
    expect((await programOku(oku, 'p1'))!.durum).toBe('ara');
    // Yeniden başlatınca yeni kartlar; eskiler geçmişte kalır.
    await programBaslat(kapi, 'p1', BUGUN, BUGUN, idUret);
    expect((await programAjandaKartlari(oku, 'p1')).filter((k) => k.bag).length).toBe(3);
  });

  it('süre değişince dizilerin bitişi taşınır; değerlendirme süresi geçmişi kapatır', async () => {
    await kurVeDoldur();
    await programBaslat(kapi, 'p1', '2026-09-01', '2026-09-01', idUret);
    await programBilgisiYaz(kapi, 'p1', { ad: 'Direnç', alanlar: ['hareket'], neden: '', sure: 28 });
    const tekrarli = (await programAjandaKartlari(oku, 'p1')).find((k) => k.tekrar)!;
    expect(tekrarli.bitis).toBe('2026-09-28');
    await programiDegerlendir(kapi, 'p1', 4, ' İyi geldi ', BUGUN);
    expect(await programOku(oku, 'p1')).toMatchObject({ durum: 'bitti', yildiz: 4, degerlendirme: 'İyi geldi', ad: 'Direnç' });
    expect((await programAjandaKartlari(oku, 'p1')).every((k) => k.bag === null)).toBe(true);
  });

  it('ajandadaki kart programa eklenir: uygulanıyorsa bağlanır, değilse kopyalanır', async () => {
    await programKur(kapi, program({ id: 'p2', ad: 'Sosyal', alanlar: ['sosyal'] }));
    await kurVeDoldur();
    await programBaslat(kapi, 'p1', '2026-10-15', BUGUN, idUret);
    const kart = yeniKart('a', { baslik: 'Eski arkadaşını ara', tarih: '2026-10-22', tekrar: herGun });
    await yeniKartKaydet(kapi, kart, [], idUret);

    expect(await karttanProgramaEkle(kapi, oku, 'a', 'p2', BUGUN, idUret)).toBe('kopyalandi');
    expect((await programKartlariOku(oku, 'p2')).map((k) => [k.baslik, k.gun])).toEqual([['Eski arkadaşını ara', 0]]);
    expect((await kartAyrinti(oku, 'a'))!.kart.planId).toBeNull();

    expect(await karttanProgramaEkle(kapi, oku, 'a', 'p1', BUGUN, idUret)).toBe('baglandi');
    const bagli = (await kartAyrinti(oku, 'a'))!.kart;
    expect(bagli).toMatchObject({ planId: 'p1', bitis: '2026-11-04' });
    const pk = (await programKartlariOku(oku, 'p1')).find((k) => k.baslik === 'Eski arkadaşını ara')!;
    expect(pk.gun).toBe(7);
    expect(bagli.bag).toBe(`program:${pk.id}`);

    // Ajandada düzenlenince programdaki karşılığı da değişir.
    await kapi.yaz(['kart'], (y) => y.calistir("UPDATE kart SET baslik = 'Ayşe’yi ara', saat = '19:00' WHERE id = 'a'"));
    await programaYansit(kapi, oku, 'a');
    expect((await programKartlariOku(oku, 'p1')).find((k) => k.id === pk.id)).toMatchObject({
      baslik: 'Ayşe’yi ara',
      saat: '19:00',
      gun: 7,
    });

    // Programdan çıkarılınca ajandadaki geleceği kalkar.
    await programKartiSil(kapi, pk.id, BUGUN);
    expect(await kartAyrinti(oku, 'a')).toBeNull();
  });

  it('gelişim kayıtları; program silinince geçmiş kartlar sıradan kart olur', async () => {
    await kurVeDoldur();
    await programBaslat(kapi, 'p1', '2026-10-19', BUGUN, idUret);
    const tekrarli = (await programAjandaKartlari(oku, 'p1')).find((k) => k.tekrar)!;
    const olcum = (await kartAyrinti(oku, tekrarli.id))!.bloklar[0]!;
    await kayitDegistir(kapi, tekrarli.id, '2026-10-19', (k) => ({ ...k, yapildi: true, degerler: { [olcum.id]: '10' } }));
    const g = await programKayitlari(oku, 'p1', '2026-10-19');
    expect(g.olcumler.map((o) => o.ad)).toEqual(['Tekrar']);
    expect(g.kayitlar).toEqual([{ kartId: tekrarli.id, tarih: '2026-10-19', yapildi: true, degerler: { [olcum.id]: '10' } }]);

    await programSil(kapi, 'p1', BUGUN);
    expect(await programlariOku(oku)).toEqual([]);
    expect(await programKartlariOku(oku, 'p1')).toEqual([]);
    const kalanlar = await tumKartlar(oku);
    expect(kalanlar.map((k) => [k.baslik, k.planId, k.bitis])).toEqual([
      ['Araştırma videosu', null, null],
      ['Direnç çalışması', null, '2026-10-19'],
    ]);
  });

  it('Rites önerisinden program', async () => {
    const { program: p, kartlar } = onerdenProgram(oneriler()[0]!, idUret, '2026-10-20T00:00:00Z');
    await programKur(kapi, p, kartlar);
    expect((await programKartlariOku(oku, p.id)).length).toBe(kartlar.length);
  });

  it('kişinin kendi alanı: eklenir, açık gelir, silinince programlardan da çıkar', async () => {
    const anahtar = await ozelAlanEkle(kapi, ' Bahçe ', 'Sebze, çiçek', idUret);
    expect(anahtar).toBe('ozel-id1');
    expect(await ozelAlanlariOku(oku)).toEqual([{ anahtar, ad: 'Bahçe', aciklama: 'Sebze, çiçek' }]);
    expect(alanAdi(anahtar)).toBe('Bahçe');
    expect((await alanDurumlari(oku)).get(anahtar)).toEqual({ acik: true, puan: 0, ilerlemek: false });
    await programKur(kapi, program({ alanlar: ['hareket', anahtar] }));
    await ozelAlanSil(kapi, anahtar);
    expect((await programOku(oku, 'p1'))!.alanlar).toEqual(['hareket']);
    expect(await ozelAlanlariOku(oku)).toEqual([]);
  });
});
