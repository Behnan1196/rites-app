import type { Bulusma } from '../bulusma';
import { banaBekleyenler, bekleyenOzeti, gizliyeEkle, grupBasinaBekleyen, yanitlamayanlar } from '../grupBekleyenler';
import type { GrupIsi } from '../isler';
import type { Karar } from '../karar';
import type { Rutin } from '../rutin';

const BEN = 'ben';
const BUGUN = '2026-10-19';
const ortak = { grup: 'g1', grupAdi: 'Aile' };
const is = (d: Partial<GrupIsi>): GrupIsi => ({
  id: 'i',
  ...ortak,
  isteyen: 'ali',
  baslik: 'X',
  tarih: null,
  kime: null,
  durum: 'acik',
  alan: null,
  yapilma: null,
  ...d,
});
const bul = (d: Partial<Bulusma>): Bulusma => ({
  id: 'b',
  ...ortak,
  kuran: 'ali',
  baslik: 'Y',
  gun: BUGUN,
  saat: null,
  yer: '',
  yanitlar: [],
  ...d,
});
const kar = (d: Partial<Karar>): Karar => ({
  id: 'k',
  ...ortak,
  kuran: 'ali',
  soru: 'Z',
  tur: 'metin',
  coklu: false,
  sonGun: null,
  yer: '',
  sonuc: null,
  bulusma: null,
  secenekler: [{ id: 's1', metin: 'a', gun: null, saat: null }],
  oylar: [],
  ...d,
});
const rut = (d: Partial<Rutin>): Rutin => ({
  id: 'r',
  ...ortak,
  kuran: 'ali',
  ad: 'W',
  hedef: 3,
  katilanlar: [],
  ...d,
});

describe('gruplardan bana bekleyenler', () => {
  const ic = {
    isler: [
      is({ id: 'istendi', durum: 'istendi', kime: BEN }),
      is({ id: 'acik' }),
      is({ id: 'benim-acik', isteyen: BEN }),
      is({ id: 'baskasindan', durum: 'istendi', kime: 'elif' }),
      is({ id: 'alindi', durum: 'alindi', alan: BEN }),
    ],
    bulusmalar: [
      bul({ id: 'yanitsiz' }),
      bul({ id: 'yanitli', yanitlar: [{ kullanici: BEN, yanit: 'belki' }] }),
      bul({ id: 'gecmis', gun: '2026-10-18' }),
      bul({ id: 'benim', kuran: BEN }),
    ],
    kararlar: [
      kar({ id: 'oysuz' }),
      kar({ id: 'oylu', oylar: [{ secenek: 's1', kullanici: BEN }] }),
      kar({ id: 'kapali', sonuc: 's1' }),
    ],
    rutinler: [rut({ id: 'davet' }), rut({ id: 'katildim', katilanlar: [{ kullanici: BEN, gunler: [] }] })],
  };

  it('yalnız benden yanıt bekleyenler', () => {
    expect(banaBekleyenler(ic, BEN, BUGUN).map((b) => b.anahtar)).toEqual([
      'is:istendi',
      'is:acik',
      'bulusma:yanitsiz',
      'karar:oysuz',
      'rutin:davet',
    ]);
  });

  it('gizlenenler düşer; benden istenen iş gizlenemez', () => {
    const gizli = new Set(['is:acik', 'is:istendi', 'karar:oysuz']);
    expect(banaBekleyenler(ic, BEN, BUGUN, gizli).map((b) => b.anahtar)).toEqual([
      'is:istendi',
      'bulusma:yanitsiz',
      'rutin:davet',
    ]);
  });

  it('özetler', () => {
    const l = banaBekleyenler(ic, BEN, BUGUN);
    expect(grupBasinaBekleyen(l).get('g1')).toBe(5);
    expect(bekleyenOzeti(l)).toBe('5 grup isteği');
    expect(bekleyenOzeti([])).toBeNull();
  });

  it('kim yanıtlamadı (kuran hariç)', () => {
    expect(yanitlamayanlar(['ali', 'ben', 'elif'], ['ben'], 'ali')).toEqual(['elif']);
  });

  it('gizli listesi sınırlı, tekrarsız', () => {
    expect(gizliyeEkle(['a', 'b'], 'a')).toEqual(['b', 'a']);
    expect(
      gizliyeEkle(
        Array.from({ length: 200 }, (_, i) => `x${i}`),
        'yeni',
      ),
    ).toHaveLength(200);
  });
});
