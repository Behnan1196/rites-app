// Karar / oylama (pilot 18 Ekim, grup etkinliklerinin altıncısı): grubun üyesi
// bir soru ve seçenekler önerir; herkes oy verir (kuran tek ya da birden çok
// seçimi belirler), kim neye oy verdi adlarıyla görünür. Kuran "Karar ver" der;
// gün oylamasında seçilen güne Buluşma kurulur. İsteğe bağlı son günden sonra oy
// verilmez. Telefonda kart yok; sonuç gruptadır (buluşma olduysa o ajandaya düşer).

import { uzunTarih, type Gun } from './tarih';

export type KararTuru = 'metin' | 'gun';

export interface KararSecenegi {
  id: string;
  metin: string;
  gun: Gun | null;
  saat: string | null;
}

export interface Karar {
  id: string;
  grup: string;
  grupAdi: string;
  kuran: string;
  soru: string;
  tur: KararTuru;
  coklu: boolean;
  sonGun: Gun | null;
  yer: string;
  sonuc: string | null;
  bulusma: string | null;
  secenekler: KararSecenegi[];
  oylar: { secenek: string; kullanici: string }[];
}

export const KARAR_ORNEKLERI = ['Ne yiyelim?', 'Nereye gidelim?', 'Hangi film?', 'Hediye ne alalım?'] as const;
export const GUN_ORNEKLERI = ['Piknik', 'Akşam yemeği', 'Aile toplantısı', 'Doğum günü'] as const;

export const KARAR_NOTU = 'Herkes oy verir; kim neye verdi görünür. Sonucu sen seçersin ("Karar ver").';
export const GUN_KARARI_NOTU = 'Herkes uyan günleri işaretler. Sen bir gün seçince o güne buluşma kurulur.';

export function secenekMetni(s: KararSecenegi): string {
  if (!s.gun) return s.metin;
  return [uzunTarih(s.gun), s.saat].filter(Boolean).join(' · ');
}

export function oylarim(k: Karar, ben: string): string[] {
  return k.oylar.filter((o) => o.kullanici === ben).map((o) => o.secenek);
}

/** Seçeneğe oy verenler (oy sırası korunur). */
export function oyVerenler(k: Karar, secenek: string): string[] {
  return k.oylar.filter((o) => o.secenek === secenek).map((o) => o.kullanici);
}

/** En çok oy alan seçenek(ler); kimse oy vermediyse boş. */
export function ondeOlanlar(k: Karar): string[] {
  const say = new Map(k.secenekler.map((s) => [s.id, 0]));
  for (const o of k.oylar) say.set(o.secenek, (say.get(o.secenek) ?? 0) + 1);
  const en = Math.max(0, ...say.values());
  return en === 0 ? [] : k.secenekler.filter((s) => say.get(s.id) === en).map((s) => s.id);
}

/** Kaç kişi oy verdi. */
export function oyVerenSayisi(k: Karar): number {
  return new Set(k.oylar.map((o) => o.kullanici)).size;
}

export function oylamaAcikMi(k: Karar, bugunGun: Gun): boolean {
  return k.sonuc === null && (k.sonGun === null || k.sonGun >= bugunGun);
}

/** Oy düğmesine basınca oylarımın yeni hâli. */
export function oyDegistir(k: Karar, ben: string, secenek: string): string[] {
  const simdi = oylarim(k, ben);
  if (simdi.includes(secenek)) return simdi.filter((s) => s !== secenek);
  return k.coklu ? [...simdi, secenek] : [secenek];
}

/** "Tek seçim · son gün 25 Ekim Pazar · 3 kişi oy verdi" */
export function kararMeta(k: Karar, bugunGun: Gun): string {
  const parcalar = [k.coklu ? 'Birden çok seçilebilir' : 'Tek seçim'];
  if (k.sonuc === null && k.sonGun)
    parcalar.push(k.sonGun >= bugunGun ? `son gün ${uzunTarih(k.sonGun)}` : 'oylama bitti');
  const n = oyVerenSayisi(k);
  parcalar.push(n === 0 ? 'henüz oy yok' : `${n} kişi oy verdi`);
  return parcalar.join(' · ');
}

/** Grup ekranındaki sıra: açıklar önce, verilmiş kararlar sonra. */
export function grubunKararlari(kararlar: readonly Karar[], grup: string): Karar[] {
  return kararlar.filter((k) => k.grup === grup).sort((a, b) => Number(a.sonuc !== null) - Number(b.sonuc !== null));
}

export interface SecenekTaslagi {
  metin: string;
  gun: Gun | null;
  saat: string | null;
}

export function kararFormuHatasi(soru: string, tur: KararTuru, secenekler: readonly SecenekTaslagi[]): string | null {
  if (!soru.trim()) return tur === 'gun' ? 'Ne için gün seçiliyor? Bir ad ver.' : 'Bir soru yaz.';
  const dolu = secenekler.filter((s) => (tur === 'gun' ? s.gun : s.metin.trim()));
  if (dolu.length < 2) return tur === 'gun' ? 'En az iki gün seç.' : 'En az iki seçenek yaz.';
  if (dolu.length > 10) return 'En çok 10 seçenek olabilir.';
  return null;
}

export function kararHatasi(mesaj: string): string | null {
  if (mesaj.includes('grup yok')) return 'Bu grubun üyesi değilsin.';
  if (mesaj.includes('yetki yok')) return 'Kararı yalnız soran verebilir.';
  if (mesaj.includes('kapali')) return 'Oylama kapandı.';
  if (mesaj.includes('tek secim')) return 'Bu oylamada tek seçim var.';
  if (mesaj.includes('secenek')) return 'Seçenekleri gözden geçir: en az iki, en çok on.';
  if (mesaj.includes('ad yok')) return 'Bir soru yaz.';
  return null;
}
