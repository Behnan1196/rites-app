import { baslikDegisir, parcaDegisir, sabitDegistir, zamanDegisimi } from '../gorunumDegisimi';
import { verilenKarti } from '../kartVerme';
import { kartIcerigi, kutuphanedenKart } from '../kutuphane';
import { kartPaketi } from '../paylasim';

describe('Görünümde değişim (P-65)', () => {
  const kendi = { kilitli: false, sabitler: null };
  it('varsayılan: hepsi açık', () => {
    expect(zamanDegisimi(kendi)).toBe('tam');
    expect(baslikDegisir(kendi)).toBe(true);
    expect(parcaDegisir(kendi, { tur: 'liste' })).toBe(true);
    expect(parcaDegisir(kendi, { tur: 'olcum' })).toBe(false);
  });
  it('sabitlenen değişmez', () => {
    const k = { kilitli: false, sabitler: ['zaman' as const] };
    expect(zamanDegisimi(k)).toBe('yok');
    expect(baslikDegisir(k)).toBe(true);
    expect(parcaDegisir(k, { tur: 'talimat', sabit: true })).toBe(false);
  });
  it('verilen kart: verenin ayarı; eski kartta yalnız saat', () => {
    expect(zamanDegisimi({ kilitli: true, sabitler: [] })).toBe('tam');
    expect(baslikDegisir({ kilitli: true, sabitler: ['baslik'] })).toBe(false);
    expect(parcaDegisir({ kilitli: true, sabitler: [] }, { tur: 'video' })).toBe(true);
    expect(zamanDegisimi({ kilitli: true, sabitler: null })).toBe('saat');
    expect(baslikDegisir({ kilitli: true, sabitler: null })).toBe(false);
    expect(parcaDegisir({ kilitli: true, sabitler: null }, { tur: 'video' })).toBe(false);
  });
  it('anahtar', () => {
    expect(sabitDegistir([], 'zaman', true)).toEqual(['zaman']);
    expect(sabitDegistir(['zaman', 'baslik'], 'zaman', false)).toEqual(['baslik']);
    expect(sabitDegistir(['zaman'], 'baslik', true)).toEqual(['baslik', 'zaman']);
  });
});

describe('Sabitler kartla taşınır (P-65)', () => {
  it('paket, verilen kart, kütüphane', () => {
    const kart = { baslik: 'Diş', kisa: '', saat: null, hatirlatma: null, tekrar: null, sabitler: ['zaman' as const] };
    const bloklar = [
      { tur: 'talimat' as const, ad: '', metin: 'Fırçala', birim: '', dakika: null, maddeler: [], sabit: true },
      { tur: 'liste' as const, ad: '', metin: '', birim: '', dakika: null, maddeler: ['a'] },
    ];
    const p = kartPaketi(kart, bloklar);
    expect(p.sabitler).toEqual(['zaman']);
    expect(p.bloklar.map((b) => !!b.sabit)).toEqual([true, false]);
    const v = verilenKarti({ id: 'v', kart: p, baslangic: '2026-10-29' }, 'Anne', () => 'k');
    expect(v.kart.sabitler).toEqual(['zaman']);
    expect(v.bloklar.map((b) => !!b.sabit)).toEqual([true, false]);
    const eski = verilenKarti(
      { id: 'v', kart: { ...p, sabitler: undefined }, baslangic: '2026-10-29' },
      'Anne',
      () => 'k',
    );
    expect(eski.kart.sabitler).toBeNull();
    const c = kartIcerigi(kart, bloklar);
    expect(c.sabitler).toEqual(['zaman']);
    const geri = kutuphanedenKart(c, '2026-10-29', () => 'x');
    expect(geri.kart.sabitler).toEqual(['zaman']);
    expect(geri.bloklar.map((b) => !!b.sabit)).toEqual([true, false]);
  });
});
