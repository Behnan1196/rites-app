import { kaynakEtiketi } from '../kaynak';
import {
  eylemEtiketi,
  grubunIsleri,
  isBagCoz,
  isDurumMetni,
  isEslemesi,
  isEylemleri,
  isKarti,
  type GrupIsi,
} from '../isler';

const BEN = 'ben';
const ad = (id: string) => ({ ali: 'Ali', elif: 'Elif' })[id] ?? id;
const i = (d: Partial<GrupIsi> = {}): GrupIsi => ({
  id: 'i1',
  grup: 'g1',
  grupAdi: 'Aile',
  isteyen: 'ali',
  baslik: 'Eczaneye uğra',
  tarih: null,
  kime: null,
  durum: 'acik',
  alan: null,
  yapilma: null,
  ...d,
});

describe('grup işi', () => {
  it('durum metinleri', () => {
    expect(isDurumMetni(i(), BEN, ad)).toBe('Herkese açık · isteyen alır');
    expect(isDurumMetni(i({ durum: 'istendi', kime: BEN }), BEN, ad)).toBe('Ali senden istiyor');
    expect(isDurumMetni(i({ durum: 'istendi', kime: 'elif' }), BEN, ad)).toBe('Elif yanıtlayacak');
    expect(isDurumMetni(i({ durum: 'alindi', alan: BEN }), BEN, ad)).toBe('Üstlendin · ajandanda');
    expect(isDurumMetni(i({ durum: 'alindi', alan: BEN, kime: BEN }), BEN, ad)).toBe('Kabul ettin · ajandanda');
    expect(isDurumMetni(i({ durum: 'alindi', alan: 'elif' }), BEN, ad)).toBe('Elif üstlendi · ajandasında');
    expect(isDurumMetni(i({ durum: 'alindi', alan: 'elif', kime: 'elif' }), BEN, ad)).toBe('Elif kabul etti · ajandasında');
    expect(isDurumMetni(i({ durum: 'reddedildi', kime: 'elif' }), BEN, ad)).toBe('Elif kabul etmedi');
    expect(isDurumMetni(i({ durum: 'yapildi', alan: 'elif' }), BEN, ad)).toBe('Elif tamamladı ✓');
    expect(isDurumMetni(i({ durum: 'yapildi', alan: BEN }), BEN, ad)).toBe('Tamamladın ✓');
  });

  it('eylemler duruma ve kişiye göre', () => {
    expect(isEylemleri(i(), BEN)).toEqual(['al']);
    expect(isEylemleri(i({ durum: 'istendi', kime: BEN }), BEN)).toEqual(['al', 'reddet']);
    expect(eylemEtiketi(i({ durum: 'istendi', kime: BEN }), 'al')).toBe('Kabul et');
    expect(eylemEtiketi(i(), 'al')).toBe('Ben alırım');
    expect(isEylemleri(i({ durum: 'istendi', kime: 'elif' }), BEN)).toEqual([]);
    expect(isEylemleri(i({ durum: 'alindi', alan: BEN }), BEN)).toEqual(['yaptim', 'birak']);
    expect(isEylemleri(i({ durum: 'yapildi', alan: BEN }), BEN)).toEqual(['geri']);
  });

  it('grup ekranında sıra: bende olanlar, açıklar, öbürleri, yapılanlar', () => {
    const l = [
      i({ id: 'yapildi', durum: 'yapildi', alan: 'ali' }),
      i({ id: 'baska', durum: 'alindi', alan: 'elif' }),
      i({ id: 'acik' }),
      i({ id: 'benden', durum: 'istendi', kime: BEN }),
      i({ id: 'baska-grup', grup: 'g2' }),
    ];
    expect(grubunIsleri(l, 'g1', BEN).map((x) => x.id)).toEqual(['benden', 'acik', 'baska', 'yapildi']);
  });

  it('kart: tarih yoksa bugün', () => {
    const k = isKarti('k', i(), '2026-10-18');
    expect(k.tarih).toBe('2026-10-18');
    expect(isKarti('k', i({ tarih: '2026-10-25' }), '2026-10-18').tarih).toBe('2026-10-25');
    expect(isBagCoz(k.bag)).toBe('i1');
    expect(kaynakEtiketi(k, new Map())).toBe('Grup: Aile');
  });

  it('eşleme: kart ekle/sil, yaptım/geri sunucuya', () => {
    const isler = [
      i({ id: 'yeni', durum: 'alindi', alan: BEN }),
      i({ id: 'bitti', durum: 'alindi', alan: BEN }),
      i({ id: 'gerial', durum: 'yapildi', alan: BEN }),
      i({ id: 'birakildi', durum: 'acik' }),
      i({ id: 'baskasi', durum: 'alindi', alan: 'elif' }),
    ];
    const kartlar = [
      { id: 'k-bitti', bag: 'is:bitti', yapildi: true },
      { id: 'k-gerial', bag: 'is:gerial', yapildi: false },
      { id: 'k-birakildi', bag: 'is:birakildi', yapildi: false },
      { id: 'k-silindi-yapilmis', bag: 'is:yok', yapildi: true },
      { id: 'k-baska', bag: null, yapildi: false },
    ];
    const f = isEslemesi(kartlar, isler, BEN);
    expect(f.ekle.map((x) => x.id)).toEqual(['yeni']);
    expect(f.sil).toEqual(['k-birakildi']);
    expect(f.yaptim).toEqual(['bitti']);
    expect(f.geri).toEqual(['gerial']);
  });
});
