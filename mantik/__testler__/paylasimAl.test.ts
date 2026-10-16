import {
  adresiTemizle, oembedAdresi, oembedBasligi, paylasilanAdres, paylasilanMetin, paylasimTaslagi, youtubeMu,
  baslangicSaniyesi, youtubeVideosu, paylasimlaraBol, paylasilanPaketi, kaynakAdi, PAYLASIM_ISARETI,
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

describe('YouTube videosu (gömülü oynatma)', () => {
  it('kimlik ve başlangıç', () => {
    expect(youtubeVideosu('https://youtu.be/dQw4w9WgXcQ?si=x&t=90')).toEqual({ kimlik: 'dQw4w9WgXcQ', baslangic: 90 });
    expect(youtubeVideosu('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m5s')).toEqual({ kimlik: 'dQw4w9WgXcQ', baslangic: 65 });
    expect(youtubeVideosu('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ kimlik: 'dQw4w9WgXcQ', baslangic: 0 });
    expect(youtubeVideosu('https://www.youtube.com/embed/dQw4w9WgXcQ?start=12')).toEqual({ kimlik: 'dQw4w9WgXcQ', baslangic: 12 });
  });
  it('YouTube değilse ya da kimlik bozuksa null', () => {
    expect(youtubeVideosu('https://vimeo.com/123')).toBeNull();
    expect(youtubeVideosu('https://www.youtube.com/watch?v=kisa')).toBeNull();
    expect(youtubeVideosu('bozuk')).toBeNull();
  });
  it('başlangıç saniyesi', () => {
    expect(baslangicSaniyesi('1h2m3s')).toBe(3723);
    expect(baslangicSaniyesi('45s')).toBe(45);
    expect(baslangicSaniyesi('abc')).toBe(0);
    expect(baslangicSaniyesi(null)).toBe(0);
  });
});

describe('biriken paylaşımlar (Rites açılmadan)', () => {
  const isaret = { shareType: 'text', value: `${PAYLASIM_ISARETI}1` };
  it('işaretlere göre bölünür', () => {
    const a = { shareType: 'url', value: 'https://youtu.be/dQw4w9WgXcQ' };
    const b = { shareType: 'text', value: 'Başlık' };
    const c = { shareType: 'url', value: 'https://example.com/x' };
    expect(paylasimlaraBol([isaret, a, b, isaret, c])).toEqual([[a, b], [c]]);
  });
  it('işaret yoksa tek paylaşım; boş paylaşım atlanır', () => {
    const a = { shareType: 'url', value: 'https://x.com' };
    expect(paylasimlaraBol([a])).toEqual([[a]]);
    expect(paylasimlaraBol([isaret])).toEqual([]);
  });
  it('kart paketi ve kaynak adı', () => {
    expect(paylasilanPaketi({ baslik: 'Yoga', videoAdresi: 'https://youtu.be/dQw4w9WgXcQ' }).bloklar).toEqual([
      { tur: 'video', ad: '', metin: 'https://youtu.be/dQw4w9WgXcQ', birim: '', dakika: null, maddeler: [] },
    ]);
    expect(kaynakAdi('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('YouTube');
    expect(kaynakAdi('https://www.vimeo.com/1')).toBe('vimeo.com');
  });
});
