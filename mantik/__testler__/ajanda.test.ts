import {
  bosGunMetni, fazlaMetni, gunBasligi, gununKartlari, haftaninGunleri, kisaGoreliTarih, oncekiDeger, tamamMetni, yapilanGunler,
} from '../ajanda';
import { bosKayit, yeniKart, type Kayit } from '../kart';

const BUGUN = '2026-10-11'; // Pazar

describe('ajanda yardımcıları', () => {
  it('günün kartları saat sırasıyla, saatsizler sonda', () => {
    const a = yeniKart('a', { baslik: 'a', tarih: BUGUN, saat: '12:00', sira: 1 });
    const b = yeniKart('b', { baslik: 'b', tarih: BUGUN, sira: 2 });
    const c = yeniKart('c', { baslik: 'c', tarih: BUGUN, saat: '07:30', sira: 3 });
    const d = yeniKart('d', { baslik: 'd', tarih: BUGUN, sira: 0 });
    const baska = yeniKart('e', { baslik: 'e', tarih: '2026-10-12' });
    expect(gununKartlari([a, b, c, d, baska], BUGUN, BUGUN).map((k) => k.id)).toEqual(['c', 'a', 'd', 'b']);
  });

  it('hafta Pazartesi başlar', () => {
    expect(haftaninGunleri(BUGUN)).toEqual([
      '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11',
    ]);
    expect(haftaninGunleri('2026-10-12')[0]).toBe('2026-10-12');
  });

  it('başlıklar ve metinler', () => {
    expect(gunBasligi(BUGUN, BUGUN)).toBe('Bugün · 11 Ekim Pazar');
    expect(gunBasligi('2026-10-12', BUGUN)).toBe('Yarın · 12 Ekim Pazartesi');
    expect(gunBasligi('2026-10-10', BUGUN)).toBe('Dün · 10 Ekim Cumartesi');
    expect(gunBasligi('2026-10-14', BUGUN)).toBe('14 Ekim Çarşamba');
    expect(kisaGoreliTarih('2026-10-12', BUGUN)).toBe('Yarın');
    expect(kisaGoreliTarih('2026-10-15', BUGUN)).toBe('15 Ekim');
    expect(tamamMetni(1, 4)).toBe('1 / 4 tamam');
    expect(bosGunMetni(BUGUN, BUGUN)).toBe('Bugün için kart yok');
    expect(bosGunMetni('2026-10-12', BUGUN)).toBe('Bu gün için kart yok');
    expect(tamamMetni(1, 2, 'Sabah planım')).toBe('1 / 2 tamam · Sabah planım');
    expect(bosGunMetni(BUGUN, BUGUN, true)).toBe('Bu kaynaktan kart yok');
    expect(fazlaMetni(2)).toBe('+2 kart daha');
  });

  it('önceki değer: açılan günden önceki en yakın dolu değer', () => {
    const r = (tarih: string, deger?: string): Kayit => ({
      ...bosKayit('k', tarih),
      degerler: deger === undefined ? {} : { b: deger },
    });
    const kayitlar = [r('2026-10-05', '12'), r('2026-10-07', '14'), r('2026-10-08', ' '), r('2026-10-09', '15'), r('2026-10-06')];
    expect(oncekiDeger(kayitlar, 'b', '2026-10-09')).toEqual({ deger: '14', tarih: '2026-10-07' });
    expect(oncekiDeger(kayitlar, 'b', '2026-10-05')).toBeNull();
    expect(oncekiDeger(kayitlar, 'yok', '2026-10-12')).toBeNull();
  });

  it('yapılan günler', () => {
    const kayitlar = [{ ...bosKayit('k', '2026-10-05'), yapildi: true }, bosKayit('k', '2026-10-06')];
    expect(yapilanGunler(kayitlar)).toEqual(new Set(['2026-10-05']));
  });
});
