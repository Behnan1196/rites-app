import { eklenecekParcaVarMi, secilebilirParcalar, seritOgeleri } from '../parcaSecimi';

describe('Her parça karta bir kez (P-67)', () => {
  it('kartta olan listede yok', () => {
    expect(secilebilirParcalar({ uzman: false, mevcut: ['liste'] }).gorunen).toEqual(['foto', 'video']);
    const u = secilebilirParcalar({ uzman: true, mevcut: ['olcum', 'video'] });
    expect(u.gorunen).not.toContain('video');
    expect(u.kayit).not.toContain('olcum');
    expect(u.kayit).toContain('puan');
  });
  it('proje adımları liste sayılır', () => {
    expect(secilebilirParcalar({ uzman: true, mevcut: ['adimlar'] }).gorunen).not.toContain('liste');
  });
  it('hepsi eklenince düğme yok', () => {
    expect(eklenecekParcaVarMi({ uzman: false, mevcut: ['liste', 'foto', 'video'] })).toBe(false);
    expect(eklenecekParcaVarMi({ uzman: false, mevcut: ['liste'] })).toBe(true);
    expect(
      eklenecekParcaVarMi({
        uzman: false,
        haric: ['foto'],
        mevcut: ['liste', 'video'],
      }),
    ).toBe(false);
  });
});

describe('Kartın altındaki şerit (P-68)', () => {
  it('varsayılan: açıklama kartta, şeritte Liste · Fotoğraf · Video; normal kullanıcıda Daha yok', () => {
    expect(seritOgeleri({ aciklamaVar: true, uzman: false })).toEqual({
      ogeler: ['liste', 'foto', 'video'],
      daha: false,
    });
  });
  it('açıklama kaldırılınca şeride döner; eklenen parça şeritten kalkar', () => {
    expect(seritOgeleri({ aciklamaVar: false, uzman: false, mevcut: ['video'] }).ogeler).toEqual([
      'aciklama',
      'liste',
      'foto',
    ]);
  });
  it('uzmanda Daha, öbür parçalar bitince yok', () => {
    expect(seritOgeleri({ aciklamaVar: true, uzman: true }).daha).toBe(true);
    const hepsi = secilebilirParcalar({ uzman: true });
    const mevcut = [...hepsi.gorunen, ...hepsi.kayit];
    expect(seritOgeleri({ aciklamaVar: true, uzman: true, mevcut })).toEqual({ ogeler: [], daha: false });
  });
  it('çeşit tasarımında açıklama ve fotoğraf yok', () => {
    expect(
      seritOgeleri({ aciklamaVar: false, aciklamaOlur: false, uzman: true, haric: ['foto', 'dosya'] }).ogeler,
    ).toEqual(['liste', 'video']);
  });
});

describe('P-83: listenin biçimleri', () => {
  it('Bilgi listesi ve bağlı liste ayrı parça değil; kartta varsa Liste şeritten kalkar', () => {
    const s = secilebilirParcalar({ uzman: true });
    expect(s.gorunen).not.toContain('bilgi');
    expect(s.gorunen).not.toContain('listebag');
    expect(seritOgeleri({ aciklamaVar: true, uzman: false, mevcut: ['listebag'] }).ogeler).toEqual(['foto', 'video']);
    expect(seritOgeleri({ aciklamaVar: true, uzman: false, mevcut: ['bilgi'] }).ogeler).toEqual(['foto', 'video']);
  });
});
