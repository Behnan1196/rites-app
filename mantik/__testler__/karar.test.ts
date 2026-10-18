import {
  grubunKararlari,
  kararFormuHatasi,
  kararMeta,
  ondeOlanlar,
  oyDegistir,
  oylamaAcikMi,
  oyVerenler,
  secenekMetni,
  type Karar,
} from '../karar';

const BEN = 'ben';
const k = (d: Partial<Karar> = {}): Karar => ({
  id: 'k1',
  grup: 'g1',
  grupAdi: 'Aile',
  kuran: 'ali',
  soru: 'Ne yiyelim?',
  tur: 'metin',
  coklu: false,
  sonGun: null,
  yer: '',
  sonuc: null,
  bulusma: null,
  secenekler: [
    { id: 'a', metin: 'Pizza', gun: null, saat: null },
    { id: 'b', metin: 'Köfte', gun: null, saat: null },
  ],
  oylar: [],
  ...d,
});

describe('karar / oylama', () => {
  it('tek seçimde oy değişir, aynısına basınca geri alınır', () => {
    const x = k({ oylar: [{ secenek: 'a', kullanici: BEN }] });
    expect(oyDegistir(x, BEN, 'b')).toEqual(['b']);
    expect(oyDegistir(x, BEN, 'a')).toEqual([]);
  });

  it('çoklu seçimde eklenir / çıkarılır', () => {
    const x = k({ coklu: true, oylar: [{ secenek: 'a', kullanici: BEN }] });
    expect(oyDegistir(x, BEN, 'b')).toEqual(['a', 'b']);
    expect(oyDegistir(x, BEN, 'a')).toEqual([]);
  });

  it('öndeki(ler) ve oy verenler', () => {
    expect(ondeOlanlar(k())).toEqual([]);
    const x = k({
      oylar: [
        { secenek: 'a', kullanici: 'ali' },
        { secenek: 'b', kullanici: BEN },
        { secenek: 'b', kullanici: 'elif' },
      ],
    });
    expect(ondeOlanlar(x)).toEqual(['b']);
    expect(oyVerenler(x, 'b')).toEqual([BEN, 'elif']);
    expect(ondeOlanlar(k({ oylar: [{ secenek: 'a', kullanici: 'ali' }, { secenek: 'b', kullanici: BEN }] }))).toEqual([
      'a',
      'b',
    ]);
  });

  it('oylama açık mı: karar verilmediyse ve son gün geçmediyse', () => {
    expect(oylamaAcikMi(k(), '2026-10-18')).toBe(true);
    expect(oylamaAcikMi(k({ sonGun: '2026-10-18' }), '2026-10-18')).toBe(true);
    expect(oylamaAcikMi(k({ sonGun: '2026-10-17' }), '2026-10-18')).toBe(false);
    expect(oylamaAcikMi(k({ sonuc: 'a' }), '2026-10-18')).toBe(false);
  });

  it('meta ve seçenek metni', () => {
    expect(kararMeta(k(), '2026-10-18')).toBe('Tek seçim · henüz oy yok');
    expect(kararMeta(k({ coklu: true, sonGun: '2026-10-25', oylar: [{ secenek: 'a', kullanici: 'x' }] }), '2026-10-18')).toBe(
      'Birden çok seçilebilir · son gün 25 Ekim Pazar · 1 kişi oy verdi',
    );
    expect(secenekMetni({ id: 'g', metin: '', gun: '2026-10-25', saat: '10:00' })).toBe('25 Ekim Pazar · 10:00');
    expect(secenekMetni({ id: 'm', metin: 'Pizza', gun: null, saat: null })).toBe('Pizza');
  });

  it('grup ekranında açıklar önce', () => {
    const l = [k({ id: 'verildi', sonuc: 'a' }), k({ id: 'acik' }), k({ id: 'baska', grup: 'g2' })];
    expect(grubunKararlari(l, 'g1').map((x) => x.id)).toEqual(['acik', 'verildi']);
  });

  it('form hatası', () => {
    const m = (metin: string) => ({ metin, gun: null, saat: null });
    expect(kararFormuHatasi('', 'metin', [m('a'), m('b')])).toBe('Bir soru yaz.');
    expect(kararFormuHatasi('Ne?', 'metin', [m('a'), m(' ')])).toBe('En az iki seçenek yaz.');
    expect(kararFormuHatasi('Piknik', 'gun', [{ metin: '', gun: '2026-10-25', saat: null }])).toBe('En az iki gün seç.');
    expect(kararFormuHatasi('Ne?', 'metin', [m('a'), m('b')])).toBeNull();
  });
});
