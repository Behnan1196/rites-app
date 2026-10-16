import { adimDurumu, adimiDegistir, adimlariEsle, hepsiYapildiMi, ilerlemeMetni } from '../adimlar';

describe('Proje adımları', () => {
  it('durum adım sayısına göre düzeltilir', () => {
    expect(adimDurumu(null, 2)).toEqual({ yapilan: [null, null], bitti: null, oncekiBitis: null });
    expect(adimDurumu({ yapilan: ['2026-10-16', 5, null, 'x'] }, 3).yapilan).toEqual(['2026-10-16', null, null]);
  });
  it('düzenlemede yapılanlar metne göre taşınır', () => {
    const eski = adimDurumu({ yapilan: ['2026-10-14', null, '2026-10-15'] }, 3);
    expect(adimlariEsle(['A', 'B', 'C'], eski, ['C', 'Yeni', 'A']).yapilan).toEqual(['2026-10-15', null, '2026-10-14']);
  });
  it('son adım bitince kart etkisi; tekrarlıda bitiş', () => {
    const d = adimDurumu({ yapilan: ['2026-10-14', null] }, 2);
    const tek = adimiDegistir(d, 1, true, '2026-10-16', { tekrar: null, bitis: null });
    expect(tek.etki).toEqual({ tur: 'bitti', gun: '2026-10-16', bitis: undefined });
    expect(hepsiYapildiMi(tek.durum)).toBe(true);
    expect(ilerlemeMetni(tek.durum)).toBe('2 / 2 adım');
    const tekrar = { gunSayisi: null, gunler: null, desen: 'hergun' as const };
    const t = adimiDegistir(d, 1, true, '2026-10-16', { tekrar, bitis: '2026-12-01' });
    expect(t.etki).toEqual({ tur: 'bitti', gun: '2026-10-16', bitis: '2026-10-16' });
    expect(t.durum.oncekiBitis).toBe('2026-12-01');
    expect(adimiDegistir(t.durum, 0, false, '2026-10-18', { tekrar, bitis: '2026-10-16' }).etki).toEqual({
      tur: 'geriAlindi',
      gun: '2026-10-16',
      bitis: '2026-12-01',
    });
  });
  it('ara adımlarda etki yok', () => {
    const d = adimDurumu(null, 3);
    expect(adimiDegistir(d, 0, true, '2026-10-16', { tekrar: null, bitis: null }).etki).toBeNull();
  });
});
