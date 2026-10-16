// "Kütüphaneye kaydet" (L-1) ve Gelenler'de "Kütüphaneme kaydet" (L-4): alanlar
// (çoklu), tür (tekli); tahmini etiketler önceden seçili. Kart görünümünden ve
// kart formundan açılınca "Ajandamdan kaldır" seçeneği var (plan kartında yok).

import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ALANLAR, type AlanAnahtari } from '@/mantik/alanlar';
import type { Blok, Kart } from '@/mantik/kart';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import {
  kartIcerigi,
  kaynakMetni,
  paketIcerigi,
  TURLER,
  turMu,
  turTahmini,
  type EtiketTuru,
  type KartIcerigi,
} from '@/mantik/kutuphane';
import { kaynakAdi, paylasilanPaketi } from '@/mantik/paylasimAl';
import { geleniSil, type Gelen } from '@/sunucu/gelenler';
import { yeniKimlik } from '@/veri/kimlik';
import { kutuphaneyeKaydet } from '@/veri/kutuphane';
import { paylasilanSil, type Paylasilan } from '@/veri/paylasilanlar';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { IsaretKutusu } from '../gruplar/parcalar';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';

export type Kaydedilen =
  | {
      tur: 'kart';
      kart: Kart;
      bloklar: readonly Pick<Blok, 'tur' | 'ad' | 'metin' | 'birim' | 'dakika' | 'maddeler' | 'dosya'>[];
      /** Plan kartında planın alanı. */
      alan: AlanAnahtari | null;
    }
  | { tur: 'gelen'; gelen: Gelen }
  /** Başka uygulamadan paylaşılan bağlantı (Gelenler'de, telefonda). */
  | { tur: 'paylasilan'; paylasilan: Paylasilan };

interface Hazirlik {
  icerik: KartIcerigi;
  alanlar: AlanAnahtari[];
  etiketTur: EtiketTuru;
  kaynak: string;
  /** "Ajandamdan kaldır" seçeneği gösterilsin mi; gösterilirse silinecek kart. */
  kaldirilacak: Kart | null;
}

function hazirla(h: Kaydedilen): Hazirlik {
  if (h.tur === 'kart') {
    return {
      icerik: kartIcerigi(h.kart, h.bloklar),
      alanlar: h.alan ? [h.alan] : [],
      etiketTur: turTahmini(h.bloklar),
      kaynak: kaynakMetni(h.kart),
      kaldirilacak: h.kart.planId || h.kart.kilitli ? null : h.kart,
    };
  }
  if (h.tur === 'paylasilan') {
    const p = paylasilanPaketi({ baslik: h.paylasilan.baslik, videoAdresi: h.paylasilan.adres });
    return {
      icerik: paketIcerigi(p),
      alanlar: [],
      etiketTur: turTahmini(p.bloklar),
      kaynak: `Paylaştın: ${kaynakAdi(h.paylasilan.adres)}`,
      kaldirilacak: null,
    };
  }
  const p = h.gelen.paket;
  const bilinen = new Set<string>(ALANLAR.map((a) => a.anahtar));
  return {
    icerik: paketIcerigi(p),
    alanlar: (p.alanlar ?? []).filter((a): a is AlanAnahtari => bilinen.has(a)),
    etiketTur: turMu(p.etiketTur) ? p.etiketTur : turTahmini(p.bloklar),
    kaynak: `Gönderen: ${h.gelen.kimdenAd}`,
    kaldirilacak: null,
  };
}

function KaydetSayfasi({
  hedef,
  gorunur,
  onKapat,
  onKaydedildi,
}: {
  hedef: Kaydedilen;
  gorunur: boolean;
  onKapat: () => void;
  onKaydedildi?: (sonuc: { kaldirildi: boolean }) => void;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [h] = useState(() => hazirla(hedef));
  const [alanlar, setAlanlar] = useState<AlanAnahtari[]>(h.alanlar);
  const [tur, setTur] = useState<EtiketTuru>(h.etiketTur);
  const [kaldir, setKaldir] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);

  const kaydet = async () => {
    setCalisiyor(true);
    try {
      await kutuphaneyeKaydet(
        kapi,
        {
          id: yeniKimlik(),
          tur: 'kart',
          baslik: h.icerik.baslik,
          alanlar: ALANLAR.map((a) => a.anahtar).filter((a) => alanlar.includes(a)),
          etiketTur: tur,
          kaynak: h.kaynak,
          paylasilabilir: true,
          olusturma: new Date().toISOString(),
          icerik: h.icerik,
        },
        kaldir && h.kaldirilacak ? h.kaldirilacak.id : undefined,
      );
      if (hedef.tur === 'gelen') {
        // Alıcı kaydedince kart sunucudan silinir (`07`).
        await geleniSil(hedef.gelen.id).catch((e: unknown) => console.warn(e));
      }
      if (hedef.tur === 'paylasilan') await paylasilanSil(kapi, hedef.paylasilan.id);
      kisaMesaj(kaldir ? "Kütüphaneye kaydedildi ve Ajandam'dan kaldırıldı" : 'Kütüphaneye kaydedildi');
      onKaydedildi?.({ kaldirildi: kaldir });
      onKapat();
    } catch (e) {
      console.warn(e);
      kisaMesaj(hedef.tur === 'gelen' ? BAGLANAMIYOR : 'Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Kütüphaneye kaydet"
      solVazgec
      altAlan={<Dugme etiket="Kaydet" onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <Yazi tur="kartBasligi">{h.icerik.baslik}</Yazi>
      <Bolum>
        <Yazi kalinlik="kalin">Hangi alanlarla ilgili?</Yazi>
        <View style={stiller.cipler}>
          {ALANLAR.map((a) => (
            <SecenekHapi
              key={a.anahtar}
              etiket={a.ad}
              secili={alanlar.includes(a.anahtar)}
              onPress={() =>
                setAlanlar((s) => (s.includes(a.anahtar) ? s.filter((x) => x !== a.anahtar) : [...s, a.anahtar]))
              }
            />
          ))}
        </View>
      </Bolum>
      <Bolum>
        <Yazi kalinlik="kalin">Türü</Yazi>
        <View style={stiller.cipler}>
          {TURLER.map((t) => (
            <SecenekHapi key={t} etiket={t} secili={tur === t} onPress={() => setTur(t)} />
          ))}
        </View>
      </Bolum>
      {h.kaldirilacak && (
        <Pressable
          onPress={() => setKaldir((k) => !k)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: kaldir }}
          accessibilityLabel="Ajandamdan kaldır"
          style={stiller.kaldir}
        >
          <IsaretKutusu secili={kaldir} />
          <View style={stiller.esnek}>
            <Yazi kalinlik="kalin">Ajandamdan kaldır</Yazi>
            {kaldir && h.kaldirilacak.tekrar && (
              <Yazi tur="ikincil">Kart ajandadan silinir; geçmiş kayıtları da silinir.</Yazi>
            )}
          </View>
        </Pressable>
      )}
    </AltSayfa>
  );
}

/** `const kaydet = useKutuphaneyeKaydet(); kaydet.ac(hedef); {kaydet.oge}` */
export function useKutuphaneyeKaydet(onKaydedildi?: (sonuc: { kaldirildi: boolean }) => void) {
  const [durum, setDurum] = useState<{ no: number; acik: boolean; hedef: Kaydedilen } | null>(null);
  const ac = useCallback((hedef: Kaydedilen) => setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true, hedef })), []);
  const oge = durum ? (
    <KaydetSayfasi
      key={durum.no}
      hedef={durum.hedef}
      gorunur={durum.acik}
      onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))}
      onKaydedildi={onKaydedildi}
    />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kaldir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  esnek: { flex: 1 },
});
