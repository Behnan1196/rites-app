import {
  hucreMetni,
  satirIsaretliMi,
  satirlariSirala,
  satirUyar,
  sayiMi,
  sayiMetni,
  sutunlariDegistir,
  sutunlariDuzelt,
  sutunToplami,
  tabloCsv,
  tabloOku,
  tabloYaz,
  type Tablo,
} from '../tablo';

const yazi = (ad: string) => ({ ad, tur: 'yazi' as const });

describe('Tablo (P-120, P-122)', () => {
  const t: Tablo = {
    sutunlar: [
      { ad: 'Alındı', tur: 'isaret' },
      yazi('Ürün'),
      { ad: 'Son fiyat', tur: 'sayi', toplam: true },
      { ad: 'Tarih', tur: 'tarih' },
    ],
    satirlar: [
      ['1', 'Süt', '42,50', '2026-11-10'],
      ['', 'Ekmek', '15', '2026-11-12'],
      ['', 'Çay', '1.250', ''],
      ['', 'ıhlamur', '', '2026-11-01'],
    ],
  };
  it('yazılır, okunur', () => {
    const y = tabloYaz(t);
    expect(JSON.parse(y.metin)).toEqual({
      sutunlar: [
        { ad: 'Alındı', tur: 'isaret' },
        { ad: 'Ürün', tur: 'yazi' },
        { ad: 'Son fiyat', tur: 'sayi', toplam: true },
        { ad: 'Tarih', tur: 'tarih' },
      ],
    });
    expect(tabloOku(y)).toEqual(t);
  });
  it('eski biçimler okunur: ad dizisi (P-120) ve tek işaret kutusu (P-121)', () => {
    expect(tabloOku({ metin: '["A","B"]', maddeler: ['["x"]', 'düz'] })).toEqual({
      sutunlar: [yazi('A'), yazi('B')],
      satirlar: [
        ['x', ''],
        ['düz', ''],
      ],
    });
    const eski = tabloOku({
      metin: '{"sutunlar":["Ürün","Fiyat"],"isaret":true}',
      maddeler: ['{"h":["Süt","42"],"y":true}', '["Ekmek","15"]'],
    });
    expect(eski.sutunlar).toEqual([{ ad: 'Alındı', tur: 'isaret' }, yazi('Ürün'), yazi('Fiyat')]);
    expect(eski.satirlar).toEqual([
      ['1', 'Süt', '42'],
      ['', 'Ekmek', '15'],
    ]);
  });
  it('sayılar Türkçe biçimde; toplam', () => {
    expect(sayiMi('42,50')).toBe(42.5);
    expect(sayiMi('1.250')).toBe(1250);
    expect(sayiMi('12.5')).toBe(12.5);
    expect(sayiMi('15 TL')).toBe(15);
    expect(sayiMi('Bim')).toBeNull();
    expect(sayiMetni(sutunToplami(t.satirlar, 2))).toBe('1.307,5');
  });
  it('türe göre sıralama; boşlar sonda', () => {
    const ad = (s: { satir: string[] }[]) => s.map((x) => x.satir[1]);
    expect(ad(satirlariSirala(t.satirlar, { sutun: 2, artan: true }, 'sayi'))).toEqual([
      'Ekmek',
      'Süt',
      'Çay',
      'ıhlamur',
    ]);
    expect(ad(satirlariSirala(t.satirlar, { sutun: 1, artan: false }, 'yazi'))).toEqual([
      'Süt',
      'ıhlamur',
      'Ekmek',
      'Çay',
    ]);
    expect(ad(satirlariSirala(t.satirlar, { sutun: 3, artan: true }, 'tarih'))).toEqual([
      'ıhlamur',
      'Süt',
      'Ekmek',
      'Çay',
    ]);
    expect(ad(satirlariSirala(t.satirlar, { sutun: 0, artan: true }, 'isaret'))[0]).toBe('Süt');
    expect(satirlariSirala(t.satirlar, null).map((x) => x.i)).toEqual([0, 1, 2, 3]);
  });
  it('görünüş, arama, işaret, sütun değişikliği, CSV', () => {
    expect(hucreMetni('tarih', '2026-11-13')).toBe('13 Kasım');
    expect(satirIsaretliMi(t, t.satirlar[0]!)).toBe(true);
    expect(satirIsaretliMi(t, t.satirlar[1]!)).toBe(false);
    expect(t.satirlar.filter((s) => satirUyar(t, s, 'kasım')).length).toBe(3);
    expect(t.satirlar.filter((s) => satirUyar(t, s, 'süt')).length).toBe(1);
    expect(sutunlariDuzelt([yazi(' Ad '), yazi(''), ...'12345'.split('').map(yazi)])).toHaveLength(5);
    expect(sutunlariDuzelt([yazi(' ')])).toBeNull();
    const d = sutunlariDegistir(t, [yazi('Ürün'), { ad: 'Alındı', tur: 'isaret' }], [1, 0]);
    expect(d.satirlar[0]).toEqual(['Süt', '1']);
    expect(tabloCsv(t).split('\r\n').slice(0, 2)).toEqual([
      '﻿Alındı;Ürün;Son fiyat;Tarih',
      'Evet;Süt;42,50;10.11.2026',
    ]);
    expect(tabloCsv({ sutunlar: [yazi('A')], satirlar: [['x;"y']] })).toBe('﻿A\r\n"x;""y"\r\n');
  });
});
