// Ajandam gün görünümü için saf yardımcılar (`05` §8, A-2, A-2b, A-8, K-12).

import { ajandadaMi } from './aliskanlik';
import { gorunurMu } from './gorunurluk';
import type { HatirlatmaSecimi, Kart, Kayit } from './kart';
import { goreliTarih, gunEkle, haftaGunu, uzunTarih, type Gun } from './tarih';

/** O günün kartları: görünenler, saat sırasıyla (saatsizler en sonda), sonra ekleniş sırası. */
/**
 * Günün kartları, kişinin elle verdiği sırayla (`sira`; pilot 17 Ekim: saat sırası
 * yerine; kartlar uzun basıp sürüklenerek sıralanır).
 */
export function gununKartlari<T extends Kart>(kartlar: readonly T[], gun: Gun, bugunGun: Gun): T[] {
  // P-78: ajandada gösterilmeyen alışkanlıklar Giriş → Devam edenler'de.
  return kartlar
    .filter((k) => gorunurMu(k, gun, bugunGun) && ajandadaMi(k))
    .sort((a, b) => a.sira - b.sira || a.id.localeCompare(b.id));
}

/**
 * Yeni kartın sırası: saatsizse en sona; saatliyse, saati kendisinden sonra olan
 * ilk saatli kartın hemen önüne (sonra istenen yere taşınabilir).
 */
export function yeniKartSirasi(kartlar: readonly Pick<Kart, 'sira' | 'saat'>[], saat: string | null): number {
  const sirali = [...kartlar].sort((a, b) => a.sira - b.sira);
  const son = sirali.length ? sirali[sirali.length - 1]!.sira : 0;
  if (!saat) return son + 1;
  const i = sirali.findIndex((k) => k.saat !== null && k.saat > saat);
  if (i < 0) return son + 1;
  const sonraki = sirali[i]!.sira;
  const onceki = i > 0 ? sirali[i - 1]!.sira : sonraki - 1;
  return (onceki + sonraki) / 2;
}

/**
 * Sürüklenip bırakılan kartın yeni sırası: yeni komşularının ortası. `sira`:
 * listenin bırakıldıktan sonraki hâlindeki sıra değerleri (taşınan dahil), `i`:
 * taşınanın yeni yeri. Komşular eşitse null (liste yeniden numaralanmalı).
 */
export function tasinanSirasi(sira: readonly number[], i: number): number | null {
  const onceki = sira[i - 1];
  const sonraki = sira[i + 1];
  if (onceki === undefined && sonraki === undefined) return sira[i] ?? 0;
  if (onceki === undefined) return sonraki! - 1;
  if (sonraki === undefined) return onceki + 1;
  if (onceki === sonraki) return null;
  return (onceki + sonraki) / 2;
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

/** "1 / 4 tamam"; süzme açıksa "1 / 2 tamam · Sabah planım" (`05` §8). */
export function tamamMetni(yapilan: number, toplam: number, kaynakAdi?: string | null): string {
  return `${yapilan} / ${toplam} tamam${kaynakAdi ? ` · ${kaynakAdi}` : ''}`;
}

export function bosGunMetni(gun: Gun, bugunGun: Gun, suzuldu = false): string {
  if (suzuldu) return 'Bu kaynaktan kart yok';
  return gun === bugunGun ? 'Bugün için kart yok' : 'Bu gün için kart yok';
}

/** Hafta kutusundaki fazlalık: "+2 kart daha". */
export function fazlaMetni(adet: number): string {
  return `+${adet} kart daha`;
}

export const HATIRLATMA_METNI: Record<HatirlatmaSecimi, string> = {
  saatinde: 'Saatinde',
  '15dk': '15 dk önce',
  '1sa': '1 saat önce',
};

export { hatirlatmaMetni } from './kart';

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

/**
 * Sürükleme bitince yazılacak sıralar. `yeniDizi`: listenin bırakıldıktan sonraki
 * hâli (eski sıra değerleriyle). Çoğunlukla yalnız taşınan kart değişir; komşular
 * eşitse görünen liste artan değerlerle yeniden numaralanır.
 */
export function siraDegisikligi(
  yeniDizi: readonly { id: string; sira: number }[],
  tasinanId: string,
): Map<string, number> {
  const i = yeniDizi.findIndex((k) => k.id === tasinanId);
  if (i < 0) return new Map();
  const tek = tasinanSirasi(
    yeniDizi.map((k) => k.sira),
    i,
  );
  if (tek !== null) return tek === yeniDizi[i]!.sira ? new Map() : new Map([[tasinanId, tek]]);
  const sonuc = new Map<string, number>();
  let onceki = -Infinity;
  for (const k of yeniDizi) {
    const v = Math.max(k.id === tasinanId ? onceki + 1 : k.sira, onceki + 1);
    if (v !== k.sira) sonuc.set(k.id, v);
    onceki = v;
  }
  return sonuc;
}
