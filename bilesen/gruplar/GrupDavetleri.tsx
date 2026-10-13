// Seni gruba çağıranlar: Katıl / Reddet. Gruplar ve Gelenler ekranlarında
// görünür (10. görev kararı). Katılmayan grubun listelerini görmez.

import { StyleSheet, View } from 'react-native';

import { grupAdi, grupDavetMetni, type AdBulucu, type Grup } from '@/mantik/gruplar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { grupDaveteYanit } from '@/sunucu/gruplar';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { KisiAvatari } from './parcalar';

export function GrupDavetleri({ davetler, ad, onYanit }: { davetler: readonly Grup[]; ad: AdBulucu; onYanit: () => void }) {
  const kisaMesaj = useKisaMesaj();
  if (davetler.length === 0) return null;

  const yanitla = async (g: Grup, katil: boolean) => {
    try {
      await grupDaveteYanit(g.id, katil);
      kisaMesaj(katil ? `${grupAdi(g.ad)}na katıldın.` : `${grupAdi(g.ad)} daveti reddedildi.`);
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
    onYanit();
  };

  return (
    <>
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Seni gruba çağıranlar
      </Yazi>
      {davetler.map((g) => (
        <View key={g.id} style={stiller.kutu}>
          <View style={stiller.satir}>
            <KisiAvatari ad={g.ad} boyut={52} vurgu />
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{g.ad}</Yazi>
              <Yazi tur="ikincil">{grupDavetMetni(g, ad)}</Yazi>
            </View>
          </View>
          <View style={stiller.dugmeler}>
            <Dugme etiket="Katıl" onPress={() => void yanitla(g, true)} style={stiller.esnek} />
            <Dugme tur="ikincil" etiket="Reddet" onPress={() => void yanitla(g, false)} style={stiller.esnek} />
          </View>
        </View>
      ))}
    </>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 2,
    borderColor: renk.vurgu,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', gap: 10 },
});
