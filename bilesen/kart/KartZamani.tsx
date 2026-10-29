// Kart görünümünde zaman (pilot 29 Ekim, P-63): düzenleme formundaki gibi sağ üstte zaman
// rozeti ("29 Ekim · 08:00"); dokununca aynı "Ne zaman?" sayfası (tarih ve saat). Kart
// buradan başka güne taşınır, saati değişir. Tekrarlı kartın sonraki bir gününde formdaki
// gibi sorulur: "Yalnız bu gün" · "Bu gün ve sonrası". Verilen kartta (P-62) yalnız saat.

import { router } from 'expo-router';
import { useState } from 'react';

import { bolmeSecenekleri, bolmeSorusuGerekirMi, duzenle, type BolmeSecimi, type KartTanimi } from '@/mantik/bolme';
import { gecerliHatirlatma, type Blok, type Kart } from '@/mantik/kart';
import { programBagCoz } from '@/mantik/program';
import { uzunTarih, type Gun } from '@/mantik/tarih';
import { islemleriUygula, kartZamaniYaz } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { programaYansit } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu } from '../OnayKutusu';
import { ZamanRozeti, ZamanSayfasi, type Zamanlama } from './Zamanlama';

function zamanlamasi(kart: Kart, gun: Gun): Zamanlama {
  return {
    tarih: kart.tarih ?? gun,
    saat: kart.saat,
    hatirlatma: kart.hatirlatma,
    alarm: kart.alarm,
    alarmSesi: kart.alarmSesi ?? null,
    tekrar: kart.tekrar,
  };
}

export function useKartZamani(kart: Kart, bloklar: readonly Blok[], gun: Gun) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [acik, setAcik] = useState(false);
  const [z, setZ] = useState<Zamanlama>(() => zamanlamasi(kart, gun));
  const [tarihsiz, setTarihsiz] = useState(kart.tarihsiz);
  const [soru, setSoru] = useState<Zamanlama | null>(null);
  /** Verilen kart: içerik ve gün verenin; yalnız saat. */
  const yalnizSaat = kart.kilitli;

  const ac = () => {
    setZ(zamanlamasi(kart, gun));
    setTarihsiz(kart.tarihsiz);
    setAcik(true);
  };

  const hata = (e: unknown) => {
    console.error('Kart kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  const uygula = async (y: Zamanlama, secim: BolmeSecimi | null) => {
    setSoru(null);
    const hatirlatma = gecerliHatirlatma(kart.hatirlatma, y.saat);
    const tanim: KartTanimi = {
      baslik: kart.baslik,
      kisa: kart.kisa,
      tarih: tarihsiz ? null : y.tarih,
      tarihsiz,
      saat: y.saat,
      hatirlatma,
      alarm: !!(hatirlatma && kart.alarm),
      alarmSesi: kart.alarm ? (kart.alarmSesi ?? null) : null,
      tekrar: kart.tekrar,
      seriSay: kart.seriSay ?? null,
    };
    try {
      const sonuc = duzenle(kart, gun, tanim, secim, yeniKimlik);
      const taslak = bloklar.map(({ kartId: _k, sira: _s, ...b }) => b);
      await islemleriUygula(kapi, sonuc.islemler, taslak, yeniKimlik);
      const eklenen = sonuc.islemler.find((i) => i.tur === 'kartEkle');
      const yeniId = eklenen?.tur === 'kartEkle' ? eklenen.kart.id : undefined;
      if (programBagCoz(kart.bag) && secim !== 'yalnizBuGun') await programaYansit(kapi, oku, yeniId ?? kart.id);
      if (sonuc.mesaj) kisaMesaj(sonuc.mesaj);
      // Tek seferlik kart başka güne taşındıysa görünüm o günü açar.
      const yeniGun = !kart.tekrar && tanim.tarih && tanim.tarih !== gun ? tanim.tarih : undefined;
      if (yeniGun && !yeniId) kisaMesaj(`Taşındı: ${yeniGun === bugunGun ? 'bugün' : uzunTarih(yeniGun)}`);
      if (yeniId || yeniGun) router.setParams({ ...(yeniId ? { id: yeniId } : {}), ...(yeniGun ? { gun: yeniGun } : {}) });
    } catch (e) {
      hata(e);
    }
  };

  const kapat = () => {
    setAcik(false);
    const once = zamanlamasi(kart, gun);
    const degisti = once.tarih !== z.tarih || once.saat !== z.saat || tarihsiz !== kart.tarihsiz;
    if (!degisti) return;
    if (yalnizSaat) {
      const hatirlatma = gecerliHatirlatma(kart.hatirlatma, z.saat);
      void kartZamaniYaz(kapi, kart.id, {
        saat: z.saat,
        hatirlatma,
        alarm: !!(hatirlatma && kart.alarm),
        alarmSesi: kart.alarmSesi ?? null,
      }).catch(hata);
      return;
    }
    if (bolmeSorusuGerekirMi(kart, gun)) setSoru(z);
    else void uygula(z, null);
  };

  const rozet = (
    <ZamanRozeti deger={zamanlamasi(kart, gun)} tarihYok={kart.tarihsiz} kalip={yalnizSaat} onPress={ac} />
  );

  const s = bolmeSecenekleri(gun);
  const oge = (
    <>
      <ZamanSayfasi
        gorunur={acik}
        bolum="tarih"
        onKapat={kapat}
        deger={z}
        bugunGun={bugunGun}
        tarihYok={tarihsiz}
        kalip={yalnizSaat}
        onTarihSec={(y) => {
          setZ(y);
          setTarihsiz(false);
        }}
        onDegis={setZ}
      />
      {soru && (
        <Katman>
          <OnayKutusu
            baslik="Değişiklik hangi günlere uygulansın?"
            aciklama={s.not}
            secenekler={[
              { etiket: s.yalnizBuGun, tur: 'ikincil', onPress: () => void uygula(soru, 'yalnizBuGun') },
              { etiket: s.buGunVeSonrasi, tur: 'ikincil', onPress: () => void uygula(soru, 'buGunVeSonrasi') },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) },
            ]}
          />
        </Katman>
      )}
    </>
  );

  return { rozet, oge };
}

/** Rozet ve sayfası birlikte (kart görünümünde, kart yüklendikten sonra çizilir). */
export function KartZamanRozeti({ kart, bloklar, gun }: { kart: Kart; bloklar: readonly Blok[]; gun: Gun }) {
  const { rozet, oge } = useKartZamani(kart, bloklar, gun);
  return (
    <>
      {rozet}
      {oge}
    </>
  );
}
