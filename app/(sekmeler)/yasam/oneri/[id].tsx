// Rites önerisi (hazır program): içeriği, "Programlarıma ekle" (kopyası kişinin
// programı olur; istediği gibi değiştirir).

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { Bolum } from '@/bilesen/Secim';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi } from '@/bilesen/yasam/parcalar';
import { alanAdi } from '@/mantik/alanlar';
import { kartZamanMetni, onerdenProgram, oneriBul, sureMetni } from '@/mantik/program';
import { yeniKimlik } from '@/veri/kimlik';
import { programKur } from '@/veri/programlar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function OneriEkrani() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [calisiyor, setCalisiyor] = useState(false);
  const o = oneriBul(id ?? '');

  if (!o) {
    return (
      <EkranKabi geri="Geri">
        <Yazi tur="ikincil">Bu öneri bulunamadı.</Yazi>
      </EkranKabi>
    );
  }

  const ekle = async () => {
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      const { program, kartlar } = onerdenProgram(o, yeniKimlik);
      await programKur(kapi, program, kartlar);
      kisaMesaj('Programlarına eklendi');
      router.replace({ pathname: '/yasam/program/[id]', params: { id: program.id } });
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <EkranKabi geri="Geri">
      <View style={stiller.ust}>
        <AlanSimgesi alan={o.alan} buyuk />
        <View style={stiller.esnek}>
          <Yazi tur="ekranBasligi" accessibilityRole="header">
            {o.ad}
          </Yazi>
          <Yazi tur="ikincil">{`Rites önerisi · ${alanAdi(o.alan)} · ${sureMetni(o.sure)}`}</Yazi>
        </View>
      </View>
      <Yazi>{o.aciklama}</Yazi>
      <Bolum>
        <Yazi kalinlik="kalin">{`Kartlar (${o.kartlar.length})`}</Yazi>
        {o.kartlar.map((k, i) => (
          <View key={i} style={stiller.kart}>
            <Yazi kalinlik="yariKalin">{k.baslik}</Yazi>
            <Yazi tur="ikincil">{kartZamanMetni(k)}</Yazi>
          </View>
        ))}
      </Bolum>
      <Dugme etiket="Programlarıma ekle" onPress={() => void ekle()} pasif={calisiyor} />
      <Yazi tur="ikincil">Eklediğin kopya senindir: kart ekler, çıkarır, süresini değiştirir, başlatırsın.</Yazi>
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  esnek: { flex: 1 },
  kart: { gap: 2, paddingVertical: 4 },
});
