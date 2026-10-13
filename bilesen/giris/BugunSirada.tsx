// Bugün sırada (G-8) ve altında "Geçmişten kalan N iş ›" satırı (A-7).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { gununKartlari } from '@/mantik/ajanda';
import { kalanIsMetni, siradaki } from '@/mantik/giris';
import { kalanlar } from '@/mantik/kalanlar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { maddeKarti, maddeKartiMi } from '@/mantik/listeler';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, isaretle, tumKartlar } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useSimdi } from '@/veri/useSimdi';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { useBanaVerilenler } from '../listeler/BanaVerilenler';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

export function BugunSirada() {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const simdi = useSimdi();
  const kisaMesaj = useKisaMesaj();
  const verilenler = useBanaVerilenler();

  const veri = useSorgu(
    ['kart'],
    async (oku) => ({ kartlar: await tumKartlar(oku), yapilanlar: await gunYapilanlari(oku, bugunGun) }),
    [bugunGun],
  );
  if (!veri.veri) return <View style={[stiller.kutu, stiller.bos]} />;

  const { kartlar, yapilanlar: yerelYapilanlar } = veri.veri;
  // Ortak listeden bana bugüne verilen maddeler de sıraya girer (`05` §9).
  const bugununMaddeleri = verilenler.maddeler.filter((m) => m.tarih === bugunGun).map(maddeKarti);
  const yapilanlar = new Set([...yerelYapilanlar, ...bugununMaddeleri.filter((m) => m.yapildi).map((m) => m.id)]);
  const sira = siradaki(gununKartlari([...kartlar, ...bugununMaddeleri], bugunGun, bugunGun), yapilanlar, simdi);
  const kalanSayisi = kalanlar(kartlar, bugunGun).length;

  return (
    <View style={stiller.kutu}>
      <Yazi tur="kutuBasligi" renk={renk.anaKoyuUstuYazi} accessibilityRole="header">
        Bugün sırada
      </Yazi>

      {sira ? (
        <>
          <View style={stiller.ust}>
            <View style={stiller.esnek}>
              <Yazi kalinlik="kalin" renk={renk.yuzey} style={stiller.baslik} numberOfLines={3}>
                {sira.kart.baslik}
              </Yazi>
              <Yazi renk={renk.anaKoyuUstuYazi}>{sira.kart.saat ?? 'Bugün'}</Yazi>
            </View>
            {(sira.kart.blokSayisi > 0 || sira.kart.kilitli || maddeKartiMi(sira.kart)) && (
              <Pressable
                onPress={() => {
                  const k = sira.kart;
                  if (maddeKartiMi(k)) router.push({ pathname: '/giris/liste/[id]', params: { id: k.listeId } });
                  else router.push({ pathname: '/kart/[id]', params: { id: k.id, gun: bugunGun } });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${sira.kart.baslik}: aç`}
                style={({ pressed }) => [stiller.ac, pressed && { opacity: 0.7 }]}
              >
                <Yazi kalinlik="kalin" renk={renk.yuzey}>
                  Aç
                </Yazi>
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={async () => {
              const k = sira.kart;
              if (maddeKartiMi(k)) {
                if (!(await verilenler.isaretle(k.maddeId, true))) {
                  kisaMesaj(BAGLANAMIYOR);
                  return;
                }
              } else await isaretle(kapi, k.id, bugunGun, true);
              kisaMesaj(`Yapıldı: ${k.baslik}`);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${sira.kart.baslik}: yaptım`}
            style={({ pressed }) => [stiller.yaptim, pressed && { opacity: 0.85 }]}
          >
            <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.yaptimYazi}>
              Yaptım
            </Yazi>
          </Pressable>
          <Yazi renk={renk.anaKoyuUstuYazi}>{kalanIsMetni(sira.kalan)}</Yazi>
        </>
      ) : (
        <View>
          <Yazi kalinlik="kalin" renk={renk.yuzey} style={stiller.tamam}>
            Bugünkü her şey tamam.
          </Yazi>
          <Yazi renk={renk.anaKoyuUstuYazi}>Eline sağlık.</Yazi>
        </View>
      )}

      {kalanSayisi > 0 && (
        <Pressable
          onPress={() => router.navigate({ pathname: '/ajandam', params: { gun: bugunGun, an: String(Date.now()) } })}
          accessibilityRole="button"
          style={({ pressed }) => [stiller.kalan, pressed && { opacity: 0.8 }]}
        >
          <View style={stiller.turuncuNokta} />
          <Yazi kalinlik="kalin" renk={renk.yuzey} style={stiller.esnek}>
            {`Geçmişten kalan ${kalanSayisi} iş`}
          </Yazi>
          <Ionicons name="chevron-forward" size={22} color={renk.yuzey} />
        </Pressable>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: { backgroundColor: renk.ana, borderRadius: 22, padding: 20, gap: 12 },
  bos: { minHeight: 180 },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  esnek: { flex: 1 },
  baslik: { fontSize: 26, lineHeight: 32 },
  ac: {
    minHeight: 52,
    minWidth: 76,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: renk.anaKoyuUstuYazi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yaptim: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yaptimYazi: { fontSize: 22 },
  tamam: { fontSize: 22, lineHeight: 28 },
  kalan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  turuncuNokta: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F2B05E' },
});

