// Kart verme (pilot 29 Ekim, P-62): aile içinde bir kişi, ajandasına kart eklemesine izin
// veren yakınına tasarlanmış bir kart verir. Kart alanın ajandasına tarihli düşer (bağ:
// `verilen:<id>`, kilitli: içerik verenin, saat ve hatırlatma alanın); geri dönen bilgi
// yalnız "Yaptım" günleri. Alan "Bırak" der, veren "Geri al" der.

import { gorunurMu } from './gorunurluk';
import { yeniKart, type Kart } from './kart';
import type { KartPaketi, PaketBlok } from './paylasim';
import { gunEkle, type Gun } from './tarih';

export type IzinDurumu = 'istek' | 'izinli';

/** `sahip` ajandasına `yetkili`nin kart eklemesine izin verir (ya da yetkili ister). */
export interface AjandaIzni {
  sahip: string;
  yetkili: string;
  durum: IzinDurumu;
}

export interface VerilenKart {
  id: string;
  veren: string;
  alan: string;
  kart: KartPaketi;
  baslangic: Gun;
  durum: 'aktif' | 'birakildi';
  olusturma: string;
  /** Alanın "Yaptım" dediği günler. */
  yapilan: Gun[];
}

const ONEK = 'verilen:';

export function verilenBagi(id: string): string {
  return ONEK + id;
}

export function verilenBagCoz(bag: string | null | undefined): string | null {
  return bag?.startsWith(ONEK) ? bag.slice(ONEK.length) || null : null;
}

/** İki kişi arasındaki izinler, benim açımdan. */
export function izinDurumu(
  izinler: readonly AjandaIzni[],
  ben: string,
  kisi: string,
): { benimAjandama: IzinDurumu | null; onunAjandasina: IzinDurumu | null } {
  return {
    benimAjandama: izinler.find((i) => i.sahip === ben && i.yetkili === kisi)?.durum ?? null,
    onunAjandasina: izinler.find((i) => i.sahip === kisi && i.yetkili === ben)?.durum ?? null,
  };
}

/** Bana gelen izin istekleri (Gelenler'de). */
export function izinIstekleri(izinler: readonly AjandaIzni[], ben: string): AjandaIzni[] {
  return izinler.filter((i) => i.sahip === ben && i.durum === 'istek');
}

/** Ajandaya düşen kart: verenin içeriği, kilitli; tarih başlangıç günü. */
export function verilenKarti(
  v: Pick<VerilenKart, 'id' | 'kart' | 'baslangic'>,
  verenAd: string,
  kimlik: () => string,
): { kart: Kart; bloklar: (PaketBlok & { id: string; dosya: null })[] } {
  const p = v.kart;
  return {
    kart: yeniKart(kimlik(), {
      baslik: p.baslik,
      kisa: p.kisa,
      tarih: v.baslangic,
      saat: p.saat,
      tekrar: p.tekrar ? { ...p.tekrar, gunler: p.tekrar.gunler ? [...p.tekrar.gunler] : null } : null,
      kaynak: 'koc',
      gelenKimden: verenAd,
      kilitli: true,
      bag: verilenBagi(v.id),
      sira: 0,
      // P-65: verenin görünüm ayarı; eski pakette yok (o zaman yalnız saat değişir).
      sabitler: p.sabitler ? [...p.sabitler] : null,
    }),
    bloklar: p.bloklar.map((b) => ({ ...b, maddeler: [...b.maddeler], id: kimlik(), dosya: null })),
  };
}

/**
 * Telefon ile sunucu arasındaki fark (kartı alan tarafı):
 * - bana verilen etkin kartın ajandada kartı yoksa eklenir;
 * - artık olmayan (geri alınmış) ya da bırakılmış kartın kartı silinir;
 * - telefonda yapılan ama sunucuda olmayan gün "yaptım", sunucuda olup telefonda olmayan "geri".
 */
export function verilenEslemesi(
  yerel: readonly { id: string; bag: string | null; yapilan: readonly Gun[] }[],
  sunucu: readonly VerilenKart[],
  ben: string,
): { ekle: VerilenKart[]; sil: string[]; yaptim: { kart: string; gun: Gun }[]; geri: { kart: string; gun: Gun }[] } {
  const bana = new Map(sunucu.filter((v) => v.alan === ben).map((v) => [v.id, v]));
  const sonuc = {
    ekle: [] as VerilenKart[],
    sil: [] as string[],
    yaptim: [] as { kart: string; gun: Gun }[],
    geri: [] as { kart: string; gun: Gun }[],
  };
  const kartiOlan = new Set<string>();
  for (const k of yerel) {
    const id = verilenBagCoz(k.bag);
    if (!id) continue;
    const v = bana.get(id);
    if (!v || v.durum !== 'aktif' || kartiOlan.has(id)) {
      sonuc.sil.push(k.id);
      continue;
    }
    kartiOlan.add(id);
    const sunucuda = new Set(v.yapilan);
    const telefonda = new Set(k.yapilan.filter((g) => g >= v.baslangic));
    for (const g of telefonda) if (!sunucuda.has(g)) sonuc.yaptim.push({ kart: id, gun: g });
    for (const g of sunucuda) if (!telefonda.has(g)) sonuc.geri.push({ kart: id, gun: g });
  }
  for (const v of bana.values()) if (v.durum === 'aktif' && !kartiOlan.has(v.id)) sonuc.ekle.push(v);
  return sonuc;
}

/** Verenin gördüğü kısa durum: "Bu hafta 5/7" · "Yapıldı" · "Bekliyor" · "Bıraktı". */
export function verilenOzeti(v: VerilenKart, bugunGun: Gun): string {
  if (v.durum === 'birakildi') return 'Bıraktı';
  const kart = verilenKarti(v, '', () => 'x').kart;
  if (!kart.tekrar) {
    if (v.yapilan.length > 0) return 'Yapıldı';
    return v.baslangic > bugunGun ? 'Başlamadı' : 'Bekliyor';
  }
  const gunler = son7GunPlani(kart, bugunGun);
  if (gunler.length === 0) return v.baslangic > bugunGun ? 'Başlamadı' : 'Bu hafta yok';
  const yapilan = gunler.filter((g) => v.yapilan.includes(g)).length;
  return `Bu hafta ${yapilan}/${gunler.length}`;
}

/** Son 7 günde (bugün dahil) kartın olduğu günler. */
function son7GunPlani(kart: Kart, bugunGun: Gun): Gun[] {
  const gunler: Gun[] = [];
  for (let i = 6; i >= 0; i--) {
    const g = gunEkle(bugunGun, -i);
    if (gorunurMu(kart, g, bugunGun)) gunler.push(g);
  }
  return gunler;
}

/** Son 14 günün şeridi (verenin ayrıntısında): her gün için kart var mı, yapıldı mı. */
export function son14Gun(v: VerilenKart, bugunGun: Gun): { gun: Gun; durum: 'yapildi' | 'yapilmadi' | 'yok' }[] {
  const kart = verilenKarti(v, '', () => 'x').kart;
  const sonuc: { gun: Gun; durum: 'yapildi' | 'yapilmadi' | 'yok' }[] = [];
  for (let i = 13; i >= 0; i--) {
    const g = gunEkle(bugunGun, -i);
    sonuc.push({
      gun: g,
      durum: !gorunurMu(kart, g, bugunGun) ? 'yok' : v.yapilan.includes(g) ? 'yapildi' : 'yapilmadi',
    });
  }
  return sonuc;
}

export function kartVermeHatasi(mesaj: string): string | null {
  if (mesaj.includes('izin yok')) return 'Bu kişi henüz ajandasına kart eklemene izin vermedi.';
  if (mesaj.includes('bagli degil')) return 'Yalnız bağlı olduğun kişilerle olur.';
  if (mesaj.includes('ad yok')) return 'Kartın bir başlığı olmalı.';
  return null;
}

export const IZIN_ACIKLAMASI =
  'Açarsan bu kişi ajandana kart ekleyebilir. Kartın içeriğini o belirler, saatini sen değiştirebilirsin; Yaptım bilgin ona gider.';
