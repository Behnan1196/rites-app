// Kaynağa göre süzme (A-5): yatay kayan çipler, kaynak renginde nokta.

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { kaynakAdi, TUMU, type KaynakAnahtari } from '@/mantik/kaynak';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { kaynakStili } from './kaynakStili';

export function KaynakCipleri({
  kaynaklar,
  secili,
  planAdlari,
  onSec,
}: {
  kaynaklar: readonly KaynakAnahtari[];
  secili: KaynakAnahtari;
  planAdlari: ReadonlyMap<string, string>;
  onSec: (anahtar: KaynakAnahtari) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={stiller.satir}
      style={stiller.kaydirma}
      accessibilityLabel="Kaynağa göre süz"
    >
      {[TUMU, ...kaynaklar].map((anahtar) => {
        const seciliMi = anahtar === secili;
        const stil = anahtar === TUMU ? null : kaynakStili(anahtar);
        const ad = anahtar === TUMU ? 'Tümü' : kaynakAdi(anahtar, planAdlari);
        return (
          <Pressable
            key={anahtar}
            onPress={() => onSec(anahtar)}
            accessibilityRole="button"
            accessibilityState={{ selected: seciliMi }}
            accessibilityLabel={`${ad}${seciliMi ? ', seçili' : ''}`}
            style={({ pressed }) => [stiller.cip, seciliMi && stiller.secili, pressed && { opacity: 0.75 }]}
          >
            {stil && <View style={[stiller.nokta, { backgroundColor: stil.serit }, seciliMi && stiller.noktaSecili]} />}
            <Yazi kalinlik="yariKalin" renk={seciliMi ? renk.yuzey : renk.yazi}>
              {ad}
            </Yazi>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const stiller = StyleSheet.create({
  kaydirma: { marginHorizontal: -olcu.ekranKenari, flexGrow: 0 },
  satir: { paddingHorizontal: olcu.ekranKenari, gap: 8 },
  cip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: olcu.enAzDokunma,
    paddingHorizontal: 16,
    borderRadius: olcu.kose.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  secili: { backgroundColor: renk.ana, borderColor: renk.ana },
  nokta: { width: 10, height: 10, borderRadius: 5 },
  noktaSecili: { borderWidth: 1.5, borderColor: renk.yuzey },
});
