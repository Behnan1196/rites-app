// Uygulamayla gelen içerik (`09-hazir-icerik.md`): dokuz alan, hazır etkinlikler
// (öneri kartları) ve hazır paketler (öneri programları). Sunucudaki içerik
// kataloğu yoksa ya da indirilemezse bu kullanılır (`katalog.ts`); sunucudaki
// kataloğun ilk içeriği de buradan üretilir (`sunucu/icerik-uret.ts`).

import type { KartCesidi, KatalogBlogu } from './katalog';
import type { Hatirlatma, Tekrar } from './kart';
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
  /** P-81: yalnız saat işin kendisiyse ("23:00'te yat"); yoksa null (saat kişinin seçimi). */
  saat: string | null;
  /** P-81: parçalar; yalnız Yaptım yetiyorsa yok. */
  bloklar: readonly EtkinlikBlogu[];
  /** P-81: kısa açıklama (talimat parçası yerine). */
  kisa?: string;
  /** P-81: kartla gelen hatırlatma ("23:00'te yat": 22:30'da). */
  hatirlatma?: Hatirlatma | null;
  /** Kütüphanem'deki türü; yoksa bloklardan tahmin edilir (P-79'dan beri gösterilmez). */
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

/**
 * P-81 (1 Kasım): öneri kartları senaryoya göre yeniden: tek iş, süre yok, saat yalnız işin
 * kendisiyse; Yaptım yetiyorsa parça yok. Hazır öneri programı yok (program kişinin kartlarından
 * sonra kurulur). Kimlikler korunur (kişinin gizlediği öneriler kaybolmasın); çıkanlar: h1 (tai
 * chi'ye katıldı), b2, u1 (23:00'te yat'a katıldı), i2, g2. Yeni: b4 (Balık ye).
 */
const e = (
  id: string,
  baslik: string,
  tekrar: Tekrar,
  bloklar: readonly EtkinlikBlogu[] = [],
  ek: Pick<Etkinlik, 'kisa' | 'saat' | 'hatirlatma'> | Partial<Pick<Etkinlik, 'kisa' | 'saat' | 'hatirlatma'>> = {},
): Etkinlik => ({
  id,
  baslik,
  tekrar,
  bloklar,
  saat: ek.saat ?? null,
  kisa: ek.kisa,
  hatirlatma: ek.hatirlatma ?? null,
});

export const ALANLAR: readonly HazirAlan[] = [
  {
    anahtar: 'hareket',
    ikon: 'walk-outline',
    ad: 'Hareket',
    aciklama: 'Esneme, yürüyüş, güç',
    etkinlikler: [
      e('h2', 'Sabah 10 dk tai chi', herGun, [{ tur: 'video' }, { tur: 'sayac', dakika: 10 }], {
        kisa: 'Videoyu açıp birlikte uygula.',
      }),
      e('h3', 'Yürüyüş', gunler('Pzt', 'Çar', 'Cum'), [{ tur: 'sayac', dakika: 30 }]),
      e('h4', 'Direnç egzersizi', gunler('Sal', 'Cum'), [{ tur: 'olcum', ad: 'Tekrar sayısı', birim: 'tekrar' }]),
    ],
    paketler: [],
  },
  {
    anahtar: 'beslenme',
    ikon: 'nutrition-outline',
    ad: 'Beslenme',
    aciklama: 'Öğün düzeni, su',
    etkinlikler: [
      e('b1', 'Günde 8 bardak su', herGun, [{ tur: 'adet', ad: 'Su', birim: 'bardak', hedef: 8 }]),
      e('b4', 'Balık ye', gunler('Sal', 'Cum'), [], { kisa: 'Haftada en az iki kez.' }),
      e('b3', 'Akşam 20:00’den sonra yeme', herGun, [], { kisa: 'Akşam yemeğini 20:00’den önce bitir.' }),
    ],
    paketler: [],
  },
  {
    anahtar: 'uyku',
    ikon: 'moon-outline',
    ad: 'Uyku',
    aciklama: 'Düzenli ve yeterli uyku',
    etkinlikler: [
      e('u2', '23:00’te yat', herGun, [], {
        saat: '23:00',
        hatirlatma: { gunOnce: 0, saat: '22:30' },
        kisa: 'Yarım saat önce ekranı kapat, ışıkları kıs.',
      }),
      e('u3', 'Kaç saat uyudum?', herGun, [{ tur: 'olcum', ad: 'Uyku', birim: 'saat' }]),
    ],
    paketler: [],
  },
  {
    anahtar: 'zihin',
    ikon: 'sunny-outline',
    ad: 'Zihin',
    aciklama: 'Sakinlik, dikkat, okuma',
    etkinlikler: [e('z1', '10 dk nefes', herGun, [{ tur: 'sayac', dakika: 10 }]), e('z2', 'Kitap oku', herGun)],
    paketler: [],
  },
  {
    anahtar: 'anlam',
    ikon: 'star-outline',
    ad: 'Anlam',
    aciklama: 'Değerler, şükran',
    etkinlikler: [
      e('a1', 'Şükran notu', herGun, [{ tur: 'gunnot', soru: 'Bugün neye şükrediyorsun?' }]),
      e('a2', 'Haftanın değerlendirmesi', gunler('Paz'), [
        { tur: 'gunnot', soru: 'Bu hafta sana iyi gelen neydi, neyi değiştirmek istersin?' },
      ]),
    ],
    paketler: [],
  },
  {
    anahtar: 'sosyal',
    ikon: 'people-outline',
    ad: 'Sosyal bağlar',
    aciklama: 'Aile, dostlar, çevre',
    etkinlikler: [
      e('s1', 'Bir yakınını ara', gunler('Pzt', 'Per'), [], { kisa: 'Bir süredir konuşmadığın birini ara.' }),
      e('s2', 'Haftalık buluşma', gunler('Cmt'), [], { kisa: 'Bir dostunla ya da ailenle yüz yüze buluş.' }),
    ],
    paketler: [],
  },
  {
    anahtar: 'ogrenme',
    ikon: 'school-outline',
    ad: 'Öğrenme',
    aciklama: 'Dil, beceri, sınav',
    etkinlikler: [
      e('o1', '20 dk İngilizce', herGun, [{ tur: 'sayac', dakika: 20 }]),
      e('o2', 'Yeni bir beceri', gunler('Cmt'), [{ tur: 'video' }], { kisa: 'Videoyu açıp birlikte uygula.' }),
    ],
    paketler: [],
  },
  {
    anahtar: 'is',
    ikon: 'briefcase-outline',
    ad: 'İş',
    aciklama: 'Çalışma hayatı ve denge',
    etkinlikler: [
      e('i1', 'Mesai sonrası ekranı kapat', haftaIci, [], {
        saat: '19:00',
        kisa: 'İş e-postalarını ve mesajlarını yarına bırak.',
      }),
    ],
    paketler: [],
  },
  {
    anahtar: 'ugras',
    ikon: 'color-palette-outline',
    ad: 'Uğraşlar',
    aciklama: 'Hobiler, yaratıcı işler',
    etkinlikler: [e('g1', '20 dk gitar', herGun, [{ tur: 'sayac', dakika: 20 }])],
    paketler: [],
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
