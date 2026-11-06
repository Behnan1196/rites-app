// Rutinin adımları (pilot 5 Kasım, P-93): rutin kartının ekranında sıralı adımlar; her birinin
// işaret kutusu (o gün), adı ve "›" (adımın kendi kartı: video, zamanlayıcı…). P-101: adıma uzun
// basıp sürükleyerek sıralanır; kaldırmak adımın kartının ⋯ menüsünde. Altta "+ Ekle". Son adım işaretlenince rutin yapıldı.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Kart } from '@/mantik/kart';
import { rutinDurumu, rutinIlerlemeMetni } from '@/mantik/rutinAdimlari';
import type { Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { adimSiralariniYaz, rutinAdimiEkle, rutinAdimiIsaretle, rutinAdimlari } from '@/veri/rutinler';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { SiraliKartlar } from '../ajanda/SiraliKartlar';
import { MaddeEkle } from './SatirIci';

export function RutinAdimlari({
  rutin,
  gun,
  duzenlenir,
  isaretlenir,
  onSurukleme,
}: {
  rutin: Pick<Kart, 'id' | 'baslik' | 'tarih'>;
  gun: Gun;
  duzenlenir: boolean;
  /** Bu gün rutinin günü mü (işaret kutuları yalnız o zaman). */
  isaretlenir: boolean;
  /** Sürükleme sırasında ekran kaymasın. */
  onSurukleme: (aktif: boolean) => void;
}) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const veri = useSorgu(
    ['kart'],
    async (o) => ({ adimlar: await rutinAdimlari(o, rutin.id), yapilanlar: await gunYapilanlari(o, gun) }),
    [rutin.id, gun],
  );
  const hata = (e: unknown) => {
    console.error('Kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  if (!veri.veri) return null;
  const { adimlar, yapilanlar } = veri.veri;
  const d = rutinDurumu(adimlar, yapilanlar);

  return (
    <View style={stiller.kap}>
      <View style={stiller.ust}>
        <Yazi kalinlik="kalin" renk={renk.ikincil} style={stiller.esnek}>
          Adımlar
        </Yazi>
        {adimlar.length > 0 && (
          <Yazi kalinlik="kalin" renk={d.yapilan === d.toplam ? renk.ana : renk.ikincil}>
            {rutinIlerlemeMetni(d)}
          </Yazi>
        )}
      </View>
      {adimlar.length === 0 && (
        <Yazi tur="ikincil">Rutinin adımlarını sırayla ekle. Her adıma sonra video, zamanlayıcı ekleyebilirsin.</Yazi>
      )}
      {/* P-101: adıma uzun basıp sürükleyerek sıra değişir (ajandadaki gibi); kaldırmak adımın kendi ⋯ menüsünde. */}
      <SiraliKartlar
        kartlar={adimlar.map((a) => ({ ...a, sira: a.ustSira ?? 0 }))}
        aralik={0}
        onSurukleme={onSurukleme}
        onSira={(kimlikler) => void adimSiralariniYaz(kapi, kimlikler).catch(hata)}
        satir={(a, surukle) => {
          const yapildi = yapilanlar.has(a.id);
          return (
            <View style={stiller.adim}>
              {isaretlenir && (
                <Pressable
                  onPress={() => void rutinAdimiIsaretle(kapi, oku, rutin.id, a.id, gun, !yapildi).catch(hata)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: yapildi }}
                  accessibilityLabel={a.baslik}
                  hitSlop={6}
                  style={stiller.isaretAlani}
                >
                  <View style={[stiller.kare, yapildi && stiller.kareDolu]}>
                    {yapildi && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
                  </View>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push({ pathname: '/kart/[id]', params: { id: a.id, gun, geri: rutin.baslik } })}
                onLongPress={duzenlenir ? surukle.onUzunBas : undefined}
                delayLongPress={300}
                onPressOut={duzenlenir ? surukle.onBirak : undefined}
                accessibilityActions={duzenlenir ? surukle.eylemler : undefined}
                onAccessibilityAction={duzenlenir ? surukle.onEylem : undefined}
                accessibilityRole="button"
                accessibilityLabel={`${a.baslik}, aç`}
                accessibilityHint={duzenlenir ? 'Sırasını değiştirmek için uzun basıp sürükle' : undefined}
                style={({ pressed }) => [stiller.adimGovde, pressed && { opacity: 0.6 }]}
              >
                <Yazi
                  renk={yapildi ? renk.ikincil : renk.yazi}
                  style={[stiller.esnek, yapildi && stiller.cizili]}
                  numberOfLines={2}
                >
                  {a.baslik}
                </Yazi>
                <Ionicons name="chevron-forward" size={18} color={renk.soluk} />
              </Pressable>
            </View>
          );
        }}
      />
      {duzenlenir && (
        <MaddeEkle
          onEkle={(baslik) => void rutinAdimiEkle(kapi, oku, rutin, baslik, bugunGun, yeniKimlik).catch(hata)}
        />
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 4 },
  ust: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  esnek: { flex: 1 },
  adim: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  isaretAlani: { width: 44, minHeight: 48, justifyContent: 'center' },
  kare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: renk.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kareDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  adimGovde: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  cizili: { textDecorationLine: 'line-through' },
});
