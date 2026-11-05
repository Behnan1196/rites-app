import { ajandadaMi, aliskanlikMi, ilerleme, kisaGidisat, sonGunler, surenAliskanlikMi } from '../aliskanlik';
import { yeniKart } from '../kart';

const herGun = { gunSayisi: null, gunler: null, desen: 'hergun' as const };

describe('Alışkanlıklar (P-78)', () => {
  it('alışkanlık: tekrarlı ve seçilmiş ya da programın kartı', () => {
    expect(aliskanlikMi({ tekrar: herGun, aliskanlik: true, planId: null, bag: null })).toBe(true);
    expect(aliskanlikMi({ tekrar: herGun, aliskanlik: false, planId: 'p', bag: null })).toBe(true);
    expect(aliskanlikMi({ tekrar: herGun, aliskanlik: false, planId: null, bag: null })).toBe(false);
    expect(aliskanlikMi({ tekrar: null, aliskanlik: true, planId: null, bag: null })).toBe(false);
  });

  it('ajandada: alışkanlık varsayılan olarak görünmez; seçilirse görünür; öbürleri hep görünür', () => {
    const a = { tekrar: herGun, aliskanlik: true, planId: null, bag: null };
    expect(ajandadaMi({ ...a, ajandada: null })).toBe(false);
    expect(ajandadaMi({ ...a, ajandada: true })).toBe(true);
    expect(ajandadaMi({ ...a, aliskanlik: false, ajandada: false })).toBe(true);
  });

  it('gidişat: şerit, ilerleme, kısa yazı', () => {
    const k = yeniKart('k', { baslik: 'Su', tarih: '2026-10-20', tekrar: { ...herGun, gunSayisi: 21 } });
    const yapilan = new Set(['2026-10-29', '2026-10-30', '2026-10-31']);
    const s = sonGunler(k, yapilan, '2026-10-31', 14);
    expect(s).toHaveLength(14);
    expect(s[0]!.durum).toBe('yok');
    expect(s.at(-1)).toEqual({ gun: '2026-10-31', durum: 'yapildi' });
    expect(ilerleme(k, '2026-10-31')).toEqual({ gun: 12, toplam: 21 });
    expect(kisaGidisat(k, yapilan, '2026-10-31', 3)).toBe('3 gün üst üste · 12/21. gün');
    expect(kisaGidisat({ ...k, tekrar: herGun }, new Set(), '2026-10-31', 0)).toBe('Henüz başlamadı');
  });
});

describe('Süren alışkanlık (P-78)', () => {
  it('süresi biten sürmez; haftanın bir günü olan sürer', () => {
    const k = yeniKart('k', { baslik: 'Su', tarih: '2026-10-01', tekrar: { ...herGun, gunSayisi: 7 } });
    expect(surenAliskanlikMi(k, '2026-10-31')).toBe(false);
    const p = yeniKart('p', {
      baslik: 'Yüzme',
      tarih: '2026-10-01',
      tekrar: { gunSayisi: null, gunler: ['Paz'], desen: null },
    });
    expect(surenAliskanlikMi(p, '2026-10-27')).toBe(true);
  });
});

describe('P-91: Ölçümlerim', () => {
  it('alışkanlık değil; varsayılan olarak ajandada görünmez, istenirse görünür', () => {
    const k = { tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' as const }, planId: null, bag: null };
    expect(aliskanlikMi({ ...k, olcumlerim: true })).toBe(false);
    expect(ajandadaMi({ ...k, olcumlerim: true, ajandada: null })).toBe(false);
    expect(ajandadaMi({ ...k, olcumlerim: true, ajandada: true })).toBe(true);
  });
});
