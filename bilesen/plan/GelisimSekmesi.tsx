// Plan ekranı → Gelişim (P-1): düzenli kart varsa Bugün · Süre · Alan puanı ·
// En uzun seri ve son ölçümler; soru varsa son 7 gün grafiği; adım varsa
// ilerleme çubuğu ve kutular. ("Grafikler" yer tutucusu yok: `10`.)

import { StyleSheet, View } from 'react-native';

import { alanAdi } from '@/mantik/alanlar';
import type { Kart } from '@/mantik/kart';
import { adimlar, adimOzeti, bitisMetni, puanDegisimi, type Plan, type SoruCubugu } from '@/mantik/plan';
import type { Gun } from '@/mantik/tarih';

import { Bolum } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { BilgiKutusu, IlerlemeCubugu, KutuIzgarasi } from '../yasam/parcalar';

interface Ozellikler {
  plan: Plan;
  kartlar: readonly Kart[];
  bugunGun: Gun;
  bugunYapilan: number;
  bugunToplam: number;
  simdikiPuan: number;
  enUzunSeri: number;
  olcumler: { ad: string; deger: string }[];
  soru: { cubuklar: SoruCubugu[]; ortalamaMetni: string } | null;
}

export function GelisimSekmesi({
  plan,
  kartlar,
  bugunGun,
  bugunYapilan,
  bugunToplam,
  simdikiPuan,
  enUzunSeri,
  olcumler,
  soru,
}: Ozellikler) {
  const duzenliVar = kartlar.some((k) => k.tekrar);
  const a = adimlar(kartlar, bugunGun);
  const ozet = a.toplam > 0 ? adimOzeti(a, bugunGun) : null;

  return (
    <View style={stiller.kap}>
      {duzenliVar && (
        <KutuIzgarasi>
          <BilgiKutusu etiket="Bugün" deger={`${bugunYapilan} / ${bugunToplam} yapıldı`} />
          <BilgiKutusu etiket="Süre" deger={plan.bitis ? bitisMetni(plan.bitis, bugunGun) : 'Bitiş yok'} />
          <BilgiKutusu etiket={`${alanAdi(plan.alan)} puanın`} deger={puanDegisimi(plan.baslangicPuani, simdikiPuan)} />
          <BilgiKutusu etiket="En uzun seri" deger={`${enUzunSeri} gün`} />
        </KutuIzgarasi>
      )}

      {olcumler.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Son ölçümler
          </Yazi>
          <Bolum style={stiller.olcumler}>
            {olcumler.map((o, i) => (
              <View key={`${o.ad}-${i}`} style={[stiller.olcum, i > 0 && stiller.cizgili]} accessible>
                <Yazi tur="ikincil" style={stiller.esnek}>
                  {o.ad}
                </Yazi>
                <Yazi kalinlik="kalin">{o.deger}</Yazi>
              </View>
            ))}
          </Bolum>
        </>
      )}

      {soru && plan.gununSorusu && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Günün sorusu
          </Yazi>
          <Bolum>
            <Yazi tur="ikincil">{plan.gununSorusu.metin}</Yazi>
            <View style={stiller.grafik} accessibilityLabel={soru.ortalamaMetni}>
              {soru.cubuklar.map((c) => (
                <View key={c.gun} style={stiller.sutun} accessible accessibilityLabel={`${c.etiket}: ${c.deger ?? 'cevap yok'}`}>
                  <Yazi tur="etiket" kalinlik="kalin" renk={c.deger ? renk.yazi : renk.soluk}>
                    {c.deger ? String(c.deger) : '–'}
                  </Yazi>
                  <View
                    style={[
                      stiller.cubuk,
                      { height: c.deger ? c.deger * 14 : 4, backgroundColor: c.deger ? renk.ana : renk.cizgi },
                    ]}
                  />
                  <Yazi tur="etiket" maxFontSizeMultiplier={1.2}>
                    {c.etiket}
                  </Yazi>
                </View>
              ))}
            </View>
            <Yazi kalinlik="kalin">{soru.ortalamaMetni}</Yazi>
          </Bolum>
        </>
      )}

      {ozet && (
        <>
          <IlerlemeCubugu metin={ozet.cubukMetni} oran={ozet.oran} />
          <KutuIzgarasi>
            {ozet.kutular.map((k) => (
              <BilgiKutusu key={k.etiket} etiket={k.etiket} deger={k.deger} />
            ))}
          </KutuIzgarasi>
        </>
      )}

      {!duzenliVar && !ozet && !soru && (
        <Yazi tur="ikincil">Plana kart ya da adım ekledikçe gelişimin burada görünür.</Yazi>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  esnek: { flex: 1 },
  olcumler: { gap: 0, paddingVertical: 4 },
  olcum: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  grafik: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 120 },
  sutun: { flex: 1, alignItems: 'center', gap: 4 },
  cubuk: { width: 22, borderRadius: 6 },
});
