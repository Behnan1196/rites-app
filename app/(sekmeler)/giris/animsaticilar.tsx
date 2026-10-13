// Anımsatıcılar ekranı (AN-4): Bugün listesi, Anımsatıcılarım, + Anımsatıcı ekle.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAnimsaticiFormu } from '@/bilesen/animsatici/AnimsaticiFormu';
import { useAnimsatmalar } from '@/bilesen/animsatici/useAnimsatmalar';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import {
  ANIMSATICI_ACIKLAMA,
  ANIMSATICI_GIZLILIK,
  animsaticiMeta,
  DURUM_METNI,
  erteleMetni,
  idiMetni,
  type Animsatici,
  type AnimsatmaDurumu,
} from '@/mantik/animsatici';
import { animsaticiSil } from '@/veri/animsaticilar';
import { useVeri } from '@/veri/VeriSaglayici';

const DURUM_RENGI: Record<AnimsatmaDurumu, string> = {
  sirada: renk.ikincil,
  ertelendi: renk.vurguYazi,
  caliyor: renk.hata,
  durduruldu: renk.soluk,
  gecti: renk.soluk,
};

export default function Animsaticilar() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const form = useAnimsaticiFormu();
  const { yukleniyor, animsaticilar, animsatmalar, durdur, ertele } = useAnimsatmalar();
  const [silinecek, setSilinecek] = useState<Animsatici | null>(null);

  const hata = (e: unknown) => {
    console.error('Anımsatıcı değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  return (
    <>
      <EkranKabi geri="Giriş" baslik="Anımsatıcılar" altBaslik={ANIMSATICI_ACIKLAMA}>
        {!yukleniyor && (
          <>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Bugün
            </Yazi>
            {animsatmalar.length === 0 ? (
              <Yazi tur="ikincil">Bugün anımsatma yok.</Yazi>
            ) : (
              <View style={stiller.liste}>
                {animsatmalar.map((m, i) => (
                  <View
                    key={`${m.animsatici.id}-${m.saat}`}
                    style={[stiller.satir, i > 0 && stiller.cizgili, m.durum === 'caliyor' && stiller.calan]}
                  >
                    <View style={stiller.satirUst} accessible accessibilityLabel={`${m.gosterilen}, ${m.animsatici.ad}, ${DURUM_METNI[m.durum]} ${idiMetni(m)}`}>
                      <Yazi tur="bolumBasligi" style={stiller.saat}>
                        {m.gosterilen}
                      </Yazi>
                      <View style={stiller.esnek}>
                        <Yazi tur="kartBasligi">{m.animsatici.ad}</Yazi>
                        <Yazi tur="ikincil" kalinlik="yariKalin" renk={DURUM_RENGI[m.durum]}>
                          {`${DURUM_METNI[m.durum]} ${idiMetni(m)}`.trim()}
                        </Yazi>
                      </View>
                    </View>
                    {m.durum === 'caliyor' && (
                      <View style={stiller.dugmeler}>
                        <Dugme etiket="Durdur" onPress={() => void durdur(m).catch(hata)} style={stiller.esnek} />
                        <Dugme
                          tur="ikincil"
                          etiket={erteleMetni(m.animsatici.erteleDk)}
                          onPress={() => void ertele(m).catch(hata)}
                          style={stiller.esnek}
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.ara}>
              Anımsatıcılarım
            </Yazi>
            {animsaticilar.map((a) => (
              <View key={a.id} style={stiller.kart}>
                <View style={stiller.esnek}>
                  <Yazi tur="kartBasligi">{a.ad}</Yazi>
                  <Yazi kalinlik="kalin" renk={renk.ana}>
                    {a.saatler.join(' · ')}
                  </Yazi>
                  <Yazi tur="ikincil">{animsaticiMeta(a)}</Yazi>
                </View>
                <Dugme tur="tehlike" etiket="Sil" onPress={() => setSilinecek(a)} />
              </View>
            ))}
          </>
        )}

        <Dugme etiket="+ Anımsatıcı ekle" onPress={form.ac} />
        <Yazi tur="ikincil">{ANIMSATICI_GIZLILIK}</Yazi>
      </EkranKabi>

      {form.oge}

      {silinecek && (
        <Katman>
          <OnayKutusu
            baslik="Anımsatıcı silinsin mi?"
            aciklama={silinecek.ad}
            secenekler={[
              {
                etiket: 'Sil',
                tur: 'tehlike',
                onPress: () => {
                  const a = silinecek;
                  setSilinecek(null);
                  void animsaticiSil(kapi, a.id)
                    .then(() => kisaMesaj(`Silindi: ${a.ad}`))
                    .catch(hata);
                },
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilinecek(null) },
            ]}
          />
        </Katman>
      )}
    </>
  );
}

const stiller = StyleSheet.create({
  liste: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    overflow: 'hidden',
  },
  satir: { paddingHorizontal: olcu.kartIci, paddingVertical: 14, gap: 12 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  calan: { backgroundColor: '#FBEDEA' },
  satirUst: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  saat: { minWidth: 64 },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', gap: 10 },
  ara: { marginTop: 8 },
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingLeft: olcu.kartIci,
    paddingVertical: 12,
    paddingRight: 4,
  },
});
