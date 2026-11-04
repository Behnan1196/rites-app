import { kartUyumlari, olcumKarsilastirmalari, programDonemi, programDonemleri } from '../deneme';
import { yeniKart } from '../kart';
import type { Program } from '../program';

const program = (p: Partial<Program>): Program => ({
  id: 'p',
  ad: 'Süt ürünsüz',
  alanlar: [],
  neden: '',
  sure: 14,
  durum: 'uygulaniyor',
  baslangic: '2026-11-01',
  yildiz: 0,
  degerlendirme: '',
  kaynak: 'Kendim',
  olusturma: '2026-11-01',
  ...p,
});

describe('Program = deney (P-90)', () => {
  it('dönem: süren programda bugüne, bitende bitişe kadar; başlamamışta yok', () => {
    expect(programDonemi(program({}), '2026-11-04')).toMatchObject({ ilk: '2026-11-01', son: '2026-11-04' });
    expect(programDonemi(program({}), '2026-11-30')).toMatchObject({ son: '2026-11-14' });
    expect(programDonemi(program({ baslangic: null }), '2026-11-04')).toBeNull();
    expect(programDonemi(program({ sure: null, durum: 'bitti' }), '2026-11-04')).toBeNull();
    expect(programDonemleri([program({}), program({ id: 'x', baslangic: '2026-12-01' })], '2026-11-04')).toHaveLength(
      1,
    );
  });

  it('kart kart uyum: görünen günlerin kaçında yapıldı', () => {
    const k = yeniKart('k', {
      baslik: 'Süt ürünü yemedim',
      tarih: '2026-11-01',
      tekrar: { gunSayisi: 14, gunler: null, desen: 'hergun' },
    });
    const u = kartUyumlari(
      [k],
      [
        { kartId: 'k', tarih: '2026-11-01' },
        { kartId: 'k', tarih: '2026-11-03' },
      ],
      { ilk: '2026-11-01', son: '2026-11-04' },
      '2026-11-04',
    );
    expect(u).toEqual([{ kartId: 'k', baslik: 'Süt ürünü yemedim', yapilan: 2, toplam: 4 }]);
  });

  it('ölçümler: önceki günler ile program dönemi; programda değeri olmayan çıkmaz', () => {
    const parca = (id: string, ad: string) => ({
      id,
      kartId: 'o',
      kartBaslik: 'Günlük ölçümler',
      tur: 'puan' as const,
      ad,
      birim: '',
    });
    const kayit = (tarih: string, d: Record<string, string>) => ({ kartId: 'o', tarih, degerler: d });
    const k = olcumKarsilastirmalari(
      [parca('e', 'Enerji'), parca('c', 'Cilt')],
      [
        kayit('2026-10-28', { e: '2', c: '3' }),
        kayit('2026-10-30', { e: '3' }),
        kayit('2026-11-01', { e: '4' }),
        kayit('2026-11-02', { e: '3' }),
        kayit('2026-10-10', { e: '1' }), // 14 günden eski: sayılmaz
      ],
      { ilk: '2026-11-01', son: '2026-11-04' },
    );
    expect(k).toHaveLength(1);
    expect(k[0]).toMatchObject({ once: { ort: 2.5, gun: 2 }, sirasinda: { ort: 3.5, gun: 2 } });
  });
});
