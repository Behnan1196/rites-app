// Kart görünümünde neyin değişebileceği (pilot 29 Ekim, P-65). Kartı tasarlayan
// (kendisi, koç, ebeveyn) düzenleme formunun altındaki "Kart görünümünde değiştirilebilsin"
// bölümünde tarih ve saati, başlık ve açıklamayı ve her içerik parçasını açıp kapatır.
// Varsayılan: hepsi açık. Verilen kartta verenin ayarı geçerli; eski verilen / koç kartında
// (ayar yok) yalnız saat değişir. Kayıt parçaları (ölçüm, puan, günün notu…) zaten
// görünümde doldurulur; onların tanımı yalnız Düzenle'de.

import { ICERIK_BLOKLARI, type Blok, type Kart, type SabitAlan } from './kart';

type KartBilgisi = Pick<Kart, 'kilitli' | 'sabitler'>;

/** Eski verilen / koç kartı: görünüm ayarı yok. */
function eskiKilitli(kart: KartBilgisi): boolean {
  return kart.kilitli && (kart.sabitler === null || kart.sabitler === undefined);
}

/** Zaman rozeti: 'tam' (tarih ve saat) · 'saat' · 'yok'. */
export function zamanDegisimi(kart: KartBilgisi): 'tam' | 'saat' | 'yok' {
  if (eskiKilitli(kart)) return 'saat';
  return kart.sabitler?.includes('zaman') ? 'yok' : 'tam';
}

export function baslikDegisir(kart: KartBilgisi): boolean {
  return !eskiKilitli(kart) && !kart.sabitler?.includes('baslik');
}

/** P-66: açıklama ayrı bir öğe. */
export function aciklamaDegisir(kart: KartBilgisi): boolean {
  return !eskiKilitli(kart) && !kart.sabitler?.includes('aciklama');
}

/** Görünümde "Değiştir" ayarı olabilen parçalar (içerik). */
export function ayarliParcaMi(tur: Blok['tur']): boolean {
  return (ICERIK_BLOKLARI as readonly string[]).includes(tur);
}

export function parcaDegisir(kart: KartBilgisi, blok: Pick<Blok, 'tur' | 'sabit'>): boolean {
  return ayarliParcaMi(blok.tur) && !eskiKilitli(kart) && !blok.sabit;
}

/** Formdaki anahtar: alan sabit mi, değiştir. */
export function sabitDegistir(sabitler: readonly SabitAlan[], alan: SabitAlan, sabit: boolean): SabitAlan[] {
  const y = sabitler.filter((s) => s !== alan);
  return sabit ? [...y, alan].sort() : y;
}
