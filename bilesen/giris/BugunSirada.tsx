// Bugün sırada (G-8; pilot 21 Ekim: sıradaki iş beyaz bir kart, "Yaptım" kartın üstünde;
// kart açılabiliyorsa dokununca açılır) ve altında "Geçmişten kalan N iş ›" satırı (A-7). Başlığın solunda
// takvim simgesi Ajandam'ı açar (pilot 21 Ekim).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { gununKartlari } from '@/mantik/ajanda';
import { kalanIsMetni, siradaki } from '@/mantik/giris';
import { tekrarMetni } from '@/mantik/gorunurluk';
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
import { KutuSimgesi } from './KutuSimgesi';
import { ModulDugmesi } from './ModulDugmesi';

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
      <View style={stiller.basliklar}>
        <ModulDugmesi
          koyu
          etiket="Ajandam'ı aç"
          onPress={() => router.navigate({ pathname: '/ajandam', params: { gun: bugunGun, an: String(Date.now()) } })}
          simge={<KutuSimgesi k="bugun" renkler={renk.yuzey} />}
        />
        <Yazi tur="kutuBasligi" renk={renk.anaKoyuUstuYazi} accessibilityRole="header">
          Bugün sırada
        </Yazi>
      </View>

      {sira ? (
        <>
          {(() => {
            const k = sira.kart;
            const acilir = k.blokSayisi > 0 || k.kilitli || maddeKartiMi(k);
            const ac = () => {
              if (maddeKartiMi(k)) router.push({ pathname: '/giris/liste/[id]', params: { id: k.listeId } });
              else router.push({ pathname: '/kart/[id]', params: { id: k.id, gun: bugunGun } });
            };
            const meta = [k.saat ?? 'Bugün', k.tekrar ? tekrarMetni(k.tekrar) : null].filter(Boolean).join(' · ');
            return (
              <View style={stiller.kart}>
                <Pressable
                  onPress={acilir ? ac : undefined}
                  disabled={!acilir}
                  accessibilityRole={acilir ? 'button' : undefined}
                  accessibilityLabel={`${k.baslik}, ${meta}${acilir ? ', aç' : ''}`}
                  style={({ pressed }) => [stiller.kartUst, pressed && { opacity: 0.7 }]}
                >
                  <View style={stiller.esnek}>
                    <Yazi kalinlik="kalin" style={stiller.baslik} numberOfLines={3}>
                      {k.baslik}
                    </Yazi>
                    <Yazi tur="ikincil">{meta}</Yazi>
                  </View>
                  {acilir && <Ionicons name="chevron-forward" size={24} color={renk.soluk} />}
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (maddeKartiMi(k)) {
                      if (!(await verilenler.isaretle(k.maddeId, true))) {
                        kisaMesaj(BAGLANAMIYOR);
                        return;
                      }
                    } else await isaretle(kapi, k.id, bugunGun, true);
                    kisaMesaj(`Yapıldı: ${k.baslik}`);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${k.baslik}: yaptım`}
                  style={({ pressed }) => [stiller.yaptim, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="checkmark" size={26} color={renk.yuzey} />
                  <Yazi kalinlik="kalin" renk={renk.yuzey} style={stiller.yaptimYazi}>
                    Yaptım
                  </Yazi>
                </Pressable>
              </View>
            );
          })()}
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
  basliklar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -6 },
  bos: { minHeight: 180 },
  esnek: { flex: 1 },
  baslik: { fontSize: 24, lineHeight: 30 },
  kart: { backgroundColor: renk.yuzey, borderRadius: 18, padding: 16, gap: 14 },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  yaptim: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: renk.ana,
    flexDirection: 'row',
    gap: 8,
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
