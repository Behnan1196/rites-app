import {
  animsaticiMeta,
  animsatmaDurumu,
  bildirimPlani,
  BILDIRIM_SINIRI,
  bugununAnimsatmalari,
  erteleSaati,
  formHatasi,
  girisOzeti,
  gunleriCoz,
  gunuKapsarMi,
  kalanSureMetni,
  sureMetni,
  idiMetni,
  kalanMetni,
  saatinBildirimleri,
  saatleriSirala,
  type Animsatici,
} from '../animsatici';
import { yeniKart } from '../kart';

const BUGUN = '2026-10-12'; // Pazartesi
const goz: Animsatici = {
  id: 'g',
  ad: 'Göz damlası',
  saatler: ['08:00', '14:00', '20:00'],
  gunler: [0, 1, 2, 3, 4, 5, 6],
  sesli: true,
  erteleDk: 10,
  alarm: false,
  bitis: null,
};
const hs: Animsatici = {
  id: 'h',
  ad: 'Bitki sula',
  saatler: ['10:00'],
  gunler: [5, 6],
  sesli: false,
  erteleDk: 5,
  alarm: false,
  bitis: null,
};

describe('form ve metinler (AN-1)', () => {
  it('ad ve saat zorunlu', () => {
    expect(formHatasi('  ', ['09:00'])).toBe('Neyi anımsatalım? Bir ad yaz.');
    expect(formHatasi('Su iç', [])).toBe('En az bir saat ekle.');
    expect(formHatasi('Su iç', ['09:00'])).toBeNull();
  });
  it('saatler sıralı ve tekil; meta metni', () => {
    expect(saatleriSirala(['21:00', '09:00', '21:00'])).toEqual(['09:00', '21:00']);
    expect(animsaticiMeta(goz)).toBe('Her gün · Bildirim · erteleme 10 dk');
    expect(animsaticiMeta(hs)).toBe('Hafta sonu · Bildirim · erteleme 5 dk');
    expect(animsaticiMeta({ ...hs, gunler: [0, 2, 4] })).toBe('Pzt, Çar, Cum · Bildirim · erteleme 5 dk');
    expect(animsaticiMeta({ ...hs, alarm: true, bitis: '2026-10-12T11:52:00.000Z' })).toBe(
      'Bir kez · Alarm · erteleme 5 dk',
    );
  });
  it('günler', () => {
    expect(gunuKapsarMi({ gunler: [0, 1, 2, 3, 4], bitis: null }, BUGUN)).toBe(true);
    expect(gunuKapsarMi({ gunler: [5, 6], bitis: null }, BUGUN)).toBe(false);
    expect(gunuKapsarMi({ gunler: [5, 6], bitis: null }, '2026-10-18')).toBe(true);
  });
  it('eski gün kayıtları çevrilir; yeni JSON okunur', () => {
    expect(gunleriCoz('hergun')).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(gunleriCoz('haftaici')).toEqual([0, 1, 2, 3, 4]);
    expect(gunleriCoz('haftasonu')).toEqual([5, 6]);
    expect(gunleriCoz('[4,0,2,9]')).toEqual([0, 2, 4]);
    expect(gunleriCoz('bozuk')).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it('süre metinleri ve form hatası', () => {
    expect(sureMetni(20)).toBe('20 dk');
    expect(sureMetni(60)).toBe('1 sa');
    expect(sureMetni(90)).toBe('1 sa 30 dk');
    expect(kalanSureMetni('2026-10-12T10:20:00.000Z', Date.parse('2026-10-12T10:01:30.000Z'))).toBe('19 dk kaldı');
    expect(kalanSureMetni('2026-10-12T10:20:00.000Z', Date.parse('2026-10-12T10:21:00.000Z'))).toBe('şimdi');
    expect(formHatasi('İlaç', ['09:00'], [])).toBe('En az bir gün seç.');
  });
});

describe('bugünün durumları (05 §7)', () => {
  it('öncelik: durduruldu, sırada/ertelendi, şimdi çalıyor (3 × erteleme), geçti', () => {
    expect(animsatmaDurumu(goz, '08:00', false, true, '08:05')).toBe('durduruldu');
    expect(animsatmaDurumu(goz, '20:00', false, false, '14:30')).toBe('sirada');
    expect(animsatmaDurumu(goz, '20:00', true, false, '14:30')).toBe('ertelendi');
    expect(animsatmaDurumu(goz, '14:00', false, false, '14:00')).toBe('caliyor');
    expect(animsatmaDurumu(goz, '14:00', false, false, '14:30')).toBe('caliyor');
    expect(animsatmaDurumu(goz, '14:00', false, false, '14:31')).toBe('gecti');
  });
  it('liste: ertelenen gösterilen saatle sıralanır, hafta sonu anımsatıcısı pazartesi yok', () => {
    const l = bugununAnimsatmalari(
      [goz, hs],
      [{ animsaticiId: 'g', saat: '08:00', durduruldu: false, ertelenenSaat: '14:10' }],
      BUGUN,
      '14:05',
    );
    expect(l.map((m) => [m.saat, m.gosterilen, m.durum, idiMetni(m)])).toEqual([
      ['14:00', '14:00', 'caliyor', ''],
      ['08:00', '14:10', 'ertelendi', '(08:00 idi)'],
      ['20:00', '20:00', 'sirada', ''],
    ]);
    const o = girisOzeti(l);
    expect([o.calan?.saat, o.siradaki?.saat, o.kalan]).toEqual(['14:00', '08:00', 2]);
    expect(kalanMetni(o.kalan)).toBe('bugün 2 kez daha');
    expect(kalanMetni(0)).toBe('bugün bitti');
  });
  it('ertele: max(gösterilen, şimdi) + erteleme; gün içinde kalır', () => {
    expect(erteleSaati('14:00', '14:03', 10)).toBe('14:13');
    expect(erteleSaati('20:00', '14:03', 10)).toBe('20:10');
    expect(erteleSaati('23:55', '23:58', 15)).toBe('23:59');
  });
});

describe('bildirim planı (10: 60 sınırı, 4 bildirim / saat)', () => {
  const temel = { gunDurumlari: [], kartlar: [], bugunYapilanlar: new Set<string>(), bugunGun: BUGUN };
  it('her saat 4 bildirim; geçmiş olanlar atlanır; durdurulan saat planlanmaz', () => {
    const p = bildirimPlani({
      ...temel,
      animsaticilar: [goz],
      gunDurumlari: [{ animsaticiId: 'g', saat: '14:00', durduruldu: true, ertelenenSaat: null }],
      simdi: '08:15',
      gunSayisi: 1,
    });
    expect(p.map((b) => b.saat)).toEqual(['08:20', '08:30', '20:00', '20:10', '20:20', '20:30']);
    expect(p[0]).toMatchObject({ baslik: 'Göz damlası', govde: '08:00', erteleDk: 10, sesli: true });
    expect(p[0]!.veri).toEqual({ tur: 'animsatici', animsaticiId: 'g', gun: BUGUN, saat: '08:00' });
  });
  it('ertelenen saat ertelenen saatten çalar; gece yarısını aşan tekrar ertesi güne geçer', () => {
    const gec: Animsatici = { ...goz, id: 'x', saatler: ['23:50'], erteleDk: 15 };
    const p = bildirimPlani({
      ...temel,
      animsaticilar: [gec],
      gunDurumlari: [{ animsaticiId: 'x', saat: '23:50', durduruldu: false, ertelenenSaat: '23:55' }],
      simdi: '23:51',
      gunSayisi: 1,
    });
    expect(p.map((b) => `${b.gun} ${b.saat}`)).toEqual([
      '2026-10-12 23:55',
      '2026-10-13 00:10',
      '2026-10-13 00:25',
      '2026-10-13 00:40',
    ]);
    expect(p.map((b) => b.id)).toEqual(saatinBildirimleri('x', BUGUN, '23:50'));
  });
  it('kart hatırlatmaları: saatinde / 15 dk / 1 saat önce; bugün yapılan çalmaz', () => {
    const randevu = yeniKart('r', { baslik: 'Diş hekimi', tarih: '2026-10-13', saat: '10:30', hatirlatma: '1sa' });
    const tai = yeniKart('t', {
      baslik: 'Tai chi',
      tarih: '2026-10-01',
      saat: '07:30',
      hatirlatma: '15dk',
      tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
    });
    const gece = yeniKart('n', { baslik: 'Gece', tarih: '2026-10-13', saat: '00:10', hatirlatma: '15dk' });
    const p = bildirimPlani({
      ...temel,
      animsaticilar: [],
      kartlar: [randevu, tai, gece],
      bugunYapilanlar: new Set(['t']),
      simdi: '06:00',
    });
    expect(p.map((b) => [b.gun, b.saat, b.baslik, b.govde])).toEqual([
      ['2026-10-12', '23:55', 'Gece', '15 dk sonra · 00:10'],
      ['2026-10-13', '07:15', 'Tai chi', '15 dk sonra · 07:30'],
      ['2026-10-13', '09:30', 'Diş hekimi', '1 saat sonra · 10:30'],
      ['2026-10-14', '07:15', 'Tai chi', '15 dk sonra · 07:30'],
    ]);
  });
  it('en çok 60 bildirim, yakından uzağa', () => {
    const cok: Animsatici = { ...goz, id: 'c', saatler: ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] };
    const p = bildirimPlani({ ...temel, animsaticilar: [cok], simdi: '00:00' });
    expect(p).toHaveLength(BILDIRIM_SINIRI);
    expect(p[0]!.saat).toBe('06:00');
    expect(p.every((b, i) => i === 0 || `${p[i - 1]!.gun} ${p[i - 1]!.saat}` <= `${b.gun} ${b.saat}`)).toBe(true);
  });
});
