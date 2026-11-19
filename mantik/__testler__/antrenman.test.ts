import { antrenmanKaydiYaz, antrenmanMi, antrenmanOzeti, antrenmanSuresi, gecenSure, siradakiAdim } from '../antrenman';
import { bosKayit, type Blok } from '../kart';
import { setHedefiYaz, setleriYaz } from '../setler';

const setBlok = (id: string): Blok => ({
  id,
  kartId: 'k',
  sira: 0,
  tur: 'setler',
  ad: '',
  metin: setHedefiYaz({ set: 2, tekrar: 10, agirlik: '20', dinlenme: 60 }),
  birim: '',
  dakika: null,
  maddeler: [],
  dosya: null,
});
const s = (t: number, a: string, y = true) => ({ tekrar: t, agirlik: a, yapildi: y });

describe('Antrenman (P-133)', () => {
  it('setli egzersiz varsa antrenman; sıradaki ilk yapılmamış', () => {
    expect(antrenmanMi([{ bloklar: [] }])).toBe(false);
    expect(antrenmanMi([{ bloklar: [] }, { bloklar: [setBlok('b')] }])).toBe(true);
    expect(siradakiAdim([{ yapildi: true }, { yapildi: false }, { yapildi: false }])).toBe(1);
    expect(siradakiAdim([{ yapildi: true }, { yapildi: true }])).toBe(1);
  });

  it('özet: set, tekrar, yeni rekor', () => {
    const b = setBlok('b');
    const kayitlar = [
      setleriYaz(bosKayit('a', '2026-11-17'), 'b', [], [s(10, '20'), s(10, '20')]),
      setleriYaz(bosKayit('a', '2026-11-19'), 'b', [], [s(10, '22,5'), s(8, '22,5'), s(6, '20', false)]),
    ];
    const ozet = antrenmanOzeti(
      [
        { id: 'a', baslik: 'Squat', bloklar: [b], kayitlar, yapildi: true },
        { id: 'c', baslik: 'Esneme', bloklar: [], kayitlar: [], yapildi: false },
      ],
      '2026-11-19',
    );
    expect(ozet).toEqual({
      egzersiz: 2,
      yapilanEgzersiz: 1,
      set: 2,
      tekrar: 18,
      rekorlar: [{ ad: 'Squat', kg: 22.5 }],
    });
  });

  it('süre metinleri ve kayıt', () => {
    expect(gecenSure(760)).toBe('12:40');
    expect(gecenSure(3912)).toBe('1:05:12');
    expect(antrenmanSuresi(2280)).toBe('38 dk');
    expect(antrenmanSuresi(3900)).toBe('1 sa 5 dk');
    const k = antrenmanKaydiYaz(bosKayit('r', '2026-11-19'), { sure: 2280.4, puan: 4, not: ' iyi ' });
    expect(JSON.parse(k.degerler.antrenman!)).toEqual({ sure: 2280, puan: 4, not: 'iyi' });
  });
});
