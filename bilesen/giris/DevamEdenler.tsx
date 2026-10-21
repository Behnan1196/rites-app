// Devam edenler: en çok 3 uygulanan program (pilot 20 Ekim; eskiden planlar);
// her satırda sol şerit, ad, sıradaki iş ve bugünkü ilerleme. Başlığın solundaki yaprak simgesi Yaşam Tarzım'ı açar.

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DEVAM_EN_COK, fazlaProgramMetni, PROGRAM_YOK_METNI } from '@/mantik/program';

import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { KutuSimgesi } from './KutuSimgesi';
import { ModulDugmesi } from './ModulDugmesi';
import { useProgramlar } from '../yasam/useProgramlar';

export function DevamEdenler() {
  const { yukleniyor, ozetler } = useProgramlar();
  if (yukleniyor) return null;
  const etkinler = ozetler.filter((o) => o.durum === 'uygulaniyor');
  const gosterilen = etkinler.slice(0, DEVAM_EN_COK);
  const fazla = etkinler.length - gosterilen.length;

  return (
    <View style={stiller.kutu}>
      <View style={stiller.baslik}>
        <ModulDugmesi
          etiket="Yaşam Tarzım'ı aç"
          onPress={() => router.navigate('/yasam')}
          simge={<KutuSimgesi k="devam" />}
        />
        <Yazi tur="kutuBasligi" accessibilityRole="header">
          Devam edenler
        </Yazi>
      </View>

      {etkinler.length === 0 ? (
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
});
