import {
  aralikta, bolmeSecenekleri, bolmeSorusuGerekirMi, duzenle, kayitAnahtarlariniEsle, sil, silmeOnayi,
  type KartIslemi, type KartTanimi,
} from '../bolme';
import { gorunurMu, tekrarMetni } from '../gorunurluk';
import { yeniKart, type Kart, type Tekrar } from '../kart';
import { gunAraligi } from '../tarih';

const BUGUN = '2026-10-12';
const her = (t: Partial<Tekrar> = {}): Tekrar => ({ gunSayisi: null, gunler: null, desen: null, ...t });
const dizi = (alanlar: Partial<Kart> = {}) =>
  yeniKart('eski', { baslik: 'Yürüyüş', tarih: '2026-10-01', saat: '07:30', tekrar: her(), ...alanlar });
const tanim = (k: Kart, d: Partial<KartTanimi> = {}): KartTanimi => ({
  baslik: k.baslik, kisa: k.kisa, tarih: k.tarih, saat: k.saat, hatirlatma: k.hatirlatma, tekrar: k.tekrar, ...d,
});
const idUret = () => {
  let n = 0;
  return () => `yeni${++n}`;
};
const bul = <T extends KartIslemi['tur']>(islemler: KartIslemi[], tur: T) =>
  islemler.filter((i): i is Extract<KartIslemi, { tur: T }> => i.tur === tur);
const gorunenGunler = (k: Kart, ilk: string, son: string) => gunAraligi(ilk, son).filter((g) => gorunurMu(k, g, BUGUN));

describe('soru ne zaman sorulur', () => {
  it('yalnız tekrarlı kart, başlangıcından sonraki bir günden', () => {
    expect(bolmeSorusuGerekirMi(dizi(), '2026-10-12')).toBe(true);
    expect(bolmeSorusuGerekirMi(dizi(), '2026-10-01')).toBe(false); // ilk gün
    expect(bolmeSorusuGerekirMi(yeniKart('t', { baslik: 'x', tarih: '2026-10-12' }), '2026-10-12')).toBe(false);
  });
  it('seçenek metinleri', () => {
    expect(bolmeSecenekleri('2026-10-12')).toEqual({
      yalnizBuGun: 'Yalnız 12 Ekim Pazartesi',
      buGunVeSonrasi: '12 Ekim Pazartesi ve sonrası',
      not: 'Geçmiş günlerin kayıtları değişmez.',
    });
  });
});

describe('düzenleme', () => {
  it('ilk günde ya da tek seferlik kartta değişiklik doğrudan karta uygulanır', () => {
    const k = dizi();
    const s = duzenle(k, '2026-10-01', tanim(k, { saat: '08:00' }), null, idUret());
    expect(s.mesaj).toBeNull();
    expect(s.islemler).toEqual([
      { tur: 'kartGuncelle', kart: { ...k, saat: '08:00' } },
      { tur: 'bloklariYaz', kartId: 'eski' },
    ]);
  });

  it('"Her gün" kart düzenlenip kaydedilince "30 gün"e dönüşmez', () => {
    const k = dizi();
    const s = duzenle(k, '2026-10-01', tanim(k, { baslik: 'Sabah yürüyüşü' }), null, idUret());
    const guncel = bul(s.islemler, 'kartGuncelle')[0]!.kart;
    expect(tekrarMetni(guncel.tekrar!)).toBe('Her gün');
  });

  it('Yalnız bu gün: gün diziden çıkar, o güne yeni tek seferlik kart, kaydı taşınır', () => {
    const k = dizi();
    const s = duzenle(k, '2026-10-12', tanim(k, { saat: '09:00' }), 'yalnizBuGun', idUret());
    expect(s.mesaj).toBe('Yalnız bu gün değişti');
    const eski = bul(s.islemler, 'kartGuncelle')[0]!.kart;
    const yeni = bul(s.islemler, 'kartEkle')[0]!.kart;
    expect(eski.atlanan).toEqual(['2026-10-12']);
    expect(eski.saat).toBe('07:30'); // dizi değişmedi
    expect(yeni).toMatchObject({ id: 'yeni1', tarih: '2026-10-12', tekrar: null, saat: '09:00', atlanan: [], bitis: null });
    expect(bul(s.islemler, 'kayitTasi')).toEqual([
      { tur: 'kayitTasi', kaynakKartId: 'eski', hedefKartId: 'yeni1', aralik: { tur: 'tek', gun: '2026-10-12' } },
    ]);
    expect(bul(s.islemler, 'bloklariYaz')).toEqual([{ tur: 'bloklariYaz', kartId: 'yeni1' }]);
    // Her gün tam olarak bir kart görünür.
    for (const g of gunAraligi('2026-10-10', '2026-10-14')) {
      expect([eski, yeni].filter((x) => gorunurMu(x, g, BUGUN))).toHaveLength(1);
    }
  });

  it('Bu gün ve sonrası: eski dizi dünde biter, yeni dizi bugün başlar, sonraki kayıtlar taşınır', () => {
    const k = dizi({ atlanan: ['2026-10-05', '2026-10-15'] });
    const s = duzenle(k, '2026-10-12', tanim(k, { saat: '18:00' }), 'buGunVeSonrasi', idUret());
    expect(s.mesaj).toBe('Bu günden sonrası değişti; geçmiş kayıtlar yerinde');
    const eski = bul(s.islemler, 'kartGuncelle')[0]!.kart;
    const yeni = bul(s.islemler, 'kartEkle')[0]!.kart;
    expect(eski).toMatchObject({ bitis: '2026-10-11', atlanan: ['2026-10-05'], saat: '07:30' });
    expect(yeni).toMatchObject({ id: 'yeni1', tarih: '2026-10-12', atlanan: ['2026-10-15'], saat: '18:00', bitis: null });
    expect(bul(s.islemler, 'kayitTasi')[0]!.aralik).toEqual({ tur: 'sonrasi', gun: '2026-10-12' });
    // Geçmiş kayıtlar silinmez.
    expect(bul(s.islemler, 'kayitSil')).toHaveLength(0);
    for (const g of gunAraligi('2026-10-06', '2026-10-20')) {
      const gorunen = [eski, yeni].filter((x) => gorunurMu(x, g, BUGUN)).length;
      expect(gorunen).toBe(g === '2026-10-15' ? 0 : 1);
    }
  });

  it('Bu gün ve sonrası: tekrar ayarı değişmediyse "30 gün" dizisinin bitişi kaymaz', () => {
    const k = dizi({ tekrar: her({ gunSayisi: 30 }) }); // 1–30 Ekim
    const s = duzenle(k, '2026-10-12', tanim(k, { saat: '18:00' }), 'buGunVeSonrasi', idUret());
    const eski = bul(s.islemler, 'kartGuncelle')[0]!.kart;
    const yeni = bul(s.islemler, 'kartEkle')[0]!.kart;
    expect(yeni.tekrar!.gunSayisi).toBe(19); // 12–30 Ekim
    const hepsi = [...gorunenGunler(eski, '2026-09-25', '2026-11-10'), ...gorunenGunler(yeni, '2026-09-25', '2026-11-10')];
    expect(hepsi).toEqual(gunAraligi('2026-10-01', '2026-10-30'));
  });

  it('Bu gün ve sonrası: tekrar ayarı değiştiyse yeni ayar bu günden sayılır', () => {
    const k = dizi({ tekrar: her({ gunSayisi: 30 }) });
    const s = duzenle(k, '2026-10-12', tanim(k, { tekrar: her({ gunSayisi: 10 }) }), 'buGunVeSonrasi', idUret());
    const yeni = bul(s.islemler, 'kartEkle')[0]!.kart;
    expect(yeni.tekrar!.gunSayisi).toBe(10);
    expect(gorunenGunler(yeni, '2026-10-01', '2026-11-30')).toEqual(gunAraligi('2026-10-12', '2026-10-21'));
  });

  it('Bu gün ve sonrası: daha önce bölünmüş dizinin bitişi yeni diziye geçer', () => {
    const k = dizi({ bitis: '2026-10-20' });
    const s = duzenle(k, '2026-10-12', tanim(k), 'buGunVeSonrasi', idUret());
    expect(bul(s.islemler, 'kartEkle')[0]!.kart.bitis).toBe('2026-10-20');
  });

  it('Bu gün ve sonrası: tekrar kapatıldıysa yalnız o güne tek seferlik kart olur', () => {
    const k = dizi();
    const s = duzenle(k, '2026-10-12', tanim(k, { tekrar: null }), 'buGunVeSonrasi', idUret());
    const yeni = bul(s.islemler, 'kartEkle')[0]!.kart;
    expect(yeni).toMatchObject({ tekrar: null, tarih: '2026-10-12', atlanan: [], bitis: null });
  });
});

describe('silme', () => {
  it('tek seferlik kart: kart ve kaydı silinir', () => {
    const k = yeniKart('t', { baslik: 'Fatura', tarih: BUGUN });
    const s = sil(k, BUGUN, null);
    expect(s.mesaj).toBe('Kart silindi');
    expect(s.islemler).toEqual([
      { tur: 'kayitSil', kartId: 't', aralik: { tur: 'hepsi' } },
      { tur: 'kartSil', kartId: 't' },
    ]);
  });

  it('tekrarlı kart ilk gününden: kart ve bütün kayıtları silinir', () => {
    const s = sil(dizi(), '2026-10-01', 'yalnizBuGun'); // ilk günde seçim yok sayılır
    expect(bul(s.islemler, 'kartSil')).toHaveLength(1);
    expect(bul(s.islemler, 'kayitSil')[0]!.aralik).toEqual({ tur: 'hepsi' });
  });

  it('Yalnız bu gün: gün diziden çıkar, yalnız o günün kaydı silinir', () => {
    const s = sil(dizi(), '2026-10-12', 'yalnizBuGun');
    expect(s.mesaj).toBe('Bu gün silindi');
    expect(bul(s.islemler, 'kartGuncelle')[0]!.kart.atlanan).toEqual(['2026-10-12']);
    expect(bul(s.islemler, 'kayitSil')[0]!.aralik).toEqual({ tur: 'tek', gun: '2026-10-12' });
    expect(bul(s.islemler, 'kartSil')).toHaveLength(0);
  });

  it('Bu gün ve sonrası: dizi dünde biter, geçmiş kayıtlar yerinde', () => {
    const s = sil(dizi({ atlanan: ['2026-10-05', '2026-10-20'] }), '2026-10-12', 'buGunVeSonrasi');
    expect(s.mesaj).toBe('Bu günden sonrası silindi; geçmiş kayıtlar yerinde');
    const eski = bul(s.islemler, 'kartGuncelle')[0]!.kart;
    expect(eski).toMatchObject({ bitis: '2026-10-11', atlanan: ['2026-10-05'] });
    expect(bul(s.islemler, 'kayitSil')[0]!.aralik).toEqual({ tur: 'sonrasi', gun: '2026-10-12' });
    expect(aralikta('2026-10-11', { tur: 'sonrasi', gun: '2026-10-12' })).toBe(false);
  });

  it('onay metinleri', () => {
    expect(silmeOnayi(yeniKart('t', { baslik: 'x' }), true)).toEqual({ baslik: 'Kart silinsin mi?', aciklama: null });
    expect(silmeOnayi(dizi(), true).aciklama).toBe('Bu kartın geçmiş kayıtları da silinecek.');
    expect(silmeOnayi(dizi(), false).aciklama).toBeNull();
  });
});

describe('kayıt taşıma', () => {
  it('blok anahtarlarını yeni kimliklere çevirir, eşlenmeyeni atar', () => {
    const kayit = {
      kartId: 'eski', tarih: BUGUN, yapildi: true,
      degerler: { b1: '15', b9: 'eski blok' }, isaretler: { b2: [true, false] }, fotolar: {},
    };
    const esleme = new Map([['b1', 'n1'], ['b2', 'n2']]);
    expect(kayitAnahtarlariniEsle(kayit, 'yeni', esleme)).toEqual({
      kartId: 'yeni', tarih: BUGUN, yapildi: true,
      degerler: { n1: '15' }, isaretler: { n2: [true, false] }, fotolar: {},
    });
  });
});
