// "+ Ekle → Liste" (pilot 6 Kasım, P-105): listenin maddeleri kart olur; önce çeşidi sorulur:
// Adımlar (işaretlediğin kalır) · Günlük kontrol (her gün baştan) · Bilgi listesi (işaretsiz).
// Listenin adına dokununca da açılır; çeşit sonradan değişebilir.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { RUTIN_CESITLERI, type RutinCesidi } from '@/mantik/rutinAdimlari';

import { AltSayfa } from '../AltSayfa';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const IKON: Record<RutinCesidi, React.ComponentProps<typeof Ionicons>['name']> = {
  1: 'repeat-outline',
  2: 'checkbox-outline',
  3: 'list-outline',
};

export function ListeCesidiSecici({
  gorunur,
  secili,
  onSec,
  onKapat,
}: {
  gorunur: boolean;
  /** Var olan listenin çeşidi (değiştirirken). */
  secili?: RutinCesidi | null;
  onSec: (c: RutinCesidi) => void;
  onKapat: () => void;
}) {
  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik={secili ? 'Listenin çeşidi' : 'Liste ekle'} solVazgec>
      {RUTIN_CESITLERI.map((t) => {
        const bu = secili === t.cesit;
        return (
          <Pressable
            key={t.cesit}
            onPress={() => onSec(t.cesit)}
            accessibilityRole="button"
            accessibilityState={{ selected: bu }}
            accessibilityLabel={`${t.ad}: ${t.aciklama}`}
            style={({ pressed }) => [stiller.tur, bu && stiller.secili, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name={IKON[t.cesit]} size={22} color={renk.ana} />
            <View style={stiller.esnek}>
              <Yazi kalinlik="kalin">{t.ad}</Yazi>
              <Yazi tur="ikincil">{t.aciklama}</Yazi>
            </View>
            {bu && <Ionicons name="checkmark" size={22} color={renk.ana} />}
          </Pressable>
        );
      })}
      <Yazi tur="ikincil">Her madde bir kart olur; dokunup video, zamanlayıcı ekleyebilirsin.</Yazi>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  tur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  secili: { borderColor: renk.ana, borderWidth: 2 },
  esnek: { flex: 1, gap: 2 },
});
