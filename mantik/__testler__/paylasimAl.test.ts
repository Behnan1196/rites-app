import {
  adresiTemizle, oembedAdresi, oembedBasligi, paylasilanAdres, paylasilanMetin, paylasimTaslagi, youtubeMu,
} from '../paylasimAl';

describe('paylaşılan bağlantı', () => {
  it('url öğesi ya da metnin içindeki ilk adres', () => {
    expect(paylasilanAdres([{ shareType: 'url', value: 'https://youtu.be/abc?si=x' }])).toBe('https://youtu.be/abc?si=x');
    expect(paylasilanAdres([{ shareType: 'text', value: 'Şuna bak: https://www.youtube.com/watch?v=abc).' }])).toBe('https://www.youtube.com/watch?v=abc');
    expect(paylasilanAdres([{ shareType: 'text', value: 'bağlantı yok' }])).toBeNull();
    expect(paylasilanAdres([])).toBeNull();
  });
  it('bağlantı dışındaki metin', () => {
    expect(paylasilanMetin([{ shareType: 'text', value: 'Sabah yogası  https://youtu.be/abc' }])).toBe('Sabah yogası');
    expect(paylasilanMetin([{ shareType: 'url', value: 'https://youtu.be/abc' }])).toBeNull();
  });
  it('YouTube tanıma ve takip eklerini atma', () => {
    expect(youtubeMu('https://youtu.be/abc')).toBe(true);
    expect(youtubeMu('https://m.youtube.com/watch?v=abc')).toBe(true);
    expect(youtubeMu('https://notyoutube.com/x')).toBe(false);
    expect(youtubeMu('çöp')).toBe(false);
    expect(adresiTemizle('https://youtu.be/abc?si=XYZ&t=42')).toBe('https://youtu.be/abc?t=42');
    expect(adresiTemizle('https://www.youtube.com/watch?v=abc&feature=shared')).toBe('https://www.youtube.com/watch?v=abc');
    expect(adresiTemizle('https://ornek.com/?si=1')).toBe('https://ornek.com/?si=1');
  });
  it('oEmbed', () => {
    expect(oembedAdresi('https://youtu.be/abc?t=1')).toBe('https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fyoutu.be%2Fabc%3Ft%3D1');
    expect(oembedBasligi({ title: ' 10 dakikada esneme ' })).toBe('10 dakikada esneme');
    expect(oembedBasligi({ title: '' })).toBeNull();
    expect(oembedBasligi(null)).toBeNull();
  });
  it('kart taslağı: başlık sırası', () => {
    expect(paylasimTaslagi('https://youtu.be/abc?si=1', 'Esneme', 'Metin')).toEqual({ baslik: 'Esneme', videoAdresi: 'https://youtu.be/abc' });
    expect(paylasimTaslagi('https://youtu.be/abc', null, 'Metin').baslik).toBe('Metin');
    expect(paylasimTaslagi('https://youtu.be/abc', null, null).baslik).toBe('YouTube videosu');
    expect(paylasimTaslagi('https://www.ornek.com/v', null, null).baslik).toBe('ornek.com');
  });
});
