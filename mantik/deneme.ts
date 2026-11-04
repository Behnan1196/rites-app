// Programın değerlendirmesi (pilot 4 Kasım, P-90: "program = deney"): belirli bir süre bazı
// şeylere uyup (süt ürünü yok, terle) durumunun (enerji, cilt…) nasıl değiştiğini görmek.
// - Uyum: programın her kartı, görünen günlerin kaçında yapıldı.
// - Ölçümler: bütün kartlardaki ölçüm parçaları (Sayarak, Ölçüm, Puan) için programdan önceki
//   günlerin ortalaması ile program dönemininki yan yana. Yorum yok; az veride uyarı.
// - Gidişat tablosunda programın günleri işaretlenir (`programDonemleri`).

import { sayiOku } from './gidisat';
import { gorunurMu } from './gorunurluk';
import type { Kart } from './kart';
import { programBitisi, uygulaniyorMu, type Program } from './program';
import { gunEkle, type Gun } from './tarih';

/** Programdan önce karşılaştırılan gün sayısı. */
export const ONCE_GUN = 14;
/** Bundan az günü olan ortalama "az veri" sayılır. */
export const AZ_VERI = 3;

export interface ProgramDonemi {
  programId: string;
  ad: string;
  ilk: Gun;
  son: Gun;
}

/** Programın son (ya da süren) uygulamasının günleri; bitişi bilinmeyen ve süren değilse yok. */
export function programDonemi(p: Program, bugunGun: Gun): ProgramDonemi | null {
  if (!p.baslangic || p.baslangic > bugunGun) return null;
  const bitis = programBitisi(p);
  const son = bitis ? (bitis < bugunGun ? bitis : bugunGun) : uygulaniyorMu(p, bugunGun) ? bugunGun : null;
  if (!son) return null;
  return { programId: p.id, ad: p.ad, ilk: p.baslangic, son };
}

export function programDonemleri(programlar: readonly Program[], bugunGun: Gun): ProgramDonemi[] {
  return programlar.map((p) => programDonemi(p, bugunGun)).filter((d): d is ProgramDonemi => d !== null);
}

export interface KartUyumu {
  kartId: string;
  baslik: string;
  yapilan: number;
  toplam: number;
}

export function kartUyumlari(
  kartlar: readonly Kart[],
  yapilanlar: readonly { kartId: string; tarih: Gun }[],
  donem: Pick<ProgramDonemi, 'ilk' | 'son'>,
  bugunGun: Gun,
): KartUyumu[] {
  const yapildi = new Set(yapilanlar.map((y) => `${y.kartId}|${y.tarih}`));
  return kartlar
    .map((k) => {
      let yapilan = 0;
      let toplam = 0;
      for (let g = donem.ilk; g <= donem.son; g = gunEkle(g, 1)) {
        if (!gorunurMu(k, g, bugunGun)) continue;
        toplam++;
        if (yapildi.has(`${k.id}|${g}`)) yapilan++;
      }
      return { kartId: k.id, baslik: k.baslik, yapilan, toplam };
    })
    .filter((u) => u.toplam > 0);
}

export interface OlcumParcasi {
  id: string;
  kartId: string;
  kartBaslik: string;
  tur: 'adet' | 'olcum' | 'puan';
  ad: string;
  birim: string;
}

export interface Ortalama {
  ort: number | null;
  gun: number;
}

export interface OlcumKarsilastirmasi {
  parca: OlcumParcasi;
  once: Ortalama;
  sirasinda: Ortalama;
}

const ADI: Record<OlcumParcasi['tur'], string> = { adet: 'Sayı', olcum: 'Ölçüm', puan: 'Puan' };

export function olcumKarsilastirmalari(
  parcalar: readonly OlcumParcasi[],
  kayitlar: readonly { kartId: string; tarih: Gun; degerler: Record<string, string> }[],
  donem: Pick<ProgramDonemi, 'ilk' | 'son'>,
  onceGun = ONCE_GUN,
): OlcumKarsilastirmasi[] {
  const onceIlk = gunEkle(donem.ilk, -onceGun);
  const ortalama = (p: OlcumParcasi, ilk: Gun, son: Gun): Ortalama => {
    const d = kayitlar
      .filter((k) => k.kartId === p.kartId && k.tarih >= ilk && k.tarih <= son)
      .map((k) => sayiOku(k.degerler[p.id]))
      .filter((n): n is number => n !== null);
    return { ort: d.length ? d.reduce((a, b) => a + b, 0) / d.length : null, gun: d.length };
  };
  return parcalar
    .map((p) => ({
      parca: { ...p, ad: p.ad.trim() || ADI[p.tur] },
      once: ortalama(p, onceIlk, gunEkle(donem.ilk, -1)),
      sirasinda: ortalama(p, donem.ilk, donem.son),
    }))
    .filter((k) => k.sirasinda.gun > 0);
}
