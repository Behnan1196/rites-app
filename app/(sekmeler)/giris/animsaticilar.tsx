// Anımsatıcılar ekranı: eklenen anımsatıcıların listesi; dokununca düzenlenir
// (silme de düzenleme sayfasında). Bugünün anımsatmaları Giriş'teki kutuda.
// Pilot 14 Ekim: "Bugün" bölümü ve satırdaki Sil düğmesi kaldırıldı.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAnimsaticiFormu } from '@/bilesen/animsatici/AnimsaticiFormu';
import { useAnimsatmalar } from '@/bilesen/animsatici/useAnimsatmalar';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { ANIMSATICI_GIZLILIK, animsaticiMeta, kalanSureMetni } from '@/mantik/animsatici';
import { animsaticiSil } from '@/veri/animsaticilar';
import { useSimdiMs } from '@/veri/useSimdi';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Animsaticilar() {
  const form = useAnimsaticiFormu();
  const { yukleniyor, animsaticilar: hepsi } = useAnimsatmalar();
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const simdiMs = useSimdiMs();
  const animsaticilar = hepsi.filter((a) => !a.bitis);
  const sureler = hepsi.filter((a) => a.bitis);

  return (
    <>
      <EkranKabi geri="Giriş" baslik="Anımsatıcılar">
        {sureler.map((a) => (
          <View key={a.id} style={stiller.kart}>
            <View style={stiller.simge}>
              <Ionicons name="timer-outline" size={20} color={renk.ana} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{a.ad}</Yazi>
              <Yazi kalinlik="kalin" renk={renk.ana}>
                {`${a.saatler[0] ?? ''} · ${kalanSureMetni(a.bitis!, simdiMs)}`}
              </Yazi>
              <Yazi tur="ikincil">{animsaticiMeta(a)}</Yazi>
            </View>
            <Dugme
              tur="yazi"
              etiket="İptal"
              onPress={() =>
                void animsaticiSil(kapi, a.id)
                  .then(() => kisaMesaj(`İptal edildi: ${a.ad}`))
                  .catch((e: unknown) => console.error('Anımsatıcı silinemedi', e))
              }
            />
          </View>
        ))}
        {!yukleniyor && animsaticilar.length === 0 && (
          <Yazi tur="ikincil">
            Henüz saatli anımsatıcın yok. İlaç, su, göz damlası gibi düzenli olanlar ya da “Süre sonra” ile hızlı bir
            zamanlayıcı ekleyebilirsin.
          </Yazi>
        )}
        {animsaticilar.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => form.ac(a)}
            accessibilityRole="button"
            accessibilityLabel={`${a.ad}, ${a.saatler.join(', ')}, ${animsaticiMeta(a)}. Düzenle`}
            style={({ pressed }) => [stiller.kart, pressed && stiller.basili]}
          >
            {a.alarm && (
              <View style={stiller.simge}>
                <Ionicons name="alarm-outline" size={20} color={renk.ana} />
              </View>
            )}
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{a.ad}</Yazi>
              <Yazi kalinlik="kalin" renk={renk.ana}>
                {a.saatler.join(' · ')}
              </Yazi>
              <Yazi tur="ikincil">{animsaticiMeta(a)}</Yazi>
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>
        ))}

        <Dugme etiket="+ Anımsatıcı ekle" onPress={() => form.ac()} />
        <Yazi tur="ikincil">{ANIMSATICI_GIZLILIK}</Yazi>
      </EkranKabi>

      {form.oge}
    </>
  );
}

const stiller = StyleSheet.create({
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 14,
  },
  basili: { opacity: 0.7 },
  simge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
});
