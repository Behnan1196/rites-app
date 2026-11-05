// Alışkanlıklar (pilot 31 Ekim, P-78). Alışkanlık, izlenen tekrarlı karttır: kişi "Alışkanlık
// olarak izle" der ya da kart bir programın tekrarlı kartıdır. Alışkanlıklar Giriş → Devam
// edenler'de bugünün Yaptım'ı ve kısa gidişatıyla durur; gidişat ekranında son haftaları,
// serisi ve ilerlemesi. Varsayılan olarak ajandada görünmez ("Ajandada göster" ile görünür);
// hatırlatmaları sürer.

import { gorunurMu, type SeritDurumu, type SeritGunu } from './gorunurluk';
import type { Kart } from './kart';
import { programBagCoz } from './program';
import { gunEkle, gunFarki, type Gun } from './tarih';

type AliskanlikAlanlari = Pick<Kart, 'tekrar' | 'aliskanlik' | 'planId' | 'bag'> & Pick<Partial<Kart>, 'olcumlerim'>;

/** Programın kartı mı (ajandaya programdan düşen). */
export function programKartiMi(k: Pick<Kart, 'planId' | 'bag'>): boolean {
  return !!k.planId || programBagCoz(k.bag) !== null;
}

/** Alışkanlık mı: tekrarlı ve (seçilmiş ya da programın kartı). */
export function aliskanlikMi(k: AliskanlikAlanlari): boolean {
  if (k.olcumlerim) return false;
  return k.tekrar !== null && (!!k.aliskanlik || programKartiMi(k));
}

/** Ajandada görünür mü: alışkanlık varsayılan olarak görünmez; öbür kartlar her zaman görünür. */
export function ajandadaMi(k: AliskanlikAlanlari & Pick<Kart, 'ajandada'>): boolean {
  // P-91: Ölçümlerim de varsayılan olarak ajandada görünmez.
  if (k.olcumlerim) return k.ajandada === true;
  if (!aliskanlikMi(k)) return true;
  return k.ajandada === true;
}

/** Son `n` günün şeridi (bugün en sağda). */
export function sonGunler(kart: Kart, yapilan: ReadonlySet<Gun>, bugunGun: Gun, n: number): SeritGunu[] {
  const sonuc: SeritGunu[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const gun = gunEkle(bugunGun, -i);
    let durum: SeritDurumu;
    if (!gorunurMu(kart, gun, bugunGun)) durum = 'yok';
    else if (yapilan.has(gun)) durum = 'yapildi';
    else durum = 'yapilmadi';
    sonuc.push({ gun, durum });
  }
  return sonuc;
}

/** Süreli alışkanlıkta kaçıncı gün: { gun: 12, toplam: 21 }; süresizde null. */
export function ilerleme(kart: Pick<Kart, 'tekrar' | 'tarih'>, bugunGun: Gun): { gun: number; toplam: number } | null {
  const toplam = kart.tekrar?.gunSayisi;
  if (!toplam || !kart.tarih) return null;
  const gun = gunFarki(kart.tarih, bugunGun) + 1;
  return { gun: Math.min(toplam, Math.max(0, gun)), toplam };
}

/** Giriş'teki kısa gidişat: "5 gün üst üste · 12/21. gün" / "Son 7 günde 3 kez". */
export function kisaGidisat(kart: Kart, yapilan: ReadonlySet<Gun>, bugunGun: Gun, seri: number): string {
  const parcalar: string[] = [];
  if (seri > 1) parcalar.push(`${seri} gün üst üste`);
  else {
    const n = sonGunler(kart, yapilan, bugunGun, 7).filter((g) => g.durum === 'yapildi').length;
    parcalar.push(n > 0 ? `Son 7 günde ${n} kez` : 'Henüz başlamadı');
  }
  const il = ilerleme(kart, bugunGun);
  if (il) parcalar.push(`${il.gun}/${il.toplam}. gün`);
  return parcalar.join(' · ');
}

/** Sürüyor mu: önümüzdeki 7 gün içinde (bugün dahil) görünecek bir günü var. */
export function surenAliskanlikMi(kart: Kart, bugunGun: Gun): boolean {
  for (let i = 0; i < 7; i++) if (gorunurMu(kart, gunEkle(bugunGun, i), bugunGun)) return true;
  return false;
}
