import { gununKartlari } from '../ajanda';
import { kutuSatirlari } from '../giris';
import {
  adBulucu, bagliKisiler, davetOzeti, cagrilabilecekler, grupAdi, grupDavetleri, grupDavetMetni, grupFormuHatasi, grupHatasi,
  grupKurulduMetni, grupSayiMetni, uyeOlduklarim, type Grup,
} from '../gruplar';
import { kaynakAnahtari, kaynakEtiketi, kaynaklar } from '../kaynak';
import type { Kisi } from '../kisiler';
import {
  atamaEtiketi, ekleyenMetni, erisimYolu, kalanMetni, kimeSecenekleri, kimlerleMetni, kisiSayisiMetni, listeFormuHatasi,
  listeHatasi, maddeKarti, maddeKartiMi, maddeleriSirala, maddeYapilanlari, uyelerMetni, yapilanlariBirlestir,
  zamanSecenekleri, type BanaVerilen, type Madde, type OrtakListe,
} from '../listeler';

const BEN = 'ben';
const kisi = (d: Partial<Kisi>): Kisi => ({ id: 'k', ad: 'Ali (eşim)', eposta: 'ali@a.com', kullaniciId: 'ali', durum: 'bagli', benEkledim: true, ...d });
const kisiler = [kisi({}), kisi({ id: 'k2', ad: 'Elif (kızım)', eposta: 'elif@a.com', kullaniciId: 'elif' }), kisi({ id: 'k3', ad: 'Hasan Bey', eposta: 'h@a.com', kullaniciId: null, durum: 'davet' })];
const ad = adBulucu(BEN, kisiler, [{ id: 'gul', ad: 'Gül Aksoy', eposta: 'gul@a.com' }]);

const grup = (d: Partial<Grup>): Grup => ({
  id: 'g1',
  ad: 'Aile',
  kurucu: BEN,
  benim: 'uye',
  uyeler: [
    { id: BEN, ad: 'Ayşe', eposta: 'ayse@a.com', durum: 'uye' },
    { id: 'ali', ad: 'Ali', eposta: 'ali@a.com', durum: 'uye' },
    { id: 'elif', ad: 'Elif', eposta: 'elif@a.com', durum: 'davet' },
  ],
  listeler: [],
  ...d,
});

describe('adlar', () => {
  it('Sen · Kişilerim adı · kendi adı · e-posta', () => {
    expect(ad(BEN)).toBe('Sen');
    expect(ad({ id: 'ali', ad: 'Ali', eposta: 'ali@a.com' })).toBe('Ali (eşim)');
    expect(ad('gul')).toBe('Gül Aksoy');
    expect(ad({ id: 'x', ad: '', eposta: 'x@a.com' })).toBe('x@a.com');
    expect(ad('bilinmeyen')).toBe('Eski üye');
  });
});

describe('gruplar (GR-1)', () => {
  it('grup adı ve metinler', () => {
    expect(grupAdi('Aile')).toBe('Aile grubu');
    expect(grupAdi('Yürüyüş grubu ')).toBe('Yürüyüş grubu');
    expect(grupAdi('YÜRÜYÜŞ GRUBU')).toBe('YÜRÜYÜŞ GRUBU');
    expect(grupKurulduMetni('Aile', 2)).toBe('Aile grubu kuruldu; davetler gönderildi.');
    expect(grupKurulduMetni('Yürüyüş grubu', 0)).toBe('Yürüyüş grubu kuruldu.');
    expect(grupFormuHatasi('  ')).toBe('Gruba bir ad ver.');
    expect(grupFormuHatasi('Aile')).toBeNull();
  });
  it('davetler ve davet metni', () => {
    const davetli = grup({ id: 'g2', kurucu: 'gul', benim: 'davet', ad: 'Yürüyüş grubu', uyeler: [{ id: 'gul', ad: 'Gül Aksoy', eposta: 'gul@a.com', durum: 'uye' }] });
    expect(grupDavetleri([grup({}), davetli]).map((g) => g.id)).toEqual(['g2']);
    expect(uyeOlduklarim([grup({}), davetli]).map((g) => g.id)).toEqual(['g1']);
    expect(grupDavetMetni(davetli, ad)).toBe('Gül Aksoy seni Yürüyüş grubuna çağırdı.');
    expect(grupDavetMetni(grup({ kurucu: 'ali' }), ad)).toBe('Ali (eşim) seni Aile grubuna çağırdı.');
    expect(davetOzeti([], ad)).toBeNull();
    expect(davetOzeti([davetli], ad)).toBe('Gül Aksoy seni Yürüyüş grubuna çağırdı.');
    expect(davetOzeti([davetli, davetli], ad)).toBe('2 grup daveti');
  });
  it('kişi sayısı', () => {
    expect(grupSayiMetni(grup({}), BEN)).toBe('1 kişi · 1 davet bekliyor');
    expect(grupSayiMetni(grup({ uyeler: [] }), BEN)).toBe('Henüz kimse yok');
  });
  it('çağrılabilenler: bağlı ve grupta olmayan', () => {
    expect(cagrilabilecekler(grup({}), kisiler)).toEqual([]);
    expect(cagrilabilecekler(grup({ uyeler: [] }), kisiler).map((k) => k.ad)).toEqual(['Ali (eşim)', 'Elif (kızım)']);
    expect(bagliKisiler(kisiler).length).toBe(2);
  });
  it('sunucu hataları', () => {
    expect(grupHatasi('bagli degil')).toBe('Gruba yalnız bağlı olduğun kişileri çağırabilirsin.');
    expect(grupHatasi('fetch failed')).toBeNull();
  });
});

const liste = (d: Partial<OrtakListe>): OrtakListe => ({
  id: 'l1',
  ad: 'Market',
  sahip: BEN,
  gruplar: [{ id: 'g1', ad: 'Aile grubu' }],
  kisiler: ['gul'],
  uyeler: [
    { id: BEN, ad: 'Ayşe', eposta: 'a@a.com' },
    { id: 'ali', ad: 'Ali', eposta: 'ali@a.com' },
    { id: 'gul', ad: 'Gül Aksoy', eposta: 'gul@a.com' },
  ],
  kalan: 2,
  ...d,
});
const madde = (d: Partial<Madde>): Madde => ({ id: 'm1', liste: 'l1', metin: 'Süt', yapildi: false, ekleyen: BEN, kime: null, tarih: null, sira: 1, ...d });

describe('ortak listeler (GR-2)', () => {
  it('liste satırı', () => {
    expect(kimlerleMetni(liste({}), BEN, ad)).toBe('Aile grubu, Gül Aksoy');
    expect(kimlerleMetni(liste({ gruplar: [], kisiler: [] }), BEN, ad)).toBe('Yalnız sen');
    // Başkasının listesinde kuran da yazar.
    expect(kimlerleMetni(liste({ sahip: 'ali', gruplar: [], kisiler: [BEN, 'gul'] }), BEN, ad)).toBe('Ali (eşim), Gül Aksoy');
    expect(kisiSayisiMetni(liste({}))).toBe('3 kişi');
    expect(kisiSayisiMetni(liste({ uyeler: [] }))).toBe('1 kişi');
    expect(kalanMetni(2)).toBe('2 madde kaldı');
    expect(kalanMetni(0)).toBe('Madde kalmadı');
    expect(listeFormuHatasi('')).toBe('Listeye bir ad ver.');
    expect(listeHatasi('bagli degil')).toBe('Listeyi yalnız bağlı olduğun kişilere açabilirsin.');
  });
  it('liste ekranı metinleri', () => {
    expect(uyelerMetni(liste({}), BEN, ad)).toBe('Sen ve Ali (eşim), Gül Aksoy');
    expect(uyelerMetni(liste({ uyeler: [{ id: BEN, ad: 'A', eposta: 'a' }] }), BEN, ad)).toBe('Yalnız sen');
    expect(ekleyenMetni(madde({}), BEN, ad)).toBe('Sen ekledin');
    expect(ekleyenMetni(madde({ ekleyen: 'elif' }), BEN, ad)).toBe('Elif (kızım) ekledi');
    expect(ekleyenMetni(madde({ ekleyen: null }), BEN, ad)).toBe('');
  });
  it('erişim yolu', () => {
    expect(erisimYolu(liste({}), BEN)).toEqual({ tur: 'sahip' });
    expect(erisimYolu(liste({ sahip: 'ali' }), 'gul')).toEqual({ tur: 'kisi' });
    expect(erisimYolu(liste({ sahip: 'ali' }), BEN)).toEqual({ tur: 'grup', gruplar: ['Aile grubu'] });
  });
  it('sıra', () => {
    expect(maddeleriSirala([madde({ id: 'b', sira: 5 }), madde({ id: 'a', sira: 2 })]).map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('madde: Kime? / Ne zaman? (GR-4)', () => {
  const bugun = '2026-10-11';
  it('etiket', () => {
    expect(atamaEtiketi(madde({ kime: 'ali', tarih: bugun }), BEN, ad, bugun)).toEqual({ metin: 'Ali (eşim) · Bugün', bana: false });
    expect(atamaEtiketi(madde({ kime: BEN, tarih: '2026-10-12' }), BEN, ad, bugun)).toEqual({ metin: 'Sen · Yarın', bana: true });
    expect(atamaEtiketi(madde({ tarih: '2026-10-15' }), BEN, ad, bugun)).toEqual({ metin: '15 Ekim', bana: false });
    expect(atamaEtiketi(madde({ kime: BEN }), BEN, ad, bugun)).toEqual({ metin: 'Sen', bana: true });
    expect(atamaEtiketi(madde({}), BEN, ad, bugun)).toBeNull();
  });
  it('seçenekler', () => {
    expect(kimeSecenekleri(liste({}), BEN, ad).map((s) => s.etiket)).toEqual(['Kimse', 'Sen', 'Ali (eşim)', 'Gül Aksoy']);
    expect(zamanSecenekleri(bugun)).toEqual([
      { tarih: null, etiket: 'Tarih yok' },
      { tarih: bugun, etiket: 'Bugün' },
      { tarih: '2026-10-12', etiket: 'Yarın' },
    ]);
  });
});

describe('ajandada madde (`05` §9)', () => {
  const bv: BanaVerilen = { id: 'm1', metin: 'Zeytinyağı', yapildi: false, tarih: '2026-10-11', liste: 'l1', listeAdi: 'Market' };
  it('sanal kart yalnız o gün, "Liste: Market" etiketiyle', () => {
    const k = maddeKarti(bv);
    expect(maddeKartiMi(k)).toBe(true);
    expect(maddeKartiMi({ id: 'abc' })).toBe(false);
    expect(gununKartlari([k], '2026-10-11', '2026-10-11').length).toBe(1);
    expect(gununKartlari([k], '2026-10-12', '2026-10-11').length).toBe(0);
    expect(kaynakAnahtari(k)).toBe('liste');
    expect(kaynakEtiketi(k, new Map())).toBe('Liste: Market');
    expect(kaynaklar([k])).toEqual(['kendim', 'liste']);
  });
  it('yapılanlar', () => {
    const y = maddeYapilanlari([bv, { ...bv, id: 'm2', yapildi: true }]);
    expect([...(y.get('2026-10-11') ?? [])]).toEqual(['madde:m2']);
    const b = yapilanlariBirlestir(new Map([['2026-10-11', new Set(['k1'])]]), y);
    expect([...(b.get('2026-10-11') ?? [])].sort()).toEqual(['k1', 'madde:m2']);
  });
});

describe('Giriş yarım kutuları (`05` §10)', () => {
  it('arka arkaya iki yarım kutu yan yana; tek kalan satırı doldurur', () => {
    expect(kutuSatirlari(['not', 'su', 'ortak', 'bugun'])).toEqual([['not'], ['su', 'ortak'], ['bugun']]);
    expect(kutuSatirlari(['ortak', 'not', 'su'])).toEqual([['ortak'], ['not'], ['su']]);
    expect(kutuSatirlari(['su', 'ortak', 'ortak'])).toEqual([['su', 'ortak'], ['ortak']]);
  });
});
