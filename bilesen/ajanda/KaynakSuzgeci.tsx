// Kaynağa göre süzme (A-5, pilot kararıyla 14 Ekim): şerit yerine üst satırdaki
// süzgeç simgesinden açılan küçük menü. Çoklu seçim: işareti kaldırılan kaynak
// ajandada gizlenir. Süzgeç açıkken simge dolu görünür.

import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { kaynakAdi, type KaynakAnahtari } from '@/mantik/kaynak';

import { IsaretKutusu } from '../gruplar/parcalar';
import { Katman } from '../Katman';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { kaynakStili } from './kaynakStili';

export function KaynakSuzgeci({
  kaynaklar,
  gizli,
  planAdlari,
  onDegis,
  onKapat,
}: {
  kaynaklar: readonly KaynakAnahtari[];
  gizli: ReadonlySet<KaynakAnahtari>;
  planAdlari: ReadonlyMap<string, string>;
  onDegis: (gizli: Set<KaynakAnahtari>) => void;
  onKapat: () => void;
}) {
  const kenar = useSafeAreaInsets();
  const degistir = (k: KaynakAnahtari) => {
    const y = new Set(gizli);
    if (y.has(k)) y.delete(k);
    else y.add(k);
    onDegis(y);
  };
  const acik = kaynaklar.some((k) => gizli.has(k));

  return (
    <Katman>
      <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} accessibilityLabel="Süzgeci kapat" />
      <View style={[stiller.kutu, { top: kenar.top + 58 }]} accessibilityViewIsModal>
        <Yazi kalinlik="kalin" style={stiller.baslik}>
          Ajandada göster
        </Yazi>
        {kaynaklar.map((k, i) => {
          const gorunur = !gizli.has(k);
          const stil = kaynakStili(k);
          const ad = kaynakAdi(k, planAdlari);
          return (
            <Pressable
              key={k}
              onPress={() => degistir(k)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: gorunur }}
              accessibilityLabel={ad}
              style={({ pressed }) => [stiller.satir, i > 0 && stiller.cizgili, pressed && { opacity: 0.7 }]}
            >
              <IsaretKutusu secili={gorunur} />
              <View style={[stiller.nokta, { backgroundColor: stil?.serit ?? renk.pasif }]} />
              <Yazi style={stiller.esnek} numberOfLines={1}>
                {ad}
              </Yazi>
            </Pressable>
          );
        })}
        {acik && (
          <Pressable
            onPress={() => onDegis(new Set())}
            accessibilityRole="button"
            style={({ pressed }) => [stiller.hepsi, pressed && { opacity: 0.7 }]}
          >
            <Yazi kalinlik="kalin" renk={renk.ana}>
              Hepsini göster
            </Yazi>
          </Pressable>
        )}
      </View>
    </Katman>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    position: 'absolute',
    right: olcu.ekranKenari,
    width: 290,
    maxWidth: '92%',
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  baslik: { paddingVertical: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  nokta: { width: 10, height: 10, borderRadius: 5 },
  esnek: { flex: 1 },
  hepsi: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: renk.satirCizgi },
});
