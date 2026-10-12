import {
  bugun, gecerliGunMu, goreliTarih, gunAraligi, gunEkle, gunFarki, gunKisa, haftaGunu, kisaTarih, uzunTarih,
} from '../tarih';

describe('tarih', () => {
  it('gün ekler; ay, yıl ve artık yıl geçişlerinde doğru', () => {
    expect(gunEkle('2026-10-11', 1)).toBe('2026-10-12');
    expect(gunEkle('2026-10-31', 1)).toBe('2026-11-01');
    expect(gunEkle('2026-12-31', 1)).toBe('2027-01-01');
    expect(gunEkle('2028-02-28', 1)).toBe('2028-02-29');
    expect(gunEkle('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('yaz saati geçişinde gün kaymaz', () => {
    // Avrupa'da 2026 yaz saati 29 Mart, kış saati 25 Ekim'de değişir.
    expect(gunEkle('2026-03-28', 2)).toBe('2026-03-30');
    expect(gunFarki('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('gün farkı', () => {
    expect(gunFarki('2026-10-01', '2026-10-31')).toBe(30);
    expect(gunFarki('2026-10-12', '2026-10-11')).toBe(-1);
  });

  it('haftanın günü Pazartesi 0', () => {
    expect(haftaGunu('2026-10-12')).toBe(0); // Pazartesi
    expect(haftaGunu('2026-10-11')).toBe(6); // Pazar
    expect(gunKisa('2026-10-14')).toBe('Çar');
  });

  it('Türkçe tarih metinleri', () => {
    expect(uzunTarih('2026-10-11')).toBe('11 Ekim Pazar');
    expect(kisaTarih('2026-10-15')).toBe('15 Ekim');
    expect(goreliTarih('2026-10-11', '2026-10-11')).toBe('Bugün');
    expect(goreliTarih('2026-10-12', '2026-10-11')).toBe('Yarın');
    expect(goreliTarih('2026-10-10', '2026-10-11')).toBe('Dün');
    expect(goreliTarih('2026-10-14', '2026-10-11')).toBe('14 Ekim Çarşamba');
  });

  it('bugün yerel saate göre', () => {
    expect(bugun(new Date(2026, 9, 11, 23, 59))).toBe('2026-10-11');
    expect(bugun(new Date(2026, 9, 12, 0, 1))).toBe('2026-10-12');
  });

  it('geçerli gün denetimi', () => {
    expect(gecerliGunMu('2026-10-11')).toBe(true);
    expect(gecerliGunMu('2026-02-30')).toBe(false);
    expect(gecerliGunMu('11.10.2026')).toBe(false);
  });

  it('gün aralığı', () => {
    expect(gunAraligi('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
});
