// Ajandada bir kart satırı (A-8): solda işaret kutusu, başlık (en çok 2 satır),
// tek meta satırı (saat, zil + hatırlatma, tekrar, kaynak etiketi ya da kilit +
// koç adı). Solda 6 pt kaynak şeridi (PL-4). Sağdaki › kaldırıldı (pilot 17 Ekim:
// her kart görünümünde açılıyor). Uzun basınca sürükleme başlar (`SiraliKartlar`).

import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type AccessibilityActionEvent } from 'react-native';

import { hatirlatmaMetni } from '@/mantik/kart';
import { tekrarMetni } from '@/mantik/gorunurluk';
import { kaynakAnahtari, kaynakEtiketi, kaynakTuru } from '@/mantik/kaynak';
import { maddeKartiMi } from '@/mantik/listeler';
import type { KartOzeti } from '@/veri/kartlar';

import { RUTIN_BILGI, rutinCesidi } from '@/mantik/rutinAdimlari';

import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { kaynakStili } from './kaynakStili';

const BOS_PLANLAR: ReadonlyMap<string, string> = new Map();

interface Ozellikler {
  kart: KartOzeti;
  yapildi: boolean;
  onIsaretle: () => void;
  onAc: () => void;
  planAdlari?: ReadonlyMap<string, string>;
  /** P-93: rutinse o günün ilerlemesi ("3/9"). */
  rutin?: { yapilan: number; toplam: number } | null;
  /** Sürükleyerek sıralama (yalnız Gün görünümünde). */
  surukle?: {
    onUzunBas: () => void;
    onBirak: () => void;
    eylemler: { name: string; label: string }[];
    onEylem: (e: AccessibilityActionEvent) => void;
  };
}

export function KartSatiri({
  kart,
  yapildi,
  onIsaretle,
  onAc,
  planAdlari = BOS_PLANLAR,
  rutin = null,
  surukle,
}: Ozellikler) {
  const maddeMi = maddeKartiMi(kart);
  const anahtar = kaynakAnahtari(kart);
  const stil = kaynakStili(anahtar);
  const etiket = kaynakEtiketi(kart, planAdlari);
  const kocMu = kaynakTuru(anahtar) === 'koc';
  const adim = rutin && rutin.toplam > 0 ? rutin : kart.adimlar && kart.adimlar.toplam > 0 ? kart.adimlar : null;
  const metaVar = !!(kart.saat || kart.hatirlatma || kart.tekrar || etiket || adim);

  return (
    <View style={stiller.kart}>
      {stil && <View style={[stiller.serit, { backgroundColor: stil.serit }]} />}
      {/* P-112: Bilgi listesinde Yaptım yok. */}
      {rutinCesidi(kart) === RUTIN_BILGI ? (
        <View style={stiller.isaretAlani}>
          <Ionicons name="reader-outline" size={24} color={renk.ikincil} />
        </View>
      ) : (
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
      )}

      <Pressable
        onPress={onAc}
        onLongPress={surukle?.onUzunBas}
        delayLongPress={300}
        onPressOut={surukle?.onBirak}
        accessibilityActions={surukle?.eylemler}
        onAccessibilityAction={surukle?.onEylem}
        accessibilityRole="button"
        accessibilityLabel={`${kart.baslik}${maddeMi ? ', listeyi aç' : ', kartı aç'}`}
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
              {!!kart.hatirlatma && (
                <Meta
                  ikon={kart.alarm ? 'alarm-outline' : 'notifications-outline'}
                  metin={hatirlatmaMetni(kart.hatirlatma)}
                />
              )}
              {!!kart.tekrar && <Meta ikon="repeat-outline" metin={tekrarMetni(kart.tekrar)} />}
              {!!adim && <Meta ikon="git-commit-outline" metin={`${adim.yapilan}/${adim.toplam}`} />}
              {!!etiket && stil && (
                <View style={[stiller.etiket, { backgroundColor: stil.zemin }]}>
                  {kocMu && <Ionicons name="lock-closed" size={14} color={stil.yazi} />}
                  <Yazi tur="etiket" kalinlik="kalin" renk={stil.yazi} numberOfLines={1}>
                    {etiket}
                  </Yazi>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function Meta({
  ikon,
  metin,
}: {
  ikon: 'time-outline' | 'notifications-outline' | 'alarm-outline' | 'repeat-outline' | 'git-commit-outline';
  metin: string;
}) {
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
  serit: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  etiket: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: olcu.kose.etiket,
    maxWidth: '100%',
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
    paddingRight: 16,
    gap: 8,
  },
  metinler: { flex: 1, gap: 4 },
  ustuCizili: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2 },
  metaParca: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
