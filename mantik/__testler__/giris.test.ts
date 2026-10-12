import { enYeniNotlar, kalanIsMetni, siradaki, yerDegistir } from '../giris';
import { yeniKart } from '../kart';

const k = (id: string, saat: string | null) => yeniKart(id, { baslik: id, tarih: '2026-10-12', saat });

describe('Bugün sırada (G-8)', () => {
  const liste = [k('a', '07:30'), k('b', '08:00'), k('c', '12:00'), k('d', null)];

  it('saati şimdiden sonra olan ilk yapılmamış kart', () => {
    expect(siradaki(liste, new Set(), '09:41')).toEqual({ kart: liste[2], kalan: 3 });
  });
  it('saati geçmişse listedeki ilk yapılmamış', () => {
    expect(siradaki(liste, new Set(['c']), '13:00')?.kart.id).toBe('a');
  });
  it('yapılanlar sayılmaz', () => {
    expect(siradaki(liste, new Set(['a', 'b']), '07:00')).toEqual({ kart: liste[2], kalan: 1 });
  });
  it('hepsi bittiyse ya da kart yoksa boş', () => {
    expect(siradaki(liste, new Set(['a', 'b', 'c', 'd']), '07:00')).toBeNull();
    expect(siradaki([], new Set(), '07:00')).toBeNull();
  });
  it('metin', () => {
    expect(kalanIsMetni(4)).toBe('Bugün 4 iş daha var');
    expect(kalanIsMetni(0)).toBe('Bugünün son işi');
  });
});

describe('sıralama ve notlar', () => {
  it('yer değiştirir', () => {
    expect(yerDegistir(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(yerDegistir(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(yerDegistir(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
  it('en yeni iki not', () => {
    const n = (id: string, olusturma: string) => ({ id, olusturma });
    expect(enYeniNotlar([n('a', '2026-10-10'), n('b', '2026-10-12'), n('c', '2026-10-11')]).map((x) => x.id)).toEqual(['b', 'c']);
  });
});
