// Ajandada bir kart satırı (A-8): solda işaret kutusu, başlık (en çok 2 satır),
// tek meta satırı (saat, zil + hatırlatma, tekrar). Bloğu olan kartın sağında ›.

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { HATIRLATMA_METNI } from '@/mantik/ajanda';
import { tekrarMetni } from '@/mantik/gorunurluk';
import type { KartOzeti } from '@/veri/kartlar';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

interface Ozellikler {
  kart: KartOzeti;
  yapildi: boolean;
  onIsaretle: () => void;
  onAc: () => void;
}

export function KartSatiri({ kart, yapildi, onIsaretle, onAc }: Ozellikler) {
  const blokluMu = kart.blokSayisi > 0 || kart.kilitli;
  const metaVar = !!(kart.saat || kart.hatirlatma || kart.tekrar);

  return (
    <View style={stiller.kart}>
      <Pressable
        onPress={onIsaretle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: yapildi }}
        accessibilityLabel={yapildi ? `${kart.baslik}: yapıldı` : `${kart.baslik}: yapıldı olarak işaretle`}
        style={stiller.isaretAlani}
        hitSlop={4}
      >
        <View style={[stiller.isaret, yapildi && stiller.isaretDolu]}>
          {yapildi && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
        </View>
      </Pressable>

      <Pressable
        onPress={onAc}
        accessibilityRole="button"
        accessibilityLabel={`${kart.baslik}${blokluMu ? ', kartı aç' : ', düzenle'}`}
        style={({ pressed }) => [stiller.govde, pressed && { opacity: 0.7 }]}
      >
        <View style={stiller.metinler}>
          <Yazi
            tur="kartBasligi"
            numberOfLines={2}
            renk={yapildi ? renk.ikincil : renk.yazi}
            style={yapildi && stiller.ustuCizili}
          >
            {kart.baslik}
          </Yazi>
          {metaVar && (
            <View style={stiller.meta}>
              {!!kart.saat && <Meta ikon="time-outline" metin={kart.saat} />}
              {!!kart.hatirlatma && <Meta ikon="notifications-outline" metin={HATIRLATMA_METNI[kart.hatirlatma]} />}
              {!!kart.tekrar && <Meta ikon="repeat-outline" metin={tekrarMetni(kart.tekrar)} />}
            </View>
          )}
        </View>
        {blokluMu && (
          <View style={stiller.ac}>
            <Ionicons name="chevron-forward" size={22} color={renk.ana} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

function Meta({ ikon, metin }: { ikon: 'time-outline' | 'notifications-outline' | 'repeat-outline'; metin: string }) {
  return (
    <View style={stiller.metaParca}>
      <Ionicons name={ikon} size={17} color={renk.ikincil} />
      <Yazi tur="ikincil">{metin}</Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    minHeight: 72,
    overflow: 'hidden',
  },
  isaretAlani: {
    width: 64,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  isaret: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: renk.soluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isaretDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  govde: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingRight: 12,
    gap: 8,
  },
  metinler: { flex: 1, gap: 4 },
  ustuCizili: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2 },
  metaParca: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ac: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
