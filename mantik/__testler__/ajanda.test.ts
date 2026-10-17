import {
  bosGunMetni, fazlaMetni, siraDegisikligi, yeniKartSirasi, gunBasligi, gununKartlari, haftaninGunleri, kisaGoreliTarih, oncekiDeger, tamamMetni, yapilanGunler,
} from '../ajanda';
import { bosKayit, yeniKart, type Kayit } from '../kart';

const BUGUN = '2026-10-11'; // Pazar

describe('ajanda yardımcıları', () => {
  it('günün kartları elle verilen sırayla (saate bakılmaz)', () => {
    const a = yeniKart('a', { baslik: 'a', tarih: BUGUN, saat: '12:00', sira: 1 });
    const b = yeniKart('b', { baslik: 'b', tarih: BUGUN, sira: 2 });
    const c = yeniKart('c', { baslik: 'c', tarih: BUGUN, saat: '07:30', sira: 3 });
    const d = yeniKart('d', { baslik: 'd', tarih: BUGUN, sira: 0 });
    const baska = yeniKart('e', { baslik: 'e', tarih: '2026-10-12' });
    expect(gununKartlari([a, b, c, d, baska], BUGUN, BUGUN).map((k) => k.id)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('yeni kartın sırası: saatsiz sona, saatli kendinden sonraki ilk saatlinin önüne', () => {
    const l = [
      { sira: 1, saat: '08:00' },
      { sira: 2, saat: null },
      { sira: 3, saat: '18:00' },
      { sira: 4, saat: null },
    ];
    expect(yeniKartSirasi(l, null)).toBe(5);
    expect(yeniKartSirasi(l, '12:00')).toBe(2.5);
    expect(yeniKartSirasi(l, '07:00')).toBe(0.5);
    expect(yeniKartSirasi(l, '21:00')).toBe(5);
    expect(yeniKartSirasi([], '09:00')).toBe(1);
  });

  it('sürüklenen kartın yeni sırası komşularının ortası; eşitse liste numaralanır', () => {
    const k = (id: string, sira: number) => ({ id, sira });
    expect(siraDegisikligi([k('b', 2), k('a', 1), k('c', 3)], 'a')).toEqual(new Map([['a', 2.5]]));
    expect(siraDegisikligi([k('c', 3), k('a', 1), k('b', 2)], 'c')).toEqual(new Map([['c', 0]]));
    expect(siraDegisikligi([k('b', 2), k('a', 1)], 'a')).toEqual(new Map([['a', 3]]));
    expect(siraDegisikligi([k('a', 1)], 'a')).toEqual(new Map());
    expect(siraDegisikligi([k('b', 2), k('a', 9), k('c', 2)], 'a')).toEqual(new Map([['a', 3], ['c', 4]]));
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
