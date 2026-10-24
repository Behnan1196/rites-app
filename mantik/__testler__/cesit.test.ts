import { cesitBul, cesitGruplari, cesitler, yeniCesitKimligi } from '../cesit';
import { cesitCoz, gomuluKatalog, katalogAyarla, katalogCoz } from '../katalog';

afterEach(() => katalogAyarla(null));

describe('kart çeşitleri (P-41)', () => {
  it('uygulamayla beş Beslenme çeşidi gelir', () => {
    expect(cesitler('beslenme').map((c) => c.ad)).toEqual(['Öğün listesi', 'Yemek tarifi', 'Tartı', 'Tabağım', 'Su']);
    expect(cesitBul('beslenme-su')?.bloklar[0]).toMatchObject({ tur: 'adet', birim: 'bardak', dakika: 8 });
    expect(cesitBul('yok')).toBeNull();
  });

  it('öğün listesi: plan listesi ve serbest cevap', () => {
    const c = cesitBul('beslenme-ogun')!;
    expect(c.bloklar.map((b) => b.tur)).toEqual(['liste', 'gunnot']);
    expect(c.bloklar[1]?.metin).toMatch(/ne kadar/);
  });

  it('sunucu satırı çözülür; bozuk satır atlanır', () => {
    expect(
      cesitCoz({
        id: 'x',
        alan: 'uyku',
        ad: 'Uyku',
        baslik_ipucu: 'İpucu',
        saat: '25:00',
        tekrar: { desen: 'hergun' },
        bloklar: [{ tur: 'puan', ad: 'Kalite' }, { tur: 'bilinmeyen' }],
      }),
    ).toMatchObject({ baslikIpucu: 'İpucu', saat: null, tekrar: { desen: 'hergun' }, bloklar: [{ tur: 'puan' }] });
    expect(cesitCoz({ id: 'x', ad: 'Alansız' })).toBeNull();
  });

  it('katalogda çeşit yoksa uygulamayla gelenler; boş liste ise hiç', () => {
    const alanlar = [{ anahtar: 'beslenme', ad: 'Beslenme' }];
    expect(katalogCoz({ alanlar })!.cesitler).toEqual(gomuluKatalog().cesitler);
    expect(katalogCoz({ alanlar, cesitler: [] })!.cesitler).toEqual([]);
    const k = katalogCoz({
      alanlar,
      cesitler: [
        { id: 'b', alan: 'beslenme', ad: 'B', sira: 20 },
        { id: 'a', alan: 'beslenme', ad: 'A', sira: 10 },
        { id: 'c', alan: 'beslenme', ad: 'Gizli', aktif: false },
      ],
    })!;
    expect(k.cesitler.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('alanlara göre gruplanır, alanların sırasıyla', () => {
    const g = cesitGruplari(
      [
        { ...cesitBul('beslenme-su')!, id: '1', alan: 'uyku' },
        { ...cesitBul('beslenme-su')!, id: '2', alan: 'beslenme' },
        { ...cesitBul('beslenme-su')!, id: '3', alan: 'bilinmeyen' },
      ],
      [
        { anahtar: 'beslenme', ad: 'Beslenme' },
        { anahtar: 'uyku', ad: 'Uyku' },
      ],
    );
    expect(g.map((x) => [x.ad, x.cesitler.map((c) => c.id)])).toEqual([
      ['Beslenme', ['2']],
      ['Uyku', ['1']],
      ['bilinmeyen', ['3']],
    ]);
  });

  it('yeni çeşidin kimliği', () => {
    expect(yeniCesitKimligi('beslenme', '3FA2C1d0-aaaa')).toBe('beslenme-3fa2c1');
  });
});
