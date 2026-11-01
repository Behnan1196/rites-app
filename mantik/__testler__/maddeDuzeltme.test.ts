import { adimDurumunuDuzelt, isaretleriDuzelt, maddeleriDuzelt } from '../maddeDuzeltme';

describe('Madde düzeltme (P-86)', () => {
  it('düzeltilen madde yerinde; boş yazı değiştirmez; silinen çıkar', () => {
    expect(maddeleriDuzelt(['a', 'b', 'c'], 1, ' B ')).toEqual(['a', 'B', 'c']);
    expect(maddeleriDuzelt(['a', 'b'], 0, '  ')).toEqual(['a', 'b']);
    expect(maddeleriDuzelt(['a', 'b', 'c'], 1, null)).toEqual(['a', 'c']);
  });
  it('silinen adımın ve günlük maddenin işareti de gider', () => {
    const d = { yapilan: ['2026-11-01', null, '2026-10-31'], bitti: null, oncekiBitis: null };
    expect(adimDurumunuDuzelt(d, 0, null).yapilan).toEqual([null, '2026-10-31']);
    expect(adimDurumunuDuzelt(d, 0, 'x')).toBe(d);
    expect(isaretleriDuzelt([true, false, true], 2, null)).toEqual([true, false]);
  });
});
