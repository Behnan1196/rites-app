// Gelenler ekranı (L-4): kimden, ne zaman, başlık, kısa açıklama, blok özeti,
// etiketler, uyarı notu; Kütüphaneme kaydet · Bugün Ajandama ekle · Sil.
// Pilot 16 Ekim: başka uygulamadan paylaşılan bağlantılar da burada, en üstte
// (telefonda durur; e-postayla devam etmeden de görünür).

import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { PaylasilanKarti } from '@/bilesen/giris/PaylasilanKarti';
import { useGelenler } from '@/bilesen/giris/useGelenler';
import { GrupDavetleri } from '@/bilesen/gruplar/GrupDavetleri';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { useKutuphaneyeKaydet } from '@/bilesen/kutuphane/KaydetSayfasi';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { alanAdi } from '@/mantik/alanlar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { blokOzeti, GELEN_UYARISI, gelenKarti } from '@/mantik/paylasim';
import { bugun, gunFarki, kisaTarih } from '@/mantik/tarih';
import { geleniSil, type Gelen } from '@/sunucu/gelenler';
import { useOturum } from '@/sunucu/oturum';
import { yeniKartKaydet } from '@/veri/kartlar';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { paylasilanlariOku, paylasilanSil, type Paylasilan } from '@/veri/paylasilanlar';
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
  const grup = useGruplar(oturum);
  const kutuphane = useKutuphaneyeKaydet(() => void yenile());
  const paylasilanlar = useSorgu(['paylasilan'], (o) => paylasilanlariOku(o), []);
  // "Ajandama ekle": kart formu dolu açılır; kart kaydedilince bağlantı Gelenler'den kalkar.
  const eklenecek = useRef<Paylasilan | null>(null);
  const kartFormu = useKartFormu(() => {
    const p = eklenecek.current;
    eklenecek.current = null;
    if (p) void paylasilanSil(kapi, p.id).catch((e: unknown) => console.error('Paylaşılan silinemedi', e));
  });
  const paylasilaniSil = (p: Paylasilan) =>
    void paylasilanSil(kapi, p.id)
      .then(() => kisaMesaj(`Silindi: ${p.baslik}`))
      .catch((e: unknown) => {
        console.error('Paylaşılan silinemedi', e);
        kisaMesaj('Silinemedi. Yeniden dene.');
      });

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
    <EkranKabi geri="Giriş" baslik="Gelenler" altBaslik="Sana gönderilen ve paylaştığın kartlar.">
      {(paylasilanlar.veri ?? []).map((p) => (
        <PaylasilanKarti
          key={p.id}
          p={p}
          neZaman={neZaman(p.olusturma, bugunGun)}
          onAjandayaEkle={() => {
            eklenecek.current = p;
            kartFormu.ac({ tur: 'yeni', gun: bugunGun, taslak: { baslik: p.baslik, videoAdresi: p.adres } });
          }}
          onKutuphaneyeKaydet={() => kutuphane.ac({ tur: 'paylasilan', paylasilan: p })}
          onSil={() => paylasilaniSil(p)}
        />
      ))}
      {!ben ? (
        <OturumGerekli oturum={oturum} aciklama="Sana gönderilen kartları görmek için e-postanla devam et." />
      ) : (
        <>
          {baglanamiyor && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}
          <GrupDavetleri davetler={grup.davetler} ad={grup.ad} onYanit={() => void grup.yenile()} />
          {!yukleniyor &&
            gelenler.length === 0 &&
            grup.davetler.length === 0 &&
            !baglanamiyor &&
            (paylasilanlar.veri ?? []).length === 0 && (
            <Yazi tur="ikincil">Şu an yeni bir şey yok.</Yazi>
          )}
          {gelenler.map((g) => (
            <View key={g.id} style={stiller.kart}>
              <Yazi tur="ikincil">{`${g.kimdenAd} gönderdi · ${neZaman(g.gonderim, bugunGun)}`}</Yazi>
              <Yazi tur="kartBasligi">{g.paket.baslik}</Yazi>
              {!!g.paket.kisa && <Yazi>{g.paket.kisa}</Yazi>}
              {(!!g.paket.alanlar?.length || !!g.paket.etiketTur) && (
                <Yazi tur="ikincil">{[...(g.paket.alanlar ?? []).map(alanAdi), g.paket.etiketTur].filter(Boolean).join(' · ')}</Yazi>
              )}
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
              <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Kütüphaneme kaydet" onPress={() => kutuphane.ac({ tur: 'gelen', gelen: g })} />
              <Dugme etiket="Bugün Ajandama ekle" onPress={() => void ajandayaEkle(g)} />
              <Dugme tur="tehlike" etiket="Sil" onPress={() => void sil(g)} />
            </View>
          ))}
        </>
      )}
      {kutuphane.oge}
      {kartFormu.oge}
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
