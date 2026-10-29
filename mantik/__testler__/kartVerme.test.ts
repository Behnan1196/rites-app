import {
  izinDurumu,
  izinIstekleri,
  son14Gun,
  verilenBagCoz,
  verilenBagi,
  verilenEslemesi,
  verilenKarti,
  verilenOzeti,
  type VerilenKart,
} from '../kartVerme';
import type { KartPaketi } from '../paylasim';

const paket = (o: Partial<KartPaketi> = {}): KartPaketi => ({
  surum: 1,
  baslik: 'Yatağını topla',
  kisa: '',
  saat: '08:00',
  tekrar: { gunSayisi: 21, gunler: null, desen: null },
  bloklar: [{ tur: 'talimat', ad: '', metin: 'Yorganı düzelt', birim: '', dakika: null, maddeler: [] }],
  ...o,
});
const v = (o: Partial<VerilenKart> = {}): VerilenKart => ({
  id: 'v1',
  veren: 'anne',
  alan: 'elif',
  kart: paket(),
  baslangic: '2026-10-26',
  durum: 'aktif',
  olusturma: '2026-10-26T08:00:00Z',
  yapilan: [],
  ...o,
});

describe('Kart verme (P-62)', () => {
  it('bağ', () => {
    expect(verilenBagCoz(verilenBagi('abc'))).toBe('abc');
    expect(verilenBagCoz('is:abc')).toBeNull();
    expect(verilenBagCoz(null)).toBeNull();
  });

  it('izinler benim açımdan', () => {
    const izinler = [
      { sahip: 'elif', yetkili: 'anne', durum: 'izinli' as const },
      { sahip: 'anne', yetkili: 'elif', durum: 'istek' as const },
    ];
    expect(izinDurumu(izinler, 'anne', 'elif')).toEqual({ benimAjandama: 'istek', onunAjandasina: 'izinli' });
    expect(izinIstekleri(izinler, 'anne')).toHaveLength(1);
    expect(izinIstekleri(izinler, 'elif')).toHaveLength(0);
  });

  it('ajandaya düşen kart kilitli, tarihli, verenin adıyla', () => {
    let n = 0;
    const { kart, bloklar } = verilenKarti(v(), 'Annem', () => `k${++n}`);
    expect(kart).toMatchObject({
      baslik: 'Yatağını topla',
      tarih: '2026-10-26',
      saat: '08:00',
      kaynak: 'koc',
      gelenKimden: 'Annem',
      kilitli: true,
      bag: 'verilen:v1',
    });
    expect(bloklar.map((b) => [b.tur, b.metin, b.dosya])).toEqual([['talimat', 'Yorganı düzelt', null]]);
  });

  it('eşleme: ekle, sil, yaptım, geri', () => {
    const sunucu = [
      v({ id: 'a', yapilan: ['2026-10-26'] }),
      v({ id: 'b' }),
      v({ id: 'c', durum: 'birakildi' }),
      v({ id: 'd', alan: 'baskasi' }),
    ];
    const yerel = [
      { id: 'ka', bag: 'verilen:a', yapilan: ['2026-10-27', '2026-10-20'] },
      { id: 'kc', bag: 'verilen:c', yapilan: [] },
      { id: 'kx', bag: 'verilen:x', yapilan: [] },
      { id: 'kis', bag: 'is:1', yapilan: [] },
    ];
    const f = verilenEslemesi(yerel, sunucu, 'elif');
    expect(f.ekle.map((x) => x.id)).toEqual(['b']);
    expect(f.sil).toEqual(['kc', 'kx']);
    // Başlangıçtan önceki gün sayılmaz.
    expect(f.yaptim).toEqual([{ kart: 'a', gun: '2026-10-27' }]);
    expect(f.geri).toEqual([{ kart: 'a', gun: '2026-10-26' }]);
  });

  it('aynı verilen kartın iki kopyası olursa fazlası silinir', () => {
    const f = verilenEslemesi(
      [
        { id: 'k1', bag: 'verilen:a', yapilan: [] },
        { id: 'k2', bag: 'verilen:a', yapilan: [] },
      ],
      [v({ id: 'a' })],
      'elif',
    );
    expect(f.sil).toEqual(['k2']);
    expect(f.ekle).toEqual([]);
  });

  it('verenin özeti', () => {
    const bugun = '2026-10-29';
    expect(verilenOzeti(v({ yapilan: ['2026-10-26', '2026-10-28'] }), bugun)).toBe('Bu hafta 2/4');
    expect(verilenOzeti(v({ durum: 'birakildi' }), bugun)).toBe('Bıraktı');
    expect(verilenOzeti(v({ kart: paket({ tekrar: null }), baslangic: '2026-10-29' }), bugun)).toBe('Bekliyor');
    expect(verilenOzeti(v({ kart: paket({ tekrar: null }), yapilan: ['2026-10-29'] }), bugun)).toBe('Yapıldı');
    expect(verilenOzeti(v({ baslangic: '2026-11-02' }), bugun)).toBe('Başlamadı');
    const serit = son14Gun(v({ yapilan: ['2026-10-27'] }), bugun);
    expect(serit).toHaveLength(14);
    expect(serit.filter((s) => s.durum !== 'yok').map((s) => s.durum)).toEqual([
      'yapilmadi',
      'yapildi',
      'yapilmadi',
      'yapilmadi',
    ]);
  });
});
