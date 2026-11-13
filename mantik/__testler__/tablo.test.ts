import {
  satirlariSirala,
  satirUyar,
  sayiMi,
  sutunlariDegistir,
  sutunlariDuzelt,
  tabloCsv,
  tabloOku,
  tabloYaz,
} from '../tablo';

describe('Tablo (P-120)', () => {
  const t = {
    sutunlar: ['Ürün', 'Son fiyat', 'Yer'],
    satirlar: [
      ['Süt', '42,50', 'Bim'],
      ['Ekmek', '15', 'Fırın'],
      ['Çay', '1.250', ''],
      ['ıhlamur', '', 'Pazar'],
    ],
    isaret: false,
    isaretli: [false, false, false, false],
  };
  it('yazılır, okunur; eksik hücre boş', () => {
    const y = tabloYaz(t);
    expect(tabloOku(y)).toEqual(t);
    expect(tabloOku({ metin: '["A","B"]', maddeler: ['["x"]', 'düz'] }).satirlar).toEqual([
      ['x', ''],
      ['düz', ''],
    ]);
  });
  it('sayılar Türkçe biçimde', () => {
    expect(sayiMi('42,50')).toBe(42.5);
    expect(sayiMi('1.250')).toBe(1250);
    expect(sayiMi('12.5')).toBe(12.5);
    expect(sayiMi('15 TL')).toBe(15);
    expect(sayiMi('Bim')).toBeNull();
  });
  it('sütuna göre sıralanır; sayılar sayı gibi, boşlar sonda', () => {
    const f = satirlariSirala(t.satirlar, { sutun: 1, artan: true }).map((x) => x.satir[0]);
    expect(f).toEqual(['Ekmek', 'Süt', 'Çay', 'ıhlamur']);
    const a = satirlariSirala(t.satirlar, { sutun: 0, artan: false }).map((x) => x.satir[0]);
    expect(a).toEqual(['Süt', 'ıhlamur', 'Ekmek', 'Çay']);
    expect(satirlariSirala(t.satirlar, null).map((x) => x.i)).toEqual([0, 1, 2, 3]);
  });
  it('arama, sütun değişikliği, CSV', () => {
    expect(t.satirlar.filter((s) => satirUyar(s, 'bİm')).length).toBe(1);
    expect(sutunlariDuzelt([' Ad ', '', 'Not', 'Fazla'])).toEqual(['Ad', 'Not', 'Fazla']);
    expect(sutunlariDuzelt(['', ' '])).toBeNull();
    const d = sutunlariDegistir(t, ['Yer', 'Ürün'], [2, 0]);
    expect(d.satirlar[0]).toEqual(['Bim', 'Süt']);
    expect(tabloCsv({ sutunlar: ['A', 'B'], satirlar: [['x;y', 'z"q']], isaret: false, isaretli: [false] })).toBe(
      '﻿A;B\r\n"x;y";"z""q"\r\n',
    );
  });
  it('P-121: Aldım işareti yazılır ve okunur; eski dizi biçimi okunur; CSV’de Alındı sütunu', () => {
    const m = {
      sutunlar: ['Ürün', 'Fiyat'],
      satirlar: [
        ['Süt', '42'],
        ['Ekmek', '15'],
      ],
      isaret: true,
      isaretli: [true, false],
    };
    const y = tabloYaz(m);
    expect(JSON.parse(y.metin)).toEqual({ sutunlar: ['Ürün', 'Fiyat'], isaret: true });
    expect(y.maddeler).toEqual(['{"h":["Süt","42"],"y":true}', '["Ekmek","15"]']);
    expect(tabloOku(y)).toEqual(m);
    expect(tabloOku({ metin: '["A"]', maddeler: ['["x"]'] })).toMatchObject({ isaret: false, isaretli: [false] });
    expect(tabloCsv(m)).toBe('\uFEFFAlındı;Ürün;Fiyat\r\nEvet;Süt;42\r\n;Ekmek;15\r\n');
    expect(sutunlariDuzelt(['1', '2', '3', '4', '5', '6'])).toHaveLength(5);
  });
});
