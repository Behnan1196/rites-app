import { formaBlok, kaydaBlok } from '../blokTaslak';

const liste = {
  id: 'b',
  kartId: 'k',
  sira: 0,
  tur: 'liste' as const,
  ad: 'Pazar',
  metin: '',
  birim: '',
  dakika: null,
  maddeler: ['Domates', 'Biber'],
  dosya: null,
};

describe('Parça taslağı (P-77)', () => {
  it('liste maddeleri düzenleyicide HTML, kaydederken geri madde', () => {
    const t = formaBlok(liste);
    expect(t).not.toHaveProperty('kartId');
    expect(t.metin).toContain('Domates');
    const k = kaydaBlok({ ...t, metin: t.metin.replace('Biber', 'Patlıcan') });
    expect(k.maddeler).toEqual(['Domates', 'Patlıcan']);
    expect(k.metin).toBe('');
  });
  it('öbür parçalar olduğu gibi', () => {
    const o = { ...liste, tur: 'olcum' as const, ad: 'Kilo', birim: 'kg', maddeler: [] };
    expect(kaydaBlok(formaBlok(o))).toEqual(formaBlok(o));
  });
});
