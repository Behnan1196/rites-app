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
    expect(tabloCsv({ sutunlar: ['A', 'B'], satirlar: [['x;y', 'z"q']] })).toBe('﻿A;B\r\n"x;y";"z""q"\r\n');
  });
});
