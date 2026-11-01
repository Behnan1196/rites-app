import { alanAdi, alanBul, hazirAlanAnahtarlari, tumAlanlar, varsayilanAcikMi } from '../alanlar';
import {
  ayniKatalog,
  blokCoz,
  gomuluKatalog,
  katalog,
  katalogAyarla,
  katalogCoz,
  katalogDenensinMi,
  KATALOG_SURUMU,
  tekrarCoz,
  sadeKatalog,
} from '../katalog';
import { oneriBul, oneriKartBul, oneriler } from '../program';

afterEach(() => katalogAyarla(null));

const ham = {
  alanlar: [
    { anahtar: 'hareket', ad: 'Hareket ve güç', aciklama: 'Yeni açıklama', ikon: 'barbell-outline', sira: 2 },
    { anahtar: 'nefes', ad: 'Nefes', aciklama: '', sira: 1, varsayilan_acik: false },
    { anahtar: 'eski', ad: 'Eski', aktif: false },
    { anahtar: 'ozel-x', ad: 'Olamaz' },
    { ad: 'Anahtarsız' },
  ],
  kartlar: [
    {
      id: 'k1',
      alanlar: ['hareket'],
      baslik: ' Duvar şınavı ',
      saat: '18:00',
      tekrar: { gunler: ['Cum', 'Pzt', 'Xyz'] },
      bloklar: [{ tur: 'video', metin: 'https://y.t/v' }, { tur: 'sayac' }, { tur: 'bilinmeyen' }],
    },
    { id: 'k2', baslik: 'Su', saat: '25:00', tekrar: {}, bloklar: [{ tur: 'olcum', ad: 'Su', birim: 'bardak' }] },
    { id: 'k3', baslik: 'Pasif', aktif: false },
    { id: 'k1', baslik: 'Aynı kimlik' },
  ],
  programlar: [
    {
      id: 'p1',
      alanlar: ['hareket'],
      ad: 'Evde güç',
      sure: 21,
      kartlar: [{ kart: 'k1', gun: 0 }, { kart: 'k2', gun: 7 }, { kart: 'yok' }],
    },
    { id: 'p2', ad: 'Kartsız', kartlar: [{ kart: 'yok' }] },
  ],
};

describe('katalog denetimi', () => {
  it('bozuk ve pasif öğeler atlanır; sıra ve varsayılanlar', () => {
    const k = katalogCoz(ham)!;
    expect(k.alanlar.map((a) => [a.anahtar, a.ad, a.varsayilanAcik])).toEqual([
      ['nefes', 'Nefes', false],
      ['hareket', 'Hareket ve güç', true],
    ]);
    expect(k.kartlar.map((c) => c.id)).toEqual(['k1', 'k2']);
    const k1 = k.kartlar[0]!;
    expect(k1).toMatchObject({ baslik: 'Duvar şınavı', saat: '18:00', tur: 'Egzersiz' });
    expect(k1.tekrar).toEqual({ gunSayisi: null, gunler: ['Pzt', 'Cum'], desen: null });
    expect(k1.bloklar.map((b) => [b.tur, b.dakika])).toEqual([
      ['video', null],
      ['sayac', 10],
    ]);
    expect(k.kartlar[1]).toMatchObject({
      saat: null,
      tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
      tur: 'Ölçüm',
    });
    expect(k.programlar).toEqual([
      {
        id: 'p1',
        alanlar: ['hareket'],
        ad: 'Evde güç',
        aciklama: '',
        sure: 21,
        kartlar: [
          { kart: 'k1', gun: 0 },
          { kart: 'k2', gun: 7 },
        ],
      },
    ]);
  });
  it('alanı olmayan ya da biçimsiz katalog geçersiz', () => {
    expect(katalogCoz(null)).toBeNull();
    expect(katalogCoz({ alanlar: [] })).toBeNull();
    expect(katalogCoz('x')).toBeNull();
  });
  it('tekrar ve blok', () => {
    expect(tekrarCoz({ desen: 'haftaici', gunler: ['Pzt'] })).toEqual({
      gunSayisi: null,
      gunler: null,
      desen: 'haftaici',
    });
    expect(tekrarCoz({ gunSayisi: 30 })).toEqual({ gunSayisi: 30, gunler: null, desen: 'hergun' });
    expect(tekrarCoz('her gün')).toBeNull();
    expect(blokCoz({ tur: 'liste', maddeler: ['a', '', 3, ' b '] })).toMatchObject({
      maddeler: ['a', 'b'],
      dosya: null,
    });
  });
});

describe('şu anki katalog', () => {
  it('uygulamayla gelen: dokuz alan, öneri kartları ve programları', () => {
    const g = gomuluKatalog();
    expect(g.alanlar.length).toBe(9);
    expect(katalogCoz(JSON.parse(JSON.stringify(g)))).toEqual(g); // kendi biçimini okur
    expect(oneriKartBul('b1')).toMatchObject({ baslik: 'Günde 8 bardak su', alanlar: ['beslenme'], tur: 'Ölçüm' });
    expect(varsayilanAcikMi('ogrenme')).toBe(false);
  });
  it('indirilen katalog alanları ve önerileri değiştirir; kalkan alan adıyla bulunur', () => {
    katalogAyarla(katalogCoz(ham));
    expect(hazirAlanAnahtarlari()).toEqual(['nefes', 'hareket']);
    expect(tumAlanlar().map((a) => a.ad)).toEqual(['Nefes', 'Hareket ve güç']);
    expect(alanBul('hareket')?.ikon).toBe('barbell-outline');
    expect(alanAdi('uyku')).toBe('Uyku'); // katalogdan kalktı, etiketlerde adı kalır
    expect(varsayilanAcikMi('nefes')).toBe(false);
    expect(oneriler().map((o) => o.id)).toEqual(['p1']);
    expect(oneriBul('p1')!.kartlar.map((k) => [k.baslik, k.gun])).toEqual([
      ['Duvar şınavı', 0],
      ['Su', 7],
    ]);
    expect(ayniKatalog(katalog(), sadeKatalog(katalogCoz(ham)!))).toBe(true);
    expect(ayniKatalog(katalog(), gomuluKatalog())).toBe(false);
  });
  it('en çok 6 saatte bir indirilir', () => {
    const simdi = new Date('2026-10-20T12:00:00Z');
    expect(katalogDenensinMi(null, simdi)).toBe(true);
    expect(katalogDenensinMi('2026-10-20T07:00:00Z', simdi)).toBe(false);
    expect(katalogDenensinMi('2026-10-20T05:59:00Z', simdi)).toBe(true);
  });
  it('P-81: uygulamanın katalog sürümü değişince 6 saat beklenmez', () => {
    const simdi = new Date('2026-10-20T12:00:00Z');
    expect(katalogDenensinMi('2026-10-20T11:00:00Z', simdi, null)).toBe(true);
    expect(katalogDenensinMi('2026-10-20T11:00:00Z', simdi, KATALOG_SURUMU - 1)).toBe(true);
    expect(katalogDenensinMi('2026-10-20T11:00:00Z', simdi, KATALOG_SURUMU)).toBe(false);
  });
});

describe('Sade öneriler (P-79, P-81)', () => {
  it('öneriler: program yok, süre yok; saat yalnız işin kendisiyse; hatırlatma kartla gelir', () => {
    const s = sadeKatalog(gomuluKatalog());
    expect(s.programlar).toEqual([]);
    expect(s.kartlar.every((c) => !c.tekrar || c.tekrar.gunSayisi === null)).toBe(true);
    expect(s.kartlar.filter((c) => c.saat).map((c) => [c.id, c.saat])).toEqual([
      ['u2', '23:00'],
      ['i1', '19:00'],
    ]);
    expect(s.kartlar.find((c) => c.id === 'u2')!.hatirlatma).toEqual({ gunOnce: 0, saat: '22:30' });
    const su = s.kartlar.find((c) => c.id === 'b1')!;
    expect(su.baslik).toBe('Günde 8 bardak su');
    expect(su.bloklar.map((b) => [b.tur, b.birim, b.dakika])).toEqual([['adet', 'bardak', 8]]);
    expect(s.kartlar.find((c) => c.id === 'a1')!.bloklar.map((b) => b.tur)).toEqual(['gunnot']);
    expect(s.kartlar.find((c) => c.id === 'h2')!.bloklar.map((b) => b.tur)).toEqual(['video', 'sayac']);
    expect(s.kartlar.some((c) => c.bloklar.some((b) => b.tur === 'talimat'))).toBe(false);
    expect(s.kartlar.length).toBe(18);
  });
  it('sunucudan eski içerik gelirse: talimat açıklamaya, tek kartlı program gösterilmez', () => {
    const ham = katalogCoz({
      alanlar: [{ anahtar: 'beslenme', ad: 'Beslenme' }],
      kartlar: [
        { id: 'x', baslik: 'Sebze', bloklar: [{ tur: 'talimat', metin: 'Yarısı sebze.' }], hatirlatma: '15dk' },
        { id: 'y', baslik: 'Su', bloklar: [] },
      ],
      programlar: [
        { id: 'p1', ad: 'Tek', kartlar: [{ kart: 'x', gun: 0 }] },
        {
          id: 'p2',
          ad: 'İki',
          kartlar: [
            { kart: 'x', gun: 0 },
            { kart: 'y', gun: 0 },
          ],
        },
      ],
    })!;
    const s = sadeKatalog(ham);
    expect(s.kartlar[0]).toMatchObject({ kisa: 'Yarısı sebze.', bloklar: [], hatirlatma: '15dk' });
    expect(s.programlar.map((p) => p.id)).toEqual(['p2']);
  });
});
