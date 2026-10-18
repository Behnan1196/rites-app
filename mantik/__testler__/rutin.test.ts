import { gorunurMu } from '../gorunurluk';
import { kaynakEtiketi } from '../kaynak';
import {
  bitecekKartlar,
  esitlemeBasi,
  haftaBasi,
  haftaDurumu,
  haftaOzeti,
  hedefMetni,
  isaretFarki,
  onerilenGunler,
  rutinBagCoz,
  rutinFormuHatasi,
  rutinKarti,
  type Rutin,
} from '../rutin';

const BEN = 'ben';
const BUGUN = '2026-10-21'; // Çarşamba
const r = (d: Partial<Rutin> = {}): Rutin => ({
  id: 'r1',
  grup: 'g1',
  grupAdi: 'Aile',
  kuran: 'ali',
  ad: 'Yürüyüş',
  hedef: 3,
  katilanlar: [],
  ...d,
});

describe('birlikte rutin', () => {
  it('hafta Pazartesi başlar; eşitleme geçen haftanın başından', () => {
    expect(haftaBasi(BUGUN)).toBe('2026-10-19');
    expect(esitlemeBasi(BUGUN)).toBe('2026-10-12');
  });

  it('hedef kadar gün önerilir', () => {
    expect(onerilenGunler(3)).toEqual(['Pzt', 'Çar', 'Cum']);
    expect(onerilenGunler(1)).toEqual(['Pzt']);
    expect(onerilenGunler(7)).toHaveLength(7);
    expect(hedefMetni(3)).toBe('Haftada 3 kez');
    expect(hedefMetni(7)).toBe('Her gün');
  });

  it('bu haftanın sayıları, önce ben', () => {
    const x = r({
      katilanlar: [
        { kullanici: 'ali', gunler: ['2026-10-14', '2026-10-19', '2026-10-20', '2026-10-21'] },
        { kullanici: BEN, gunler: ['2026-10-20'] },
      ],
    });
    expect(haftaDurumu(x, BEN, BUGUN)).toEqual([
      { kullanici: BEN, sayi: 1, tamam: false },
      { kullanici: 'ali', sayi: 3, tamam: true },
    ]);
    expect(haftaOzeti(x, BEN, BUGUN, (id) => (id === BEN ? 'Sen' : 'Ali'))).toBe('Sen 1/3 · Ali 3/3 ✓');
    expect(haftaOzeti(r(), BEN, BUGUN, (id) => id)).toBe('Henüz katılan yok');
  });

  it('ajandaya giren kart seçilen günlerde görünür', () => {
    const k = rutinKarti('k1', r(), ['Pzt', 'Çar', 'Cum'], BUGUN);
    expect(rutinBagCoz(k.bag)).toBe('r1');
    expect(kaynakEtiketi(k, new Map())).toBe('Grup: Aile');
    expect(gorunurMu(k, '2026-10-21', BUGUN)).toBe(true);
    expect(gorunurMu(k, '2026-10-22', BUGUN)).toBe(false);
    expect(gorunurMu(k, '2026-10-23', BUGUN)).toBe(true);
    expect(rutinKarti('k2', r(), ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], BUGUN).tekrar?.gunler).toBeNull();
  });

  it('rutin yoksa ya da katılmıyorsam dizisi biter', () => {
    const kartlar = [
      { id: 'a', bag: 'rutin:r1' },
      { id: 'b', bag: 'rutin:r2' },
      { id: 'c', bag: 'rutin:r3' },
      { id: 'd', bag: 'bulusma:x|2026-10-21|' },
      { id: 'e', bag: null },
    ];
    const rutinler = [r({ katilanlar: [{ kullanici: BEN, gunler: [] }] }), r({ id: 'r2' })];
    expect(bitecekKartlar(kartlar, rutinler, BEN)).toEqual(['b', 'c']);
  });

  it('işaret farkı: telefon doğrudur, aralık dışına dokunulmaz', () => {
    const yerel = new Set(['2026-10-19', '2026-10-21', '2026-10-01']);
    const sunucu = ['2026-10-19', '2026-10-20', '2026-10-02'];
    expect(isaretFarki(yerel, sunucu, '2026-10-12', BUGUN)).toEqual({ ekle: ['2026-10-21'], sil: ['2026-10-20'] });
  });

  it('form hatası', () => {
    expect(rutinFormuHatasi(' ', ['Pzt'])).toBe('Rutine bir ad ver.');
    expect(rutinFormuHatasi('Yürüyüş', [])).toBe('En az bir gün seç.');
    expect(rutinFormuHatasi('Yürüyüş', null)).toBeNull();
  });
});
