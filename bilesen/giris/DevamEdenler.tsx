// Devam edenler (PL-3): en çok 3 süren plan; her satırda sol şerit, ad,
// sıradaki iş ve ilerleme. "Tümü ›" Yaşam Tarzım'ı açar.

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DEVAM_EN_COK, fazlaPlanMetni, PLAN_YOK_METNI } from '@/mantik/plan';

import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { usePlanlar } from '../yasam/usePlanlar';

export function DevamEdenler() {
  const { yukleniyor, ozetler } = usePlanlar();
  if (yukleniyor) return null;
  const etkinler = ozetler.filter((o) => o.plan.durum === 'etkin');
  const gosterilen = etkinler.slice(0, DEVAM_EN_COK);
  const fazla = etkinler.length - gosterilen.length;

  return (
    <View style={stiller.kutu}>
      <View style={stiller.baslik}>
        <Yazi tur="kutuBasligi" accessibilityRole="header">
          Devam edenler
        </Yazi>
        <Pressable
          onPress={() => router.navigate('/yasam')}
          accessibilityRole="button"
          accessibilityLabel="Bütün planlar: Yaşam Tarzım"
          style={stiller.tumu}
          hitSlop={6}
        >
          <Yazi kalinlik="kalin" renk={renk.ana}>
            Tümü ›
          </Yazi>
        </Pressable>
      </View>

      {etkinler.length === 0 ? (
        <Yazi tur="ikincil">{PLAN_YOK_METNI}</Yazi>
      ) : (
        <>
          {gosterilen.map((o) => (
            <Pressable
              key={o.plan.id}
              onPress={() => router.push({ pathname: '/yasam/plan/[id]', params: { id: o.plan.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${o.plan.ad}, ${o.siradaki}, ${o.ilerleme}`}
              style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
            >
              <View style={stiller.serit} />
              <View style={stiller.esnek}>
                <Yazi tur="kartBasligi" numberOfLines={2}>
                  {o.plan.ad}
                </Yazi>
                <Yazi tur="ikincil" numberOfLines={2}>
                  {o.siradaki}
                </Yazi>
              </View>
              <Yazi kalinlik="kalin" style={stiller.ilerleme}>
                {o.ilerleme}
              </Yazi>
            </Pressable>
          ))}
          {fazla > 0 && (
            <Pressable onPress={() => router.navigate('/yasam')} accessibilityRole="button" style={stiller.fazla}>
              <Yazi kalinlik="kalin" renk={renk.ana}>
                {fazlaPlanMetni(fazla)}
              </Yazi>
            </Pressable>
          )}
        </>
      )}
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
  baslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  tumu: { minHeight: 44, justifyContent: 'center' },
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
});
