import { alarmPlani } from '../alarm';
import { bildirimPlani, bugununAnimsatmalari, type Animsatici } from '../animsatici';
import {
  geriSayimMetni,
  ilerleme,
  kalanMs,
  kadranAcisiDakika,
  kadranDegeri,
  kadranDokunusu,
  zamanlayiciAltMetni,
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
  it('kadran: açı dakikaya, tepeden geçerken sıçramaz', () => {
    expect(kadranAcisiDakika(0, -10)).toBeCloseTo(0);
    expect(kadranAcisiDakika(10, 0)).toBeCloseTo(15);
    expect(kadranAcisiDakika(0, 10)).toBeCloseTo(30);
    expect(kadranAcisiDakika(-10, 0)).toBeCloseTo(45);
    expect(kadranDegeri(5, 7.4)).toBe(7);
    expect(kadranDegeri(58, 1)).toBe(60);
    expect(kadranDegeri(60, 2)).toBe(60);
    expect(kadranDegeri(2, 59)).toBe(0);
    expect(kadranDegeri(0, 58)).toBe(0);
    expect(kadranDegeri(50, 44)).toBe(44);
    expect(kadranDokunusu(12.2)).toBe(12);
    expect(kadranDokunusu(59.8)).toBe(60);
    expect(kadranDokunusu(0.3)).toBe(0);
  });

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
