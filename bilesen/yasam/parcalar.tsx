// Yaşam Tarzım'ın küçük parçaları: alan simgesi, puan noktaları, plan satırı,
// ilerleme hapı, bilgi kutusu, ilerleme çubuğu.

import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { AlanAnahtari } from '@/mantik/alanlar';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

const ALAN_IKONU: Record<AlanAnahtari, IkonAdi> = {
  hareket: 'walk-outline',
  beslenme: 'nutrition-outline',
  uyku: 'moon-outline',
  zihin: 'sunny-outline',
  anlam: 'star-outline',
  sosyal: 'people-outline',
  ogrenme: 'school-outline',
  is: 'briefcase-outline',
  ugras: 'color-palette-outline',
};

export function AlanSimgesi({ alan, buyuk = false }: { alan: AlanAnahtari; buyuk?: boolean }) {
  const cap = buyuk ? 72 : 52;
  return (
    <View
      style={[stiller.simge, { width: cap, height: cap, borderRadius: cap / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={ALAN_IKONU[alan]} size={buyuk ? 34 : 26} color={renk.ana} />
    </View>
  );
}

/** 5 noktalı puan (yalnız gösterir). */
export function PuanNoktalari({ puan }: { puan: number }) {
  return (
    <View style={stiller.noktalar} accessibilityLabel={puan > 0 ? `Puan ${puan} / 5` : 'Puan verilmedi'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[stiller.nokta, { backgroundColor: i <= puan ? renk.ana : renk.cizgi }]} />
      ))}
    </View>
  );
}

export function IlerlemeHapi({ metin, soluk = false }: { metin: string; soluk?: boolean }) {
  return (
    <View style={[stiller.hap, soluk && { backgroundColor: renk.bolumluZemin }]}>
      <Yazi tur="etiket" kalinlik="kalin" renk={soluk ? renk.ikincil : renk.anaKoyu}>
        {metin}
      </Yazi>
    </View>
  );
}

/** Planlarım ve Alan ekranındaki plan satırı. */
export function PlanSatiri({
  ad,
  meta,
  hap,
  bitti = false,
  onPress,
}: {
  ad: string;
  meta: string;
  hap: string;
  bitti?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${ad}, ${meta}, ${hap}`}
      style={({ pressed }) => [stiller.planSatiri, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.esnek}>
        <Yazi tur="kartBasligi" numberOfLines={2}>
          {ad}
        </Yazi>
        <Yazi tur="ikincil" numberOfLines={2}>
          {meta}
        </Yazi>
      </View>
      <IlerlemeHapi metin={hap} soluk={bitti} />
    </Pressable>
  );
}

/** Gelişim'deki küçük bilgi kutusu: etiket üstte, değer kalın. */
export function BilgiKutusu({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <View style={stiller.bilgiKutusu} accessible accessibilityLabel={`${etiket}: ${deger}`}>
      <Yazi tur="ikincil">{etiket}</Yazi>
      <Yazi tur="bolumBasligi">{deger}</Yazi>
    </View>
  );
}

export function KutuIzgarasi({ children }: { children: React.ReactNode }) {
  return <View style={stiller.izgara}>{children}</View>;
}

/** "2 / 7 adım bitti" ve dolan çubuk. */
export function IlerlemeCubugu({ metin, oran }: { metin: string; oran: number }) {
  return (
    <View style={stiller.cubukKutu} accessible accessibilityLabel={metin}>
      <Yazi kalinlik="kalin">{metin}</Yazi>
      <View style={stiller.cubuk}>
        <View style={[stiller.cubukDolu, { width: `${Math.round(Math.min(1, Math.max(0, oran)) * 100)}%` }]} />
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  simge: { backgroundColor: renk.anaAcik, alignItems: 'center', justifyContent: 'center' },
  noktalar: { flexDirection: 'row', gap: 6 },
  nokta: { width: 16, height: 16, borderRadius: 8 },
  hap: {
    backgroundColor: renk.anaAcik,
    borderRadius: olcu.kose.hap,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  planSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 64,
  },
  esnek: { flex: 1, gap: 2 },
  bilgiKutusu: {
    width: '48.5%',
    minHeight: 84,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: 14,
    gap: 4,
  },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  cubukKutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: 14,
    gap: 10,
  },
  cubuk: { height: 14, borderRadius: 7, backgroundColor: renk.anaAcik, overflow: 'hidden' },
  cubukDolu: { height: 14, borderRadius: 7, backgroundColor: renk.ana },
});
