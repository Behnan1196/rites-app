// Tekrarlı kartı düzenleme ve silme: "Yalnız bu gün" / "Bu gün ve sonrası" (`05` §4, K-14).
//
// Fonksiyonlar veritabanına dokunmaz; yapılacak işlerin listesini döndürür.
// Veri katmanı bu listeyi tek bir yazma işleminde sırayla uygular.
//
// Ürün sahibinin kararı (silme): kart tamamen silinince kendi kayıtları da
// silinir. "Bu gün ve sonrası" silmede geçmiş kayıtlar yerinde kalır.

import type { Kart, Kayit, Tekrar } from './kart';
import { gunEkle, gunFarki, uzunTarih, type Gun } from './tarih';

/**
 * Düzenleme formundan gelen tanım alanları. `tarihsiz` yalnız plan adımı
 * düzenlenirken verilir (tarih seçilince adım tarihsiz olmaktan çıkar).
 */
export type KartTanimi = Pick<Kart, 'baslik' | 'kisa' | 'tarih' | 'saat' | 'hatirlatma' | 'tekrar'> & {
  tarihsiz?: boolean;
  alarm?: boolean;
};

export type KayitAraligi =
  | { tur: 'tek'; gun: Gun }
  | { tur: 'sonrasi'; gun: Gun } // gun dahil, sonrası
  | { tur: 'hepsi' };

export type KartIslemi =
  | { tur: 'kartGuncelle'; kart: Kart }
  | { tur: 'kartEkle'; kart: Kart }
  | { tur: 'kartSil'; kartId: string }
  /** Formdaki blokları bu karta yaz (yeni kartta blok kimlikleri yenilenir). */
  | { tur: 'bloklariYaz'; kartId: string }
  /**
   * Kayıtları bir karttan ötekine taşı. Yeni kartın blok kimlikleri farklıysa
   * kayıtlardaki anahtarlar `kayitAnahtarlariniEsle` ile çevrilir; tek seferlik
   * hedef kartın `yapildi` kısa yolu taşınan kayda göre güncellenir.
   */
  | { tur: 'kayitTasi'; kaynakKartId: string; hedefKartId: string; aralik: KayitAraligi }
  | { tur: 'kayitSil'; kartId: string; aralik: KayitAraligi };

export interface BolmeSonucu {
  islemler: KartIslemi[];
  /** İşlem sonrası kısa mesaj; doğrudan düzenlemede yok. */
  mesaj: string | null;
}

export type BolmeSecimi = 'yalnizBuGun' | 'buGunVeSonrasi';

function baslangic(kart: Kart): Gun | null {
  return kart.tarih;
}

/**
 * "Yalnız bu gün / bu gün ve sonrası" sorusu sorulmalı mı?
 * Yalnız tekrarlı kart, başlangıcından sonraki bir günden düzenlenir/silinirken.
 */
export function bolmeSorusuGerekirMi(kart: Kart, gun: Gun): boolean {
  const bas = baslangic(kart);
  return kart.tekrar !== null && bas !== null && gun > bas;
}

/** Sorunun seçenekleri (K-14). */
export function bolmeSecenekleri(gun: Gun) {
  const tarih = uzunTarih(gun);
  return {
    yalnizBuGun: `Yalnız ${tarih}`,
    buGunVeSonrasi: `${tarih} ve sonrası`,
    not: 'Geçmiş günlerin kayıtları değişmez.',
  };
}

function ayniTekrarMi(a: Tekrar | null, b: Tekrar | null): boolean {
  if (a === null || b === null) return a === b;
  const gunlerA = [...(a.gunler ?? [])].sort().join(',');
  const gunlerB = [...(b.gunler ?? [])].sort().join(',');
  return a.gunSayisi === b.gunSayisi && a.desen === b.desen && gunlerA === gunlerB;
}

/**
 * "Bu gün ve sonrası" ile açılan yeni dizinin tekrarı. Kişi tekrar ayarını
 * değiştirmediyse dizinin bitişi kaymasın: "30 gün" kalan güne indirilir.
 * Değiştirdiyse yeni ayar yeni dizinin ilk gününden sayılır.
 */
function yeniDizininTekrari(eski: Kart, tanim: KartTanimi, gun: Gun): Tekrar | null {
  if (!tanim.tekrar) return null;
  if (!ayniTekrarMi(eski.tekrar, tanim.tekrar) || tanim.tekrar.gunSayisi === null) return tanim.tekrar;
  const bas = baslangic(eski) ?? gun;
  const kalan = tanim.tekrar.gunSayisi - gunFarki(bas, gun);
  return { ...tanim.tekrar, gunSayisi: Math.max(1, kalan) };
}

/**
 * Düzenlemeyi kaydet. `secim` yalnız `bolmeSorusuGerekirMi` true ise kullanılır;
 * değilse değişiklik doğrudan karta uygulanır.
 */
export function duzenle(
  kart: Kart,
  gun: Gun,
  tanim: KartTanimi,
  secim: BolmeSecimi | null,
  yeniId: () => string,
): BolmeSonucu {
  if (!bolmeSorusuGerekirMi(kart, gun) || secim === null) {
    return {
      islemler: [{ tur: 'kartGuncelle', kart: { ...kart, ...tanim } }, { tur: 'bloklariYaz', kartId: kart.id }],
      mesaj: null,
    };
  }

  if (secim === 'yalnizBuGun') {
    const yeni: Kart = {
      ...kart,
      ...tanim,
      id: yeniId(),
      tarih: gun,
      tekrar: null,
      bitis: null,
      atlanan: [],
      yapildi: false,
      birakildi: false,
    };
    return {
      islemler: [
        { tur: 'kartGuncelle', kart: { ...kart, atlanan: [...kart.atlanan, gun].sort() } },
        { tur: 'kartEkle', kart: yeni },
        { tur: 'bloklariYaz', kartId: yeni.id },
        { tur: 'kayitTasi', kaynakKartId: kart.id, hedefKartId: yeni.id, aralik: { tur: 'tek', gun } },
      ],
      mesaj: 'Yalnız bu gün değişti',
    };
  }

  // Bu gün ve sonrası
  const tekrar = yeniDizininTekrari(kart, tanim, gun);
  const yeni: Kart = {
    ...kart,
    ...tanim,
    id: yeniId(),
    tarih: gun,
    tekrar,
    bitis: tekrar ? kart.bitis : null,
    atlanan: tekrar ? kart.atlanan.filter((g) => g >= gun) : [],
    yapildi: false,
    birakildi: false,
  };
  const eski: Kart = {
    ...kart,
    bitis: gunEkle(gun, -1),
    atlanan: kart.atlanan.filter((g) => g < gun),
  };
  return {
    islemler: [
      { tur: 'kartGuncelle', kart: eski },
      { tur: 'kartEkle', kart: yeni },
      { tur: 'bloklariYaz', kartId: yeni.id },
      { tur: 'kayitTasi', kaynakKartId: kart.id, hedefKartId: yeni.id, aralik: { tur: 'sonrasi', gun } },
    ],
    mesaj: 'Bu günden sonrası değişti; geçmiş kayıtlar yerinde',
  };
}

/** Silme. `secim` yalnız `bolmeSorusuGerekirMi` true ise kullanılır. */
export function sil(kart: Kart, gun: Gun, secim: BolmeSecimi | null): BolmeSonucu {
  if (!bolmeSorusuGerekirMi(kart, gun) || secim === null) {
    return {
      islemler: [
        { tur: 'kayitSil', kartId: kart.id, aralik: { tur: 'hepsi' } },
        { tur: 'kartSil', kartId: kart.id },
      ],
      mesaj: 'Kart silindi',
    };
  }
  if (secim === 'yalnizBuGun') {
    return {
      islemler: [
        { tur: 'kartGuncelle', kart: { ...kart, atlanan: [...kart.atlanan, gun].sort() } },
        { tur: 'kayitSil', kartId: kart.id, aralik: { tur: 'tek', gun } },
      ],
      mesaj: 'Bu gün silindi',
    };
  }
  return {
    islemler: [
      {
        tur: 'kartGuncelle',
        kart: { ...kart, bitis: gunEkle(gun, -1), atlanan: kart.atlanan.filter((g) => g < gun) },
      },
      { tur: 'kayitSil', kartId: kart.id, aralik: { tur: 'sonrasi', gun } },
    ],
    mesaj: 'Bu günden sonrası silindi; geçmiş kayıtlar yerinde',
  };
}

/**
 * Tamamen silmeden önceki onay (soru sorulmayan durum).
 * Tek seferlik kart: "Kart silinsin mi?". Tekrarlı kart ilk gününden silinirken
 * kayıtları varsa ek uyarı: "Bu kartın geçmiş kayıtları da silinecek."
 */
export function silmeOnayi(kart: Kart, kayitVarMi: boolean): { baslik: string; aciklama: string | null } {
  return {
    baslik: 'Kart silinsin mi?',
    aciklama: kart.tekrar !== null && kayitVarMi ? 'Bu kartın geçmiş kayıtları da silinecek.' : null,
  };
}

/** Taşınan kaydın blok anahtarlarını yeni kartın blok kimliklerine çevirir. Eşlenmeyen anahtar atılır. */
export function kayitAnahtarlariniEsle(kayit: Kayit, hedefKartId: string, esleme: ReadonlyMap<string, string>): Kayit {
  const cevir = <T>(nesne: Record<string, T>): Record<string, T> => {
    const sonuc: Record<string, T> = {};
    for (const [anahtar, deger] of Object.entries(nesne)) {
      const yeni = esleme.get(anahtar);
      if (yeni) sonuc[yeni] = deger;
    }
    return sonuc;
  };
  return {
    ...kayit,
    kartId: hedefKartId,
    degerler: cevir(kayit.degerler),
    isaretler: cevir(kayit.isaretler),
    fotolar: cevir(kayit.fotolar),
  };
}

/** Kayıt bu aralıkta mı? */
export function aralikta(gun: Gun, aralik: KayitAraligi): boolean {
  if (aralik.tur === 'hepsi') return true;
  if (aralik.tur === 'tek') return gun === aralik.gun;
  return gun >= aralik.gun;
}
