// Gelenler (G-3): Hızlı Not'un altında tek satır; solda Gelenler simgesi, sağda zil (pilot 21 Ekim). Grup davetleri de burada
// sayılır (10. görev kararı); başka uygulamadan paylaşılan bağlantılar da
// (16 Ekim). Oturum yoksa ve paylaşılan da yoksa görünmez.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { bekleyenOzeti } from '@/mantik/grupBekleyenler';
import { davetOzeti } from '@/mantik/gruplar';
import { gelenlerOzeti } from '@/mantik/paylasim';
import { kaynakAdi } from '@/mantik/paylasimAl';
import { useSorgu } from '@/veri/kancalar';
import { paylasilanlariOku } from '@/veri/paylasilanlar';
import { useOturum } from '@/sunucu/oturum';

import { olcu, renk } from '../tema';
import { useGelenBildirimi } from '../GelenBildirimi';
import { useGrupBekleyenleri } from '../gruplar/useGrupBekleyenleri';
import { useGruplar } from '../gruplar/useGruplar';
import { useKisiler } from '../gruplar/useKisiler';
import { Yazi } from '../Yazi';
import { ModulDugmesi } from './ModulDugmesi';
import { useGelenler } from './useGelenler';

export function GelenlerKutusu() {
  const oturum = useOturum();
  const { ben, gelenler } = useGelenler(oturum);
  const { davetler, ad } = useGruplar(oturum);
  const { bekleyenler } = useGrupBekleyenleri();
  const zil = useGelenBildirimi();
  const { istekler } = useKisiler(oturum);
  const paylasilanlar = useSorgu(['paylasilan'], (o) => paylasilanlariOku(o), []).veri ?? [];
  if (!ben && paylasilanlar.length === 0) return null;
  const davet = davetOzeti(davetler, ad);
  const ogeler = [
    ...paylasilanlar.map((p) => ({ kimden: kaynakAdi(p.adres), baslik: p.baslik })),
    ...gelenler.map((g) => ({ kimden: g.kimdenAd, baslik: g.paket.baslik })),
  ];
  const sayi = ogeler.length + davetler.length + bekleyenler.length + istekler.length;
  const istekOzeti = istekler.length ? `${istekler.length} kişi ekleme isteği` : null;
  const grupOzeti = [istekOzeti, bekleyenOzeti(bekleyenler)].filter(Boolean).join(' · ') || null;
  const ozet =
    ogeler.length > 0 || !davet
      ? [
          ogeler.length > 0 || (!grupOzeti && davetler.length === 0) ? gelenlerOzeti(ogeler) : null,
          davet && davetler.length > 0 ? `${davetler.length} grup daveti` : null,
          grupOzeti,
        ]
          .filter(Boolean)
          .join(' · ')
      : [davet, grupOzeti].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={() => router.push('/giris/gelenler')}
      accessibilityRole="button"
      accessibilityLabel={`Gelenler${sayi ? `, ${sayi} yeni` : ''}. ${ozet}`}
      style={({ pressed }) => [stiller.kutu, pressed && { opacity: 0.75 }]}
    >
      <ModulDugmesi
        etiket="Gelenler'i aç"
        onPress={() => router.push('/giris/gelenler')}
        simge={<Ionicons name="file-tray-outline" size={24} color={renk.ana} />}
      />
      <View style={stiller.esnek}>
        <View style={stiller.ust}>
          <Yazi tur="kartBasligi">Gelenler</Yazi>
          {sayi > 0 && (
            <View style={stiller.rozet}>
              <Yazi tur="etiket" kalinlik="kalin" renk={renk.yuzey}>
                {String(sayi)}
              </Yazi>
            </View>
          )}
        </View>
        <Yazi tur="ikincil" numberOfLines={1}>
          {ozet}
        </Yazi>
      </View>
      {zil.acik !== null && (
        <Pressable
          onPress={() => void zil.degistir()}
          accessibilityRole="switch"
          accessibilityState={{ checked: zil.acik }}
          accessibilityLabel={
            zil.acik
              ? 'Gelenler bildirimleri açık; kapatmak için dokun'
              : 'Gelenler bildirimleri kapalı; açmak için dokun'
          }
          hitSlop={8}
          style={stiller.zil}
        >
          <Ionicons
            name={zil.acik ? 'notifications' : 'notifications-off-outline'}
            size={22}
            color={zil.acik ? renk.ana : renk.soluk}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  kutu: {
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
  esnek: { flex: 1 },
  zil: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rozet: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: renk.vurgu,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
