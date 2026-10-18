import { kaynakEtiketi } from '../kaynak';
import {
  nobetBagCoz,
  nobetBagi,
  nobetEslemesi,
  nobetFormuHatasi,
  nobetGunleriMetni,
  nobetIsaretFarki,
  nobetKarti,
  siradaki,
  yaklasanSira,
  type Nobet,
} from '../nobet';

const BEN = 'ben';
const n = (d: Partial<Nobet> = {}): Nobet => ({
  id: 'n1',
  grup: 'g1',
  grupAdi: 'Aile',
  kuran: 'ali',
  ad: 'Çöp',
  gunler: [0, 3], // Pzt, Per
  sira: ['ali', BEN, 'elif'],
  baslangic: '2026-10-19', // Pazartesi
  kayitlar: [],
  ...d,
});

describe('nöbet', () => {
  it('sıra takvime göre döner; yalnız seçilen günler sayılır', () => {
    const x = n();
    expect(siradaki(x, '2026-10-18')).toBeNull(); // başlangıçtan önce
    expect(siradaki(x, '2026-10-19')).toBe('ali'); // Pzt
    expect(siradaki(x, '2026-10-20')).toBeNull(); // Sal: nöbet günü değil
    expect(siradaki(x, '2026-10-22')).toBe(BEN); // Per
    expect(siradaki(x, '2026-10-26')).toBe('elif'); // Pzt
    expect(siradaki(x, '2026-10-29')).toBe('ali'); // Per: baştan
    // 10 hafta sonra: 20 nöbet günü → 20 % 3 = 2 → elif
    expect(siradaki(x, '2026-12-28')).toBe('elif');
  });

  it('başlangıç nöbet günü değilse de doğru sayar', () => {
    const x = n({ baslangic: '2026-10-21' }); // Çarşamba
    expect(siradaki(x, '2026-10-22')).toBe('ali');
    expect(siradaki(x, '2026-10-26')).toBe(BEN);
    expect(siradaki(x, '2026-10-29')).toBe('elif');
  });

  it('her gün: her gün bir sonraki', () => {
    const x = n({ gunler: [0, 1, 2, 3, 4, 5, 6], sira: ['a', 'b'] });
    expect(['2026-10-19', '2026-10-20', '2026-10-21'].map((g) => siradaki(x, g))).toEqual(['a', 'b', 'a']);
    expect(nobetGunleriMetni(x.gunler)).toBe('Her gün');
    expect(nobetGunleriMetni([3, 0])).toBe('Pzt, Per');
  });

  it('yaklaşan sıra yapılanla', () => {
    const x = n({ kayitlar: [{ gun: '2026-10-19', yapan: 'elif' }] });
    expect(yaklasanSira(x, '2026-10-19', 3)).toEqual([
      { gun: '2026-10-19', kim: 'ali', yapan: 'elif' },
      { gun: '2026-10-22', kim: BEN, yapan: null },
      { gun: '2026-10-26', kim: 'elif', yapan: null },
    ]);
  });

  it('ajanda eşlemesi: sırası bende olan günler eklenir, fazlası silinir, geçmişe dokunulmaz', () => {
    const x = n();
    const kartlar = [
      { id: 'tamam', bag: nobetBagi('n1', '2026-10-22'), tarih: '2026-10-22' },
      { id: 'fazla', bag: nobetBagi('n1', '2026-10-26'), tarih: '2026-10-26' },
      { id: 'gecmis', bag: nobetBagi('n1', '2026-10-12'), tarih: '2026-10-12' },
      { id: 'silinmis', bag: nobetBagi('yok', '2026-10-23'), tarih: '2026-10-23' },
      { id: 'cift', bag: nobetBagi('n1', '2026-10-22'), tarih: '2026-10-22' },
      { id: 'baska', bag: null, tarih: '2026-10-22' },
    ];
    const { ekle, sil } = nobetEslemesi(kartlar, [x], BEN, '2026-10-19');
    expect(sil).toEqual(['fazla', 'silinmis', 'cift']);
    // Önümüzdeki 14 gün (19 Ekim – 1 Kasım), Pzt/Per: 19 ali, 22 ben, 26 elif, 29 ali → yalnız 22 (zaten var)
    expect(ekle).toEqual([]);
    // İki gün sonra ufka 2 Kasım (ben) girer
    expect(nobetEslemesi(kartlar, [x], BEN, '2026-10-21').ekle.map((e) => e.gun)).toEqual(['2026-11-02']);
  });

  it('kart: grup kaynağı, bağ', () => {
    const k = nobetKarti('k', n(), '2026-10-22');
    expect(kaynakEtiketi(k, new Map())).toBe('Grup: Aile');
    expect(nobetBagCoz(k.bag)).toEqual({ id: 'n1', gun: '2026-10-22' });
    expect(k.tarih).toBe('2026-10-22');
  });

  it('işaret farkı: başkası yaptıysa yazılmaz; yalnız kendi işaretim geri alınır', () => {
    const kayitlar = [
      { gun: '2026-10-19', yapan: 'elif' },
      { gun: '2026-10-22', yapan: BEN },
    ];
    expect(nobetIsaretFarki(new Set(['2026-10-19', '2026-10-26']), kayitlar, BEN, '2026-10-12', '2026-10-26')).toEqual({
      ekle: ['2026-10-26'],
      sil: ['2026-10-22'],
    });
  });

  it('form hatası', () => {
    expect(nobetFormuHatasi('', [0], ['a'])).toBe('Nöbete bir ad ver.');
    expect(nobetFormuHatasi('Çöp', [], ['a'])).toBe('En az bir gün seç.');
    expect(nobetFormuHatasi('Çöp', [0], [])).toBe('Sıraya en az bir kişi ekle.');
  });
});
