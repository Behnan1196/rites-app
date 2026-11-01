import { cesitTanimi, isaretliGorunur, listeOzeti, maddeSirasi, paylasilanOzeti, tarihliMi } from '../listeCesidi';

describe('Liste çeşitleri (P-61, P-86: kartla aynı üç çeşit)', () => {
  it('bilinmeyen ve eski çeşit (alışveriş, hazırlık) Adımlar', () => {
    expect(cesitTanimi(undefined).cesit).toBe('yapilacak');
    expect(cesitTanimi('alisveris').ad).toBe('Adımlar');
    expect(cesitTanimi('hazirlik').cesit).toBe('yapilacak');
    expect(cesitTanimi('gunluk').ad).toBe('Günlük kontrol');
    expect(cesitTanimi('not').ad).toBe('Bilgi listesi');
  });

  it('Adımlar’da yapılan alta iner; günlükte yerinde kalır', () => {
    const m = [
      { id: 'a', yapildi: true, sira: 1 },
      { id: 'b', yapildi: false, sira: 2 },
      { id: 'c', yapildi: false, sira: 3 },
    ];
    expect(maddeSirasi('yapilacak', m).map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(maddeSirasi('gunluk', m).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('günlük kontrolde dünkü işaret bugün görünmez', () => {
    expect(isaretliGorunur('gunluk', { yapildi: true, yapildiGun: '2026-11-01' }, '2026-11-01')).toBe(true);
    expect(isaretliGorunur('gunluk', { yapildi: true, yapildiGun: '2026-10-31' }, '2026-11-01')).toBe(false);
    expect(isaretliGorunur('yapilacak', { yapildi: true, yapildiGun: null }, '2026-11-01')).toBe(true);
    expect(tarihliMi('gunluk')).toBe(false);
  });

  it('özetler', () => {
    expect(listeOzeti('yapilacak', 3, 2)).toBe('2 kalan');
    expect(listeOzeti('gunluk', 4, 1)).toBe('Bugün 3/4');
    expect(listeOzeti('not', 4, 4)).toBe('4 madde');
    expect(listeOzeti('yapilacak', 0, 0)).toBe('Boş');
    expect(paylasilanOzeti('not', 3)).toBe('');
    expect(paylasilanOzeti('gunluk', 3)).toBe('');
    expect(paylasilanOzeti('yapilacak', 2)).toBe('2 madde kaldı');
  });
});
