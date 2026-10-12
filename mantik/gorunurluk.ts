// Bir kart bir günde görünür mü (`05` §1), tekrar metni, seri ve son 7 gün (`05` §3).

import type { Kart, Tekrar } from './kart';
import { gunEkle, gunFarki, GUN_KISA, haftaGunu, type Gun, type GunKisa } from './tarih';

/** Tekrarın o haftanın gününü kapsayıp kapsamadığı. */
function haftaGunuUygunMu(tekrar: Tekrar, gun: Gun): boolean {
  const hg = haftaGunu(gun);
  if (tekrar.desen === 'haftaici') return hg <= 4;
  if (tekrar.desen === 'haftasonu') return hg >= 5;
  if (tekrar.desen === 'hergun') return true;
  if (tekrar.gunler && tekrar.gunler.length > 0) return tekrar.gunler.includes(GUN_KISA[hg]!);
  return true;
}

/**
 * `05` §1. `bugunGun`, tarihi olmayan (tarihsiz olmayan) tek seferlik kartın
 * bugüne ait sayılması için gerekir.
 */
export function gorunurMu(kart: Kart, gun: Gun, bugunGun: Gun): boolean {
  if (kart.tarihsiz) return false;
  if (!kart.tekrar) return gun === (kart.tarih ?? bugunGun);

  const baslangic = kart.tarih ?? bugunGun;
  if (gun < baslangic) return false;
  if (kart.bitis && gun > kart.bitis) return false;
  if (kart.atlanan.includes(gun)) return false;
  const { gunSayisi } = kart.tekrar;
  if (gunSayisi !== null && gunFarki(baslangic, gun) >= gunSayisi) return false;
  return haftaGunuUygunMu(kart.tekrar, gun);
}

function siraliGunler(gunler: readonly GunKisa[]): GunKisa[] {
  return GUN_KISA.filter((g) => gunler.includes(g));
}

/**
 * Tekrar metni (`05` §1.4): "Her gün", "Pzt Çar Cum", "30 gün", "30 gün · Pzt Per".
 * Desenler: "Hafta içi", "Hafta sonu".
 */
export function tekrarMetni(tekrar: Tekrar): string {
  const parcalar: string[] = [];
  if (tekrar.gunSayisi !== null) parcalar.push(`${tekrar.gunSayisi} gün`);

  if (tekrar.desen === 'haftaici') parcalar.push('Hafta içi');
  else if (tekrar.desen === 'haftasonu') parcalar.push('Hafta sonu');
  else {
    const gunler = tekrar.desen === 'hergun' || !tekrar.gunler ? [] : siraliGunler(tekrar.gunler);
    const herGun = gunler.length === 0 || gunler.length === 7;
    if (!herGun) parcalar.push(gunler.join(' '));
    else if (parcalar.length === 0) parcalar.push('Her gün');
  }
  return parcalar.join(' · ');
}

/**
 * Kartın şu anki serisi (`05` §3). Seri her zaman bugüne göre hesaplanır:
 * bugün yapıldıysa bugünden, yapılmadıysa dünden geriye bakılır; kartın
 * görünmediği günler atlanır; görünür olup yapılmamış ilk günde durur.
 * Tekrarsız kartta 0.
 */
export function seri(kart: Kart, yapilanGunler: ReadonlySet<Gun>, bugunGun: Gun): number {
  if (!kart.tekrar) return 0;
  const baslangic = kart.tarih ?? bugunGun;
  let gun = yapilanGunler.has(bugunGun) && gorunurMu(kart, bugunGun, bugunGun) ? bugunGun : gunEkle(bugunGun, -1);
  let sayi = 0;
  for (; gun >= baslangic; gun = gunEkle(gun, -1)) {
    if (!gorunurMu(kart, gun, bugunGun)) continue;
    if (!yapilanGunler.has(gun)) break;
    sayi++;
  }
  return sayi;
}

/** Plan Gelişim'indeki "En uzun seri": planın tekrarlı kartlarının şu anki serilerinin en büyüğü. */
export function enUzunSeri(seriler: readonly number[]): number {
  return seriler.reduce((enBuyuk, s) => Math.max(enBuyuk, s), 0);
}

/** Son 7 gün şeridindeki bir günün durumu. */
export type SeritDurumu =
  | 'yapildi' // ✓ görünür ve yapıldı
  | 'yapilmadi' // – görünür, yapılmadı (geçmiş ya da bugün)
  | 'gelecek' // boş: görünür, henüz gelmedi
  | 'yok'; // · kartın o gün olmadığı gün

export interface SeritGunu {
  gun: Gun;
  durum: SeritDurumu;
}

/** Son 7 gün şeridi (K-13): açılan gün en sağda. */
export function son7Gun(
  kart: Kart,
  acilanGun: Gun,
  yapilanGunler: ReadonlySet<Gun>,
  bugunGun: Gun,
): SeritGunu[] {
  const sonuc: SeritGunu[] = [];
  for (let i = 6; i >= 0; i--) {
    const gun = gunEkle(acilanGun, -i);
    let durum: SeritDurumu;
    if (!gorunurMu(kart, gun, bugunGun)) durum = 'yok';
    else if (yapilanGunler.has(gun)) durum = 'yapildi';
    else if (gun > bugunGun) durum = 'gelecek';
    else durum = 'yapilmadi';
    sonuc.push({ gun, durum });
  }
  return sonuc;
}

/** K-13: "Seri: 4 gün üst üste" / "Seri henüz başlamadı". Seri bozulunca ayrıca bir şey söylenmez. */
export function seriMetni(sayi: number): string {
  return sayi > 0 ? `Seri: ${sayi} gün üst üste` : 'Seri henüz başlamadı';
}
