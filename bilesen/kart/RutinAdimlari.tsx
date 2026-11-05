// Rutinin adımları (pilot 5 Kasım, P-93): rutin kartının ekranında sıralı adımlar; her birinin
// işaret kutusu (o gün), adı ve "›" (adımın kendi kartı: video, zamanlayıcı…). Adıma uzun basınca
// Yukarı · Aşağı · Rutinden kaldır. Altta "+ Adım ekle". Son adım işaretlenince rutin yapıldı.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Kart } from '@/mantik/kart';
import { rutinDurumu, rutinIlerlemeMetni } from '@/mantik/rutinAdimlari';
import type { Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, kartlariSil } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { adimlarinYeriniDegistir, rutinAdimiEkle, rutinAdimiIsaretle, rutinAdimlari } from '@/veri/rutinler';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { ElemanMenusu } from './ElemanMenusu';
import { MaddeEkle } from './SatirIci';

export function RutinAdimlari({
  rutin,
  gun,
  duzenlenir,
  isaretlenir,
}: {
  rutin: Pick<Kart, 'id' | 'baslik' | 'tarih'>;
  gun: Gun;
  duzenlenir: boolean;
  /** Bu gün rutinin günü mü (işaret kutuları yalnız o zaman). */
  isaretlenir: boolean;
}) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [menu, setMenu] = useState<string | null>(null);
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
  const secili = adimlar.find((a) => a.id === menu);
  const i = secili ? adimlar.indexOf(secili) : -1;

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
      {adimlar.map((a) => {
        const yapildi = yapilanlar.has(a.id);
        return (
          <View key={a.id} style={stiller.adim}>
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
              onLongPress={duzenlenir ? () => setMenu(a.id) : undefined}
              accessibilityRole="button"
              accessibilityLabel={`${a.baslik}, aç`}
              accessibilityHint={duzenlenir ? 'Sıra ve kaldırma için uzun bas' : undefined}
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
      })}
      {duzenlenir && (
        <MaddeEkle
          onEkle={(baslik) => void rutinAdimiEkle(kapi, oku, rutin, baslik, bugunGun, yeniKimlik).catch(hata)}
        />
      )}
      {secili && (
        <ElemanMenusu
          baslik={secili.baslik}
          anahtarlar={[]}
          onYukari={i > 0 ? () => void adimlarinYeriniDegistir(kapi, secili, adimlar[i - 1]!).catch(hata) : undefined}
          onAsagi={
            i < adimlar.length - 1
              ? () => void adimlarinYeriniDegistir(kapi, secili, adimlar[i + 1]!).catch(hata)
              : undefined
          }
          onSil={() => {
            setMenu(null);
            void kartlariSil(kapi, [secili.id])
              .then(() => kisaMesaj(`Rutinden kaldırıldı: ${secili.baslik}`))
              .catch(hata);
          }}
          silEtiketi="Rutinden kaldır"
          onKapat={() => setMenu(null)}
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
