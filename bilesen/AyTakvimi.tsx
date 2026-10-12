// Ay takvimi ızgarası (`05` §8): 6 haftaya kadar; ay dışı günler soluk;
// seçili gün dolu, bugün halkalı. İsteğe bağlı her günün altında sayı (A-3).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AY_ADLARI, GUN_KISA, gunEkle, haftaGunu, uzunTarih, type Gun } from '@/mantik/tarih';

import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

function ayinIlkGunu(gun: Gun): Gun {
  return `${gun.slice(0, 8)}01`;
}

function ayKaydir(ilkGun: Gun, fark: number): Gun {
  const yil = Number(ilkGun.slice(0, 4));
  const ay = Number(ilkGun.slice(5, 7)) - 1 + fark;
  const y = yil + Math.floor(ay / 12);
  const a = ((ay % 12) + 12) % 12;
  return `${y}-${String(a + 1).padStart(2, '0')}-01`;
}

/** Ayın görünen haftaları (Pazartesi başlar). */
export function ayIzgarasi(ilkGun: Gun): Gun[][] {
  const baslangic = gunEkle(ilkGun, -haftaGunu(ilkGun));
  const ay = ilkGun.slice(0, 7);
  const haftalar: Gun[][] = [];
  for (let h = 0; h < 6; h++) {
    const hafta = Array.from({ length: 7 }, (_, i) => gunEkle(baslangic, h * 7 + i));
    if (h > 0 && hafta[0]!.slice(0, 7) !== ay) break;
    haftalar.push(hafta);
  }
  return haftalar;
}

interface Ozellikler {
  secili: Gun | null;
  bugunGun: Gun;
  onSec: (gun: Gun) => void;
  /** Her günün altında gösterilecek sayı (boşsa gösterilmez). */
  sayilar?: ReadonlyMap<Gun, number>;
}

export function AyTakvimi({ secili, bugunGun, onSec, sayilar }: Ozellikler) {
  const [ilkGun, setIlkGun] = useState(() => ayinIlkGunu(secili ?? bugunGun));
  const ay = ilkGun.slice(0, 7);
  const ayAdi = `${AY_ADLARI[Number(ilkGun.slice(5, 7)) - 1]} ${ilkGun.slice(0, 4)}`;

  return (
    <View style={stiller.kap}>
      <View style={stiller.baslik}>
        <Pressable
          onPress={() => setIlkGun(ayKaydir(ilkGun, -1))}
          accessibilityRole="button"
          accessibilityLabel="Önceki ay"
          style={stiller.ok}
        >
          <Ionicons name="chevron-back" size={24} color={renk.ana} />
        </Pressable>
        <Yazi tur="bolumBasligi" accessibilityRole="header">
          {ayAdi}
        </Yazi>
        <Pressable
          onPress={() => setIlkGun(ayKaydir(ilkGun, 1))}
          accessibilityRole="button"
          accessibilityLabel="Sonraki ay"
          style={stiller.ok}
        >
          <Ionicons name="chevron-forward" size={24} color={renk.ana} />
        </Pressable>
      </View>

      <View style={stiller.satir}>
        {GUN_KISA.map((g) => (
          <Yazi key={g} tur="etiket" kalinlik="yariKalin" style={stiller.hucreBaslik}>
            {g}
          </Yazi>
        ))}
      </View>

      {ayIzgarasi(ilkGun).map((hafta) => (
        <View key={hafta[0]} style={stiller.satir}>
          {hafta.map((gun) => {
            const ayDisi = gun.slice(0, 7) !== ay;
            const seciliMi = gun === secili;
            const bugunMu = gun === bugunGun;
            const sayi = sayilar?.get(gun) ?? 0;
            return (
              <Pressable
                key={gun}
                onPress={() => onSec(gun)}
                accessibilityRole="button"
                accessibilityState={{ selected: seciliMi }}
                accessibilityLabel={`${uzunTarih(gun)}${bugunMu ? ', bugün' : ''}${sayi ? `, ${sayi} kart` : ''}`}
                style={stiller.hucre}
              >
                <View
                  style={[
                    stiller.daire,
                    bugunMu && !seciliMi && stiller.bugun,
                    seciliMi && { backgroundColor: renk.ana },
                  ]}
                >
                  <Yazi
                    kalinlik={seciliMi || bugunMu ? 'kalin' : 'normal'}
                    renk={seciliMi ? renk.yuzey : ayDisi ? renk.pasif : renk.yazi}
                    style={stiller.gunSayisi}
                    maxFontSizeMultiplier={1.3}
                  >
                    {Number(gun.slice(8))}
                  </Yazi>
                </View>
                {sayilar && (
                  <Yazi tur="etiket" kalinlik="kalin" renk={renk.vurguYazi} style={stiller.kartSayisi} maxFontSizeMultiplier={1.2}>
                    {sayi > 0 ? String(sayi) : ' '}
                  </Yazi>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 6 },
  baslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ok: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satir: { flexDirection: 'row' },
  hucreBaslik: { flex: 1, textAlign: 'center' },
  hucre: { flex: 1, alignItems: 'center', minHeight: olcu.enAzDokunma, paddingVertical: 2 },
  daire: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bugun: { borderWidth: 2, borderColor: renk.ana },
  gunSayisi: { fontSize: 18 },
  kartSayisi: { fontSize: 13, lineHeight: 16 },
});
