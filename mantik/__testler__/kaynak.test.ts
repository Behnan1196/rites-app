import { yeniKart } from '../kart';
import { gizliyiSuz, kaynakAdi, kaynakAnahtari, kaynakEtiketi, kaynaklar, kaynakTuru, suz, suzgecAcikMi, TUMU } from '../kaynak';

const planlar = new Map([['p1', 'Sabah planım']]);
const kendi = yeniKart('a', { baslik: 'a' });
const plan = yeniKart('b', { baslik: 'b', planId: 'p1' });
const gelen = yeniKart('c', { baslik: 'c', kaynak: 'gelen', gelenKimden: 'Elif' });
const liste = { ...yeniKart('d', { baslik: 'Domates' }), listeAdi: 'Market' };

describe('kaynak (PL-4, A-5)', () => {
  it('anahtar ve tür', () => {
    expect([kendi, plan, gelen, liste].map(kaynakAnahtari)).toEqual(['kendim', 'plan:p1', 'gelen', 'liste']);
    expect(kaynakTuru('plan:p1')).toBe('plan');
    expect(kaynakTuru('koc:Ayşe')).toBe('koc');
    expect(kaynakTuru('kendim')).toBe('kendim');
  });
  it('çip adları', () => {
    expect(kaynakAdi('kendim', planlar)).toBe('Kendi kartlarım');
    expect(kaynakAdi('plan:p1', planlar)).toBe('Sabah planım');
    expect(kaynakAdi('gelen', planlar)).toBe('Gelenlerden');
    expect(kaynakAdi('liste', planlar)).toBe('Ortak listeler');
    expect(kaynakAdi('koc:Ayşe Hanım', planlar)).toBe('Ayşe Hanım (koç)');
  });
  it('satır etiketi; kendi kartında yok', () => {
    expect(kaynakEtiketi(kendi, planlar)).toBeNull();
    expect(kaynakEtiketi(plan, planlar)).toBe('Sabah planım');
    expect(kaynakEtiketi(gelen, planlar)).toBe('Gelen: Elif');
    expect(kaynakEtiketi(liste, planlar)).toBe('Liste: Market');
  });
  it('çipler yalnız kartı olan kaynaklar; "Kendi kartlarım" hep başta', () => {
    expect(kaynaklar([gelen, plan, gelen])).toEqual(['kendim', 'gelen', 'plan:p1']);
    expect(kaynaklar([])).toEqual(['kendim']);
  });
  it('süzme', () => {
    expect(suz([kendi, plan, gelen], TUMU)).toHaveLength(3);
    expect(suz([kendi, plan, gelen], 'plan:p1').map((k) => k.id)).toEqual(['b']);
    expect(suz([kendi, plan, gelen], 'kendim').map((k) => k.id)).toEqual(['a']);
  });
});

describe('çoklu süzme (14 Ekim)', () => {
  it('gizlenen kaynaklar düşer; boş küme hepsini gösterir', () => {
    const kendiK = yeniKart('a', { baslik: 'a' });
    const planK = yeniKart('b', { baslik: 'b', planId: 'p1' });
    const gelenK = yeniKart('c', { baslik: 'c', kaynak: 'gelen', gelenKimden: 'Elif' });
    const hepsi = [kendiK, planK, gelenK];
    expect(gizliyiSuz(hepsi, new Set()).map((k) => k.id)).toEqual(['a', 'b', 'c']);
    expect(gizliyiSuz(hepsi, new Set(['plan:p1', 'gelen'])).map((k) => k.id)).toEqual(['a']);
    expect(suzgecAcikMi(['kendim', 'plan:p1'], new Set(['gelen']))).toBe(false);
    expect(suzgecAcikMi(['kendim', 'plan:p1'], new Set(['plan:p1']))).toBe(true);
  });
});
