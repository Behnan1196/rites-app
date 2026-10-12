import { ara, aramaMetni, bulunduMetni, haftaBasligi, ilkGorunurGun } from '../arama';
import { yeniKart } from '../kart';

const BUGUN = '2026-10-11'; // Pazar

describe('arama (A-6)', () => {
  const enginar = yeniKart('e', { baslik: 'Zeytinyağlı enginar', kisa: 'Pazar tarifi', tarih: BUGUN, saat: '12:00' });
  const mercimek = yeniKart('m', { baslik: 'Mercimek çorbası', kisa: 'Kış tarifi', tarih: '2026-10-14', saat: '18:30' });
  const eski = yeniKart('o', { baslik: 'Eski TARİF defteri', tarih: '2026-09-01' });
  const tai = yeniKart('t', {
    baslik: 'Tai chi', tarih: '2026-10-01', saat: '07:30',
    tekrar: { gunSayisi: null, gunler: ['Pzt', 'Çar', 'Cum'], desen: null },
  });
  const adim = yeniKart('a', { baslik: 'Tarif kitabını ayıkla', tarih: null, tarihsiz: true });
  const bloklar = new Map([['t', 'Videoyu aç, hareketleri birlikte yap. ISINMA']]);
  const hepsi = [mercimek, adim, enginar, eski, tai];

  it('en az iki harf', () => {
    expect(ara(hepsi, bloklar, 't', BUGUN)).toEqual([]);
    expect(ara(hepsi, bloklar, ' ', BUGUN)).toEqual([]);
  });

  it('Türkçe büyük/küçük harf: "tarif" ↔ "TARİF", "ısınma" ↔ "ISINMA"', () => {
    expect(ara(hepsi, bloklar, 'TARİF', BUGUN).map((s) => s.kart.id)).toEqual(['o', 'e', 'm', 'a']);
    expect(ara(hepsi, bloklar, 'ısınma', BUGUN).map((s) => s.kart.id)).toEqual(['t']);
  });

  it('tekrar metni de aranır', () => {
    expect(ara(hepsi, bloklar, 'pzt çar', BUGUN).map((s) => s.kart.id)).toEqual(['t']);
  });

  it('nerede metni ve sıra: tekrarlılar, tarihliler, tarihsizler', () => {
    const s = ara(hepsi, new Map([['t', 'tarif']]), 'tarif', BUGUN);
    expect(s.map((x) => [x.kart.id, x.nerede, x.gun])).toEqual([
      ['t', 'Tekrarlı · Pzt Çar Cum · 07:30', '2026-10-12'],
      ['o', '1 Eylül Salı', '2026-09-01'],
      ['e', 'Bugün, 11 Ekim Pazar · 12:00', BUGUN],
      ['m', '14 Ekim Çarşamba · 18:30', '2026-10-14'],
      ['a', 'Tarihsiz adım', null],
    ]);
  });

  it('arama metni ve sonuç sayısı', () => {
    expect(aramaMetni(enginar, 'Malzemeler 4 enginar')).toContain('malzemeler');
    expect(bulunduMetni(2)).toBe('2 kart bulundu');
    expect(bulunduMetni(0)).toBe('Bu sözcükle bir kart bulunamadı.');
  });

  it('tekrarlı kartın ilk görünür günü bugünden itibaren', () => {
    expect(ilkGorunurGun(tai, BUGUN)).toBe('2026-10-12');
    const bitmis = { ...tai, bitis: '2026-10-05' };
    expect(ilkGorunurGun(bitmis, BUGUN)).toBe('2026-10-01');
  });
});

describe('hafta başlığı', () => {
  it('aynı ay ve ay geçişi', () => {
    expect(haftaBasligi('2026-10-05')).toBe('5 – 11 Ekim');
    expect(haftaBasligi('2026-09-28')).toBe('28 Eyl – 4 Eki');
    expect(haftaBasligi('2026-12-28')).toBe('28 Ara – 3 Oca');
  });
});
