import { enUzunSeri, gorunurMu, seri, seriMetni, son7Gun, tekrarMetni } from '../gorunurluk';
import { yeniKart, type Kart, type Tekrar } from '../kart';
import { gunAraligi } from '../tarih';

const BUGUN = '2026-10-12'; // Pazartesi
const her = (t: Partial<Tekrar> = {}): Tekrar => ({ gunSayisi: null, gunler: null, desen: null, ...t });
const kart = (alanlar: Partial<Kart> = {}) => yeniKart('k1', { baslik: 'Deneme', ...alanlar });

describe('gorunurMu (05 §1)', () => {
  it('tarihsiz adım hiçbir gün görünmez', () => {
    const k = kart({ tarihsiz: true, tarih: null });
    expect(gorunurMu(k, BUGUN, BUGUN)).toBe(false);
    expect(gorunurMu(k, '2026-10-13', BUGUN)).toBe(false);
  });

  it('tek seferlik kart yalnız kendi gününde görünür; tarihi yoksa bugün', () => {
    const k = kart({ tarih: '2026-10-14' });
    expect(gorunurMu(k, '2026-10-14', BUGUN)).toBe(true);
    expect(gorunurMu(k, '2026-10-13', BUGUN)).toBe(false);
    const tarihsizOlmayan = kart({ tarih: null });
    expect(gorunurMu(tarihsizOlmayan, BUGUN, BUGUN)).toBe(true);
    expect(gorunurMu(tarihsizOlmayan, '2026-10-13', BUGUN)).toBe(false);
  });

  it('başlangıçtan önce görünmez', () => {
    const k = kart({ tarih: '2026-10-10', tekrar: her() });
    expect(gorunurMu(k, '2026-10-09', BUGUN)).toBe(false);
    expect(gorunurMu(k, '2026-10-10', BUGUN)).toBe(true);
  });

  it('"Pzt Çar Cum" kartı Salı görünmez', () => {
    const k = kart({ tarih: '2026-10-05', tekrar: her({ gunler: ['Pzt', 'Çar', 'Cum'] }) });
    expect(gorunurMu(k, '2026-10-12', BUGUN)).toBe(true); // Pzt
    expect(gorunurMu(k, '2026-10-13', BUGUN)).toBe(false); // Sal
    expect(gorunurMu(k, '2026-10-14', BUGUN)).toBe(true); // Çar
  });

  it('"30 gün" kartı 31. gün görünmez (başlangıç dahil 30 gün)', () => {
    const k = kart({ tarih: '2026-10-01', tekrar: her({ gunSayisi: 30 }) });
    expect(gorunurMu(k, '2026-10-30', BUGUN)).toBe(true); // 30. gün
    expect(gorunurMu(k, '2026-10-31', BUGUN)).toBe(false); // 31. gün
  });

  it('bitiş sonrası görünmez', () => {
    const k = kart({ tarih: '2026-10-01', tekrar: her(), bitis: '2026-10-11' });
    expect(gorunurMu(k, '2026-10-11', BUGUN)).toBe(true);
    expect(gorunurMu(k, '2026-10-12', BUGUN)).toBe(false);
  });

  it('atlanan gün görünmez', () => {
    const k = kart({ tarih: '2026-10-01', tekrar: her(), atlanan: ['2026-10-05'] });
    expect(gorunurMu(k, '2026-10-05', BUGUN)).toBe(false);
    expect(gorunurMu(k, '2026-10-06', BUGUN)).toBe(true);
  });

  it('hafta içi / hafta sonu desenleri', () => {
    const ici = kart({ tarih: '2026-10-01', tekrar: her({ desen: 'haftaici' }) });
    const sonu = kart({ tarih: '2026-10-01', tekrar: her({ desen: 'haftasonu' }) });
    expect(gorunurMu(ici, '2026-10-16', BUGUN)).toBe(true); // Cum
    expect(gorunurMu(ici, '2026-10-17', BUGUN)).toBe(false); // Cmt
    expect(gorunurMu(sonu, '2026-10-17', BUGUN)).toBe(true);
    expect(gorunurMu(sonu, '2026-10-18', BUGUN)).toBe(true); // Paz
    expect(gorunurMu(sonu, '2026-10-19', BUGUN)).toBe(false);
  });

  it('gün sayısı ve gün listesi birlikte', () => {
    const k = kart({ tarih: '2026-10-12', tekrar: her({ gunSayisi: 7, gunler: ['Pzt', 'Per'] }) });
    const gorunenler = gunAraligi('2026-10-12', '2026-10-25').filter((g) => gorunurMu(k, g, BUGUN));
    expect(gorunenler).toEqual(['2026-10-12', '2026-10-15']);
  });
});

describe('tekrarMetni (05 §1.4)', () => {
  it('örneklerdeki metinler', () => {
    expect(tekrarMetni(her())).toBe('Her gün');
    expect(tekrarMetni(her({ gunler: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] }))).toBe('Her gün');
    expect(tekrarMetni(her({ gunler: ['Cum', 'Pzt', 'Çar'] }))).toBe('Pzt Çar Cum');
    expect(tekrarMetni(her({ gunSayisi: 30 }))).toBe('30 gün');
    expect(tekrarMetni(her({ gunSayisi: 30, gunler: ['Per', 'Pzt'] }))).toBe('30 gün · Pzt Per');
  });
  it('desenler', () => {
    expect(tekrarMetni(her({ desen: 'haftaici' }))).toBe('Hafta içi');
    expect(tekrarMetni(her({ desen: 'hergun', gunSayisi: 10 }))).toBe('10 gün');
  });
});

describe('seri (05 §3)', () => {
  const pztCarCum = kart({ tarih: '2026-09-28', tekrar: her({ gunler: ['Pzt', 'Çar', 'Cum'] }) });

  it('kartın olmadığı günler seriyi bozmaz', () => {
    // 5 Pzt, 7 Çar, 9 Cum yapıldı; bugün (12 Pzt) yapıldı → 4
    const yapilan = new Set(['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12']);
    expect(seri(pztCarCum, yapilan, BUGUN)).toBe(4);
  });

  it('bugün yapılmadıysa dünden başlar (seri bozulmuş sayılmaz)', () => {
    const yapilan = new Set(['2026-10-05', '2026-10-07', '2026-10-09']);
    expect(seri(pztCarCum, yapilan, BUGUN)).toBe(3);
  });

  it('görünür olup yapılmamış ilk günde durur', () => {
    const yapilan = new Set(['2026-10-05', '2026-10-09']); // 7 Çar yapılmadı
    expect(seri(pztCarCum, yapilan, BUGUN)).toBe(1);
  });

  it('başlangıçtan önceye gitmez', () => {
    const k = kart({ tarih: '2026-10-10', tekrar: her() });
    const yapilan = new Set(['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(seri(k, yapilan, BUGUN)).toBe(2);
  });

  it('tekrarsız kartta 0; yeni kartta 0', () => {
    expect(seri(kart({ tarih: BUGUN }), new Set([BUGUN]), BUGUN)).toBe(0);
    expect(seri(kart({ tarih: BUGUN, tekrar: her() }), new Set(), BUGUN)).toBe(0);
  });

  it('seri her zaman bugüne göre (açılan güne bağlı değil)', () => {
    const k = kart({ tarih: '2026-10-01', tekrar: her() });
    const yapilan = new Set(gunAraligi('2026-10-01', '2026-10-11'));
    expect(seri(k, yapilan, BUGUN)).toBe(11);
  });

  it('metin ve en uzun seri', () => {
    expect(seriMetni(4)).toBe('Seri: 4 gün üst üste');
    expect(seriMetni(0)).toBe('Seri henüz başlamadı');
    expect(enUzunSeri([2, 7, 3])).toBe(7);
    expect(enUzunSeri([])).toBe(0);
  });
});

describe('son 7 gün şeridi (K-13)', () => {
  it('açılan gün en sağda; ✓ – · ve gelecek', () => {
    const k = kart({ tarih: '2026-09-28', tekrar: her({ gunler: ['Pzt', 'Çar', 'Cum'] }) });
    // Ekran 11: Kayıt 9 Ekim Cuma; Pzt, Çar, Cum yapıldı
    const yapilan = new Set(['2026-10-05', '2026-10-07', '2026-10-09']);
    const serit = son7Gun(k, '2026-10-09', yapilan, BUGUN);
    expect(serit.map((s) => s.gun)).toEqual(gunAraligi('2026-10-03', '2026-10-09'));
    expect(serit.map((s) => s.durum)).toEqual(['yok', 'yok', 'yapildi', 'yok', 'yapildi', 'yok', 'yapildi']);
  });

  it('gelecek günler boş, geçmiş yapılmamışlar –', () => {
    const k = kart({ tarih: '2026-10-01', tekrar: her() });
    const serit = son7Gun(k, '2026-10-14', new Set(['2026-10-12']), BUGUN);
    expect(serit.map((s) => s.durum)).toEqual([
      'yapilmadi', 'yapilmadi', 'yapilmadi', 'yapilmadi', 'yapildi', 'gelecek', 'gelecek',
    ]);
  });
});
