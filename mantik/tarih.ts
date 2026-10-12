// Gün hesapları. Günler `YYYY-AA-GG` metni (telefonun yerel günü) olarak tutulur
// (`03`, `07` Zaman ve tarih). Hesaplar saat dilimi ve yaz saati kaymasından
// etkilenmesin diye UTC gece yarısı üzerinden yapılır; yalnız `bugun()` yerel
// saati okur.

/** `YYYY-AA-GG` biçiminde gün. Metin karşılaştırması tarih sırasını verir. */
export type Gun = string;

/** Haftanın günleri, Pazartesi'den başlayarak. */
export const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
export type GunKisa = (typeof GUN_KISA)[number];

export const GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'] as const;

export const AY_ADLARI = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

const GUN_DESENI = /^(\d{4})-(\d{2})-(\d{2})$/;
const GUN_MS = 86_400_000;

function ikiHane(n: number): string {
  return String(n).padStart(2, '0');
}

/** Günü UTC gece yarısına çevirir (yalnız hesap için). */
function utcMs(gun: Gun): number {
  const m = GUN_DESENI.exec(gun);
  if (!m) throw new Error(`Geçersiz gün: ${gun}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function utcGun(ms: number): Gun {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${ikiHane(d.getUTCMonth() + 1)}-${ikiHane(d.getUTCDate())}`;
}

export function gecerliGunMu(metin: string): boolean {
  if (!GUN_DESENI.test(metin)) return false;
  return utcGun(utcMs(metin)) === metin; // 2026-02-30 gibi günleri eler
}

/** Telefonun yerel saatine göre bugün. */
export function bugun(simdi: Date = new Date()): Gun {
  return `${simdi.getFullYear()}-${ikiHane(simdi.getMonth() + 1)}-${ikiHane(simdi.getDate())}`;
}

export function gunEkle(gun: Gun, gunSayisi: number): Gun {
  return utcGun(utcMs(gun) + gunSayisi * GUN_MS);
}

/** `b − a` gün olarak (a'dan b'ye kaç gün). */
export function gunFarki(a: Gun, b: Gun): number {
  return Math.round((utcMs(b) - utcMs(a)) / GUN_MS);
}

/** 0 = Pazartesi … 6 = Pazar. */
export function haftaGunu(gun: Gun): number {
  return (new Date(utcMs(gun)).getUTCDay() + 6) % 7;
}

export function gunKisa(gun: Gun): GunKisa {
  return GUN_KISA[haftaGunu(gun)]!;
}

/** "11 Ekim Pazar" */
export function uzunTarih(gun: Gun): string {
  const d = new Date(utcMs(gun));
  return `${d.getUTCDate()} ${AY_ADLARI[d.getUTCMonth()]} ${GUN_ADLARI[haftaGunu(gun)]}`;
}

/** "15 Ekim" */
export function kisaTarih(gun: Gun): string {
  const d = new Date(utcMs(gun));
  return `${d.getUTCDate()} ${AY_ADLARI[d.getUTCMonth()]}`;
}

/** "Bugün", "Yarın", "Dün", yoksa "11 Ekim Pazar". */
export function goreliTarih(gun: Gun, bugunGun: Gun): string {
  const fark = gunFarki(bugunGun, gun);
  if (fark === 0) return 'Bugün';
  if (fark === 1) return 'Yarın';
  if (fark === -1) return 'Dün';
  return uzunTarih(gun);
}

/** `ilk` ile `son` arasındaki günler (ikisi dahil). */
export function gunAraligi(ilk: Gun, son: Gun): Gun[] {
  const sonuc: Gun[] = [];
  for (let g = ilk; g <= son; g = gunEkle(g, 1)) sonuc.push(g);
  return sonuc;
}
