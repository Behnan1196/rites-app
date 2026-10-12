import { birak, buguneAl, kacGunOnce, kalanlar, kalanlarBasligi } from '../kalanlar';
import { yeniKart, type Kart } from '../kart';

const BUGUN = '2026-10-12';
let n = 0;
const kart = (alanlar: Partial<Kart>) => yeniKart(`k${++n}`, { baslik: `Kart ${n}`, ...alanlar });

describe('geçmişten kalanlar (05 §5)', () => {
  it('yalnız son 7 gündeki (bugün hariç) yapılmamış tek seferlik kartlar', () => {
    const dun = kart({ tarih: '2026-10-11', baslik: 'Elektrik faturasını öde' });
    const yediGunOnce = kart({ tarih: '2026-10-05' });
    const sekizGunOnce = kart({ tarih: '2026-10-04' });
    const bugunku = kart({ tarih: BUGUN });
    const yapilmis = kart({ tarih: '2026-10-10', yapildi: true });
    const birakilmis = kart({ tarih: '2026-10-10', birakildi: true });
    const kilitli = kart({ tarih: '2026-10-10', kilitli: true });
    const tekrarli = kart({ tarih: '2026-10-10', tekrar: { gunSayisi: null, gunler: null, desen: null } });
    const tarihsiz = kart({ tarih: null, tarihsiz: true });
    const sonuc = kalanlar([dun, yediGunOnce, sekizGunOnce, bugunku, yapilmis, birakilmis, kilitli, tekrarli, tarihsiz], BUGUN);
    expect(sonuc.map((k) => k.id)).toEqual([yediGunOnce.id, dun.id]);
  });

  it('eskiden yeniye; aynı günde saate göre, saatsizler sonda', () => {
    const a = kart({ tarih: '2026-10-10' });
    const b = kart({ tarih: '2026-10-10', saat: '09:00' });
    const c = kart({ tarih: '2026-10-09', saat: '20:00' });
    expect(kalanlar([a, b, c], BUGUN).map((k) => k.id)).toEqual([c.id, b.id, a.id]);
  });

  it('başlık ve zaman metni', () => {
    const dun = kart({ tarih: '2026-10-11' });
    const once = kart({ tarih: '2026-10-09' });
    expect(kalanlarBasligi([dun], BUGUN)).toBe('Dünden kalanlar');
    expect(kalanlarBasligi([dun, once], BUGUN)).toBe('Geçmişten kalanlar');
    expect(kacGunOnce('2026-10-11', BUGUN)).toBe('Dün');
    expect(kacGunOnce('2026-10-09', BUGUN)).toBe('3 gün önce');
  });

  it('Bugüne al ve Bırak', () => {
    const k = kart({ tarih: '2026-10-11' });
    expect(buguneAl(k, BUGUN).tarih).toBe(BUGUN);
    expect(kalanlar([buguneAl(k, BUGUN)], BUGUN)).toHaveLength(0);
    const b = birak(k);
    expect(b.birakildi).toBe(true);
    expect(b.tarih).toBe('2026-10-11'); // geçmişte yapılmamış olarak kalır
    expect(kalanlar([b], BUGUN)).toHaveLength(0);
  });
});
