// Nöbet / sıra (pilot 18 Ekim, grup etkinliklerinin dördüncüsü): bulaşık, çöp
// gibi dönüşümlü iş. Kuran günleri ve sırayı seçer; her seçilen günde sıradaki
// kişi (takvime göre döner, yapılmasa da geçer). Kimin günü olduğu `baslangic`tan
// bu yana kaçıncı nöbet günü olduğuyla hesaplanır; her telefon aynı sonucu bulur.
// Sırası gelenin ajandasına önümüzdeki günler için tek seferlik kartlar girer
// (`bag`: `nobet:<id>|<gün>`); "Yaptım" grupta görünür.

import { yeniKart, type Kart } from './kart';
import { gunEkle, gunFarki, haftaGunu, GUN_KISA, type Gun } from './tarih';

export interface Nobet {
  id: string;
  grup: string;
  grupAdi: string;
  kuran: string;
  ad: string;
  /** Hafta günleri, 0 = Pzt … 6 = Paz. */
  gunler: number[];
  /** Sıradaki kişiler (kullanıcı kimlikleri), sırasıyla. */
  sira: string[];
  baslangic: Gun;
  kayitlar: { gun: Gun; yapan: string }[];
}

export const NOBET_ORNEKLERI = ['Bulaşık', 'Çöp', 'Sofra', 'Çiçekleri sulamak', 'Market', 'Akşam yemeği'] as const;

export const NOBET_NOTU =
  'Sıra her seçilen günde bir sonrakine geçer (yapılmasa da). Sırası gelenin ajandasına o gün düşer; "Yaptım" grupta görünür.';

/** Ajandaya kaç gün ilerisi için kart girer. */
export const NOBET_UFKU = 14;

/** "Pzt, Per" ya da "Her gün" */
export function nobetGunleriMetni(gunler: readonly number[]): string {
  if (gunler.length >= 7) return 'Her gün';
  return [...gunler]
    .sort((a, b) => a - b)
    .map((g) => GUN_KISA[g])
    .join(', ');
}

/** O gün nöbet günü mü; öyleyse sırası kimde (yoksa null). */
export function siradaki(n: Pick<Nobet, 'gunler' | 'sira' | 'baslangic'>, gun: Gun): string | null {
  if (n.sira.length === 0 || n.gunler.length === 0 || gun < n.baslangic) return null;
  if (!n.gunler.includes(haftaGunu(gun))) return null;
  // `baslangic` ile `gun` arasındaki (gun hariç) nöbet günleri.
  const fark = gunFarki(n.baslangic, gun);
  const haftalar = Math.floor(fark / 7);
  let sayi = haftalar * new Set(n.gunler).size;
  for (let i = haftalar * 7; i < fark; i++) if (n.gunler.includes(haftaGunu(gunEkle(n.baslangic, i)))) sayi++;
  return n.sira[sayi % n.sira.length]!;
}

/** Bugünden başlayarak sıradaki `adet` nöbet günü ve kimde olduğu. */
export function yaklasanSira(n: Nobet, bugunGun: Gun, adet: number): { gun: Gun; kim: string; yapan: string | null }[] {
  const sonuc: { gun: Gun; kim: string; yapan: string | null }[] = [];
  for (let i = 0; sonuc.length < adet && i < 60; i++) {
    const gun = gunEkle(bugunGun, i);
    const kim = siradaki(n, gun);
    if (kim) sonuc.push({ gun, kim, yapan: n.kayitlar.find((k) => k.gun === gun)?.yapan ?? null });
  }
  return sonuc;
}

export function nobetFormuHatasi(ad: string, gunler: readonly number[], sira: readonly string[]): string | null {
  if (!ad.trim()) return 'Nöbete bir ad ver.';
  if (gunler.length === 0) return 'En az bir gün seç.';
  if (sira.length === 0) return 'Sıraya en az bir kişi ekle.';
  return null;
}

export function nobetHatasi(mesaj: string): string | null {
  if (mesaj.includes('grup yok')) return 'Bu grubun üyesi değilsin.';
  if (mesaj.includes('yetki yok')) return 'Nöbeti yalnız kuran değiştirebilir.';
  if (mesaj.includes('sira gecersiz')) return 'Sıradaki herkes grubun üyesi olmalı.';
  if (mesaj.includes('ad yok')) return 'Nöbete bir ad ver.';
  return null;
}

// ---- Ajandadaki kartlar ve eşitleme ----------------------------------------------------

const ONEK = 'nobet:';

export function nobetBagi(id: string, gun: Gun): string {
  return `${ONEK}${id}|${gun}`;
}

export function nobetBagCoz(bag: string | null): { id: string; gun: Gun } | null {
  if (!bag?.startsWith(ONEK)) return null;
  const [id, gun] = bag.slice(ONEK.length).split('|');
  return id && gun ? { id, gun } : null;
}

export function nobetKarti(id: string, n: Pick<Nobet, 'id' | 'ad' | 'grupAdi'>, gun: Gun): Kart {
  return yeniKart(id, {
    baslik: n.ad,
    kisa: 'Nöbet · sıra sende',
    tarih: gun,
    kaynak: 'grup',
    gelenKimden: n.grupAdi,
    bag: nobetBagi(n.id, gun),
  });
}

/**
 * Ajandadaki nöbet kartlarının olması gereken hâli: bugünden `NOBET_UFKU` gün
 * ilerisine kadar sırası bende olan her gün için bir kart. Fazlalar (sıra
 * değişti, nöbet silindi, gruptan çıkıldı) silinir; eksikler eklenir. Geçmiş
 * kartlara dokunulmaz.
 */
export function nobetEslemesi(
  kartlar: readonly { id: string; bag: string | null; tarih: string | null }[],
  nobetler: readonly Nobet[],
  ben: string,
  bugunGun: Gun,
): { ekle: { nobet: Nobet; gun: Gun }[]; sil: string[] } {
  const istenen = new Map<string, { nobet: Nobet; gun: Gun }>();
  for (const n of nobetler)
    for (let i = 0; i < NOBET_UFKU; i++) {
      const gun = gunEkle(bugunGun, i);
      if (siradaki(n, gun) === ben) istenen.set(nobetBagi(n.id, gun), { nobet: n, gun });
    }
  const var_ = new Set<string>();
  const sil: string[] = [];
  for (const k of kartlar) {
    const b = nobetBagCoz(k.bag);
    if (!b || !k.bag) continue;
    if (b.gun < bugunGun) continue;
    if (istenen.has(k.bag) && !var_.has(k.bag)) var_.add(k.bag);
    else sil.push(k.id);
  }
  const ekle = [...istenen].filter(([bag]) => !var_.has(bag)).map(([, x]) => x);
  return { ekle, sil };
}

/**
 * Telefondaki "Yaptım"lar ile sunucu arasındaki fark ([ilk, son] aralığında).
 * Başkası o günü zaten işaretlediyse yeniden yazılmaz; yalnız kendi işaretim geri alınır.
 */
export function nobetIsaretFarki(
  yerel: ReadonlySet<Gun>,
  kayitlar: readonly { gun: Gun; yapan: string }[],
  ben: string,
  ilk: Gun,
  son: Gun,
): { ekle: Gun[]; sil: Gun[] } {
  const icinde = (g: Gun) => g >= ilk && g <= son;
  const herhangi = new Set(kayitlar.map((k) => k.gun));
  const benim = kayitlar.filter((k) => k.yapan === ben && icinde(k.gun)).map((k) => k.gun);
  return {
    ekle: [...yerel].filter((g) => icinde(g) && !herhangi.has(g)).sort(),
    sil: benim.filter((g) => !yerel.has(g)).sort(),
  };
}
