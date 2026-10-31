// Kart görünümünde zaman (P-63, P-67): Kur'daki gibi zaman satırı: Tarih · Saat · Süre ·
// Hatırlatma hapları; her biri kendi küçük sayfasını açar. Kart buradan taşınır, saati,
// süresi ve hatırlatması değişir. İzinler ayrı (P-67): tarih (ve süre), saat (ve hatırlatma).
// Tekrarlı kartın sonraki bir gününde formdaki gibi sorulur: "Yalnız bu gün" · "Bu gün ve
// sonrası". Eski verilen kartta (görünüm ayarı yok) yalnız saat ve hatırlatma.

import { router } from 'expo-router';
import { useImperativeHandle, useState, type Ref } from 'react';

import { bolmeSecenekleri, bolmeSorusuGerekirMi, duzenle, type BolmeSecimi, type KartTanimi } from '@/mantik/bolme';
import { eskiVerilenMi, saatDegisir, tarihDegisir } from '@/mantik/gorunumDegisimi';
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
import { ZamanHaplari, ZamanSayfasi, type ZamanBolumu, type Zamanlama } from './Zamanlama';

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

function ayniMi(a: Zamanlama, b: Zamanlama): boolean {
  return (
    a.tarih === b.tarih &&
    a.saat === b.saat &&
    !!a.alarm === !!b.alarm &&
    (a.alarmSesi ?? null) === (b.alarmSesi ?? null) &&
    JSON.stringify(a.hatirlatma) === JSON.stringify(b.hatirlatma) &&
    JSON.stringify(a.tekrar) === JSON.stringify(b.tekrar)
  );
}

/** P-72: kartın altındaki şerit hatırlatma sayfasını buradan açar. */
export interface KartZamaniAcici {
  ac: (b: ZamanBolumu) => void;
}

/** Zaman satırı ve sayfaları (kart yüklendikten sonra çizilir). */
export function KartZamanSatiri({
  kart,
  bloklar,
  gun,
  ref,
  sag,
}: {
  kart: Kart;
  bloklar: readonly Blok[];
  gun: Gun;
  ref?: Ref<KartZamaniAcici>;
  /** P-77: şeridin sağında ⋯ (başlık ve zaman izinleri). */
  sag?: React.ReactNode;
}) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [bolum, setBolum] = useState<ZamanBolumu | null>(null);
  const [z, setZ] = useState<Zamanlama>(() => zamanlamasi(kart, gun));
  const [tarihsiz, setTarihsiz] = useState(kart.tarihsiz);
  const [soru, setSoru] = useState<{ z: Zamanlama; tarihsiz: boolean } | null>(null);
  const eski = eskiVerilenMi(kart);

  const ac = (b: ZamanBolumu) => {
    setZ(zamanlamasi(kart, gun));
    setTarihsiz(kart.tarihsiz);
    setBolum(b);
  };
  useImperativeHandle(ref, () => ({ ac }));

  const hata = (e: unknown) => {
    console.error('Kart kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  const uygula = async (y: Zamanlama, ts: boolean, secim: BolmeSecimi | null) => {
    setSoru(null);
    const hatirlatma = gecerliHatirlatma(y.hatirlatma, y.saat);
    const tanim: KartTanimi = {
      baslik: kart.baslik,
      kisa: kart.kisa,
      tarih: ts && y.tekrar === null ? null : y.tarih,
      tarihsiz: ts && y.tekrar === null,
      saat: y.saat,
      hatirlatma,
      alarm: !!(hatirlatma && y.alarm),
      alarmSesi: y.alarm ? (y.alarmSesi ?? null) : null,
      tekrar: y.tekrar,
      seriSay: kart.seriSay ?? null,
      sabitler: kart.sabitler ?? null,
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
      const yeniGun = !y.tekrar && tanim.tarih && tanim.tarih !== gun ? tanim.tarih : undefined;
      if (yeniGun && !yeniId) kisaMesaj(`Taşındı: ${yeniGun === bugunGun ? 'bugün' : uzunTarih(yeniGun)}`);
      if (yeniId || yeniGun)
        router.setParams({ ...(yeniId ? { id: yeniId } : {}), ...(yeniGun ? { gun: yeniGun } : {}) });
    } catch (e) {
      hata(e);
    }
  };

  const kapat = () => {
    setBolum(null);
    if (ayniMi(z, zamanlamasi(kart, gun)) && tarihsiz === kart.tarihsiz) return;
    if (eski) {
      // Eski verilen kart: yalnız saat ve hatırlatma, kartın kendi satırında.
      const hatirlatma = gecerliHatirlatma(z.hatirlatma, z.saat);
      void kartZamaniYaz(kapi, kart.id, {
        saat: z.saat,
        hatirlatma,
        alarm: !!(hatirlatma && z.alarm),
        alarmSesi: z.alarmSesi ?? null,
      }).catch(hata);
      return;
    }
    if (bolmeSorusuGerekirMi(kart, gun)) setSoru({ z, tarihsiz });
    else void uygula(z, tarihsiz, null);
  };

  const s = bolmeSecenekleri(gun);
  return (
    <>
      <ZamanHaplari
        deger={zamanlamasi(kart, gun)}
        tarihYok={kart.tarihsiz}
        tarihIzni={tarihDegisir(kart)}
        saatIzni={saatDegisir(kart)}
        onAc={ac}
        sag={sag}
      />
      <ZamanSayfasi
        gorunur={bolum !== null}
        bolum={bolum ?? 'tarih'}
        onKapat={kapat}
        deger={z}
        bugunGun={bugunGun}
        tarihYok={tarihsiz}
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
              {
                etiket: s.yalnizBuGun,
                tur: 'ikincil',
                onPress: () => void uygula(soru.z, soru.tarihsiz, 'yalnizBuGun'),
              },
              {
                etiket: s.buGunVeSonrasi,
                tur: 'ikincil',
                onPress: () => void uygula(soru.z, soru.tarihsiz, 'buGunVeSonrasi'),
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) },
            ]}
          />
        </Katman>
      )}
    </>
  );
}
