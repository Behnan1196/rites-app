import {
  eklendiMetni, kalanKisiMetni, kisiBasHarf, epostaDuzelt, epostaGecerliMi, eslestir, gelenIstekler, kisiEklemeHatasi, kisiFormuHatasi,
  sinirMetni, type Kisi, type SunucuBaglantisi,
} from '../kisiler';
import { blokOzeti, gelenKarti, gelenlerOzeti, kartPaketi, paketGecerliMi } from '../paylasim';

const kisi = (d: Partial<Kisi>): Kisi => ({ id: 'x', ad: 'Ali', eposta: 'ali@a.com', kullaniciId: null, durum: 'davet', benEkledim: true, ...d });
const bag = (d: Partial<SunucuBaglantisi>): SunucuBaglantisi => ({ diger: 'u1', eposta: 'ali@a.com', ad: 'Ali', durum: 'bagli', benIstedim: true, ...d });

describe('kişi formu (KS-1)', () => {
  it('ad, e-posta, zaten var, sınır', () => {
    expect(kisiFormuHatasi(' ', 'a@b.co', [], 0)).toEqual({ alan: 'ad', metin: 'Önce bir ad yaz.' });
    expect(kisiFormuHatasi('Ali', 'ali@', [], 0)?.metin).toBe('E-posta adresi eksik ya da hatalı görünüyor.');
    expect(kisiFormuHatasi('Ali', ' ALİ@a.com ', [kisi({})], 0)?.metin).toBe('Bu e-posta zaten kişilerinde.');
    expect(kisiFormuHatasi('Ali', 'veli@a.com', [], 5)?.metin).toBe('Ücretsiz üyelikte en çok 5 kişi ekleyebilirsin.');
    expect(kisiFormuHatasi('Ali', 'veli@a.com', [], 4)).toBeNull();
  });
  it('e-posta düzeltme ve geçerlilik', () => {
    expect(epostaDuzelt(' Ayşe.KILIÇ@Ornek.COM ')).toBe('ayşe.kiliç@ornek.com');
    expect(epostaGecerliMi('a@b.co')).toBe(true);
    expect(epostaGecerliMi('a b@c.com')).toBe(false);
  });
  it('mesajlar', () => {
    expect(eklendiMetni('Elif', 'istek')).toBe("Elif Rites'ta. Bağlantı isteği gönderildi.");
    expect(eklendiMetni('Elif', 'davet')).toBe("Elif henüz Rites'ta değil. Davet e-postası gönderildi.");
    expect(kisiEklemeHatasi('ERROR: sinir')).toBe('Ücretsiz üyelikte en çok 5 kişi ekleyebilirsin.');
    expect(kisiEklemeHatasi('Network request failed')).toBe('Şu an bağlanamıyor. Biraz sonra yeniden dene.');
    expect(sinirMetni(3)).toBe('Eklediğin kişiler (ücretsiz) 3 / 5');
    expect(kalanKisiMetni(3)).toBe('2 kişi daha ekleyebilirsin.');
    expect(kalanKisiMetni(5)).toBe('Sınır doldu.');
    expect([kisiBasHarf('Gül Aksoy'), kisiBasHarf('Ali (eşim)'), kisiBasHarf('hasan bey'), kisiBasHarf('')]).toEqual(['GA', 'A', 'HB', '?']);
  });
});

describe('eşleştirme', () => {
  it('kabul edilen istek bağlı olur; davet edilen katılınca isteğe döner', () => {
    const e = eslestir(
      [kisi({ id: 'k1', kullaniciId: 'u1', durum: 'istek' }), kisi({ id: 'k2', eposta: 'veli@a.com', durum: 'davet' })],
      [bag({ diger: 'u1' }), bag({ diger: 'u2', eposta: 'veli@a.com', ad: 'Veli', durum: 'istek' })],
      [],
    );
    expect(e.guncelle.map((k) => [k.id, k.durum, k.kullaniciId])).toEqual([['k1', 'bagli', 'u1'], ['k2', 'istek', 'u2']]);
    expect(e.ekle).toEqual([]);
    expect(e.sil).toEqual([]);
  });
  it('sunucuda karşılığı kalmayan silinir; bekleyen davet kalır', () => {
    const e = eslestir(
      [kisi({ id: 'k1', kullaniciId: 'u1', durum: 'bagli' }), kisi({ id: 'k2', eposta: 'davet@a.com' }), kisi({ id: 'k3', eposta: 'eski@a.com' })],
      [],
      ['davet@a.com'],
    );
    expect(e.sil).toEqual(['k1', 'k3']);
  });
  it('başka yerde kabul edilen bağlantı kendi adıyla eklenir; bana gelen istek eklenmez', () => {
    const baglantilar = [
      bag({ diger: 'u5', eposta: 'elif@a.com', ad: 'Elif', durum: 'bagli', benIstedim: false }),
      bag({ diger: 'u6', eposta: 'can@a.com', ad: '', durum: 'istek', benIstedim: false }),
    ];
    const e = eslestir([], baglantilar, []);
    expect(e.ekle).toEqual([{ ad: 'Elif', eposta: 'elif@a.com', kullaniciId: 'u5', durum: 'bagli', benEkledim: false }]);
    expect(gelenIstekler(baglantilar).map((b) => b.diger)).toEqual(['u6']);
  });
});

describe('paylaşım (L-4)', () => {
  const paket = kartPaketi(
    { baslik: 'Bulgur', kisa: '40 dakika', saat: '19:00', tekrar: null },
    [
      { tur: 'foto', ad: '', metin: '', birim: '', dakika: null, maddeler: [] },
      { tur: 'liste', ad: 'Malzemeler', metin: '', birim: '', dakika: null, maddeler: ['bulgur', 'kabak'] },
      { tur: 'sayac', ad: 'Fırın', metin: '', birim: '', dakika: 40, maddeler: [] },
    ],
  );
  it('fotoğraf ve dosya gitmez; blok özeti', () => {
    expect(paket.bloklar.map((b) => b.tur)).toEqual(['liste', 'sayac']);
    expect(blokOzeti(paket)).toEqual(['Liste', 'Zamanlayıcı']);
    expect(paketGecerliMi(JSON.parse(JSON.stringify(paket)))).toBe(true);
    expect(paketGecerliMi({})).toBe(false);
  });
  it('Bugün Ajandama ekle: bugüne tek seferlik, kaynak gelen', () => {
    let n = 0;
    const { kart, bloklar } = gelenKarti(paket, 'Elif', '2026-10-13', () => `i${++n}`);
    expect(kart).toMatchObject({ baslik: 'Bulgur', tarih: '2026-10-13', saat: '19:00', tekrar: null, kaynak: 'gelen', gelenKimden: 'Elif' });
    expect(bloklar.map((b) => [b.tur, b.maddeler])).toEqual([['liste', ['bulgur', 'kabak']], ['sayac', []]]);
  });
  it('Gelenler özeti', () => {
    expect(gelenlerOzeti([])).toBe('Şu an yeni bir şey yok');
    expect(gelenlerOzeti([{ kimden: 'Elif', baslik: 'Bulgur' }, { kimden: 'Ali', baslik: 'X' }])).toBe('Elif: Bulgur ve 1 tane daha');
  });
});
