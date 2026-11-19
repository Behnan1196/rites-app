import { bosKayit } from '../kart';
import {
  agirlikDuzelt,
  gecenSefer,
  hedefMetni,
  setGecmisi,
  setHedefiOku,
  setHedefiYaz,
  setleriOku,
  setleriYaz,
  setOzeti,
} from '../setler';

describe('Setler (P-127)', () => {
  const blok = { id: 'b', metin: setHedefiYaz({ set: 3, tekrar: 10, agirlik: '12,5', dinlenme: 60 }) };
  const hedef = setHedefiOku(blok);

  it('hedef okunur, bozuk ya da boşsa varsayılan', () => {
    expect(hedef).toEqual({ set: 3, tekrar: 10, agirlik: '12,5', dinlenme: 60 });
    expect(hedefMetni(hedef)).toBe('3 × 10 · 12,5 kg');
    expect(setHedefiOku({ metin: '' })).toEqual({ set: 3, tekrar: 10, agirlik: '', dinlenme: 60 });
    expect(setHedefiOku({ metin: '{"set":40,"tekrar":0}' }).set).toBe(10);
    expect(agirlikDuzelt('12.5 kg')).toBe('12,5');
    expect(agirlikDuzelt('abc')).toBe('');
  });

  it('kayıt yoksa setler hedefle dolu; bütün setler bitince Yaptım, biri kalkınca geri', () => {
    let k = bosKayit('k', '2026-11-19');
    const ilk = setleriOku(k, hedef, 'b');
    expect(ilk).toHaveLength(3);
    expect(ilk[0]).toEqual({ tekrar: 10, agirlik: '12,5', yapildi: false });
    const iki = ilk.map((s, i) => (i < 2 ? { ...s, yapildi: true } : s));
    k = setleriYaz(k, 'b', ilk, iki);
    expect(k.yapildi).toBe(false);
    const uc = iki.map((s) => ({ ...s, yapildi: true, tekrar: 8 }));
    k = setleriYaz(k, 'b', iki, uc);
    expect(k.yapildi).toBe(true);
    expect(setleriOku(k, hedef, 'b').map((s) => s.tekrar)).toEqual([8, 8, 8]);
    k = setleriYaz(k, 'b', uc, [...uc, { tekrar: 8, agirlik: '', yapildi: false }]);
    expect(k.yapildi).toBe(false);
  });

  it('özet, geçen sefer ve geçmiş', () => {
    const s = (t: number, a: string, y = true) => ({ tekrar: t, agirlik: a, yapildi: y });
    expect(setOzeti([s(12, '10'), s(12, '10'), s(12, '10', false)])).toBe('2 × 12 · 10 kg');
    expect(setOzeti([s(12, ''), s(10, ''), s(8, '')])).toBe('12 · 10 · 8 tekrar');
    expect(setOzeti([s(12, '10'), s(10, '12,5')])).toBe('12 × 10 · 10 × 12,5 kg');
    expect(setOzeti([s(12, '10', false)])).toBe('');
    expect(setOzeti([s(11, '20'), s(9, '20'), s(11, '20')])).toBe('11 · 9 · 11 tekrar · 20 kg');

    const kayit = (tarih: string, setler: ReturnType<typeof s>[]) => setleriYaz(bosKayit('k', tarih), 'b', [], setler);
    const kayitlar = [
      kayit('2026-11-15', [s(10, '10'), s(10, '10'), s(10, '10')]),
      kayit('2026-11-17', [s(12, '10'), s(10, '12,5'), s(8, '12,5', false)]),
      kayit('2026-11-18', [s(10, '10', false)]),
    ];
    expect(gecenSefer(kayitlar, blok, '2026-11-19')).toMatchObject({
      gun: '2026-11-17',
      toplamTekrar: 22,
      enAgir: 12.5,
    });
    expect(gecenSefer(kayitlar, blok, '2026-11-17')?.gun).toBe('2026-11-15');
    expect(setGecmisi(kayitlar, blok).map((g) => g.gun)).toEqual(['2026-11-17', '2026-11-15']);
  });
});
