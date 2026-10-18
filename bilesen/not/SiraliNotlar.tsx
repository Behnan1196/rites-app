// Notlar ekranındaki liste (N-1): nota uzun basıp sürükleyerek sıra değişir
// (pilot 19 Ekim: ajandadaki gibi; soldaki tutamaç kalktı). Ekran okuyucuda
// notun "Yukarı taşı / Aşağı taşı" eylemleri var.

import type { Not } from '@/veri/notlar';

import { SiraliKartlar } from '../ajanda/SiraliKartlar';
import { YapiskanNot } from './YapiskanNot';

interface Ozellikler {
  notlar: readonly Not[];
  onAc: (not: Not) => void;
  onSira: (kimlikler: string[]) => void;
  /** Sürükleme başlayınca true, bitince false (ekran kaydırması durdurulsun diye). */
  onSurukleme: (aktif: boolean) => void;
}

export function SiraliNotlar({ notlar, onAc, onSira, onSurukleme }: Ozellikler) {
  return (
    <SiraliKartlar
      kartlar={notlar}
      aralik={10}
      onSira={onSira}
      onSurukleme={onSurukleme}
      satir={(not, surukle) => <YapiskanNot not={not} onPress={() => onAc(not)} surukle={surukle} />}
    />
  );
}
