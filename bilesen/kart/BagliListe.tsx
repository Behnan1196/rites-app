// Listeler'den bağlanan liste (pilot 1 Kasım, P-83): alışveriş gibi listeler Giriş → Listeler'de
// durur; kart yalnız ona bağlanır. Kartta listenin adı, özeti ve "›"; dokununca liste açılır.
// Parçanın `metin`i listenin kimliği, `ad`ı son bilinen adı (liste silinirse yine görünür).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { cesitTanimi, listeOzeti, paylasilanOzeti } from '@/mantik/listeCesidi';
import { yerelListeMi } from '@/mantik/yerelListe';
import { useOturum } from '@/sunucu/oturum';
import { useSorgu } from '@/veri/kancalar';
import { yerelListeleriOku } from '@/veri/yerelListeler';

import { useListeler } from '../listeler/useListeler';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

interface ListeSecenegi {
  id: string;
  ad: string;
  ikon: ReturnType<typeof cesitTanimi>['ikon'];
  ozet: string;
}

/** Kişinin bağlanabilecek listeleri: önce kendi (telefondaki), sonra paylaşılanlar. */
function useListeSecenekleri(): { secenekler: ListeSecenegi[]; yukleniyor: boolean } {
  const yereller = useSorgu(['liste'], (o) => yerelListeleriOku(o), []);
  const { listeler, yukleniyor } = useListeler(useOturum());
  const secenekler: ListeSecenegi[] = [
    ...(yereller.veri ?? []).map((l) => ({
      id: l.id,
      ad: l.ad,
      ikon: cesitTanimi(l.cesit).ikon,
      ozet: listeOzeti(cesitTanimi(l.cesit).cesit, l.maddeSayisi, l.kalan),
    })),
    ...listeler.map((l) => ({
      id: l.id,
      ad: l.ad,
      ikon: cesitTanimi(l.cesit).ikon,
      ozet: `Paylaşılan · ${paylasilanOzeti(cesitTanimi(l.cesit).cesit, l.kalan)}`,
    })),
  ];
  return { secenekler, yukleniyor: yereller.yukleniyor || yukleniyor };
}

function ListeSatiri({
  ad,
  ikon,
  ozet,
  secili = false,
  onPress,
  sag,
}: {
  ad: string;
  ikon: ListeSecenegi['ikon'];
  ozet: string;
  secili?: boolean;
  onPress?: () => void;
  sag: 'ac' | 'sec';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={sag === 'sec' ? 'radio' : 'button'}
      accessibilityState={sag === 'sec' ? { selected: secili } : undefined}
      accessibilityLabel={`${ad}, ${ozet}${sag === 'ac' ? ', listeyi aç' : ''}`}
      style={({ pressed }) => [stiller.satir, secili && stiller.satirSecili, pressed && { opacity: 0.75 }]}
    >
      <Ionicons name={ikon} size={22} color={kaynakRenk.liste.serit} />
      <View style={stiller.esnek}>
        <Yazi kalinlik="kalin" numberOfLines={1}>
          {ad}
        </Yazi>
        <Yazi tur="ikincil" numberOfLines={1}>
          {ozet}
        </Yazi>
      </View>
      {sag === 'ac' ? (
        <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
      ) : (
        secili && <Ionicons name="checkmark-circle" size={22} color={renk.ana} />
      )}
    </Pressable>
  );
}

/** Kartta: bağlı listenin satırı; dokununca Listeler'deki liste. */
export function BagliListeBlogu({ listeId, ad }: { listeId: string; ad: string }) {
  const { secenekler, yukleniyor } = useListeSecenekleri();
  if (!listeId) return <Yazi tur="ikincil">Henüz bir liste seçilmedi.</Yazi>;
  const l = secenekler.find((s) => s.id === listeId);
  if (!l) {
    if (yukleniyor) return null;
    return (
      <Yazi tur="ikincil">
        {yerelListeMi(listeId)
          ? `"${ad || 'Liste'}" artık yok.`
          : `"${ad || 'Liste'}" şu an açılamıyor (paylaşılan liste).`}
      </Yazi>
    );
  }
  return (
    <ListeSatiri
      ad={l.ad}
      ikon={l.ikon}
      ozet={l.ozet}
      sag="ac"
      onPress={() => router.push({ pathname: '/giris/liste/[id]', params: { id: l.id } })}
    />
  );
}

/** Parça ayarında: Listeler'deki listelerden biri seçilir. */
export function BagliListeSecici({ listeId, onSec }: { listeId: string; onSec: (id: string, ad: string) => void }) {
  const { secenekler, yukleniyor } = useListeSecenekleri();
  if (!yukleniyor && secenekler.length === 0)
    return (
      <Yazi tur="ikincil">
        {"Henüz listen yok. Giriş → Listeler'de bir liste oluştur (örneğin alışveriş); sonra buradan bağla."}
      </Yazi>
    );
  return (
    <View style={stiller.secici} accessibilityRole="radiogroup" accessibilityLabel="Bağlanacak liste">
      {secenekler.map((s) => (
        <ListeSatiri
          key={s.id}
          ad={s.ad}
          ikon={s.ikon}
          ozet={s.ozet}
          secili={s.id === listeId}
          sag="sec"
          onPress={() => onSec(s.id, s.ad)}
        />
      ))}
    </View>
  );
}

const stiller = StyleSheet.create({
  secici: { gap: 8 },
  satir: {
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
  satirSecili: { borderColor: renk.ana, borderWidth: 2 },
  esnek: { flex: 1, gap: 2 },
});
