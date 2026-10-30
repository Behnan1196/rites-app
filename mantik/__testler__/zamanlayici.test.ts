import { alarmPlani } from '../alarm';
import { bildirimPlani, bugununAnimsatmalari, type Animsatici } from '../animsatici';
import {
  bitenBildirimZamanlayicilari,
  geriSayimMetni,
  ilerleme,
  kalanMs,
  parcalardanMs,
  sureParcalari,
  VARSAYILAN_ZAMANLAYICI,
  zamanlayiciAltMetni,
  zamanlayiciAyariCoz,
  zamanlayiciSuresiMetni,
  zamanlayiciSurerMi,
} from '../zamanlayici';

const T0 = Date.parse('2026-10-12T10:00:00.000Z');
const z: Animsatici = {
  id: 'z',
  ad: 'Çay',
  saatler: ['13:05'],
  gunler: [],
  sesli: true,
  erteleDk: 5,
  alarm: true,
  bitis: '2026-10-12T10:05:00.000Z',
  ses: null,
  toplamMs: 300_000,
  duraklama: null,
};

describe('zamanlayıcı', () => {
  it('geri sayım saniyeyi yukarı yuvarlar', () => {
    expect(geriSayimMetni(300_000)).toBe('05:00');
    expect(geriSayimMetni(8_200)).toBe('00:09');
    expect(geriSayimMetni(0)).toBe('00:00');
    expect(geriSayimMetni(3_900_000)).toBe('1:05:00');
  });

  it('süre metni', () => {
    expect(zamanlayiciSuresiMetni(300_000)).toBe('5 dk');
    expect(zamanlayiciSuresiMetni(5_400_000)).toBe('1 sa 30 dk');
    expect(zamanlayiciSuresiMetni(150_000)).toBe('2 dk 30 sn');
    expect(zamanlayiciSuresiMetni(45_000)).toBe('45 sn');
  });

  it('kalan süre ve halka', () => {
    expect(kalanMs(z, T0 + 60_000)).toBe(240_000);
    expect(ilerleme(z, T0 + 60_000)).toBeCloseTo(0.2);
    expect(ilerleme(z, T0 + 400_000)).toBe(1);
    expect(ilerleme({ ...z, toplamMs: null }, T0)).toBeNull();
    const d = { ...z, duraklama: 120_000 };
    expect(kalanMs(d, T0 + 999_999)).toBe(120_000);
    expect(ilerleme(d, T0)).toBeCloseTo(0.6);
  });

  it('sürüyor mu ve alt metin', () => {
    expect(zamanlayiciSurerMi(z, T0)).toBe(true);
    expect(zamanlayiciSurerMi(z, T0 + 300_000)).toBe(false);
    expect(zamanlayiciSurerMi({ ...z, duraklama: 5 }, T0 + 9e9)).toBe(true);
    expect(zamanlayiciAltMetni(z, T0)).toBe('');
    expect(zamanlayiciAltMetni({ ...z, duraklama: 5 }, T0)).toBe('Duraklatıldı');
    expect(zamanlayiciAltMetni(z, T0 + 300_000)).toBe('Süre doldu');
  });

  it('duraklatılmış zamanlayıcı ne çalar ne planlanır', () => {
    const gun = '2026-10-12';
    const d = { ...z, saatler: ['10:05'], duraklama: 120_000 };
    expect(bugununAnimsatmalari([d], [], gun, '10:06')).toEqual([]);
    expect(alarmPlani([d], [], gun, '10:00')).toEqual([]);
    expect(
      bildirimPlani({
        animsaticilar: [{ ...d, alarm: false }],
        gunDurumlari: [],
        kartlar: [],
        bugunYapilanlar: new Set(),
        bugunGun: gun,
        simdi: '10:00',
        simdiMs: T0,
      }),
    ).toEqual([]);
  });
});

describe('Giriş zamanlayıcısının ayarı (P-42, P-70)', () => {
  it('varsayılan: alarm, telefonun sesi, 5 dk', () => {
    expect(zamanlayiciAyariCoz(null)).toEqual(VARSAYILAN_ZAMANLAYICI);
    expect(VARSAYILAN_ZAMANLAYICI).toEqual({ cal: 'alarm', ses: null, sonMs: 300_000 });
  });

  it('bozuk alanlar varsayılana döner; 1 saatten uzun olur, en çok 23:59:59', () => {
    expect(zamanlayiciAyariCoz({ gorunum: 'kadran', cal: 'bildirim', ses: 'can', sonMs: 4_000_000 })).toEqual({
      cal: 'bildirim',
      ses: 'can',
      sonMs: 4_000_000,
    });
    expect(zamanlayiciAyariCoz({ sonMs: 90_400 }).sonMs).toBe(90_000);
    expect(zamanlayiciAyariCoz({ sonMs: 90_000_000 }).sonMs).toBe(300_000);
  });

  it('çarklar: saat, dakika, saniye', () => {
    expect(parcalardanMs(1, 30, 5)).toBe(5_405_000);
    expect(sureParcalari(5_405_000)).toEqual({ sa: 1, dk: 30, sn: 5 });
    expect(parcalardanMs(30, 0, 0)).toBe((24 * 3600 - 1) * 1000);
    expect(geriSayimMetni(5_405_000)).toBe('1:30:05');
  });
});

describe('Bildirimli zamanlayıcı bir kez çalar (P-70)', () => {
  const bitis = new Date(T0).toISOString();
  it('süresi geçen bildirimli zamanlayıcı silinir; alarmlı ve duraklatılmış kalır', () => {
    const liste = [
      { id: 'b', bitis, alarm: false, duraklama: null },
      { id: 'a', bitis, alarm: true, duraklama: null },
      { id: 'd', bitis, alarm: false, duraklama: 60_000 },
      { id: 's', bitis: null, alarm: false, duraklama: null },
    ];
    expect(bitenBildirimZamanlayicilari(liste, T0 + 1000)).toEqual([]);
    expect(bitenBildirimZamanlayicilari(liste, T0 + 6000)).toEqual(['b']);
  });
});
