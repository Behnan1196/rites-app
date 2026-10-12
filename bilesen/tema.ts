// Tasarım sabitleri. Kaynak: rites-paket/06-tasarim-kurallari.md
// Renk ya da ölçü değişecekse yalnız burada değişir.

export const renk = {
  zemin: '#F3F5F7',
  yuzey: '#FFFFFF',
  yazi: '#17212B',
  ikincil: '#4E5B68',
  soluk: '#8A96A3',
  pasif: '#B9C3CC',
  cizgi: '#D9DFE5',
  satirCizgi: '#EEF1F4',

  ana: '#1D6B73',
  anaAcik: '#E2F0F1',
  anaKoyu: '#14525A',
  anaKoyuUstuYazi: '#CFE6E8',

  vurgu: '#C9821F',
  vurguYazi: '#8A5510',
  vurguAcik: '#F7EBD8',
  vurguAcik2: '#FBF4EA',
  vurguCizgi: '#EAD9BF',

  hata: '#B3412E',
  bolumluZemin: '#E6EAEE',

  notZemin: '#FFF6C4',
  notCizgi: '#EBDB8E',
  notSayfaZemin: '#FFFBE6',

  suDolu: '#4A90B8',
  suBos: '#E3ECF2',

  perde: 'rgba(23,33,43,0.45)',
} as const;

/** Kaynak renkleri (ajanda şeridi, etiket, süzme noktası). Kendi kartında şerit yok. */
export const kaynakRenk = {
  plan: { serit: '#1D6B73', zemin: '#E2F0F1', yazi: '#14525A' },
  koc: { serit: '#C9821F', zemin: '#FBF4EA', yazi: '#8A5510' },
  gelen: { serit: '#9A4E8C', zemin: '#F6EAF3', yazi: '#7A3A6E' },
  liste: { serit: '#6E7F2A', zemin: '#EFF2E2', yazi: '#556320' },
} as const;

/** Yazı boyutları (pt). */
export const boyut = {
  ekranBasligi: 26,
  bolumBasligi: 20,
  kartBasligi: 18,
  govde: 17,
  ikincil: 16,
  etiket: 14,
  cokKucuk: 13,
} as const;

export const olcu = {
  ekranKenari: 20,
  bolumArasi: 16,
  kartIci: 16,
  enAzDokunma: 44,
  anaDugme: 56,
  kose: { kart: 18, dugme: 14, hap: 24, etiket: 8, sayfa: 24, onay: 20 },
  altMenuYukseklik: 64,
  sayfaUstBosluk: 54,
} as const;

// Yazı tipi: Atkinson Hyperlegible Next. Yüklenemezse sistem yazı tipi kullanılır.
export type Kalinlik = 'normal' | 'yariKalin' | 'kalin';

export const YAZI_AILESI: Record<Kalinlik, string> = {
  normal: 'AtkinsonHyperlegibleNext_400Regular',
  yariKalin: 'AtkinsonHyperlegibleNext_600SemiBold',
  kalin: 'AtkinsonHyperlegibleNext_700Bold',
};

const SISTEM_KALINLIK = { normal: '400', yariKalin: '600', kalin: '700' } as const;

let yaziTipiYuklendi = false;

/** Açılışta bir kez, yazı tipi yüklendikten sonra çağrılır. */
export function yaziTipiDurumu(yuklendi: boolean) {
  yaziTipiYuklendi = yuklendi;
}

/** Text / TextInput için yazı biçimi. */
export function yazi(kalinlik: Kalinlik = 'normal') {
  return yaziTipiYuklendi
    ? { fontFamily: YAZI_AILESI[kalinlik] }
    : { fontWeight: SISTEM_KALINLIK[kalinlik] };
}
