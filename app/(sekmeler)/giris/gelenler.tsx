// Gelenler ekranı (L-4): kimden, ne zaman, başlık, kısa açıklama, blok özeti,
// uyarı notu; Bugün Ajandama ekle · Sil. ("Kütüphaneme kaydet" 11. görevde.)

import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useGelenler } from '@/bilesen/giris/useGelenler';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { blokOzeti, GELEN_UYARISI, gelenKarti } from '@/mantik/paylasim';
import { bugun, gunFarki, kisaTarih } from '@/mantik/tarih';
import { geleniSil, type Gelen } from '@/sunucu/gelenler';
import { useOturum } from '@/sunucu/oturum';
import { yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

function neZaman(gonderim: string, bugunGun: string): string {
  const gun = bugun(new Date(gonderim));
  const fark = gunFarki(gun, bugunGun);
  return fark === 0 ? 'Bugün' : fark === 1 ? 'Dün' : kisaTarih(gun);
}

export default function Gelenler() {
  const oturum = useOturum();
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { ben, gelenler, yukleniyor, baglanamiyor, yenile } = useGelenler(oturum);

  const ajandayaEkle = async (g: Gelen) => {
    try {
      const { kart, bloklar } = gelenKarti(g.paket, g.kimdenAd, bugunGun, yeniKimlik);
      await yeniKartKaydet(kapi, kart, bloklar, yeniKimlik);
      await geleniSil(g.id);
      kisaMesaj(`Ajandama eklendi: ${g.paket.baslik}`);
      void yenile();
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };

  const sil = async (g: Gelen) => {
    try {
      await geleniSil(g.id);
      kisaMesaj(`Silindi: ${g.paket.baslik}`);
      void yenile();
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };

  return (
    <EkranKabi geri="Giriş" baslik="Gelenler" altBaslik="Sana gönderilen kartlar.">
      {!ben ? (
        <OturumGerekli oturum={oturum} aciklama="Sana gönderilen kartları görmek için e-postanla devam et." />
      ) : (
        <>
          {baglanamiyor && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}
          {!yukleniyor && gelenler.length === 0 && !baglanamiyor && <Yazi tur="ikincil">Şu an yeni bir şey yok.</Yazi>}
          {gelenler.map((g) => (
            <View key={g.id} style={stiller.kart}>
              <Yazi tur="ikincil">{`${g.kimdenAd} gönderdi · ${neZaman(g.gonderim, bugunGun)}`}</Yazi>
              <Yazi tur="kartBasligi">{g.paket.baslik}</Yazi>
              {!!g.paket.kisa && <Yazi>{g.paket.kisa}</Yazi>}
              {g.paket.bloklar.length > 0 && (
                <View style={stiller.ozet}>
                  {blokOzeti(g.paket).map((b, i) => (
                    <View key={`${b}-${i}`} style={stiller.hap}>
                      <Yazi tur="etiket">{b}</Yazi>
                    </View>
                  ))}
                </View>
              )}
              <Yazi tur="etiket" renk={renk.vurguYazi}>
                {GELEN_UYARISI}
              </Yazi>
              <Dugme etiket="Bugün Ajandama ekle" onPress={() => void ajandayaEkle(g)} />
              <Dugme tur="tehlike" etiket="Sil" onPress={() => void sil(g)} />
            </View>
          ))}
        </>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 8,
  },
  ozet: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hap: { backgroundColor: renk.zemin, borderRadius: olcu.kose.etiket, paddingHorizontal: 8, paddingVertical: 2 },
});
