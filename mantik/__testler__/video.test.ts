import { adrestekiBaslangic, blokVideolari, sureCoz, sureYaz, videolarBlogu } from '../video';

describe('çoklu video (P-53)', () => {
  it('eski tek bağlantı bir videodur', () => {
    expect(blokVideolari({ metin: 'https://youtu.be/abc', maddeler: [] })).toEqual([
      { adres: 'https://youtu.be/abc', baslik: '', bas: null, bit: null },
    ]);
    expect(blokVideolari({ metin: '', maddeler: [] })).toEqual([]);
  });

  it('videolar ↔ parça', () => {
    const v = [
      { adres: 'https://youtu.be/a', baslik: 'Isınma', bas: 30, bit: null },
      { adres: 'https://youtu.be/b', baslik: '', bas: null, bit: 600 },
    ];
    const b = videolarBlogu(v);
    expect(b.metin).toBe('https://youtu.be/a');
    expect(blokVideolari(b)).toEqual(v);
    expect(blokVideolari({ metin: 'x', maddeler: ['bozuk', '{"adres":""}'] })).toEqual([
      { adres: 'x', baslik: '', bas: null, bit: null },
    ]);
  });

  it('süre yazımı ve çözümü', () => {
    expect(sureCoz('1:30')).toBe(90);
    expect(sureCoz('1:02:03')).toBe(3723);
    expect(sureCoz('45')).toBe(45);
    expect(sureCoz('2m5s')).toBe(125);
    expect(sureCoz('')).toBeNull();
    expect(sureCoz('abc')).toBeNull();
    expect(sureYaz(90)).toBe('1:30');
    expect(sureYaz(3723)).toBe('1:02:03');
    expect(sureYaz(null)).toBe('');
  });

  it('bağlantıdaki başlangıç', () => {
    expect(adrestekiBaslangic('https://www.youtube.com/watch?v=abcdefghijk&t=75')).toBe(75);
    expect(adrestekiBaslangic('https://youtu.be/abc')).toBeNull();
  });
});
