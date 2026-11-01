// Parça düzenleyicisinin taslağı (Kur'da ve kart görünümündeki parça ayar sayfasında; P-77).
// Liste maddeleri düzenleyicide onay kutulu liste (HTML) olarak `metin`dedir; kaydederken
// `maddeler`e döner. İşaretleri kalan listede yapılmış maddeler metnine göre yapılmış kalır.

import { adimDurumu, adimlariEsle } from './adimlar';
import { maddeliListeMi, type Blok } from './kart';
import { htmlMaddeleri, maddelerdenHtml } from './zenginMetin';

export type ParcaTaslagi = Omit<Blok, 'kartId' | 'sira'>;

/** Kayıtlı parça → düzenleyici taslağı. */
export function formaBlok(b: Blok | ParcaTaslagi): ParcaTaslagi {
  const { kartId: _k, sira: _s, ...taslak } = b as Blok;
  // P-50: liste maddeleri editörde onay kutulu liste (HTML).
  return maddeliListeMi(b.tur) ? { ...taslak, metin: maddelerdenHtml(b.maddeler) } : taslak;
}

/** Düzenleyici taslağı → kaydedilecek parça. */
export function kaydaBlok<T extends ParcaTaslagi>(b: T): T {
  if (!maddeliListeMi(b.tur)) return b;
  const maddeler = htmlMaddeleri(b.metin);
  if (b.tur !== 'adimlar') return { ...b, maddeler, metin: '' };
  const eski = adimDurumu(b.durum, b.maddeler.length);
  return { ...b, maddeler, metin: '', durum: adimlariEsle(b.maddeler, eski, maddeler) };
}
