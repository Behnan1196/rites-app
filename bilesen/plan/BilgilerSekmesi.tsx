// Plan ekranı → Bilgiler (P-1): Neden? ve Hedef yerinde düzenlenir; Alan,
// Bitiş, Başlangıç, Günün sorusu satırları; Günün sorusu alanı (`08` açık soru 5);
// "Planı bitir".

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { alanAdi } from '@/mantik/alanlar';
import { bitisMetni, SORU_VARSAYILAN_ALT, SORU_VARSAYILAN_UST, type GununSorusu, type Plan } from '@/mantik/plan';
import { kisaTarih, type Gun } from '@/mantik/tarih';

import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { Bolum } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

interface Ozellikler {
  plan: Plan;
  bugunGun: Gun;
  onBilgi: (bilgi: Partial<Pick<Plan, 'neden' | 'hedef'>>) => void;
  onSoru: (soru: GununSorusu | null) => void;
  onBitir: () => void;
}

export function BilgilerSekmesi({ plan, bugunGun, onBilgi, onSoru, onBitir }: Ozellikler) {
  const [neden, setNeden] = useState(plan.neden);
  const [hedef, setHedef] = useState(plan.hedef);
  const [soru, setSoru] = useState(plan.gununSorusu?.metin ?? '');
  const [alt, setAlt] = useState(plan.gununSorusu?.alt ?? SORU_VARSAYILAN_ALT);
  const [ust, setUst] = useState(plan.gununSorusu?.ust ?? SORU_VARSAYILAN_UST);
  const etkin = plan.durum === 'etkin';

  const kaydetNeden = () => {
    if (neden.trim() !== plan.neden) onBilgi({ neden: neden.trim() });
  };
  const kaydetHedef = () => {
    if (hedef.trim() !== plan.hedef) onBilgi({ hedef: hedef.trim() });
  };
  const soruDegisti =
    soru.trim() !== (plan.gununSorusu?.metin ?? '') ||
    (plan.gununSorusu !== null && (alt.trim() !== plan.gununSorusu.alt || ust.trim() !== plan.gununSorusu.ust));

  const satirlar: [string, string][] = [
    ['Alan', alanAdi(plan.alan)],
    ['Bitiş', plan.bitis ? bitisMetni(plan.bitis, bugunGun) : 'Yok'],
    ['Başlangıç', kisaTarih(plan.baslangic)],
  ];
  if (plan.gununSorusu) satirlar.push(['Günün sorusu', plan.gununSorusu.metin]);

  return (
    <View style={stiller.kap}>
      <GirisAlani
        etiket="Neden?"
        value={neden}
        onChangeText={setNeden}
        onBlur={kaydetNeden}
        onSubmitEditing={kaydetNeden}
        placeholder="Örneğin: Daha dinç uyanmak"
        returnKeyType="done"
        editable={etkin}
      />
      <GirisAlani
        etiket="Hedef"
        value={hedef}
        onChangeText={setHedef}
        onBlur={kaydetHedef}
        onSubmitEditing={kaydetHedef}
        placeholder="Örneğin: Her sabah 15 dakika hareket"
        returnKeyType="done"
        editable={etkin}
      />

      <Bolum style={stiller.satirlar}>
        {satirlar.map(([etiket, deger], i) => (
          <View key={etiket} style={[stiller.satir, i > 0 && stiller.cizgili]} accessible accessibilityLabel={`${etiket}: ${deger}`}>
            <Yazi tur="ikincil" style={stiller.etiket}>
              {etiket}
            </Yazi>
            <Yazi kalinlik="yariKalin" style={stiller.deger}>
              {deger}
            </Yazi>
          </View>
        ))}
      </Bolum>

      {etkin && (
        <Bolum>
          <Yazi kalinlik="kalin" accessibilityRole="header">
            Günün sorusu
          </Yazi>
          <GirisAlani
            etiket="Soru"
            value={soru}
            onChangeText={setSoru}
            placeholder="Örneğin: Bu sabah kendini ne kadar dinç hissettin?"
            returnKeyType="done"
          />
          <View style={stiller.uclar}>
            <View style={stiller.esnek}>
              <GirisAlani etiket="1'in altı" value={alt} onChangeText={setAlt} returnKeyType="done" />
            </View>
            <View style={stiller.esnek}>
              <GirisAlani etiket="5'in altı" value={ust} onChangeText={setUst} returnKeyType="done" />
            </View>
          </View>
          {soruDegisti && soru.trim() !== '' && (
            <Dugme
              tur="ikincil"
              etiket="Soruyu kaydet"
              onPress={() =>
                onSoru({
                  metin: soru.trim(),
                  alt: alt.trim() || SORU_VARSAYILAN_ALT,
                  ust: ust.trim() || SORU_VARSAYILAN_UST,
                })
              }
            />
          )}
          {plan.gununSorusu && (
            <Dugme
              tur="tehlike"
              etiket="Soruyu kaldır"
              onPress={() => {
                setSoru('');
                setAlt(SORU_VARSAYILAN_ALT);
                setUst(SORU_VARSAYILAN_UST);
                onSoru(null);
              }}
            />
          )}
        </Bolum>
      )}

      {etkin ? (
        <Dugme tur="tehlike" etiket="Planı bitir" onPress={onBitir} />
      ) : (
        <Yazi tur="ikincil" renk={renk.ikincil}>
          Bu plan bitti; kartları ajandada görünmüyor.
        </Yazi>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 16 },
  satirlar: { gap: 0, paddingVertical: 4 },
  satir: { flexDirection: 'row', gap: 12, paddingVertical: 12, alignItems: 'flex-start' },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  etiket: { width: 110 },
  deger: { flex: 1 },
  uclar: { flexDirection: 'row', gap: 10 },
  esnek: { flex: 1 },
});
