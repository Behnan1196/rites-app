// Hafta görünümü (A-4): iki sütunlu gün kutuları. Kutuda en çok 4 kompakt kart
// (saat, ✓, tek satır başlık, yapılan üstü çizili, solda 4 pt kaynak şeridi);
// fazlası "+N kart daha", boşsa "Boş". Başlığa dokununca o günün Gün görünümü.

import { Pressable, StyleSheet, View } from 'react-native';

import { fazlaMetni } from '@/mantik/ajanda';
import { kaynakAnahtari, type KaynakliKart } from '@/mantik/kaynak';
import { gunKisa, uzunTarih, type Gun } from '@/mantik/tarih';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { kaynakStili } from './kaynakStili';

const KUTUDA_EN_COK = 4;

export interface HaftaGunu<T extends KaynakliKart> {
  gun: Gun;
  kartlar: readonly T[];
  yapilanlar: ReadonlySet<string>;
}

export function HaftaGorunumu<T extends KaynakliKart>({
  gunler,
  bugunGun,
  onGunuAc,
  onKartiAc,
}: {
  gunler: readonly HaftaGunu<T>[];
  bugunGun: Gun;
  onGunuAc: (gun: Gun) => void;
  onKartiAc: (kart: T, gun: Gun) => void;
}) {
  return (
    <View style={stiller.izgara}>
      {gunler.map(({ gun, kartlar, yapilanlar }) => {
        const bugunMu = gun === bugunGun;
        const fazla = kartlar.length - KUTUDA_EN_COK;
        return (
          <View key={gun} style={stiller.kutu}>
            <Pressable
              onPress={() => onGunuAc(gun)}
              accessibilityRole="button"
              accessibilityLabel={`${uzunTarih(gun)}${bugunMu ? ', bugün' : ''}, ${kartlar.length} kart, gün görünümünü aç`}
              style={({ pressed }) => [stiller.baslik, bugunMu && stiller.baslikBugun, pressed && { opacity: 0.75 }]}
            >
              <Yazi kalinlik="kalin" renk={bugunMu ? renk.yuzey : renk.yazi}>
                {`${gunKisa(gun)} ${Number(gun.slice(8))}`}
              </Yazi>
            </Pressable>

            <View style={stiller.icerik}>
              {kartlar.slice(0, KUTUDA_EN_COK).map((kart) => {
                const yapildi = yapilanlar.has(kart.id);
                const stil = kaynakStili(kaynakAnahtari(kart));
                return (
                  <Pressable
                    key={kart.id}
                    onPress={() => onKartiAc(kart, gun)}
                    accessibilityRole="button"
                    accessibilityLabel={`${kart.saat ? `${kart.saat}, ` : ''}${kart.baslik}${yapildi ? ', yapıldı' : ''}`}
                    style={({ pressed }) => [stiller.oge, pressed && { opacity: 0.7 }]}
                  >
                    {stil && <View style={[stiller.serit, { backgroundColor: stil.serit }]} />}
                    {(!!kart.saat || yapildi) && (
                      <Yazi tur="etiket" renk={renk.ikincil} style={stiller.ust} maxFontSizeMultiplier={1.3}>
                        {[kart.saat, yapildi ? '✓' : null].filter(Boolean).join(' ')}
                      </Yazi>
                    )}
                    <Yazi
                      kalinlik="yariKalin"
                      numberOfLines={1}
                      renk={yapildi ? renk.soluk : renk.yazi}
                      style={[stiller.oBaslik, yapildi && stiller.ustuCizili]}
                      maxFontSizeMultiplier={1.4}
                    >
                      {kart.baslik}
                    </Yazi>
                  </Pressable>
                );
              })}
              {fazla > 0 && (
                <Pressable onPress={() => onGunuAc(gun)} accessibilityRole="button" style={stiller.fazla}>
                  <Yazi tur="etiket" kalinlik="kalin" renk={renk.ana}>
                    {fazlaMetni(fazla)}
                  </Yazi>
                </Pressable>
              )}
              {kartlar.length === 0 && (
                <Yazi tur="etiket" renk={renk.soluk} style={stiller.bos}>
                  Boş
                </Yazi>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const stiller = StyleSheet.create({
  izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  kutu: {
    width: '48.5%',
    minHeight: 120,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    overflow: 'hidden',
  },
  baslik: {
    minHeight: olcu.enAzDokunma + 4,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: renk.zemin,
  },
  baslikBugun: { backgroundColor: renk.ana },
  icerik: { padding: 6, gap: 2 },
  oge: {
    minHeight: olcu.enAzDokunma,
    justifyContent: 'center',
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  serit: { position: 'absolute', left: 0, top: 2, bottom: 2, width: 4, borderRadius: 2 },
  ust: { fontSize: 13, lineHeight: 17 },
  oBaslik: { fontSize: 16, lineHeight: 21 },
  ustuCizili: { textDecorationLine: 'line-through' },
  fazla: { minHeight: olcu.enAzDokunma, justifyContent: 'center', paddingHorizontal: 12 },
  bos: { paddingHorizontal: 8, paddingVertical: 10 },
});
