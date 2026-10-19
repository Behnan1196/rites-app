// Gelenler'de "Gruplarından" (pilot 19 Ekim): yanıt bekleyen iş, buluşma, oylama
// ve rutin daveti, grup ekranındaki kartın aynısıyla (düğmeleri burada çalışır).
// Yanıtlayınca kalkar; gizlenebilenlerde "Gizle".

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Bekleyen } from '@/mantik/grupBekleyenler';
import type { Rutin } from '@/mantik/rutin';
import type { AdBulucu } from '@/mantik/gruplar';
import { useBugun } from '@/veri/useBugun';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { BulusmaKarti } from './BulusmaKarti';
import { IsKarti } from './IsKarti';
import { KararKarti } from './KararKarti';
import { RutinFormu } from './RutinFormu';
import { RutinKarti } from './RutinKarti';

export function GrupBekleyenleri({
  ben,
  bekleyenler,
  ad,
  onGizle,
}: {
  ben: string;
  bekleyenler: readonly Bekleyen[];
  ad: AdBulucu;
  onGizle: (anahtar: string) => Promise<void>;
}) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [katil, setKatil] = useState<{ n: number; rutin: Rutin } | null>(null);
  if (bekleyenler.length === 0) return null;
  const adi = (id: string) => ad(id);

  return (
    <View style={stiller.kap}>
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Gruplarından
      </Yazi>
      {bekleyenler.map((b) => (
        <View key={b.anahtar} style={stiller.oge}>
          <View style={stiller.ust}>
            <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
              {b.grupAdi.toLocaleUpperCase('tr')}
            </Yazi>
            {b.gizlenir && (
              <Dugme
                tur="yazi"
                etiket="Gizle"
                onPress={() => void onGizle(b.anahtar).then(() => kisaMesaj('Gizlendi; grupta yine görünür'))}
              />
            )}
          </View>
          {b.tur === 'is' && <IsKarti is={b.is} ben={ben} bugunGun={bugunGun} ad={adi} onDuzenle={() => undefined} />}
          {b.tur === 'bulusma' && <BulusmaKarti bulusma={b.bulusma} ben={ben} ad={adi} onDuzenle={() => undefined} />}
          {b.tur === 'karar' && <KararKarti karar={b.karar} ben={ben} bugunGun={bugunGun} ad={adi} />}
          {b.tur === 'rutin' && (
            <RutinKarti
              rutin={b.rutin}
              ben={ben}
              bugunGun={bugunGun}
              ad={adi}
              onKatil={() => setKatil((k) => ({ n: (k?.n ?? 0) + 1, rutin: b.rutin }))}
              onAyril={() => undefined}
              onDuzenle={() => undefined}
            />
          )}
        </View>
      ))}
      {katil && (
        <RutinFormu
          key={katil.n}
          grup={{ id: katil.rutin.grup, ad: katil.rutin.grupAdi }}
          kip={{ tur: 'katil', rutin: katil.rutin }}
          onKapat={() => setKatil(null)}
        />
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 12 },
  oge: { gap: 4 },
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
});
