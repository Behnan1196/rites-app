// Koç paketi (pilot 19 Kasım, P-134): koçun ya da diyetisyenin danışana gönderdiği içerik.
// İleride koç panelinden sunucuyla gelecek; şimdilik Koçum'daki "Örnek koçla dene" uygulamanın
// içindeki örneği kurar. Rites'ın yapısına çevrilir: her antrenman bir liste kartı (Günlük
// kontrol, kendi günlerinde tekrarlı, `kaynak: koc`, kilitli), egzersizleri listenin adımları
// (bölümü, açıklaması, Setler parçası); beslenme planı her gün tekrarlı bir kartın `beslenme`
// parçası. Kartların bağı `ornekkoc:<anahtar>` (örneği kaldırınca hepsi silinir).

import type { BeslenmePlani } from './beslenme';
import { planYaz } from './beslenme';
import { yeniKart, type Blok, type Bolum, type Kart } from './kart';
import { RUTIN_GUNLUK } from './rutinAdimlari';
import { setHedefiYaz, type SetHedefi } from './setler';
import type { Gun, GunKisa } from './tarih';

export interface PaketEgzersizi {
  ad: string;
  bolum: Bolum;
  aciklama: string;
  /** Setsiz egzersizde (ısınma, esneme) yok; "Yaptım" ile işaretlenir. */
  hedef?: SetHedefi;
}

export interface PaketAntrenmani {
  anahtar: string;
  ad: string;
  gun: GunKisa;
  saat: string | null;
  egzersizler: PaketEgzersizi[];
}

export interface PaketKocu {
  ad: string;
  unvan: string;
  /** Avatarda iki harf. */
  bas: string;
}

export interface KocPaketi {
  surum: 1;
  /** Programın gün sayısı (antrenmanlar ve beslenme bu kadar sürer). */
  gunSayisi: number;
  antrenman: { koc: PaketKocu; ad: string; not: string; antrenmanlar: PaketAntrenmani[] } | null;
  beslenme: { koc: PaketKocu; ad: string; not: string; plan: BeslenmePlani } | null;
}

/** Telefonda tutulan koç bilgisi (Koçum'un başı). */
export interface KocBilgisi {
  ornek: boolean;
  kuruldu: Gun;
  bitis: Gun | null;
  antrenman: (PaketKocu & { program: string }) | null;
  beslenme: (PaketKocu & { program: string }) | null;
}

export const ORNEK_BAG = 'ornekkoc:';

type Taslak = { kart: Kart; bloklar: Omit<Blok, 'kartId' | 'sira'>[] };

/** Paketi telefona kurulacak kartlara çevirir (sırası: önce liste, sonra adımları). */
export function paketKartlari(p: KocPaketi, bugunGun: Gun, idUret: () => string): Taslak[] {
  const sonuc: Taslak[] = [];
  const parca = (tur: Blok['tur'], metin: string): Omit<Blok, 'kartId' | 'sira'> => ({
    id: idUret(),
    tur,
    ad: '',
    metin,
    birim: '',
    dakika: null,
    maddeler: [],
    dosya: null,
  });
  if (p.antrenman) {
    const koc = p.antrenman.koc.ad;
    for (const a of p.antrenman.antrenmanlar) {
      const id = idUret();
      sonuc.push({
        kart: yeniKart(id, {
          baslik: a.ad,
          kisa: p.antrenman.not,
          tarih: bugunGun,
          saat: a.saat,
          tekrar: { gunSayisi: p.gunSayisi, gunler: [a.gun], desen: null },
          kaynak: 'koc',
          gelenKimden: koc,
          kilitli: true,
          bag: `${ORNEK_BAG}antrenman:${a.anahtar}`,
          rutin: RUTIN_GUNLUK,
        }),
        bloklar: [],
      });
      a.egzersizler.forEach((e, i) => {
        sonuc.push({
          kart: yeniKart(idUret(), {
            baslik: e.ad,
            kisa: e.aciklama,
            tarih: bugunGun,
            tekrar: { gunSayisi: null, gunler: null, desen: 'hergun' },
            kaynak: 'koc',
            gelenKimden: koc,
            kilitli: true,
            bag: `${ORNEK_BAG}egzersiz:${a.anahtar}:${i}`,
            ust: id,
            ustSira: i + 1,
            bolum: e.bolum,
          }),
          bloklar: e.hedef ? [parca('setler', setHedefiYaz(e.hedef))] : [],
        });
      });
    }
  }
  if (p.beslenme) {
    sonuc.push({
      kart: yeniKart(idUret(), {
        baslik: p.beslenme.ad,
        kisa: p.beslenme.not,
        tarih: bugunGun,
        tekrar: { gunSayisi: p.gunSayisi, gunler: null, desen: 'hergun' },
        kaynak: 'koc',
        gelenKimden: p.beslenme.koc.ad,
        kilitli: true,
        bag: `${ORNEK_BAG}beslenme`,
      }),
      bloklar: [parca('beslenme', planYaz(p.beslenme.plan))],
    });
  }
  return sonuc;
}

export function kocBilgisi(p: KocPaketi, bugunGun: Gun, bitis: Gun | null): KocBilgisi {
  return {
    ornek: true,
    kuruldu: bugunGun,
    bitis,
    antrenman: p.antrenman ? { ...p.antrenman.koc, program: p.antrenman.ad } : null,
    beslenme: p.beslenme ? { ...p.beslenme.koc, program: p.beslenme.ad } : null,
  };
}

// ---- Örnek paket (uydurma kişiler; gösterim için) ------------------------------------

const h = (set: number, tekrar: number, dinlenme: number, agirlik = ''): SetHedefi => ({
  set,
  tekrar,
  agirlik,
  dinlenme,
});

export const ORNEK_PAKET: KocPaketi = {
  surum: 1,
  gunSayisi: 28,
  antrenman: {
    koc: { ad: 'Ali Kaya', unvan: 'Fitness koçu (örnek)', bas: 'AK' },
    ad: 'Güç ve denge · 4 hafta',
    not: 'Haftada üç gün. Ağırlıklar başlangıç için; kolay gelirse bir sonraki hafta biraz artır.',
    antrenmanlar: [
      {
        anahtar: 'A',
        ad: 'Bacak ve kalça',
        gun: 'Pzt',
        saat: null,
        egzersizler: [
          { ad: 'Yerinde yürüyüş', bolum: 'isinma', aciklama: '2 dakika, kolları da salla.' },
          { ad: 'Kalça çevirme', bolum: 'isinma', aciklama: 'Her yöne 10 kez, yavaşça.' },
          {
            ad: 'Squat',
            bolum: 'ana',
            aciklama: 'Ayaklar omuz genişliğinde; sandalyeye oturur gibi in, dizler ayak ucunu geçmesin.',
            hedef: h(3, 10, 60),
          },
          {
            ad: 'Lunge',
            bolum: 'ana',
            aciklama: 'Bir adım öne at, iki dizini de bük, öndeki topukla itip dön. Her bacakla.',
            hedef: h(3, 10, 60),
          },
          {
            ad: 'Köprü',
            bolum: 'ana',
            aciklama: 'Sırtüstü, dizler bükük; kalçayı kaldır, iki saniye tut, indir.',
            hedef: h(3, 12, 45),
          },
          {
            ad: 'Baldır kaldırma',
            bolum: 'ana',
            aciklama: 'Parmak uçlarında yüksel, yavaşça in.',
            hedef: h(3, 15, 45),
          },
          { ad: 'Arka bacak esnetme', bolum: 'soguma', aciklama: 'Her bacak 30 saniye; zorlamadan.' },
        ],
      },
      {
        anahtar: 'B',
        ad: 'Göğüs, sırt ve kol',
        gun: 'Çar',
        saat: null,
        egzersizler: [
          { ad: 'Kol çevirme', bolum: 'isinma', aciklama: 'Öne ve geriye 1 dakika.' },
          {
            ad: 'Duvar şınavı',
            bolum: 'ana',
            aciklama: 'Duvara bir kol boyu uzakta dur, göğsünü duvara yaklaştır, it.',
            hedef: h(3, 10, 60),
          },
          {
            ad: 'Lastikle kürek çekme',
            bolum: 'ana',
            aciklama: 'Lastiği ayağına geçir, dirsekleri geriye çek, kürek kemiklerini sık.',
            hedef: h(3, 12, 60),
          },
          {
            ad: 'Omuz press',
            bolum: 'ana',
            aciklama: 'Dambılları omuz hizasından yukarı it, yavaşça indir.',
            hedef: h(3, 10, 60, '4'),
          },
          {
            ad: 'Biceps curl',
            bolum: 'ana',
            aciklama: 'Dirsekler gövdede, dambılları kaldır, yavaş indir.',
            hedef: h(3, 12, 45, '4'),
          },
          { ad: 'Göğüs esnetme', bolum: 'soguma', aciklama: 'Kapı kenarında kolunu aç, 30 saniye.' },
        ],
      },
      {
        anahtar: 'C',
        ad: 'Tüm vücut ve denge',
        gun: 'Cum',
        saat: null,
        egzersizler: [
          { ad: 'Yerinde yürüyüş', bolum: 'isinma', aciklama: '2 dakika.' },
          {
            ad: 'Sandalyeden kalkma',
            bolum: 'ana',
            aciklama: 'Kollar göğüste, sandalyeden kalk, yavaşça otur.',
            hedef: h(3, 12, 60),
          },
          {
            ad: 'Kuş-köpek',
            bolum: 'ana',
            aciklama: 'Dört ayak üstünde; karşı kol ve bacağı uzat, 2 saniye tut. Her yana.',
            hedef: h(3, 10, 45),
          },
          { ad: 'Tek ayak denge', bolum: 'ana', aciklama: 'Bir sandalyeye yakın dur; her ayakla 3 kez 20 saniye.' },
          { ad: 'Derin nefes', bolum: 'soguma', aciklama: '2 dakika, burundan al, ağızdan yavaş ver.' },
        ],
      },
    ],
  },
  beslenme: {
    koc: { ad: 'Dyt. Selin Öz', unvan: 'Diyetisyen (örnek)', bas: 'SÖ' },
    ad: 'Beslenme planı',
    not: 'Öğün saatleri yaklaşık; farklı yediğinde "Farklı yedim" de, hesap yapma.',
    plan: {
      gunler: [0, 1, 0, 1, 0, 1, 0].map((v) =>
        v === 0
          ? [
              {
                id: 'kahvalti',
                ad: 'Kahvaltı',
                saat: '08:00',
                icerik: '2 yumurta, 1 dilim peynir, 5 zeytin, 1 dilim tam buğday ekmek',
                miktarlar: [
                  { ad: 'Haşlanmış yumurta', miktar: '2 adet' },
                  { ad: 'Beyaz peynir', miktar: '1 kibrit kutusu' },
                  { ad: 'Zeytin', miktar: '5 adet' },
                  { ad: 'Tam buğday ekmek', miktar: '1 ince dilim' },
                ],
                degisimler: ['2 et', '1 süt', '1 ekmek', '1 yağ'],
                secenekler: ['Yulaflı kahvaltı (tarif)', 'Menemen, 1 dilim ekmek'],
                not: '',
                tarif: null,
              },
              {
                id: 'ogle',
                ad: 'Öğle',
                saat: '13:00',
                icerik: 'Izgara tavuk, bulgur pilavı, salata',
                miktarlar: [
                  { ad: 'Tavuk göğsü, ızgara', miktar: '120 g · avuç içi' },
                  { ad: 'Bulgur pilavı', miktar: '6 yemek kaşığı' },
                  { ad: 'Mevsim salata', miktar: '1 kase' },
                  { ad: 'Zeytinyağı', miktar: '1 tatlı kaşığı' },
                ],
                degisimler: ['3 et', '2 ekmek', '1 sebze', '1 yağ'],
                secenekler: ['Izgara köfte, bulgur, salata', 'Ton balıklı salata, 2 dilim tam buğday ekmek'],
                not: 'Dışarıda yersen ızgara köfte de olur; ekmeği yarım dilim tut.',
                tarif: 'bulgur',
              },
              {
                id: 'ara',
                ad: 'Ara öğün',
                saat: '16:00',
                icerik: '1 kase yoğurt, 10 badem',
                miktarlar: [
                  { ad: 'Yoğurt', miktar: '1 kase' },
                  { ad: 'Çiğ badem', miktar: '10 adet' },
                ],
                degisimler: ['1 süt', '1 yağ'],
                secenekler: ['1 meyve, 2 ceviz'],
                not: '',
                tarif: null,
              },
              {
                id: 'aksam',
                ad: 'Akşam',
                saat: '19:00',
                icerik: 'Zeytinyağlı taze fasulye, cacık',
                miktarlar: [
                  { ad: 'Zeytinyağlı taze fasulye', miktar: '1 tabak' },
                  { ad: 'Cacık', miktar: '1 kase' },
                  { ad: 'Tam buğday ekmek', miktar: '1 ince dilim' },
                ],
                degisimler: ['2 sebze', '1 süt', '1 ekmek', '2 yağ'],
                secenekler: ['Mercimek çorbası, salata, yoğurt'],
                not: '',
                tarif: 'fasulye',
              },
            ]
          : [
              {
                id: 'kahvalti',
                ad: 'Kahvaltı',
                saat: '08:00',
                icerik: 'Yulaflı kahvaltı, 1 meyve',
                miktarlar: [
                  { ad: 'Yulaf', miktar: '4 yemek kaşığı' },
                  { ad: 'Süt', miktar: '1 su bardağı' },
                  { ad: 'Elma ya da armut', miktar: '1 küçük' },
                ],
                degisimler: ['1 süt', '1 ekmek', '1 meyve'],
                secenekler: ['2 yumurta, peynir, 1 dilim ekmek'],
                not: '',
                tarif: 'yulaf',
              },
              {
                id: 'ogle',
                ad: 'Öğle',
                saat: '13:00',
                icerik: 'Mercimek çorbası, ton balıklı salata',
                miktarlar: [
                  { ad: 'Mercimek çorbası', miktar: '1 kase' },
                  { ad: 'Ton balığı, süzülmüş', miktar: 'yarım kutu' },
                  { ad: 'Yeşil salata', miktar: '1 kase' },
                ],
                degisimler: ['2 et', '1 ekmek', '1 sebze', '1 yağ'],
                secenekler: ['Izgara tavuk, bulgur, salata'],
                not: '',
                tarif: 'mercimek',
              },
              {
                id: 'ara',
                ad: 'Ara öğün',
                saat: '16:00',
                icerik: '1 meyve, 2 ceviz',
                miktarlar: [
                  { ad: 'Mevsim meyvesi', miktar: '1 orta' },
                  { ad: 'Ceviz', miktar: '2 bütün' },
                ],
                degisimler: ['1 meyve', '1 yağ'],
                secenekler: ['1 kase yoğurt, 10 badem'],
                not: '',
                tarif: null,
              },
              {
                id: 'aksam',
                ad: 'Akşam',
                saat: '19:00',
                icerik: 'Fırında balık, haşlanmış sebze',
                miktarlar: [
                  { ad: 'Balık', miktar: '150 g · avuç içi' },
                  { ad: 'Haşlanmış sebze', miktar: '1 tabak' },
                  { ad: 'Tam buğday ekmek', miktar: '1 ince dilim' },
                ],
                degisimler: ['3 et', '2 sebze', '1 ekmek'],
                secenekler: ['Izgara köfte, salata'],
                not: '',
                tarif: null,
              },
            ],
      ),
      tarifler: [
        {
          id: 'bulgur',
          ad: 'Bulgur pilavı',
          sure: '25 dk',
          degisim: '2 ekmek',
          malzemeler: ['1 su bardağı pilavlık bulgur', '1 kuru soğan', '1 yemek kaşığı zeytinyağı', '2 su bardağı su'],
          yapilis: [
            'Soğanı zeytinyağında kavur.',
            'Bulguru ekle, 2 dakika çevir.',
            'Suyu ekle, kısık ateşte suyunu çekene kadar pişir.',
          ],
        },
        {
          id: 'fasulye',
          ad: 'Zeytinyağlı taze fasulye',
          sure: '40 dk',
          degisim: '2 sebze, 2 yağ',
          malzemeler: ['500 g taze fasulye', '1 soğan', '2 domates', '2 yemek kaşığı zeytinyağı'],
          yapilis: [
            'Soğanı zeytinyağında öldür.',
            'Fasulye ve rendelenmiş domatesi ekle.',
            'Az su ile kısık ateşte yumuşayana kadar pişir.',
          ],
        },
        {
          id: 'mercimek',
          ad: 'Mercimek çorbası',
          sure: '35 dk',
          degisim: '1 ekmek',
          malzemeler: ['1 su bardağı kırmızı mercimek', '1 soğan', '1 havuç', '6 su bardağı su'],
          yapilis: ['Hepsini tencereye koy, yumuşayana kadar pişir.', 'Blenderdan geçir; limonla ser.'],
        },
        {
          id: 'yulaf',
          ad: 'Yulaflı kahvaltı',
          sure: '5 dk',
          degisim: '1 süt, 1 ekmek',
          malzemeler: ['4 yemek kaşığı yulaf', '1 su bardağı süt', 'Tarçın'],
          yapilis: ['Yulafı sütle karıştır, 2–3 dakika pişir ya da bir gece bekletir.', 'Tarçın serp.'],
        },
      ],
      alisveris: [
        'Yumurta (15)',
        'Beyaz peynir',
        'Zeytin',
        'Tam buğday ekmek',
        'Tavuk göğsü (500 g)',
        'Bulgur',
        'Yoğurt (1 kg)',
        'Badem',
        'Taze fasulye (500 g)',
        'Kırmızı mercimek',
        'Ton balığı (2 kutu)',
        'Balık (2 porsiyon)',
        'Yulaf',
        'Süt',
        'Mevsim meyvesi ve sebzesi',
      ],
    },
  },
};
