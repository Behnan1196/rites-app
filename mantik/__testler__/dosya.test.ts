import { sesDosyasiMi } from '../dosya';

describe('sesDosyasiMi', () => {
  it('ses uzantılarını tanır', () => {
    expect(sesDosyasiMi('file:///belgeler/dosyalar/ab12.m4a')).toBe(true);
    expect(sesDosyasiMi('file:///x/kayit.MP3')).toBe(true);
    expect(sesDosyasiMi('blob:http://localhost/x.wav?v=1')).toBe(true);
  });
  it('öteki dosyaları ses saymaz', () => {
    expect(sesDosyasiMi('file:///x/tarif.pdf')).toBe(false);
    expect(sesDosyasiMi('file:///x/foto.jpg')).toBe(false);
    expect(sesDosyasiMi('file:///x/uzantisiz')).toBe(false);
  });
});
