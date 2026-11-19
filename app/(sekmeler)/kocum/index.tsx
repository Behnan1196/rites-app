// Koçum (pilot 19 Kasım, P-133): koçun ya da diyetisyenin programı, beslenme planı, mesajlar ve
// check-in burada olacak (`docs/danisan-uygulamasi.md`). Koç bağı (davet kodu, sunucu, koç paneli)
// henüz yok; sekme şimdilik ne geleceğini anlatır ve kişinin kendi antrenmanına yol gösterir.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';

const GELECEKLER: { ikon: ComponentProps<typeof Ionicons>['name']; metin: string }[] = [
  { ikon: 'barbell-outline', metin: 'Koçunun hazırladığı antrenmanlar kendi günlerinde ajandana gelir.' },
  { ikon: 'restaurant-outline', metin: 'Diyetisyeninin öğün planı ve tarifleri burada durur.' },
  { ikon: 'chatbubbles-outline', metin: 'Koçunla yazışır, sesli mesaj ve görüntülü görüşme bağlantısı gönderirsin.' },
  { ikon: 'checkbox-outline', metin: 'Haftalık check-in sorularını buradan cevaplarsın.' },
];

export default function Kocum() {
  return (
    <EkranKabi baslik="Koçum">
      <View style={stiller.kutu}>
        <View style={stiller.simge}>
          <Ionicons name="person-add-outline" size={28} color={renk.ana} />
        </View>
        <Yazi tur="bolumBasligi">Koçunla ya da diyetisyeninle bağlan</Yazi>
        <Yazi tur="ikincil">
          {
            "Yakında: koçun ya da diyetisyenin Rites'ı kullanmaya başlayınca sana bir davet kodu verecek. Kodu buraya yazınca bağlanırsınız; neyin ona gideceğini sen seçersin."
          }
        </Yazi>
        {GELECEKLER.map((g) => (
          <View key={g.metin} style={stiller.satir}>
            <Ionicons name={g.ikon} size={22} color={renk.ana} />
            <Yazi style={stiller.esnek}>{g.metin}</Yazi>
          </View>
        ))}
      </View>

      <View style={stiller.kutu}>
        <Yazi tur="kartBasligi">Şimdilik kendi antrenmanın</Yazi>
        <Yazi tur="ikincil">
          {
            'Egzersiz listende setler varsa listeyi açıp "Antrenmana başla"ya dokun: egzersiz egzersiz ilerler, setleri işaretler, sonunda özetini görürsün.'
          }
        </Yazi>
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="Programlar ve öneriler"
          onPress={() => router.navigate('/yasam')}
        />
      </View>
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  simge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satir: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  esnek: { flex: 1 },
});
