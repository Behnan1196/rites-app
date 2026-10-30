// Anımsatıcılar ekranı: eklenen anımsatıcıların listesi; dokununca düzenlenir
// (silme de düzenleme sayfasında). Bugünün anımsatmaları Giriş'teki kutuda.
// Pilot 14 Ekim: "Bugün" bölümü ve satırdaki Sil düğmesi kaldırıldı.
// Pilot 23 Ekim: zamanlayıcı üstteydi; P-71 (30 Ekim): zamanlayıcı yalnız Giriş'te, bu ekranda yok.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAnimsaticiFormu } from '@/bilesen/animsatici/AnimsaticiFormu';
import { useAnimsatmalar } from '@/bilesen/animsatici/useAnimsatmalar';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { olcu, renk } from '@/bilesen/tema';
import { Bolum } from '@/bilesen/Secim';
import { SesSecici } from '@/bilesen/SesSecici';
import { Yazi } from '@/bilesen/Yazi';
import { ANIMSATICI_GIZLILIK, animsaticiMeta } from '@/mantik/animsatici';
import { ayarOku, ayarYaz } from '@/veri/ayar';
import { useSorgu } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Animsaticilar() {
  const form = useAnimsaticiFormu();
  const { yukleniyor, animsaticilar: hepsi } = useAnimsatmalar();
  const { kapi } = useVeri();
  const kartSesi = useSorgu(['ayar'], async (o) => (await ayarOku(o, 'hatirlatma_sesi')) ?? null, []);
  const animsaticilar = hepsi.filter((a) => !a.bitis);

  return (
    <>
      <EkranKabi geri="Giriş" baslik="Anımsatıcılar">
        {!yukleniyor && animsaticilar.length === 0 && (
          <Yazi tur="ikincil">
            Henüz saatli anımsatıcın yok. İlaç, su, göz damlası gibi düzenli olanları ekleyebilirsin.
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
        <Bolum>
          <Yazi kalinlik="kalin">Ajanda hatırlatmalarının sesi</Yazi>
          <Yazi tur="ikincil">
            Kartlara kurduğun hatırlatmalar bu sesle gelir. Anımsatıcının sesi kendi sayfasında seçilir.
          </Yazi>
          <SesSecici
            ses={kartSesi.veri ?? null}
            onDegis={(ses) =>
              void ayarYaz(kapi, 'hatirlatma_sesi', ses).catch((e: unknown) => console.error('Ses kaydedilemedi', e))
            }
          />
        </Bolum>
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
