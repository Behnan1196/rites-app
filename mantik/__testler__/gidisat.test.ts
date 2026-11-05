import { gidisatTablosu, olcumParcalariMi, sayiMetni, sayiOku } from '../gidisat';
import { bosKayit, type Blok } from '../kart';
import { hazirKarttaMi, OLCUM_HAZIRLARI, olcumGunu, olcumGunuMu, siklikYaz } from '../olcumHazirlari';

const blok = (id: string, tur: Blok['tur'], ad: string, d: Partial<Blok> = {}): Blok => ({
  id,
  kartId: 'k',
  sira: 0,
  tur,
  ad,
  metin: '',
  birim: '',
  dakika: null,
  maddeler: [],
  dosya: null,
  ...d,
});

describe('Gidişat (P-87)', () => {
  const bloklar = [
    blok('su', 'adet', 'Su', { birim: 'bardak', dakika: 8 }),
    blok('kahve', 'adet', 'Kahve'),
    blok('enerji', 'puan', 'Enerji'),
    blok('kilo', 'olcum', '', { birim: 'kg' }),
    blok('not', 'gunnot', 'Not'),
  ];
  const kayit = (tarih: string, d: Record<string, string>) => ({ ...bosKayit('k', tarih), degerler: d });
  const t = gidisatTablosu(
    bloklar,
    [
      kayit('2026-11-04', { su: '8', kahve: '1', enerji: '4', kilo: '72,5' }),
      kayit('2026-11-03', { su: '4', kahve: '3', enerji: '2', kilo: '73' }),
    ],
    '2026-11-04',
    7,
  );
  it('ölçüm parçaları sütun olur; günün notu olmaz; adsız ölçüme tür adı', () => {
    expect(t.sutunlar.map((s) => s.ad)).toEqual(['Su', 'Kahve', 'Enerji', 'Ölçüm']);
    expect(olcumParcalariMi(bloklar)).toBe(true);
    expect(olcumParcalariMi([blok('x', 'liste', '')])).toBe(false);
  });
  it('en yeni gün başta; değer yoksa boş; koyuluk hedefe, 5’e, döneme göre', () => {
    expect(t.satirlar.map((s) => s.gun)).toEqual([
      '2026-11-04',
      '2026-11-03',
      '2026-11-02',
      '2026-11-01',
      '2026-10-31',
      '2026-10-30',
      '2026-10-29',
    ]);
    const [bugun, dun, once] = t.satirlar;
    expect(bugun!.hucreler.map((h) => h.deger)).toEqual([8, 1, 4, 72.5]);
    expect(once!.hucreler.every((h) => h.deger === null && h.yogunluk === 0)).toBe(true);
    expect(bugun!.hucreler[0]!.yogunluk).toBe(1);
    expect(dun!.hucreler[0]!.yogunluk).toBe(0.5);
    expect(bugun!.hucreler[2]!.yogunluk).toBe(0.8);
    expect(bugun!.hucreler[3]!.yogunluk).toBeCloseTo(0.08);
    expect(dun!.hucreler[3]!.yogunluk).toBe(1);
  });
  it('son 7 günün ortalaması yalnız değer girilen günlerden', () => {
    expect(t.ortalama).toEqual([6, 2, 3, 72.75]);
    expect(sayiMetni(72.75)).toBe('72,8');
    expect(sayiOku(' 7,5 ')).toBe(7.5);
    expect(sayiOku('abc')).toBeNull();
  });
  it('hazır ölçüm kartta varsa yeniden önerilmez', () => {
    const su = OLCUM_HAZIRLARI.find((h) => h.ad === 'Su')!;
    expect(hazirKarttaMi(su, bloklar)).toBe(true);
    expect(
      hazirKarttaMi(
        OLCUM_HAZIRLARI.find((h) => h.ad === 'Uyku')!,
        bloklar,
      ),
    ).toBe(false);
  });
});

describe('P-91: ölçüm sıklığı', () => {
  it('haftalık ölçüm yalnız kendi gününde (değeri varsa yine)', () => {
    expect(olcumGunu({ metin: siklikYaz(0) })).toBe(0);
    expect(olcumGunu({ metin: '' })).toBeNull();
    expect(olcumGunuMu({ metin: 'hafta:0' }, 0)).toBe(true);
    expect(olcumGunuMu({ metin: 'hafta:0' }, 3)).toBe(false);
    expect(olcumGunuMu({ metin: 'hafta:0' }, 3, true)).toBe(true);
    expect(olcumGunuMu({ metin: '' }, 3)).toBe(true);
  });
});
