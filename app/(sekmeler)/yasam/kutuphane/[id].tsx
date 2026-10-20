// Kayıt ayrıntısı (L-2): etiketler, kaynak, içerik; "Bugün Ajandama ekle"
// (düzenlenebilir kopya), "Programa ekle" (pilot 20 Ekim), "Paylaş",
// "Kütüphaneden çıkar".

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { usePaylas } from '@/bilesen/paylasim/PaylasSayfasi';
import { Bolum } from '@/bilesen/Secim';
import { renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import {
  blokBasligi,
  etiketMetni,
  icerikMetaMetni,
  kayitAltMetni,
  kayitPaketi,
  kutuphanedenKart,
  type KartIcerigi,
  type KutuphaneBlogu,
} from '@/mantik/kutuphane';
import { useSorgu } from '@/veri/kancalar';
import { BuyutulebilirFoto } from '@/bilesen/kart/BuyutulebilirFoto';
import { yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { kutuphaneKaydiOku, kutuphanedenCikar } from '@/veri/kutuphane';
import { programKartiEkle } from '@/veri/programlar';
import { ProgramSecSayfasi } from '@/bilesen/yasam/ProgramSayfalari';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function KayitAyrintisi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const paylas = usePaylas();
  const veri = useSorgu(['kutuphane'], (o) => kutuphaneKaydiOku(o, id), [id]);
  const [cikarSorusu, setCikarSorusu] = useState(false);
  const [programSec, setProgramSec] = useState(0);
  const k = veri.veri;

  const hata = (e: unknown) => {
    console.warn(e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  const ajandayaEkle = async (c: KartIcerigi) => {
    try {
      const { kart, bloklar } = kutuphanedenKart(c, bugunGun, yeniKimlik);
      await yeniKartKaydet(kapi, kart, bloklar, yeniKimlik);
      kisaMesaj(`Ajandama eklendi: ${c.baslik}`);
    } catch (e) {
      hata(e);
    }
  };

  const programaEkle = async (programId: string) => {
    setProgramSec(0);
    if (!k) return;
    try {
      const c = k.icerik;
      await programKartiEkle(
        kapi,
        programId,
        {
          gun: 0,
          baslik: c.baslik,
          kisa: c.kisa,
          saat: c.saat,
          hatirlatma: c.hatirlatma,
          alarm: false,
          tekrar: c.tekrar,
          bloklar: c.bloklar,
        },
        bugunGun,
        yeniKimlik,
      );
      kisaMesaj(`Programa eklendi: ${c.baslik}`);
    } catch (e) {
      hata(e);
    }
  };

  const cikar = async () => {
    setCikarSorusu(false);
    if (!k) return;
    try {
      await kutuphanedenCikar(kapi, k.id);
      kisaMesaj('Kütüphaneden çıkarıldı');
      router.back();
    } catch (e) {
      hata(e);
    }
  };

  return (
    <EkranKabi geri="Kütüphanem" baslik={k?.baslik ?? (veri.yukleniyor ? '' : 'Kayıt')}>
      {!veri.yukleniyor && !k && <Yazi tur="ikincil">Bu kayıt artık kütüphanende değil.</Yazi>}
      {k && (
        <>
          <View style={stiller.ust}>
            <Yazi tur="ikincil">{etiketMetni(k)}</Yazi>
            <Yazi tur="ikincil" kalinlik="kalin">
              {kayitAltMetni(k)}
            </Yazi>
          </View>

          <KartIcerigiGorunumu c={k.icerik} />

          <View style={stiller.eylemler}>
            <Dugme etiket="Bugün Ajandama ekle" onPress={() => void ajandayaEkle(k.icerik)} />
            <Dugme
              tur="ikincil"
              yaziRengi={renk.ana}
              etiket="Programa ekle"
              onPress={() => setProgramSec((n) => n + 1)}
            />
            {k.paylasilabilir && (
              <Dugme
                tur="ikincil"
                yaziRengi={renk.ana}
                etiket="Paylaş"
                onPress={() => paylas.ac({ paket: kayitPaketi(k) })}
              />
            )}
            <Dugme tur="tehlike" etiket="Kütüphaneden çıkar" onPress={() => setCikarSorusu(true)} />
          </View>
        </>
      )}

      {cikarSorusu && k && (
        <Katman>
          <OnayKutusu
            baslik={`"${k.baslik}" kütüphaneden çıkarılsın mı?`}
            aciklama="Ajandandaki ve programlarındaki kopyalar yerinde kalır."
            secenekler={[
              { etiket: 'Çıkar', tur: 'tehlike', onPress: () => void cikar() },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setCikarSorusu(false) },
            ]}
          />
        </Katman>
      )}
      {paylas.oge}
      {k && programSec > 0 && (
        <ProgramSecSayfasi
          key={programSec}
          baslik={k.baslik}
          gorunur
          onKapat={() => setProgramSec(0)}
          onSec={(id) => void programaEkle(id)}
        />
      )}
    </EkranKabi>
  );
}

/** Kartın içeriği, salt okunur: meta, kısa açıklama, bloklar. */
function KartIcerigiGorunumu({ c }: { c: KartIcerigi }) {
  const meta = icerikMetaMetni(c);
  return (
    <>
      {!!meta && <Yazi tur="ikincil">{meta}</Yazi>}
      {!!c.kisa && <Yazi>{c.kisa}</Yazi>}
      {c.bloklar.map((b, i) => (
        <BlokGorunumu key={i} b={b} />
      ))}
    </>
  );
}

function BlokGorunumu({ b }: { b: KutuphaneBlogu }) {
  switch (b.tur) {
    case 'talimat':
      return b.metin ? <Yazi>{b.metin}</Yazi> : null;
    case 'liste':
    case 'adimlar':
      return (
        <Bolum>
          <Yazi kalinlik="kalin">{b.ad || (b.tur === 'adimlar' ? 'Proje adımları' : 'Liste')}</Yazi>
          {b.maddeler.map((m, i) => (
            <Yazi key={i}>{`• ${m}`}</Yazi>
          ))}
        </Bolum>
      );
    case 'video':
      return /^https?:\/\//i.test(b.metin) ? (
        <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Videoyu aç" onPress={() => void Linking.openURL(b.metin)} />
      ) : (
        <Yazi tur="ikincil">Video</Yazi>
      );
    case 'foto':
      return b.dosya ? <BuyutulebilirFoto uri={b.dosya} style={stiller.foto} etiket="Fotoğraf" /> : null;
    default:
      return <Yazi tur="ikincil">{blokBasligi(b)}</Yazi>;
  }
}

const stiller = StyleSheet.create({
  ust: { gap: 2 },
  eylemler: { gap: 10, marginTop: 8 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },
});
