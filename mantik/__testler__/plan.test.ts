import { ALANLAR, alanBul, varsayilanAcikMi } from '../alanlar';
import { yeniKart, type Kart } from '../kart';
import {
  adimKarti, adimlar, adimlariAyir, adimOzeti, alanAltSatiri, bugunDurumu, etkinliktenKart, etkinlikMetni,
  ilerleme, ilerlemeMetni, paketBitisi, planEnUzunSerisi, planMetaMetni, puanDegisimi, siradakiMetni,
  sonOlcumler, soruGrafigi, sorulanPlan, sureBitisi, sureMetni, VIDEO_TALIMATI,
} from '../plan';

const BUGUN = '2026-10-11'; // Pazar
let n = 0;
const kimlik = () => `k${++n}`;
beforeEach(() => {
  n = 0;
});

const herGun = { gunSayisi: null, gunler: null, desen: 'hergun' as const };

describe('hazır içerik (09)', () => {
  it('dokuz alan; her paketin etkinlikleri alanda var', () => {
    expect(ALANLAR.map((a) => a.ad)).toEqual([
      'Hareket', 'Beslenme', 'Uyku', 'Zihin', 'Anlam', 'Sosyal bağlar', 'Öğrenme', 'İş', 'Uğraşlar',
    ]);
    for (const a of ALANLAR) {
      for (const p of a.paketler) for (const id of p.etkinlikler) expect(a.etkinlikler.some((e) => e.id === id)).toBe(true);
    }
    expect(varsayilanAcikMi('ogrenme')).toBe(false);
    expect(varsayilanAcikMi('is')).toBe(true);
  });
  it('etkinlik metni', () => {
    const [esneme, , yuruyus] = alanBul('hareket')!.etkinlikler;
    expect(etkinlikMetni(esneme!)).toBe('Her gün · 07:30');
    expect(etkinlikMetni(yuruyus!)).toBe('Pzt Çar Cum · 18:00');
    expect(etkinlikMetni(alanBul('is')!.etkinlikler[0]!)).toBe('Hafta içi · 19:00');
  });
});

describe('süre (10 madde 5)', () => {
  it('4 / 8 hafta yalnız bitiş tarihine dönüşür', () => {
    expect(sureBitisi('4hafta', BUGUN)).toBe('2026-11-08');
    expect(sureBitisi('8hafta', BUGUN)).toBe('2026-12-06');
    expect(sureBitisi('yok', BUGUN)).toBeNull();
    expect(paketBitisi(alanBul('hareket')!.paketler[1]!, BUGUN)).toBe('2026-11-22');
  });
  it('süre metni', () => {
    expect(sureMetni('2026-11-08', BUGUN)).toBe('Bitiş: 8 Kasım (28 gün)');
    expect(sureMetni(BUGUN, BUGUN)).toBe('Bitiş: 11 Ekim (bugün)');
    expect(sureMetni('2026-10-01', BUGUN)).toBe('Bitiş: 1 Ekim (geçti)');
    expect(sureMetni(null, BUGUN)).toBe('Bitiş tarihi yok');
    expect(planMetaMetni({ alan: 'is', bitis: '2026-10-30' }, BUGUN)).toBe('İş · Bitiş: 30 Ekim (19 gün)');
  });
});

describe('plan başlatma (PL-1)', () => {
  it('etkinlikten düzenli kart: bugünden başlar, planın bitişinde durur', () => {
    const tai = alanBul('hareket')!.etkinlikler[1]!;
    const { kart, bloklar } = etkinliktenKart(tai, { id: 'p1', bitis: '2026-11-08' }, BUGUN, kimlik);
    expect(kart).toMatchObject({
      baslik: 'Tai chi, 8 hareket', tarih: BUGUN, saat: '07:45', tekrar: herGun, bitis: '2026-11-08', planId: 'p1',
    });
    expect(bloklar.map((b) => [b.tur, b.metin])).toEqual([['video', ''], ['talimat', VIDEO_TALIMATI]]);
  });
  it('blok türleri', () => {
    const plan = { id: 'p', bitis: null };
    const [su, sebze] = alanBul('beslenme')!.etkinlikler;
    expect(etkinliktenKart(su!, plan, BUGUN, kimlik).bloklar).toMatchObject([{ tur: 'olcum', ad: 'İçilen su', birim: 'bardak' }]);
    expect(etkinliktenKart(sebze!, plan, BUGUN, kimlik).bloklar).toMatchObject([
      { tur: 'talimat', metin: 'Öğle yemeğinde tabağın yarısı sebze olsun.' },
    ]);
    expect(etkinliktenKart(alanBul('zihin')!.etkinlikler[0]!, plan, BUGUN, kimlik).bloklar).toMatchObject([{ tur: 'sayac', dakika: 10 }]);
    expect(etkinliktenKart(alanBul('anlam')!.etkinlikler[0]!, plan, BUGUN, kimlik).bloklar).toMatchObject([{ tur: 'gunnot' }]);
  });
  it('adımlar her satırda bir iş; tarihsiz oluşur', () => {
    expect(adimlariAyir(' Teklif al\n\nKoli sipariş et \n  ')).toEqual(['Teklif al', 'Koli sipariş et']);
    expect(adimKarti('a', 'Masaları ölç', 'p1')).toMatchObject({ tarih: null, tarihsiz: true, planId: 'p1', tekrar: null });
  });
});

const adim = (id: string, d: Partial<Kart>): Kart => yeniKart(id, { baslik: id, planId: 'p', ...d });

describe('adımlar (PL-2, 05 §6)', () => {
  const kartlar = [
    adim('anahtar', { tarih: '2026-10-30', saat: '10:00' }),
    adim('internet', { tarih: '2026-10-15' }),
    adim('arsiv', { tarih: BUGUN, saat: '14:00' }),
    adim('eski', { tarih: '2026-10-09' }),
    adim('yarin', { tarih: '2026-10-12' }),
    adim('masa', { tarihsiz: true, sira: 2 }),
    adim('duyur', { tarihsiz: true, sira: 1 }),
    adim('teklif', { tarih: '2026-10-05', yapildi: true }),
    adim('tai', { tarih: '2026-10-01', tekrar: herGun }),
  ];
  it('sıradakiler tarih sırasıyla, geciken kırmızı; tarihsizler; bitenler', () => {
    const a = adimlar(kartlar, BUGUN);
    expect(a.siradakiler.map((s) => [s.kart.id, s.ne, s.gecikti])).toEqual([
      ['eski', 'Gecikti · 9 Ekim', true],
      ['arsiv', 'Bugün · 14:00', false],
      ['yarin', 'Yarın', false],
      ['internet', '15 Ekim', false],
      ['anahtar', '30 Ekim · 10:00', false],
    ]);
    expect(a.tarihsizler.map((s) => s.kart.id)).toEqual(['duyur', 'masa']);
    expect(a.bitenler.map((s) => s.kart.id)).toEqual(['teklif']);
    expect(a.toplam).toBe(8);
    expect(adimOzeti(a, BUGUN)).toEqual({
      cubukMetni: '1 / 8 adım bitti',
      oran: 1 / 8,
      kutular: [
        { etiket: 'Adımlar', deger: '1 / 8 bitti' },
        { etiket: 'Tarihsiz', deger: '2 adım' },
        { etiket: 'Geciken', deger: '1 adım' },
      ],
    });
  });
});

describe('ilerleme ve sıradaki (PL-3, 05 §6)', () => {
  const tai = adim('Tai chi', { tarih: '2026-10-01', saat: '07:30', tekrar: herGun });
  const yuruyus = adim('Yürüyüş', { tarih: '2026-10-01', saat: '18:00', tekrar: { gunSayisi: null, gunler: ['Pzt'], desen: null } });
  it('yalnız düzenli', () => {
    const i = ilerleme([tai, yuruyus], new Set(), BUGUN);
    expect(ilerlemeMetni(i)).toBe('0 / 1 bugün');
    expect(siradakiMetni([tai, yuruyus], new Set(), BUGUN)).toBe('Sıradaki: 07:30 Tai chi');
    expect(siradakiMetni([tai, yuruyus], new Set(['Tai chi']), BUGUN)).toBe('Bugün tamam ✓');
    expect(siradakiMetni([yuruyus], new Set(), BUGUN)).toBe('Sırada bir şey yok');
  });
  it('yalnız adım ve ikisi birden', () => {
    const adimlarListe = [adim('Arşivi ayıkla', { tarih: BUGUN }), adim('Masa', { tarihsiz: true }), adim('Bitti', { tarih: '2026-10-02', yapildi: true })];
    expect(ilerlemeMetni(ilerleme(adimlarListe, new Set(), BUGUN))).toBe('1 / 3 adım');
    expect(siradakiMetni(adimlarListe, new Set(), BUGUN)).toBe('Bugün: Arşivi ayıkla');
    expect(siradakiMetni(adimlarListe.slice(1), new Set(), BUGUN)).toBe('Sıradaki adım: Masa');
    expect(siradakiMetni([adim('X', { tarih: '2026-10-12' })], new Set(), BUGUN)).toBe('Yarın: X');
    expect(siradakiMetni([adim('X', { tarih: '2026-10-15' })], new Set(), BUGUN)).toBe('15 Ekim: X');
    expect(ilerlemeMetni(ilerleme([tai, ...adimlarListe], new Set(['Tai chi']), BUGUN))).toBe('1 / 1 bugün · 1 / 3 adım');
    expect(siradakiMetni([tai, ...adimlarListe], new Set(['Tai chi']), BUGUN)).toBe('Bugün: Arşivi ayıkla');
    expect(ilerlemeMetni(ilerleme([], new Set(), BUGUN))).toBe('—');
  });
  it('bugün durumu', () => {
    expect(bugunDurumu(tai, new Set(), BUGUN)).toBe('bekliyor');
    expect(bugunDurumu(tai, new Set(['Tai chi']), BUGUN)).toBe('yapildi');
    expect(bugunDurumu(yuruyus, new Set(), BUGUN)).toBe('yok');
  });
  it('plan bitişinden sonra düzenli kart görünmez', () => {
    const biten = { ...tai, bitis: '2026-10-10' };
    expect(bugunDurumu(biten, new Set(), BUGUN)).toBe('yok');
  });
});

describe('alan ve gelişim', () => {
  it('alan alt satırı ve puan', () => {
    expect(alanAltSatiri(2, false)).toBe('2 plan');
    expect(alanAltSatiri(0, true)).toBe('İlerlemek istiyorum');
    expect(alanAltSatiri(0, false)).toBe('Plan yok');
    expect(puanDegisimi(2, 3)).toBe('2 → 3');
    expect(puanDegisimi(0, 3)).toBe('— → 3');
  });
  it('en uzun seri ve son ölçümler', () => {
    const tai = adim('t', { tarih: '2026-10-01', tekrar: herGun });
    const yapilan = new Map([['t', new Set(['2026-10-09', '2026-10-10', BUGUN])]]);
    expect(planEnUzunSerisi([tai], yapilan, BUGUN)).toBe(3);
    const bloklar = [
      { id: 'b1', kartId: 't', tur: 'olcum' as const, ad: 'Tekrar sayısı', birim: 'tekrar' },
      { id: 'b2', kartId: 't', tur: 'olcum' as const, ad: 'Boş', birim: '' },
      { id: 'b3', kartId: 't', tur: 'talimat' as const, ad: '', birim: '' },
    ];
    const kayit = (tarih: string, d: Record<string, string>) => ({ kartId: 't', tarih, yapildi: true, degerler: d, isaretler: {}, fotolar: {} });
    expect(sonOlcumler(bloklar, [kayit('2026-10-10', { b1: '15' }), kayit('2026-10-02', { b1: '11' }), kayit('2026-10-05', { b1: ' ' })])).toEqual([
      { ad: 'Tekrar sayısı', deger: '15 tekrar (ilk: 11)' },
    ]);
  });
  it('Günün sorusu grafiği', () => {
    const g = soruGrafigi(new Map([[BUGUN, 4], ['2026-10-09', 3]]), BUGUN);
    expect(g.cubuklar.map((c) => c.etiket)).toEqual(['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Bugün']);
    expect(g.cubuklar.map((c) => c.deger)).toEqual([null, null, null, null, 3, null, 4]);
    expect(g.ortalamaMetni).toBe('Son 7 günde ortalama 3,5 / 5');
    expect(soruGrafigi(new Map(), BUGUN).ortalamaMetni).toBe('Henüz cevap yok');
  });
  it('sorulan plan: soru tanımlı ilk etkin plan', () => {
    const soru = { metin: 's', alt: 'Hiç', ust: 'Çok' };
    expect(sorulanPlan([{ durum: 'bitti' as const, gununSorusu: soru }, { durum: 'etkin' as const, gununSorusu: null }])).toBeNull();
    expect(sorulanPlan([{ durum: 'etkin' as const, gununSorusu: soru }])).not.toBeNull();
  });
});
