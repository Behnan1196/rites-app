import { alanAdi, alanAdiHatasi, alanBul, ozelAlanlariAyarla, tumAlanlar, varsayilanAcikMi } from '../alanlar';
import { ALANLAR } from '../hazirIcerik';
import { yeniKart } from '../kart';
import {
  ajandaKarti,
  alanAltSatiri,
  bugunMetni,
  durdurmaFarki,
  durumMetni,
  etkinDurum,
  kartSirasi,
  kartZamanMetni,
  karttanIcerik,
  oneriler,
  onerdenProgram,
  programBagCoz,
  programBitisi,
  programMetni,
  programSirasi,
  siradakiMetni,
  sonOlcumler,
  sureMetni,
  uygulamaOzeti,
  VIDEO_TALIMATI,
  yildizMetni,
  type Program,
  type ProgramKarti,
} from '../program';

const BUGUN = '2026-10-20'; // Salı
let n = 0;
const kimlik = () => `k${++n}`;
beforeEach(() => {
  n = 0;
  ozelAlanlariAyarla([]);
});

const herGun = { gunSayisi: null, gunler: null, desen: 'hergun' as const };

const program = (d: Partial<Program> = {}): Program => ({
  id: 'p1',
  ad: 'Direnç egzersizi',
  alanlar: ['hareket', 'beslenme'],
  neden: '',
  sure: 21,
  durum: 'hazir',
  baslangic: null,
  yildiz: 0,
  degerlendirme: '',
  kaynak: 'Kendim',
  olusturma: '2026-10-01T00:00:00Z',
  ...d,
});

const pkart = (d: Partial<ProgramKarti> = {}): ProgramKarti => ({
  id: 'pk1',
  programId: 'p1',
  sira: 0,
  gun: 0,
  baslik: 'Araştırma videosu',
  kisa: '',
  saat: null,
  hatirlatma: null,
  alarm: false,
  tekrar: null,
  bloklar: [{ tur: 'video', ad: '', metin: 'https://youtu.be/x', birim: '', dakika: null, maddeler: [], dosya: null }],
  ...d,
});

describe('alanlar', () => {
  it('dokuz hazır alan; her paketin etkinlikleri alanda var', () => {
    expect(ALANLAR.map((a) => a.ad)).toEqual([
      'Hareket', 'Beslenme', 'Uyku', 'Zihin', 'Anlam', 'Sosyal bağlar', 'Öğrenme', 'İş', 'Uğraşlar',
    ]);
    for (const a of ALANLAR)
      for (const p of a.paketler) for (const id of p.etkinlikler) expect(a.etkinlikler.some((e) => e.id === id)).toBe(true);
    expect(varsayilanAcikMi('ogrenme')).toBe(false);
  });
  it('kişinin eklediği alan da bulunur', () => {
    ozelAlanlariAyarla([{ anahtar: 'ozel-1', ad: 'Bahçe', aciklama: '' }]);
    expect(alanAdi('ozel-1')).toBe('Bahçe');
    expect(alanBul('ozel-1')?.ikon).toBeNull();
    expect(tumAlanlar().map((a) => a.ad).at(-1)).toBe('Bahçe');
    expect(alanAdiHatasi(' ', tumAlanlar())).toBe('Alana bir ad ver.');
    expect(alanAdiHatasi('bahçe', tumAlanlar())).toBe('Bu adla bir alan var.');
    expect(alanAdiHatasi('Müzik', tumAlanlar())).toBeNull();
  });
});

describe('süre ve durum', () => {
  it('süre metni ve bitiş', () => {
    expect(sureMetni(21)).toBe('3 hafta');
    expect(sureMetni(10)).toBe('10 gün');
    expect(sureMetni(null)).toBe('Süresiz');
    expect(programBitisi({ baslangic: BUGUN, sure: 21 })).toBe('2026-11-09');
    expect(programBitisi({ baslangic: BUGUN, sure: null })).toBeNull();
  });
  it('durum metni; süresi geçen program bitti sayılır', () => {
    expect(durumMetni(program(), BUGUN)).toBe('Hazır · 3 hafta');
    const u = program({ durum: 'uygulaniyor', baslangic: '2026-10-12' });
    expect(durumMetni(u, BUGUN)).toBe('Uygulanıyor · 9. gün / 21');
    expect(durumMetni({ ...u, sure: null }, BUGUN)).toBe('Uygulanıyor · 9. gün');
    expect(durumMetni({ ...u, baslangic: '2026-10-22' }, BUGUN)).toBe('Başlıyor: 22 Ekim');
    expect(etkinDurum({ ...u, baslangic: '2026-09-01' }, BUGUN)).toBe('bitti');
    expect(durumMetni(program({ durum: 'ara' }), BUGUN)).toBe('Ara verildi');
  });
  it('sıralama: uygulanan, hazır, ara, bitti', () => {
    const l = [
      program({ id: 'b', durum: 'bitti' }),
      program({ id: 'h', durum: 'hazir' }),
      program({ id: 'u', durum: 'uygulaniyor', baslangic: BUGUN }),
      program({ id: 'a', durum: 'ara' }),
    ];
    expect(programSirasi(l, BUGUN).map((p) => p.id)).toEqual(['u', 'h', 'a', 'b']);
  });
  it('yıldız ve alan satırı', () => {
    expect(yildizMetni(4)).toBe('★★★★☆');
    expect(yildizMetni(0)).toBe('');
    expect(alanAltSatiri(1, 2, false)).toBe('1 program uygulanıyor');
    expect(alanAltSatiri(0, 2, true)).toBe('İlerlemek istiyorum');
    expect(alanAltSatiri(0, 2, false)).toBe('2 program');
    expect(alanAltSatiri(0, 0, false)).toBe('Program yok');
  });
});

describe('programın kartları', () => {
  it('zaman metni ve sıra', () => {
    expect(kartZamanMetni(pkart())).toBe('1. gün');
    expect(kartZamanMetni(pkart({ tekrar: herGun, saat: '07:30' }))).toBe('Her gün · 07:30');
    expect(kartZamanMetni(pkart({ gun: 7, tekrar: { gunSayisi: null, gunler: ['Pzt', 'Per'], desen: null } }))).toBe(
      'Pzt Per · 8. günden',
    );
    expect(kartSirasi([pkart({ id: 'b', gun: 3 }), pkart({ id: 'a', gun: 0, sira: 2 }), pkart({ id: 'c', gun: 0, sira: 1 })]).map((k) => k.id)).toEqual(['c', 'a', 'b']);
  });
  it('başlatınca ajanda kartı: gün kayar, tekrarlı bitişte durur, bağ taşır', () => {
    const p = program({ baslangic: BUGUN });
    const tek = ajandaKarti(pkart({ gun: 2 }), p, BUGUN, kimlik)!;
    expect(tek.kart).toMatchObject({ tarih: '2026-10-22', tekrar: null, bitis: null, planId: 'p1', bag: 'program:pk1' });
    expect(tek.bloklar[0]).toMatchObject({ tur: 'video', metin: 'https://youtu.be/x' });
    const tekrarli = ajandaKarti(pkart({ tekrar: herGun, saat: '07:30', hatirlatma: 'saatinde', alarm: true }), p, BUGUN, kimlik)!;
    expect(tekrarli.kart).toMatchObject({ tarih: BUGUN, bitis: '2026-11-09', hatirlatma: 'saatinde', alarm: true });
    expect(programBagCoz(tekrarli.kart.bag)).toBe('pk1');
  });
  it('uygulanırken eklenen kart bugünden önceye düşmez; bitişten sonra başlayan tekrarlı yok', () => {
    const p = program({ baslangic: '2026-10-12' });
    expect(ajandaKarti(pkart({ gun: 0 }), p, BUGUN, kimlik)!.kart.tarih).toBe(BUGUN);
    expect(ajandaKarti(pkart({ gun: 30, tekrar: herGun }), p, BUGUN, kimlik)).toBeNull();
    expect(ajandaKarti(pkart(), program(), BUGUN, kimlik)).toBeNull();
  });
  it('ajanda kartından program kartı', () => {
    const k = yeniKart('a', { baslik: 'Arkadaşını ara', tarih: '2026-10-15', tekrar: herGun, saat: '19:00' });
    expect(karttanIcerik(k, [], '2026-10-12')).toMatchObject({ gun: 3, baslik: 'Arkadaşını ara', saat: '19:00', tekrar: herGun });
    expect(karttanIcerik(k, [], null).gun).toBe(0);
  });
  it('ara ver: başlamış dizi dün biter, gelecektekiler ve yapılmamışlar silinir', () => {
    const kartlar = [
      yeniKart('eski', { baslik: 'a', tarih: '2026-10-12', tekrar: herGun, bitis: '2026-11-01' }),
      yeniKart('biten', { baslik: 'b', tarih: '2026-10-01', tekrar: herGun, bitis: '2026-10-10' }),
      yeniKart('gelecek', { baslik: 'c', tarih: '2026-10-25', tekrar: herGun }),
      yeniKart('bugun', { baslik: 'd', tarih: BUGUN }),
      yeniKart('yapilan', { baslik: 'e', tarih: BUGUN, yapildi: true }),
      yeniKart('gecmis', { baslik: 'f', tarih: '2026-10-13' }),
    ];
    expect(durdurmaFarki(kartlar, BUGUN)).toEqual({ bitir: ['eski'], sil: ['gelecek', 'bugun'] });
  });
});

describe('ilerleme ve gelişim', () => {
  it('bugün ve sıradaki', () => {
    const a = yeniKart('a', { baslik: 'Esneme', tarih: '2026-10-12', tekrar: herGun, saat: '07:30' });
    const b = yeniKart('b', { baslik: 'Arkadaşını ara', tarih: '2026-10-21' });
    expect(bugunMetni([a, b], new Set(), BUGUN)).toBe('0 / 1 bugün');
    expect(siradakiMetni([a, b], new Set(), BUGUN)).toBe('Sıradaki: 07:30 Esneme');
    expect(siradakiMetni([a, b], new Set(['a']), BUGUN)).toBe('Bugün tamam ✓');
    expect(siradakiMetni([b], new Set(), BUGUN)).toBe('Yarın: Arkadaşını ara');
    expect(siradakiMetni([], new Set(), BUGUN)).toBe('Sırada bir şey yok');
    expect(bugunMetni([b], new Set(), BUGUN)).toBeNull();
  });
  it('uygulama özeti ve son ölçümler', () => {
    const a = yeniKart('a', { baslik: 'Esneme', tarih: '2026-10-18', tekrar: herGun });
    expect(uygulamaOzeti([a], [{ kartId: 'a', tarih: '2026-10-18' }, { kartId: 'a', tarih: BUGUN }], '2026-10-18', BUGUN)).toEqual({
      yapilan: 2,
      toplam: 3,
    });
    const blok = { id: 'o', kartId: 'a', tur: 'olcum' as const, ad: 'Tekrar', birim: 'tekrar' };
    expect(
      sonOlcumler([blok], [
        { kartId: 'a', tarih: '2026-10-19', degerler: { o: '12' } },
        { kartId: 'a', tarih: '2026-10-18', degerler: { o: '10' } },
      ]),
    ).toEqual([{ ad: 'Tekrar', deger: '12 tekrar (ilk: 10)' }]);
  });
});

describe('Rites önerileri', () => {
  it('her hazır paket bir öneri; kopyası hazır program', () => {
    expect(oneriler().length).toBe(ALANLAR.reduce((t, a) => t + a.paketler.length, 0));
    const o = oneriler().find((x) => x.id === 'ph1')!;
    expect(o.sure).toBe(28);
    const { program: p, kartlar } = onerdenProgram(o, kimlik, '2026-10-20T10:00:00Z');
    expect(p).toMatchObject({ ad: 'Sabah hareketi', alanlar: ['hareket'], durum: 'hazir', kaynak: 'Rites önerisi', sure: 28 });
    expect(kartlar.map((k) => [k.baslik, k.programId, k.gun])).toEqual([
      ['Sabah esnemesi', p.id, 0],
      ['Tai chi, 8 hareket', p.id, 0],
    ]);
    expect(kartlar[1]!.bloklar.map((b) => b.tur)).toEqual(['video', 'talimat']);
    expect(kartlar[1]!.bloklar[1]!.metin).toBe(VIDEO_TALIMATI);
  });
  it('arama metni kartları da kapsar', () => {
    expect(programMetni(program(), [pkart()])).toContain('araştırma videosu');
    expect(programMetni(program(), [])).toContain('hareket');
  });
});
