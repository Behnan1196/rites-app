// Uygulamayla gelen içerik (`09-hazir-icerik.md`): dokuz alan, hazır etkinlikler
// (öneri kartları) ve hazır paketler (öneri programları). Sunucudaki içerik
// kataloğu yoksa ya da indirilemezse bu kullanılır (`katalog.ts`); sunucudaki
// kataloğun ilk içeriği de buradan üretilir (`sunucu/icerik-uret.ts`).

import type { KartCesidi, KatalogBlogu } from './katalog';
import type { Tekrar } from './kart';
import type { GunKisa } from './tarih';

/** Etkinliğin bloğu: plan başlatılınca kartın blokları buna göre kurulur. */
export type EtkinlikBlogu =
  | { tur: 'sayac'; dakika: number }
  | { tur: 'video' }
  | { tur: 'olcum'; ad: string; birim: string }
  | { tur: 'talimat'; metin: string }
  | { tur: 'gunnot'; soru?: string }
  /** P-39: sayarak (+1), isteğe bağlı günlük hedef. */
  | { tur: 'adet'; ad: string; birim: string; hedef?: number };

export interface Etkinlik {
  id: string;
  baslik: string;
  tekrar: Tekrar;
  saat: string;
  blok: EtkinlikBlogu;
  /** Kütüphanem'deki türü; yoksa bloklardan tahmin edilir. */
  tur?: 'Tarif' | 'Egzersiz' | 'Bilgi' | 'Ölçüm' | 'Rutin' | 'Diğer';
}

export interface HazirPaket {
  id: string;
  ad: string;
  hafta: number;
  aciklama: string;
  etkinlikler: string[];
}

/** Uygulamayla gelen alan: hazır etkinlikleri (öneri kartları) ve paketleri (öneri programları) ile. */
export interface HazirAlan {
  anahtar: string;
  ad: string;
  aciklama: string;
  /** Ionicons simge adı. */
  ikon: string;
  etkinlikler: Etkinlik[];
  paketler: HazirPaket[];
}

const herGun: Tekrar = { gunSayisi: null, gunler: null, desen: 'hergun' };
const haftaIci: Tekrar = { gunSayisi: null, gunler: null, desen: 'haftaici' };
const gunler = (...g: GunKisa[]): Tekrar => ({ gunSayisi: null, gunler: g, desen: null });

const TURU: Record<string, Etkinlik['tur']> = {
  h1: 'Egzersiz',
  h3: 'Egzersiz',
  h4: 'Egzersiz',
  z1: 'Rutin',
  a1: 'Rutin',
  a2: 'Rutin',
  o1: 'Rutin',
  i2: 'Egzersiz',
  g1: 'Rutin',
  g2: 'Rutin',
};

const e = (id: string, baslik: string, tekrar: Tekrar, saat: string, blok: EtkinlikBlogu): Etkinlik => ({
  id,
  baslik,
  tekrar,
  saat,
  blok,
  tur: TURU[id],
});

export const ALANLAR: readonly HazirAlan[] = [
  {
    anahtar: 'hareket',
    ikon: 'walk-outline',
    ad: 'Hareket',
    aciklama: 'Esneme, yürüyüş, güç',
    etkinlikler: [
      e('h1', 'Sabah esnemesi', herGun, '07:30', { tur: 'sayac', dakika: 10 }),
      e('h2', 'Tai chi, 8 hareket', herGun, '07:45', { tur: 'video' }),
      e('h3', 'Yürüyüş', gunler('Pzt', 'Çar', 'Cum'), '18:00', { tur: 'sayac', dakika: 30 }),
      e('h4', 'Direnç egzersizi', gunler('Sal', 'Per', 'Cmt'), '18:00', {
        tur: 'olcum',
        ad: 'Tekrar sayısı',
        birim: 'tekrar',
      }),
    ],
    paketler: [
      {
        id: 'ph1',
        ad: 'Sabah hareketi',
        hafta: 4,
        aciklama: 'Her sabah esneme ve tai chi.',
        etkinlikler: ['h1', 'h2'],
      },
      { id: 'ph2', ad: 'Yürüyüşe başla', hafta: 6, aciklama: 'Haftada üç gün 30 dakika yürüyüş.', etkinlikler: ['h3'] },
    ],
  },
  {
    anahtar: 'beslenme',
    ikon: 'nutrition-outline',
    ad: 'Beslenme',
    aciklama: 'Öğün düzeni, su',
    etkinlikler: [
      e('b1', 'Su', herGun, '09:00', { tur: 'adet', ad: 'İçilen su', birim: 'bardak', hedef: 8 }),
      e('b2', 'Öğlene bir tabak sebze', herGun, '13:00', {
        tur: 'talimat',
        metin: 'Öğle yemeğinde tabağın yarısı sebze olsun.',
      }),
      e('b3', 'Akşam 20:00’den sonra yeme', herGun, '20:00', {
        tur: 'talimat',
        metin: 'Akşam yemeğini 20:00’den önce bitir.',
      }),
    ],
    paketler: [{ id: 'pb1', ad: 'Su alışkanlığı', hafta: 3, aciklama: 'Her gün 8 bardak su.', etkinlikler: ['b1'] }],
  },
  {
    anahtar: 'uyku',
    ikon: 'moon-outline',
    ad: 'Uyku',
    aciklama: 'Düzenli ve yeterli uyku',
    etkinlikler: [
      e('u1', 'Ekranı kapat', herGun, '22:30', {
        tur: 'talimat',
        metin: 'Telefonu ve televizyonu kapat, ışıkları kıs.',
      }),
      e('u2', 'Aynı saatte yat', herGun, '23:00', { tur: 'talimat', metin: 'Her gün aynı saatte yatmaya çalış.' }),
      e('u3', 'Kaç saat uyudum?', herGun, '07:00', { tur: 'olcum', ad: 'Uyku', birim: 'saat' }),
    ],
    paketler: [
      {
        id: 'pu1',
        ad: 'Uyku düzeni',
        hafta: 3,
        aciklama: 'Ekranı kapat, aynı saatte yat, uykunu yaz.',
        etkinlikler: ['u1', 'u2', 'u3'],
      },
    ],
  },
  {
    anahtar: 'zihin',
    ikon: 'sunny-outline',
    ad: 'Zihin',
    aciklama: 'Sakinlik, dikkat, okuma',
    etkinlikler: [
      e('z1', 'Nefes egzersizi', herGun, '08:15', { tur: 'sayac', dakika: 10 }),
      e('z2', 'Kitap okuma', herGun, '21:00', { tur: 'olcum', ad: 'Okunan sayfa', birim: 'sayfa' }),
    ],
    paketler: [
      {
        id: 'pz1',
        ad: 'Günde 10 dakika nefes',
        hafta: 3,
        aciklama: 'Her sabah kısa bir nefes çalışması.',
        etkinlikler: ['z1'],
      },
    ],
  },
  {
    anahtar: 'anlam',
    ikon: 'star-outline',
    ad: 'Anlam',
    aciklama: 'Değerler, şükran',
    etkinlikler: [
      e('a1', 'Şükran notu', herGun, '21:30', { tur: 'gunnot', soru: 'Bugün neye şükrediyorsun?' }),
      e('a2', 'Haftanın değerlendirmesi', gunler('Paz'), '20:00', {
        tur: 'gunnot',
        soru: 'Bu hafta sana iyi gelen neydi, neyi değiştirmek istersin?',
      }),
    ],
    paketler: [
      {
        id: 'pa1',
        ad: 'Şükran defteri',
        hafta: 4,
        aciklama: 'Her akşam şükrettiğin bir şeyi yaz.',
        etkinlikler: ['a1'],
      },
    ],
  },
  {
    anahtar: 'sosyal',
    ikon: 'people-outline',
    ad: 'Sosyal bağlar',
    aciklama: 'Aile, dostlar, çevre',
    etkinlikler: [
      e('s1', 'Bir yakınını ara', gunler('Pzt', 'Per'), '19:00', {
        tur: 'talimat',
        metin: 'Bir süredir konuşmadığın birini ara.',
      }),
      e('s2', 'Haftalık buluşma', gunler('Cmt'), '15:00', {
        tur: 'talimat',
        metin: 'Bir dostunla ya da ailenle yüz yüze buluş.',
      }),
    ],
    paketler: [
      {
        id: 'ps1',
        ad: 'Haftada iki arama',
        hafta: 4,
        aciklama: 'Yakınlarınla bağını sıcak tut.',
        etkinlikler: ['s1'],
      },
    ],
  },
  {
    anahtar: 'ogrenme',
    ikon: 'school-outline',
    ad: 'Öğrenme',
    aciklama: 'Dil, beceri, sınav',
    etkinlikler: [
      e('o1', 'İngilizce', herGun, '20:30', { tur: 'sayac', dakika: 20 }),
      e('o2', 'Yeni bir beceri', gunler('Cmt'), '17:00', { tur: 'video' }),
    ],
    paketler: [
      {
        id: 'po1',
        ad: 'Her gün 20 dakika İngilizce',
        hafta: 8,
        aciklama: 'Kısa ama her gün.',
        etkinlikler: ['o1'],
      },
    ],
  },
  {
    anahtar: 'is',
    ikon: 'briefcase-outline',
    ad: 'İş',
    aciklama: 'Çalışma hayatı ve denge',
    etkinlikler: [
      e('i1', 'Mesai sonrası ekranı kapat', haftaIci, '19:00', {
        tur: 'talimat',
        metin: 'İş e-postalarını ve mesajlarını yarına bırak.',
      }),
      e('i2', 'Öğle arası kısa yürüyüş', haftaIci, '12:30', { tur: 'sayac', dakika: 15 }),
    ],
    paketler: [
      {
        id: 'pi1',
        ad: 'İşi işte bırak',
        hafta: 4,
        aciklama: 'Mesai sonrası ekran molası.',
        etkinlikler: ['i1'],
      },
    ],
  },
  {
    anahtar: 'ugras',
    ikon: 'color-palette-outline',
    ad: 'Uğraşlar',
    aciklama: 'Hobiler, yaratıcı işler',
    etkinlikler: [
      e('g1', 'Gitar', herGun, '20:00', { tur: 'sayac', dakika: 20 }),
      e('g2', 'Resim', gunler('Cmt'), '11:00', { tur: 'sayac', dakika: 60 }),
    ],
    paketler: [
      {
        id: 'pg1',
        ad: 'Her gün 20 dakika gitar',
        hafta: 6,
        aciklama: 'Kısa ama her gün.',
        etkinlikler: ['g1'],
      },
    ],
  },
];

// ---- İsimli kart çeşitleri (pilot 24 Ekim, P-41) --------------------------------
// İlk alan Beslenme. Sunucudaki kataloğun ilk çeşitleri de buradan üretilir.

const parca = (tur: KatalogBlogu['tur'], alanlar: Partial<KatalogBlogu> = {}): KatalogBlogu => ({
  tur,
  ad: '',
  metin: '',
  birim: '',
  dakika: null,
  maddeler: [],
  dosya: null,
  ...alanlar,
});

export const HAZIR_CESITLER: readonly KartCesidi[] = [
  {
    id: 'beslenme-ogun',
    alan: 'beslenme',
    // P-49: Beslenme kartlarında seri yok (öğün, tartı… art arda gün sayılmaz).
    seri: false,
    ad: 'Öğün listesi',
    ikon: 'restaurant-outline',
    aciklama: 'Öğün planın; farklı yediğini kısaca yazarsın',
    baslik: 'Öğünlerim',
    baslikIpucu: '',
    saat: null,
    tekrar: herGun,
    bloklar: [
      parca('liste', { ad: 'Öğünler', maddeler: ['Kahvaltı', 'Öğle', 'Akşam', 'Ara öğün'] }),
      parca('gunnot', { metin: 'Plandan farklı ne yedin, ne kadar?' }),
    ],
  },
  {
    id: 'beslenme-tarif',
    alan: 'beslenme',
    // P-49: Beslenme kartlarında seri yok (öğün, tartı… art arda gün sayılmaz).
    seri: false,
    ad: 'Yemek tarifi',
    ikon: 'book-outline',
    aciklama: 'Malzemeler ve yapılışı',
    baslik: '',
    baslikIpucu: 'Örneğin: Mercimek çorbası',
    saat: null,
    tekrar: null,
    bloklar: [parca('liste', { ad: 'Malzemeler' }), parca('talimat')],
  },
  {
    id: 'beslenme-tarti',
    alan: 'beslenme',
    // P-49: Beslenme kartlarında seri yok (öğün, tartı… art arda gün sayılmaz).
    seri: false,
    ad: 'Tartı',
    ikon: 'scale-outline',
    aciklama: 'Haftada bir kilo ve bel',
    baslik: 'Tartı',
    baslikIpucu: '',
    saat: '08:00',
    tekrar: gunler('Pzt'),
    bloklar: [parca('olcum', { ad: 'Kilo', birim: 'kg' }), parca('olcum', { ad: 'Bel', birim: 'cm' })],
  },
  {
    id: 'beslenme-tabak',
    alan: 'beslenme',
    // P-49: Beslenme kartlarında seri yok (öğün, tartı… art arda gün sayılmaz).
    seri: false,
    ad: 'Tabağım',
    ikon: 'camera-outline',
    aciklama: 'Tabağının fotoğrafı',
    baslik: 'Tabağım',
    baslikIpucu: '',
    saat: null,
    tekrar: herGun,
    bloklar: [parca('talimat', { metin: 'Yemeğe başlamadan tabağının fotoğrafını çek.' }), parca('gelfoto')],
  },
  {
    id: 'beslenme-su',
    alan: 'beslenme',
    // P-49: Beslenme kartlarında seri yok (öğün, tartı… art arda gün sayılmaz).
    seri: false,
    ad: 'Su',
    ikon: 'water-outline',
    aciklama: 'İçtiğin bardakları say',
    baslik: 'Su',
    baslikIpucu: '',
    saat: null,
    tekrar: herGun,
    bloklar: [parca('adet', { ad: 'İçilen su', birim: 'bardak', dakika: 8 })],
  },
];
