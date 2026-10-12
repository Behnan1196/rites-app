// Alanlar, hazır etkinlikler ve hazır paketler (`09-hazir-icerik.md`).
// Uygulamanın içinde sabittir; platformdan indirilmez.

import type { Tekrar } from './kart';
import type { GunKisa } from './tarih';

export type AlanAnahtari =
  | 'hareket'
  | 'beslenme'
  | 'uyku'
  | 'zihin'
  | 'anlam'
  | 'sosyal'
  | 'ogrenme'
  | 'is'
  | 'ugras';

/** Etkinliğin bloğu: plan başlatılınca kartın blokları buna göre kurulur. */
export type EtkinlikBlogu =
  | { tur: 'sayac'; dakika: number }
  | { tur: 'video' }
  | { tur: 'olcum'; ad: string; birim: string }
  | { tur: 'talimat'; metin: string }
  | { tur: 'gunnot' };

export interface Etkinlik {
  id: string;
  baslik: string;
  tekrar: Tekrar;
  saat: string;
  blok: EtkinlikBlogu;
}

export interface HazirPaket {
  id: string;
  ad: string;
  hafta: number;
  aciklama: string;
  etkinlikler: string[];
}

export interface Alan {
  anahtar: AlanAnahtari;
  ad: string;
  aciklama: string;
  etkinlikler: Etkinlik[];
  paketler: HazirPaket[];
}

const herGun: Tekrar = { gunSayisi: null, gunler: null, desen: 'hergun' };
const haftaIci: Tekrar = { gunSayisi: null, gunler: null, desen: 'haftaici' };
const gunler = (...g: GunKisa[]): Tekrar => ({ gunSayisi: null, gunler: g, desen: null });

const e = (id: string, baslik: string, tekrar: Tekrar, saat: string, blok: EtkinlikBlogu): Etkinlik => ({
  id,
  baslik,
  tekrar,
  saat,
  blok,
});

export const ALANLAR: readonly Alan[] = [
  {
    anahtar: 'hareket',
    ad: 'Hareket',
    aciklama: 'Esneme, yürüyüş, güç',
    etkinlikler: [
      e('h1', 'Sabah esnemesi', herGun, '07:30', { tur: 'sayac', dakika: 10 }),
      e('h2', 'Tai chi, 8 hareket', herGun, '07:45', { tur: 'video' }),
      e('h3', 'Yürüyüş', gunler('Pzt', 'Çar', 'Cum'), '18:00', { tur: 'sayac', dakika: 30 }),
      e('h4', 'Direnç egzersizi', gunler('Sal', 'Per', 'Cmt'), '18:00', { tur: 'olcum', ad: 'Tekrar sayısı', birim: 'tekrar' }),
    ],
    paketler: [
      { id: 'ph1', ad: 'Sabah hareketi', hafta: 4, aciklama: 'Her sabah esneme ve tai chi.', etkinlikler: ['h1', 'h2'] },
      { id: 'ph2', ad: 'Yürüyüşe başla', hafta: 6, aciklama: 'Haftada üç gün 30 dakika yürüyüş.', etkinlikler: ['h3'] },
    ],
  },
  {
    anahtar: 'beslenme',
    ad: 'Beslenme',
    aciklama: 'Öğün düzeni, su',
    etkinlikler: [
      e('b1', 'Su', herGun, '09:00', { tur: 'olcum', ad: 'İçilen su', birim: 'bardak' }),
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
    ad: 'Anlam',
    aciklama: 'Değerler, şükran',
    etkinlikler: [
      e('a1', 'Şükran notu', herGun, '21:30', { tur: 'gunnot' }),
      e('a2', 'Haftanın değerlendirmesi', gunler('Paz'), '20:00', { tur: 'gunnot' }),
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

export const ALAN_ANAHTARLARI = ALANLAR.map((a) => a.anahtar);

export function alanBul(anahtar: string): Alan | undefined {
  return ALANLAR.find((a) => a.anahtar === anahtar);
}

export function alanAdi(anahtar: string): string {
  return alanBul(anahtar)?.ad ?? '';
}

/** Varsayılan açık alanlar: hepsi, Öğrenme hariç. */
export function varsayilanAcikMi(anahtar: AlanAnahtari): boolean {
  return anahtar !== 'ogrenme';
}

/** Alan puanının sözleri (1–5). */
export const PUAN_SOZLERI = ['', 'Çok zayıf', 'Zayıf', 'Orta', 'İyi', 'Çok iyi'] as const;

export const HAZIR_ORNEK_METNI = "Rites'ın hazır örnekleri. Seçince uyarlayabilirsin.";
