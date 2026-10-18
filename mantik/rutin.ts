// Birlikte rutin (pilot 18 Ekim, grup etkinliklerinin üçüncüsü): "Haftada 3
// yürüyüş" gibi ortak hedef. Katılan kendi günlerini seçer; ajandasına o günlerde
// tekrarlı bir kart girer (`bag`: `rutin:<id>`). Kartta "Yaptım" dediği günler
// sunucuya yazılır (yalnız gün; kartın içi telefonda kalır). Grupta kişi kişi bu
// haftaki sayı görünür. Hafta Pazartesi başlar.

import { haftaninGunleri } from './ajanda';
import { yeniKart, type Kart } from './kart';
import { GUN_KISA, gunEkle, type Gun, type GunKisa } from './tarih';

export interface Rutin {
  id: string;
  grup: string;
  grupAdi: string;
  kuran: string;
  ad: string;
  hedef: number;
  katilanlar: { kullanici: string; gunler: Gun[] }[];
}

export const RUTIN_ORNEKLERI = [
  'Yürüyüş',
  'Su içmek',
  '10 dk okuma',
  'Esneme',
  'Ekransız akşam',
  'Erken yatmak',
] as const;

export const RUTIN_NOTU =
  'Katılan kendi günlerini seçer; ajandasında o günlerde görünür. Grupta yalnız kimin bu hafta kaç kez yaptığı görünür.';

export function haftaBasi(gun: Gun): Gun {
  return haftaninGunleri(gun)[0]!;
}

/** Eşitlenen aralığın ilk günü: geçen haftanın Pazartesi'si (dünkü işaret de yetişsin). */
export function esitlemeBasi(bugunGun: Gun): Gun {
  return gunEkle(haftaBasi(bugunGun), -7);
}

/** Hedef kadar gün, haftaya yayılmış (katılırken önerilir). */
export function onerilenGunler(hedef: number): GunKisa[] {
  const ONERI: Record<number, number[]> = {
    1: [0],
    2: [1, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return (ONERI[Math.min(7, Math.max(1, hedef))] ?? [0]).map((i) => GUN_KISA[i]!);
}

export function katildimMi(r: Rutin, ben: string): boolean {
  return r.katilanlar.some((k) => k.kullanici === ben);
}

export function haftalikSayi(gunler: readonly Gun[], bugunGun: Gun): number {
  const ilk = haftaBasi(bugunGun);
  const son = gunEkle(ilk, 6);
  return gunler.filter((g) => g >= ilk && g <= son).length;
}

/** Grup ekranındaki satırlar: kişi, bu hafta kaç kez, hedefe ulaştı mı (önce ben). */
export function haftaDurumu(
  r: Rutin,
  ben: string,
  bugunGun: Gun,
): { kullanici: string; sayi: number; tamam: boolean }[] {
  return [...r.katilanlar]
    .sort((a, b) => (a.kullanici === ben ? -1 : b.kullanici === ben ? 1 : 0))
    .map((k) => {
      const sayi = haftalikSayi(k.gunler, bugunGun);
      return { kullanici: k.kullanici, sayi, tamam: sayi >= r.hedef };
    });
}

/** "Sen 2/3 · Ali 3/3 ✓" */
export function haftaOzeti(r: Rutin, ben: string, bugunGun: Gun, ad: (id: string) => string): string {
  const satirlar = haftaDurumu(r, ben, bugunGun);
  if (satirlar.length === 0) return 'Henüz katılan yok';
  return satirlar.map((s) => `${ad(s.kullanici)} ${s.sayi}/${r.hedef}${s.tamam ? ' ✓' : ''}`).join(' · ');
}

export function hedefMetni(hedef: number): string {
  return hedef >= 7 ? 'Her gün' : `Haftada ${hedef} kez`;
}

export function rutinFormuHatasi(ad: string, gunler: readonly GunKisa[] | null): string | null {
  if (!ad.trim()) return 'Rutine bir ad ver.';
  if (gunler && gunler.length === 0) return 'En az bir gün seç.';
  return null;
}

export function rutinHatasi(mesaj: string): string | null {
  if (mesaj.includes('grup yok')) return 'Bu grubun üyesi değilsin.';
  if (mesaj.includes('yetki yok')) return 'Bunu yalnız rutini kuran değiştirebilir.';
  if (mesaj.includes('ad yok')) return 'Rutine bir ad ver.';
  return null;
}

// ---- Ajandadaki kart ve eşitleme ------------------------------------------------------

const ONEK = 'rutin:';

export function rutinBagi(id: string): string {
  return ONEK + id;
}

export function rutinBagCoz(bag: string | null): string | null {
  return bag?.startsWith(ONEK) ? bag.slice(ONEK.length) || null : null;
}

/** Katılınca ajandaya giren kart: bugünden başlar, seçilen günlerde tekrarlar. */
export function rutinKarti(
  id: string,
  r: Pick<Rutin, 'id' | 'ad' | 'hedef' | 'grupAdi'>,
  gunler: GunKisa[],
  bugunGun: Gun,
): Kart {
  return yeniKart(id, {
    baslik: r.ad,
    kisa: `Birlikte rutin · ${hedefMetni(r.hedef).toLocaleLowerCase('tr')}`,
    tarih: bugunGun,
    tekrar: { gunSayisi: null, gunler: gunler.length === 7 ? null : gunler, desen: null },
    kaynak: 'grup',
    gelenKimden: r.grupAdi,
    bag: rutinBagi(r.id),
  });
}

/** Rutin artık yoksa ya da artık katılmıyorsam ajandadaki dizisi biter. */
export function bitecekKartlar(
  kartlar: readonly { id: string; bag: string | null }[],
  rutinler: readonly Rutin[],
  ben: string,
): string[] {
  const harita = new Map(rutinler.map((r) => [r.id, r]));
  return kartlar
    .filter((k) => {
      const id = rutinBagCoz(k.bag);
      if (!id) return false;
      const r = harita.get(id);
      return !r || !katildimMi(r, ben);
    })
    .map((k) => k.id);
}

/**
 * Telefondaki "Yaptım"lar ile sunucudaki günlerim arasındaki fark (yalnız
 * [ilk, son] aralığında). Telefon doğrudur: sunucuda eksik olan eklenir, fazla olan silinir.
 */
export function isaretFarki(
  yerel: ReadonlySet<Gun>,
  sunucu: readonly Gun[],
  ilk: Gun,
  son: Gun,
): { ekle: Gun[]; sil: Gun[] } {
  const icinde = (g: Gun) => g >= ilk && g <= son;
  const s = new Set(sunucu.filter(icinde));
  return {
    ekle: [...yerel].filter((g) => icinde(g) && !s.has(g)).sort(),
    sil: [...s].filter((g) => !yerel.has(g)).sort(),
  };
}
