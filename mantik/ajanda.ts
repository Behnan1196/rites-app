// Ajandam gün görünümü için saf yardımcılar (`05` §8, A-2, A-2b, A-8, K-12).

import { gorunurMu } from './gorunurluk';
import type { HatirlatmaSecimi, Kart, Kayit } from './kart';
import { goreliTarih, gunEkle, haftaGunu, uzunTarih, type Gun } from './tarih';

/** O günün kartları: görünenler, saat sırasıyla (saatsizler en sonda), sonra ekleniş sırası. */
export function gununKartlari<T extends Kart>(kartlar: readonly T[], gun: Gun, bugunGun: Gun): T[] {
  return kartlar
    .filter((k) => gorunurMu(k, gun, bugunGun))
    .sort((a, b) => {
      const s = (a.saat ?? '99:99').localeCompare(b.saat ?? '99:99');
      return s !== 0 ? s : a.sira - b.sira;
    });
}

/** Seçili günün haftası, Pazartesi'den Pazar'a. */
export function haftaninGunleri(gun: Gun): Gun[] {
  const pazartesi = gunEkle(gun, -haftaGunu(gun));
  return Array.from({ length: 7 }, (_, i) => gunEkle(pazartesi, i));
}

/** "Bugün · 11 Ekim Pazar", "Yarın · …", "Dün · …", yoksa "14 Ekim Çarşamba". */
export function gunBasligi(gun: Gun, bugunGun: Gun): string {
  const goreli = goreliTarih(gun, bugunGun);
  const uzun = uzunTarih(gun);
  return goreli === uzun ? uzun : `${goreli} · ${uzun}`;
}

/** Zamanlama çubuğundaki kısa tarih: "Bugün", "Yarın", "Dün" ya da "15 Ekim". */
export function kisaGoreliTarih(gun: Gun, bugunGun: Gun): string {
  const goreli = goreliTarih(gun, bugunGun);
  if (goreli !== uzunTarih(gun)) return goreli;
  return goreli.split(' ').slice(0, 2).join(' ');
}

export function tamamMetni(yapilan: number, toplam: number): string {
  return `${yapilan} / ${toplam} tamam`;
}

export function bosGunMetni(gun: Gun, bugunGun: Gun): string {
  return gun === bugunGun ? 'Bugün için kart yok' : 'Bu gün için kart yok';
}

export const HATIRLATMA_METNI: Record<HatirlatmaSecimi, string> = {
  saatinde: 'Saatinde',
  '15dk': '15 dk önce',
  '1sa': '1 saat önce',
};

/** Kayıtlardan yapılan günler (seri ve şerit için). */
export function yapilanGunler(kayitlar: readonly Kayit[]): Set<Gun> {
  return new Set(kayitlar.filter((k) => k.yapildi).map((k) => k.tarih));
}

/**
 * K-12 "Önceki": aynı kartın, açılan günden önceki en yakın, o blokta değeri
 * olan kaydı.
 */
export function oncekiDeger(
  kayitlar: readonly Kayit[],
  blokId: string,
  gun: Gun,
): { deger: string; tarih: Gun } | null {
  let enYakin: { deger: string; tarih: Gun } | null = null;
  for (const k of kayitlar) {
    const deger = k.degerler[blokId];
    if (k.tarih < gun && deger !== undefined && deger.trim() !== '' && (!enYakin || k.tarih > enYakin.tarih)) {
      enYakin = { deger, tarih: k.tarih };
    }
  }
  return enYakin;
}
