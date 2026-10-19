// Grup ekranında bir buluşma: ad, gün · saat · yer, kim geliyor; altında
// Geliyorum / Belki / Gelemem. Kuran için "Düzenle".

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { benimYanitim, bulusmaZamani, YANITLAR, yanitAyrintisi, yanitOzeti, type Bulusma } from '@/mantik/bulusma';
import { yanitlamayanlar } from '@/mantik/grupBekleyenler';
import { BAGLANAMIYOR } from '@/mantik/kisiler';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { SecenekHapi } from '../Secim';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { useBulusmalar } from './Bulusmalar';

export function BulusmaKarti({
  bulusma,
  ben,
  ad,
  onDuzenle,
  uyeler,
}: {
  bulusma: Bulusma;
  ben: string;
  ad: (id: string) => string;
  onDuzenle: () => void;
  /** Grubun üyeleri: kuran için "Yanıt bekleniyor: …" (pilot 19 Ekim). */
  uyeler?: readonly string[];
}) {
  const { yanitla } = useBulusmalar();
  const kisaMesaj = useKisaMesaj();
  const benim = benimYanitim(bulusma, ben);
  const ayrinti = yanitAyrintisi(bulusma, ad);
  const bekleyen =
    uyeler && bulusma.kuran === ben
      ? yanitlamayanlar(
          uyeler,
          bulusma.yanitlar.map((y) => y.kullanici),
          bulusma.kuran,
        )
      : [];

  return (
    <View style={stiller.kart}>
      <View style={stiller.ust}>
        <Ionicons name="calendar-outline" size={22} color={kaynakRenk.grup.serit} />
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi">{bulusma.baslik}</Yazi>
          <Yazi kalinlik="kalin" renk={kaynakRenk.grup.yazi}>
            {bulusmaZamani(bulusma)}
          </Yazi>
          <Yazi tur="ikincil">{ayrinti || yanitOzeti(bulusma)}</Yazi>
          {bekleyen.length > 0 && (
            <Yazi tur="ikincil" renk={renk.vurguYazi}>{`Yanıt bekleniyor: ${bekleyen.map(ad).join(', ')}`}</Yazi>
          )}
        </View>
        {bulusma.kuran === ben && <Dugme tur="yazi" etiket="Düzenle" onPress={onDuzenle} />}
      </View>
      <View style={stiller.yanitlar}>
        {YANITLAR.map(({ yanit, etiket }) => (
          <SecenekHapi
            key={yanit}
            etiket={etiket}
            erisimEtiketi={`${bulusma.baslik}: ${etiket}`}
            secili={benim === yanit}
            onPress={() => {
              if (benim === yanit) return;
              void yanitla(bulusma, yanit).then((ok) => {
                if (!ok) kisaMesaj(BAGLANAMIYOR);
                else if (yanit === 'geliyorum') kisaMesaj('Ajandana eklendi');
                else if (benim === 'geliyorum') kisaMesaj('Ajandandan kaldırıldı');
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.grup.serit,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  esnek: { flex: 1, gap: 2 },
  yanitlar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
