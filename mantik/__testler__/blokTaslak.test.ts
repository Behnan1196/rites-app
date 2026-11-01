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

describe('P-83: bilgi listesi ve bağlı liste', () => {
  it('bilgi listesinin maddeleri kaydedilir; bağlı listenin kimliği metinde kalır', () => {
    const bilgi = formaBlok({
      id: 'b',
      tur: 'bilgi',
      ad: '',
      metin: '',
      birim: '',
      dakika: null,
      maddeler: ['Un', 'Şeker'],
      dosya: null,
    });
    expect(kaydaBlok(bilgi).maddeler).toEqual(['Un', 'Şeker']);
    const bag = {
      id: 'c',
      tur: 'listebag' as const,
      ad: 'Pazar',
      metin: 'y-1',
      birim: '',
      dakika: null,
      maddeler: [],
      dosya: null,
    };
    expect(kaydaBlok(formaBlok(bag))).toEqual(bag);
  });
});
