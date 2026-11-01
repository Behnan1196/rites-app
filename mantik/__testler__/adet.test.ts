import { adetYaz, simgeDokunusu } from '../adet';
import { bosKayit } from '../kart';

describe('Su sayacı (P-81)', () => {
  const k = bosKayit('k', '2026-11-01');
  it('hedefe ulaşınca Yaptım; altına inince kalkar', () => {
    const a = adetYaz(k, 'b', 7, 8);
    expect([a.degerler.b, a.yapildi]).toEqual(['7', false]);
    const b = adetYaz(a, 'b', 8, 8);
    expect(b.yapildi).toBe(true);
    expect(adetYaz(b, 'b', 9, 8).yapildi).toBe(true);
    expect(adetYaz(b, 'b', 7, 8).yapildi).toBe(false);
  });
  it('elle verilen Yaptım sınır geçilmeden değişmez; hedefsizde hiç değişmez', () => {
    expect(adetYaz({ ...k, yapildi: true }, 'b', 2, 8).yapildi).toBe(true);
    expect(adetYaz(k, 'b', 20, null).yapildi).toBe(false);
  });
  it('simgeye dokunuş: doldurur; son doluya dokununca bir azalır', () => {
    expect(simgeDokunusu(0, 2)).toBe(3);
    expect(simgeDokunusu(3, 2)).toBe(2);
    expect(simgeDokunusu(5, 2)).toBe(3);
  });
});
