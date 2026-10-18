// Grup ekranındaki "+ Ekle" (pilot 18 Ekim): grupta ne açılacak? Türler sırayla
// eklenir (`kararlar.md`, Gruplar: ortak etkinlikler çeşitlenir).

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AltSayfa } from '../AltSayfa';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export type GrupEklemeTuru = 'liste' | 'bulusma' | 'rutin';

const TURLER: { tur: GrupEklemeTuru; ad: string; aciklama: string; ikon: keyof typeof Ionicons.glyphMap }[] = [
  {
    tur: 'bulusma',
    ad: 'Buluşma',
    aciklama: 'Gün, saat, yer öner; herkes geliyorum / belki / gelemem der.',
    ikon: 'calendar-outline',
  },
  {
    tur: 'rutin',
    ad: 'Birlikte rutin',
    aciklama: '"Haftada 3 yürüyüş" gibi ortak hedef; isteyen katılır, kim kaç kez yaptı görünür.',
    ikon: 'repeat-outline',
  },
  {
    tur: 'liste',
    ad: 'Liste',
    aciklama: 'Yapılacaklar, hazırlık, market listesi; maddeyi birine verebilirsin.',
    ikon: 'list-outline',
  },
];

export function GrubaEkleSayfasi({
  grupAdi,
  onSec,
  onKapat,
}: {
  grupAdi: string;
  onSec: (tur: GrupEklemeTuru) => void;
  onKapat: () => void;
}) {
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={`${grupAdi} · ekle`} sagKapat="Kapat">
      <View style={stiller.kap}>
        {TURLER.map((t) => (
          <Pressable
            key={t.tur}
            onPress={() => onSec(t.tur)}
            accessibilityRole="button"
            accessibilityLabel={`${t.ad}. ${t.aciklama}`}
            style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
          >
            <View style={stiller.simge}>
              <Ionicons name={t.ikon} size={24} color={renk.ana} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{t.ad}</Yazi>
              <Yazi tur="ikincil">{t.aciklama}</Yazi>
            </View>
          </Pressable>
        ))}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 12 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  simge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1, gap: 2 },
});
