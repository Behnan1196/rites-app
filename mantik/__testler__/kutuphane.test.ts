import { yeniKart, type Kart } from '../kart';
import {
  blokBasligi, etiketMetni, icerikMetaMetni, kartIcerigi, kaynakMetni, kayitAltMetni, kayitPaketi, kutuphanedenKart,
  kutuphaneSuz, paketIcerigi, planIcerigi, planiYenidenBaslat, planKartiMetni, suzgecSecenekleri, turTahmini,
  type KutuphaneKaydi,
} from '../kutuphane';
import type { Plan } from '../plan';

const BUGUN = '2026-10-13';
let n = 0;
const kimlik = () => `id${++n}`;
const blok = (tur: Parameters<typeof turTahmini>[0][number]['tur'], d: object = {}) => ({ tur, ad: '', metin: '', birim: '', dakika: null, maddeler: [], dosya: null, ...d });

const enginar = kartIcerigi(
  yeniKart('k1', { baslik: 'Zeytinyağlı enginar', kisa: 'Hafif akşam yemeği', saat: '19:00', hatirlatma: '15dk' }),
  [blok('liste', { ad: 'Malzemeler', maddeler: ['4 enginar', '1 limon'] }), blok('talimat', { metin: 'Enginarları limonlu suda beklet.' }), blok('foto', { dosya: 'file:///d/dosyalar/a.jpg' })],
);
const kayit = (d: Partial<KutuphaneKaydi> = {}): KutuphaneKaydi =>
  ({ id: 'L1', tur: 'kart', baslik: enginar.baslik, alanlar: ['beslenme'], etiketTur: 'Tarif', kaynak: 'Kendim', paylasilabilir: true, olusturma: '2026-10-13T08:00:00Z', icerik: enginar, ...d }) as KutuphaneKaydi;

describe('kaydetmek (L-1)', () => {
  it('tahmini tür', () => {
    expect(turTahmini([blok('liste'), blok('talimat')])).toBe('Tarif');
    expect(turTahmini([blok('video'), blok('talimat')])).toBe('Egzersiz');
    expect(turTahmini([blok('olcum'), blok('talimat')])).toBe('Ölçüm');
    expect(turTahmini([blok('talimat')])).toBe('Bilgi');
    expect(turTahmini([])).toBe('Diğer');
    expect(turTahmini([blok('sayac')])).toBe('Diğer');
  });
  it('kaynak', () => {
    expect(kaynakMetni(yeniKart('a', { baslik: 'x' }))).toBe('Kendim');
    expect(kaynakMetni(yeniKart('a', { baslik: 'x', kaynak: 'gelen', gelenKimden: 'Elif' }))).toBe('Gönderen: Elif');
  });
  it('kopya: kayıtlar ve tarih gitmez, bloklar ve dosya kalır', () => {
    expect(enginar).toEqual({
      baslik: 'Zeytinyağlı enginar', kisa: 'Hafif akşam yemeği', saat: '19:00', hatirlatma: '15dk', tekrar: null,
      bloklar: [
        { tur: 'liste', ad: 'Malzemeler', metin: '', birim: '', dakika: null, maddeler: ['4 enginar', '1 limon'], dosya: null },
        { tur: 'talimat', ad: '', metin: 'Enginarları limonlu suda beklet.', birim: '', dakika: null, maddeler: [], dosya: null },
        { tur: 'foto', ad: '', metin: '', birim: '', dakika: null, maddeler: [], dosya: 'file:///d/dosyalar/a.jpg' },
      ],
    });
  });
  it('Gelenler paketinden', () => {
    const c = paketIcerigi({ surum: 1, baslik: 'Bulgur', kisa: '', saat: null, tekrar: null, bloklar: [{ tur: 'liste', ad: 'M', metin: '', birim: '', dakika: null, maddeler: ['bulgur'] }] });
    expect(c.bloklar[0]).toEqual({ tur: 'liste', ad: 'M', metin: '', birim: '', dakika: null, maddeler: ['bulgur'], dosya: null });
    expect(c.hatirlatma).toBeNull();
  });
});

describe('bulmak (L-2)', () => {
  const tai: KutuphaneKaydi = kayit({ id: 'L2', baslik: 'Tai chi', alanlar: ['hareket', 'zihin'], etiketTur: 'Egzersiz', icerik: { ...enginar, baslik: 'Tai chi', kisa: 'Denge ve esneklik', bloklar: [] } });
  const liste = [kayit(), tai];
  it('metinler', () => {
    expect(etiketMetni(tai)).toBe('Hareket · Zihin · Egzersiz');
    expect(kayitAltMetni(kayit({ kaynak: 'Gönderen: Elif' }))).toBe('Gönderen: Elif');
    expect(blokBasligi({ tur: 'liste', ad: 'Malzemeler' })).toBe('Liste: Malzemeler');
    expect(blokBasligi({ tur: 'talimat', ad: '' })).toBe('Talimat');
    expect(icerikMetaMetni({ saat: '07:30', tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' } })).toBe('07:30 · Her gün');
  });
  it('arama: başlık, etiket ve içerik; Türkçe harfler', () => {
    expect(kutuphaneSuz(liste, { sorgu: 'ENGİNAR', alan: null, tur: null }).map((k) => k.id)).toEqual(['L1']);
    expect(kutuphaneSuz(liste, { sorgu: 'limon', alan: null, tur: null }).map((k) => k.id)).toEqual(['L1']);
    expect(kutuphaneSuz(liste, { sorgu: 'zihin', alan: null, tur: null }).map((k) => k.id)).toEqual(['L2']);
    expect(kutuphaneSuz(liste, { sorgu: 'denge', alan: null, tur: null }).map((k) => k.id)).toEqual(['L2']);
  });
  it('alan ve tür süzgeci; çiplerde yalnız geçenler', () => {
    expect(kutuphaneSuz(liste, { sorgu: '', alan: 'hareket', tur: null }).map((k) => k.id)).toEqual(['L2']);
    expect(kutuphaneSuz(liste, { sorgu: '', alan: null, tur: 'Tarif' }).map((k) => k.id)).toEqual(['L1']);
    expect(kutuphaneSuz(liste, { sorgu: '', alan: 'beslenme', tur: 'Egzersiz' })).toEqual([]);
    expect(suzgecSecenekleri(liste, ['hareket', 'beslenme', 'uyku', 'zihin'])).toEqual({ alanlar: ['hareket', 'beslenme', 'zihin'], turler: ['Tarif', 'Egzersiz'] });
  });
  it('Bugün Ajandama ekle: bugünden başlayan, tekrarı korunan kopya', () => {
    n = 0;
    const tekrarli = { ...enginar, tekrar: { gunSayisi: 30, gunler: ['Pzt', 'Çar'] as ['Pzt', 'Çar'], desen: null } };
    const { kart, bloklar } = kutuphanedenKart(tekrarli, BUGUN, kimlik, 5);
    expect(kart).toMatchObject({ id: 'id1', baslik: 'Zeytinyağlı enginar', tarih: BUGUN, saat: '19:00', hatirlatma: '15dk', kaynak: 'kendim', planId: null, yapildi: false, sira: 5 });
    expect(kart.tekrar).toEqual({ gunSayisi: 30, gunler: ['Pzt', 'Çar'], desen: null });
    expect(kart.tekrar?.gunler).not.toBe(tekrarli.tekrar.gunler);
    expect(bloklar.map((b) => b.id)).toEqual(['id2', 'id3', 'id4']);
  });
  it('paylaşım paketi: dosyalar gitmez, etiketler gider', () => {
    const p = kayitPaketi(kayit() as KutuphaneKaydi & { tur: 'kart' });
    expect(p.bloklar.map((b) => b.tur)).toEqual(['liste', 'talimat']);
    expect(p.alanlar).toEqual(['beslenme']);
    expect(p.etiketTur).toBe('Tarif');
  });
});

describe('planı kütüphaneye kaydetmek ve yeniden başlatmak (L-3)', () => {
  const plan: Plan = { id: 'p1', ad: 'Sabah hareketi', alan: 'hareket', kaynak: 'kendim', neden: 'Enerji', hedef: 'Her sabah 20 dk', baslangic: '2026-10-01', bitis: '2026-10-29', baslangicPuani: 2, gununSorusu: { metin: 'Enerjin?', alt: 'Hiç', ust: 'Çok' }, durum: 'etkin' };
  const duzenli: Kart = yeniKart('k1', { baslik: 'Yürüyüş', tarih: '2026-10-01', saat: '07:30', tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' }, bitis: '2026-10-29', planId: 'p1', sira: 0 });
  const adimTarihli: Kart = yeniKart('k2', { baslik: 'Ayakkabı al', tarih: '2026-10-03', planId: 'p1', sira: 1, yapildi: true });
  const adimTarihsiz: Kart = yeniKart('k3', { baslik: 'Rota seç', tarihsiz: true, planId: 'p1', sira: 2 });
  const icerik = planIcerigi(plan, [
    { kart: adimTarihsiz, bloklar: [] },
    { kart: duzenli, bloklar: [blok('video', { metin: 'https://y.t/v' })] },
    { kart: adimTarihli, bloklar: [] },
  ]);
  it('kopya: süre gün olarak, kartlar plan başlangıcına göre', () => {
    expect(icerik.sure).toBe(28);
    expect(icerik.kartlar.map((k) => [k.baslik, k.gun])).toEqual([['Yürüyüş', 0], ['Ayakkabı al', 2], ['Rota seç', null]]);
    expect(planKartiMetni(icerik.kartlar[0]!)).toBe('Yürüyüş · Her gün · 07:30');
    expect(planKartiMetni(icerik.kartlar[2]!)).toBe('Adım: Rota seç');
    expect(kayitAltMetni({ ...kayit(), tur: 'plan', icerik } as KutuphaneKaydi)).toBe('Plan · 28 gün · 3 kart');
  });
  it('yeniden başlat: bugünden, aynı uzunlukta; adımlar yapılmamış', () => {
    n = 0;
    const y = planiYenidenBaslat(icerik, BUGUN, 3, kimlik);
    expect(y.plan).toMatchObject({ id: 'id1', ad: 'Sabah hareketi', baslangic: BUGUN, bitis: '2026-11-10', baslangicPuani: 3, durum: 'etkin', kaynak: 'kendim' });
    expect(y.plan.gununSorusu).toEqual({ metin: 'Enerjin?', alt: 'Hiç', ust: 'Çok' });
    expect(y.duzenliler.map((d) => [d.kart.baslik, d.kart.tarih, d.kart.bitis, d.kart.planId, d.bloklar.length])).toEqual([['Yürüyüş', BUGUN, '2026-11-10', 'id1', 1]]);
    expect(y.adimlar.map((k) => [k.baslik, k.tarih, k.tarihsiz, k.yapildi])).toEqual([['Ayakkabı al', '2026-10-15', false, false], ['Rota seç', null, true, false]]);
  });
  it('bitişsiz plan', () => {
    const p = planIcerigi({ ...plan, bitis: null }, []);
    expect(p.sure).toBeNull();
    expect(planiYenidenBaslat(p, BUGUN, 0, kimlik).plan.bitis).toBeNull();
  });
});
