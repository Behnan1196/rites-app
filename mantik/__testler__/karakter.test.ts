import type { Kayit } from '../kart';
import {
  cubukOranlari,
  kisaSure,
  oncekiCevaplar,
  notKartTaslagi,
  olcumGecmisi,
  olcumSayisi,
  seriSayilirMi,
  seriVarsayilani,
  sonYediGunMetni,
} from '../karakter';

const tekrar = { gunSayisi: null, gunler: null, desen: 'hergun' as const };
const kayit = (tarih: string, deger?: string): Kayit => ({
  kartId: 'k',
  tarih,
  yapildi: true,
  degerler: deger === undefined ? {} : { o: deger },
  isaretler: {},
  fotolar: {},
});

describe('kartın karakteri', () => {
  it('seri: tekrarlı kartta açık; liste ya da ölçüm varsa kapalı; kişinin seçimi önce gelir', () => {
    expect(seriVarsayilani([])).toBe(true);
    expect(seriVarsayilani([{ tur: 'talimat' }, { tur: 'sayac' }])).toBe(true);
    expect(seriVarsayilani([{ tur: 'liste' }])).toBe(false);
    expect(seriVarsayilani([{ tur: 'olcum' }])).toBe(false);
    expect(seriSayilirMi({ tekrar: null, seriSay: true }, [])).toBe(false);
    expect(seriSayilirMi({ tekrar, seriSay: null }, [])).toBe(true);
    expect(seriSayilirMi({ tekrar, seriSay: undefined }, [{ tur: 'liste' }])).toBe(false);
    expect(seriSayilirMi({ tekrar, seriSay: true }, [{ tur: 'liste' }])).toBe(true);
    expect(seriSayilirMi({ tekrar, seriSay: false }, [])).toBe(false);
  });

  it('son 7 gün metni', () => {
    expect(
      sonYediGunMetni([
        { gun: '2026-10-20', durum: 'yapildi' },
        { gun: '2026-10-21', durum: 'yapilmadi' },
        { gun: '2026-10-22', durum: 'yapildi' },
      ]),
    ).toBe('Son 7 günde 2 kez');
    expect(sonYediGunMetni([{ gun: '2026-10-20', durum: 'yok' }])).toBe('Son 7 günde henüz yok');
  });

  it('ölçüm geçmişi: sayılar, eskiden yeniye, o güne kadar, en çok N', () => {
    expect(olcumSayisi('72,5')).toBe(72.5);
    expect(olcumSayisi(' 80 ')).toBe(80);
    expect(olcumSayisi('120/80')).toBeNull();
    const kayitlar = [
      kayit('2026-10-22', '71,8'),
      kayit('2026-10-20', '72,5'),
      kayit('2026-10-21', 'iyi'),
      kayit('2026-10-23'),
      kayit('2026-10-25', '70'),
    ];
    const g = olcumGecmisi(kayitlar, 'o', '2026-10-24');
    expect(g.map((n) => [n.tarih, n.deger, n.metin])).toEqual([
      ['2026-10-20', 72.5, '72,5'],
      ['2026-10-22', 71.8, '71,8'],
    ]);
    expect(olcumGecmisi(kayitlar, 'o', '2026-10-25', 1).map((n) => n.deger)).toEqual([70]);
  });

  it('çubuk oranları', () => {
    expect(cubukOranlari([])).toEqual([]);
    const o = cubukOranlari([
      { tarih: 'a', deger: 70, metin: '70' },
      { tarih: 'b', deger: 72, metin: '72' },
    ]);
    expect(o[0]).toBeCloseTo(0.15);
    expect(o[1]).toBeCloseTo(1);
    expect(cubukOranlari([{ tarih: 'a', deger: 5, metin: '5' }])).toEqual([0.6]);
  });

  it('not → kart taslağı', () => {
    expect(notKartTaslagi({ id: 'n', metin: ' Süt al ', sesli: false, sesYolu: null })).toEqual({
      baslik: 'Süt al',
      notId: 'n',
    });
    expect(notKartTaslagi({ id: 'n', metin: 'Tarif\nun, şeker', sesli: false, sesYolu: null })).toEqual({
      baslik: 'Tarif',
      metin: 'Tarif\nun, şeker',
      notId: 'n',
    });
    const uzun = 'a'.repeat(70);
    expect(notKartTaslagi({ id: 'n', metin: uzun, sesli: false, sesYolu: null }).baslik).toHaveLength(60);
    expect(notKartTaslagi({ id: 's', metin: '', sesli: true, sesYolu: 'file:///s.m4a' })).toEqual({
      baslik: 'Sesli not',
      sesYolu: 'file:///s.m4a',
      notId: 's',
    });
  });

  it('kısa süre ve önceki cevaplar', () => {
    expect(kisaSure(45)).toBe('45 sn');
    expect(kisaSure(600)).toBe('10 dk');
    expect(kisaSure(5400)).toBe('90 dk');
    const k = (tarih: string, d: string): Kayit => ({
      kartId: 'k',
      tarih,
      yapildi: false,
      degerler: { n: d },
      isaretler: {},
      fotolar: {},
    });
    const c = oncekiCevaplar(
      [k('2026-10-20', 'a'), k('2026-10-22', ' b '), k('2026-10-21', ''), k('2026-10-24', 'bugün')],
      'n',
      '2026-10-24',
    );
    expect(c).toEqual([
      { tarih: '2026-10-22', metin: 'b' },
      { tarih: '2026-10-20', metin: 'a' },
    ]);
  });
});
