import { yeniKart, type Blok } from '../kart';
import { kalanMetni, karttanListeler, paylasimdanYerele, tasinacakMi, yerelListeMi } from '../yerelListe';

type B = Pick<Blok, 'id' | 'tur' | 'ad' | 'maddeler' | 'durum'>;
const blok = (o: Partial<B>): B => ({
  id: 'b1',
  tur: 'adimlar',
  ad: '',
  maddeler: ['a', 'b', 'c'],
  durum: undefined,
  ...o,
});

describe('Listelerim (P-58)', () => {
  it('yalnız listeden ibaret tek seferlik kart taşınır', () => {
    const k = yeniKart('k', { baslik: 'Bahçe' });
    expect(tasinacakMi(k, [blok({})])).toBe(true);
    expect(tasinacakMi(k, [blok({}), blok({ tur: 'liste' })])).toBe(true);
    expect(tasinacakMi(k, [blok({}), blok({ tur: 'talimat' })])).toBe(false);
    expect(tasinacakMi(k, [])).toBe(false);
    expect(tasinacakMi({ ...k, tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' } }, [blok({})])).toBe(false);
    expect(tasinacakMi({ ...k, planId: 'p' }, [blok({})])).toBe(false);
  });

  it('maddeler, işaretler ve tarih taşınır', () => {
    const k = { baslik: 'Taşınma', kisa: '<html><p>Kutular</p></html>', tarih: '2026-11-05' };
    const l = karttanListeler(
      k,
      [blok({ durum: { yapilan: ['2026-10-20', null, null], bitti: null, oncekiBitis: null } })],
      {},
      '2026-10-27',
    );
    expect(l).toEqual([
      {
        ad: 'Taşınma',
        aciklama: 'Kutular',
        maddeler: [
          { metin: 'a', yapildi: true, tarih: null },
          { metin: 'b', yapildi: false, tarih: '2026-11-05' },
          { metin: 'c', yapildi: false, tarih: '2026-11-05' },
        ],
      },
    ]);
    const gecmis = karttanListeler(
      { ...k, tarih: '2026-10-01' },
      [blok({ tur: 'liste', ad: 'Mutfak' })],
      { b1: [false, true] },
      '2026-10-27',
    );
    expect(gecmis[0]!.ad).toBe('Taşınma · Mutfak');
    expect(gecmis[0]!.maddeler.map((m) => [m.yapildi, m.tarih])).toEqual([
      [false, null],
      [true, null],
      [false, null],
    ]);
  });

  it('kimlik ve kalan metni', () => {
    expect(yerelListeMi('y-abc')).toBe(true);
    expect(yerelListeMi('1234-uuid')).toBe(false);
    expect(kalanMetni([])).toBe('Boş');
    expect(kalanMetni([{ yapildi: true }])).toBe('Hepsi tamam');
    expect(kalanMetni([{ yapildi: false }, { yapildi: true }])).toBe('1 kalan');
  });

  it('P-60: paylaşmayı bırakınca: sıra korunur, başkasına verilen maddenin tarihi düşer', () => {
    const m = (metin: string, sira: number, kime: string | null, tarih: string | null, yapildi = false) => ({
      metin,
      sira,
      kime,
      tarih,
      yapildi,
    });
    expect(
      paylasimdanYerele(
        [m('c', 3, 'ali', '2026-11-01'), m('a', 1, null, '2026-11-02', true), m('b', 2, 'ben', '2026-11-03')],
        'ben',
      ),
    ).toEqual([
      { metin: 'a', yapildi: true, tarih: '2026-11-02' },
      { metin: 'b', yapildi: false, tarih: '2026-11-03' },
      { metin: 'c', yapildi: false, tarih: null },
    ]);
  });
});
