import { kutuAcikMi, kutulariSirala, kutuSirasi, kutuTasi, hazirKutular } from '../giris';
import { sonYedekMetni, yedekDosyaAdi, yedekSorunu, yollariCevir } from '../yedek';

const BUGUN = '2026-10-13';

describe('Giriş kutuları (G-7, 05 §10)', () => {
  it('varsayılan sıra, hepsi açık', () => {
    expect(kutuSirasi(null).map((a) => a.k)).toEqual([
      'not',
      'gelenler',
      'bugun',
      'animsatici',
      'devam',
      'olcum',
      'soru',
      'su',
      'ortak',
    ]);
    expect(kutuSirasi(null).every((a) => a.acik)).toBe(true);
  });
  it('kayıtlı sıra korunur; bilinmeyen atılır, yeni kutu sona açık eklenir', () => {
    const s = kutuSirasi([
      { k: 'devam', acik: false },
      { k: 'koc' as never, acik: true },
      { k: 'not', acik: true },
    ]);
    expect(s.slice(0, 3)).toEqual([
      { k: 'devam', acik: false },
      { k: 'not', acik: true },
      { k: 'gelenler', acik: true },
    ]);
    expect(s).toHaveLength(9);
    expect(kutuAcikMi(s, 'devam')).toBe(false);
  });
  it('yalnız yazılmış kutular ayarda; ↑ ↓ görünen komşuyla yer değiştirir', () => {
    const s = kutuSirasi(null);
    expect(hazirKutular(s).map((a) => a.k)).toEqual([
      'not',
      'gelenler',
      'animsatici',
      'devam',
      'olcum',
      'ortak',
    ]);
    const t = kutuTasi(s, 'animsatici', 1);
    // animsatici, görünen komşusu devam ile yer değiştirir; görünmeyenler (soru, su) yerinde kalır.
    expect(t.map((a) => a.k)).toEqual([
      'not',
      'gelenler',
      'bugun',
      'devam',
      'animsatici',
      'olcum',
      'soru',
      'su',
      'ortak',
    ]);
    expect(hazirKutular(t).map((a) => a.k)).toEqual([
      'not',
      'gelenler',
      'devam',
      'animsatici',
      'olcum',
      'ortak',
    ]);
    // Son görünen aşağı inemez, ilk görünen yukarı çıkamaz.
    expect(kutuTasi(t, 'ortak', 1)).toEqual(t);
    expect(kutuTasi(s, 'not', -1)).toEqual(s);
  });
  it('sürükleyerek sıralama: görünmeyenler yerinde kalır', () => {
    const s = kutuSirasi(null).map((a) => (a.k === 'gelenler' ? { ...a, acik: false } : a));
    const t = kutulariSirala(s, ['devam', 'not', 'gelenler', 'animsatici', 'olcum', 'ortak']);
    expect(t.map((a) => a.k)).toEqual([
      'devam',
      'not',
      'bugun',
      'gelenler',
      'animsatici',
      'olcum',
      'soru',
      'su',
      'ortak',
    ]);
    expect(t.find((a) => a.k === 'gelenler')?.acik).toBe(false);
    expect(kutulariSirala(s, ['not'])).toEqual(s);
  });
});

describe('yedek (PR-2, 10 madde 10)', () => {
  it('metinler', () => {
    expect(yedekDosyaAdi(BUGUN)).toBe('rites-yedek-2026-10-13.json');
    expect(sonYedekMetni(null, BUGUN)).toBe('Henüz yedek almadın.');
    expect(sonYedekMetni(BUGUN, BUGUN)).toBe('Son yedek: 13 Ekim (bugün)');
    expect(sonYedekMetni('2026-10-04', BUGUN)).toBe('Son yedek: 4 Ekim (9 gün önce)');
  });
  it('dosya denetimi', () => {
    expect(yedekSorunu({ bicim: 'rites-yedek', surum: 5, tablolar: {} }, 5)).toBeNull();
    expect(yedekSorunu({ bicim: 'rites-yedek', surum: 6, tablolar: {} }, 5)).toBe('yeni');
    expect(yedekSorunu({ foo: 1 }, 5)).toBe('bicim');
    expect(yedekSorunu(null, 5)).toBe('bicim');
  });
  it('dosya yolları yeni klasöre çevrilir (JSON içinde de)', () => {
    const eski = 'file:///eski/Documents/dosyalar';
    const yeni = 'file:///yeni/Documents/dosyalar/';
    const s = yollariCevir(
      [{ dosya: `${eski}/a.jpg`, fotolar: JSON.stringify({ b1: `${eski}/b.jpg` }), sayi: 3, bos: null }],
      eski,
      yeni,
    );
    expect(s[0]).toEqual({
      dosya: `${yeni}a.jpg`,
      fotolar: JSON.stringify({ b1: `${yeni}b.jpg` }),
      sayi: 3,
      bos: null,
    });
  });
});
