// Kaynağın rengi (`06` Kaynak renkleri). Kendi kartında renk yok.

import { kaynakTuru, type KaynakAnahtari } from '@/mantik/kaynak';

import { kaynakRenk } from '../tema';

export type KaynakRengi = (typeof kaynakRenk)[keyof typeof kaynakRenk];

export function kaynakStili(anahtar: KaynakAnahtari): KaynakRengi | null {
  const tur = kaynakTuru(anahtar);
  return tur === 'kendim' ? null : kaynakRenk[tur];
}
