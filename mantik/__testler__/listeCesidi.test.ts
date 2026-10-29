import {
  alisverisOnerileri,
  cesitTanimi,
  gecmiseEkle,
  listeOzeti,
  maddeSirasi,
  miktarAyir,
  paylasilanOzeti,
} from '../listeCesidi';

describe('Liste çeşitleri (P-61)', () => {
  it('bilinmeyen çeşit Yapılacaklar', () => {
    expect(cesitTanimi(undefined).cesit).toBe('yapilacak');
    expect(cesitTanimi('alisveris').ad).toBe('Alışveriş');
  });

  it('yapılan alta iner (yapılacak, alışveriş); hazırlıkta yerinde kalır', () => {
    const m = [
      { id: 'a', yapildi: true, sira: 1 },
      { id: 'b', yapildi: false, sira: 2 },
      { id: 'c', yapildi: false, sira: 3 },
    ];
    expect(maddeSirasi('alisveris', m).map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(maddeSirasi('yapilacak', m).map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(maddeSirasi('hazirlik', m).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('özetler', () => {
    expect(listeOzeti('alisveris', 3, 2)).toBe('2 alınacak');
    expect(listeOzeti('alisveris', 3, 0)).toBe('Hepsi alındı');
    expect(listeOzeti('hazirlik', 10, 7)).toBe('3/10 hazır');
    expect(listeOzeti('not', 4, 4)).toBe('4 madde');
    expect(listeOzeti('yapilacak', 0, 0)).toBe('Boş');
    expect(paylasilanOzeti('not', 3)).toBe('');
    expect(paylasilanOzeti('yapilacak', 2)).toBe('2 madde kaldı');
  });

  it('miktar ayrılır', () => {
    expect(miktarAyir('2 kg domates')).toEqual({ metin: 'Domates', miktar: '2 kg' });
    expect(miktarAyir('3 ekmek')).toEqual({ metin: 'Ekmek', miktar: '3' });
    expect(miktarAyir('1,5 lt süt')).toEqual({ metin: 'Süt', miktar: '1,5 lt' });
    expect(miktarAyir('ıspanak')).toEqual({ metin: 'Ispanak', miktar: '' });
    expect(miktarAyir('2 incir')).toEqual({ metin: 'İncir', miktar: '2' });
    expect(miktarAyir('yarım kilo peynir')).toEqual({ metin: 'Peynir', miktar: 'yarım kilo' });
    expect(miktarAyir('Zeytinyağı')).toEqual({ metin: 'Zeytinyağı', miktar: '' });
    expect(miktarAyir('7 Tepe çayı')).toEqual({ metin: 'Tepe çayı', miktar: '7' });
  });

  it('geçmiş ve öneriler', () => {
    let g: string[] = [];
    for (const x of ['Süt', 'Domates', 'Sucuk', 'süt', 'Ekmek']) g = gecmiseEkle(g, x);
    expect(g).toEqual(['Ekmek', 'Süt', 'Sucuk', 'Domates']);
    expect(alisverisOnerileri(g, 'su', [])).toEqual(['Sucuk']);
    expect(alisverisOnerileri(g, 'mat', [])).toEqual(['Domates']);
    expect(alisverisOnerileri(g, 's', [])).toEqual([]);
    expect(alisverisOnerileri(g, 'sü', ['Süt'])).toEqual([]);
    expect(alisverisOnerileri(g, '2 kg dom', [])).toEqual(['Domates']);
  });
});
