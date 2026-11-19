// Devam edenler: en çok 3 uygulanan program (pilot 20 Ekim; eskiden planlar);
// her satırda sol şerit, ad, sıradaki iş ve bugünkü ilerleme. Başlığın solundaki yaprak simgesi Yaşam Tarzım'ı açar.
// P-78 (31 Ekim): bugünün alışkanlıkları da burada: Yaptım kutusu, ad, kısa gidişat ("5 gün üst üste ·
// 12/21. gün"); altta "Alışkanlıklar ›" gidişat ekranını açar. Alışkanlıklar ajandada görünmeyebilir.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DEVAM_EN_COK, fazlaProgramMetni, PROGRAM_YOK_METNI } from '@/mantik/program';
import { isaretle } from '@/veri/kartlar';
import { rutinAdimiIsaretle } from '@/veri/rutinler';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { KutuSimgesi } from './KutuSimgesi';
import { ModulDugmesi } from './ModulDugmesi';
import { useAliskanliklar } from './useAliskanliklar';
import { useProgramlar } from '../yasam/useProgramlar';

/** Giriş'te en çok bu kadar bugünkü alışkanlık; fazlası gidişat ekranında. */
const ALISKANLIK_EN_COK = 5;

export function DevamEdenler() {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const { yukleniyor, ozetler } = useProgramlar();
  const { aliskanliklar } = useAliskanliklar();
  if (yukleniyor) return null;
  const bugunkuler = aliskanliklar.filter((a) => a.bugunVar);
  const gosterilenAliskanlik = bugunkuler.slice(0, ALISKANLIK_EN_COK);
  const etkinler = ozetler.filter((o) => o.durum === 'uygulaniyor');
  const gosterilen = etkinler.slice(0, DEVAM_EN_COK);
  const fazla = etkinler.length - gosterilen.length;

  return (
    <View style={stiller.kutu}>
      <View style={stiller.baslik}>
        <ModulDugmesi
          etiket="Programlar'ı aç"
          onPress={() => router.navigate('/yasam')}
          simge={<KutuSimgesi k="devam" />}
        />
        <Yazi tur="kutuBasligi" accessibilityRole="header">
          Devam edenler
        </Yazi>
      </View>

      {etkinler.length === 0 && aliskanliklar.length === 0 ? (
        <Yazi tur="ikincil">{PROGRAM_YOK_METNI}</Yazi>
      ) : (
        <>
          {gosterilen.map((o) => (
            <Pressable
              key={o.program.id}
              onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: o.program.id } })}
              accessibilityRole="button"
              accessibilityLabel={[o.program.ad, o.siradaki, o.bugun].filter(Boolean).join(', ')}
              style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
            >
              <View style={stiller.serit} />
              <View style={stiller.esnek}>
                <Yazi tur="kartBasligi" numberOfLines={2}>
                  {o.program.ad}
                </Yazi>
                <Yazi tur="ikincil" numberOfLines={2}>
                  {o.siradaki}
                </Yazi>
              </View>
              {!!o.bugun && (
                <Yazi kalinlik="kalin" style={stiller.ilerleme}>
                  {o.bugun}
                </Yazi>
              )}
            </Pressable>
          ))}
          {fazla > 0 && (
            <Pressable onPress={() => router.navigate('/yasam')} accessibilityRole="button" style={stiller.fazla}>
              <Yazi kalinlik="kalin" renk={renk.ana}>
                {fazlaProgramMetni(fazla)}
              </Yazi>
            </Pressable>
          )}
          {gosterilenAliskanlik.map((a) => (
            <View key={a.kart.id} style={stiller.satir}>
              <Pressable
                onPress={() =>
                  // P-110: listenin maddesiyse listenin ilerlemesi de güncellenir.
                  void (
                    a.kart.ust
                      ? rutinAdimiIsaretle(kapi, oku, a.kart.ust, a.kart.id, bugunGun, !a.yapildi)
                      : isaretle(kapi, a.kart.id, bugunGun, !a.yapildi)
                  ).catch((e: unknown) => console.error('İşaretlenemedi', e))
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: a.yapildi }}
                accessibilityLabel={`${a.kart.baslik}: yaptım`}
                hitSlop={8}
                style={[stiller.kutucuk, a.yapildi && stiller.kutucukDolu]}
              >
                {a.yapildi && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/kart/[id]', params: { id: a.kart.id, gun: bugunGun, geri: 'Giriş' } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${a.kart.baslik}, ${a.kisa}`}
                style={({ pressed }) => [stiller.esnek, pressed && { opacity: 0.75 }]}
              >
                <Yazi
                  tur="kartBasligi"
                  numberOfLines={2}
                  renk={a.yapildi ? renk.ikincil : renk.yazi}
                  style={a.yapildi && stiller.cizili}
                >
                  {a.kart.baslik}
                </Yazi>
                <Yazi tur="ikincil" numberOfLines={1}>
                  {[a.kisa, a.program?.ad, a.liste].filter(Boolean).join(' · ')}
                </Yazi>
              </Pressable>
            </View>
          ))}
        </>
      )}
      <Pressable
        onPress={() => router.push('/giris/aliskanliklar')}
        accessibilityRole="button"
        style={({ pressed }) => [stiller.fazla, pressed && { opacity: 0.75 }]}
      >
        <Yazi kalinlik="kalin" renk={renk.ana}>
          {bugunkuler.length > gosterilenAliskanlik.length
            ? `Alışkanlıklar (${bugunkuler.length - gosterilenAliskanlik.length} daha) ›`
            : 'Alışkanlıklar ve gidişat ›'}
        </Yazi>
      </Pressable>
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 4,
  },
  baslik: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
  },
  serit: { width: 5, alignSelf: 'stretch', borderRadius: 2, backgroundColor: kaynakRenk.plan.serit },
  esnek: { flex: 1, gap: 2 },
  ilerleme: { flexShrink: 0, maxWidth: '45%', textAlign: 'right' },
  fazla: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  kutucuk: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: renk.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutucukDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  cizili: { textDecorationLine: 'line-through' },
});
