import { adHatasi, adTemizle, basHarf, trBuyuk, trKucuk } from '../metin';

describe('trBuyuk', () => {
  it('i harfini İ yapar, ı harfini I yapar', () => {
    expect(trBuyuk('bugün sırada')).toBe('BUGÜN SIRADA');
    expect(trBuyuk('anımsatıcılar')).toBe('ANIMSATICILAR');
    expect(trBuyuk('iş')).toBe('İŞ');
    expect(trBuyuk('günün sorusu · sabah planım')).toBe('GÜNÜN SORUSU · SABAH PLANIM');
  });
});

describe('trKucuk', () => {
  it('İ harfini i yapar, I harfini ı yapar', () => {
    expect(trKucuk('İŞ')).toBe('iş');
    expect(trKucuk('IŞIK')).toBe('ışık');
    expect(trKucuk('Zeytinyağlı ENGİNAR')).toBe('zeytinyağlı enginar');
  });
});

describe('adTemizle', () => {
  it('boşlukları düzeltir', () => {
    expect(adTemizle('  Ayşe   Nur  ')).toBe('Ayşe Nur');
    expect(adTemizle('\n\t')).toBe('');
  });
});

describe('adHatasi', () => {
  it('boş ya da yalnız boşluk olan adı kabul etmez', () => {
    expect(adHatasi('')).toBe('Önce adını yaz.');
    expect(adHatasi('   ')).toBe('Önce adını yaz.');
  });
  it('dolu adı kabul eder', () => {
    expect(adHatasi('Ayşe')).toBeNull();
    expect(adHatasi(' Behnan ')).toBeNull();
  });
});

describe('basHarf', () => {
  it('ilk harfi Türkçe büyük harfle verir', () => {
    expect(basHarf('Ayşe')).toBe('A');
    expect(basHarf('ilknur')).toBe('İ');
    expect(basHarf('ırmak')).toBe('I');
    expect(basHarf('  şule')).toBe('Ş');
  });
  it('boş adda boş metin verir', () => {
    expect(basHarf('')).toBe('');
    expect(basHarf('   ')).toBe('');
  });
  it('emoji gibi iki parçalı karakteri bölmez', () => {
    expect(basHarf('😀 Neşe')).toBe('😀');
  });
});
