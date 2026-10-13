// Kayıt ayrıntısı (L-2, L-3): etiketler, kaynak, içerik; kartta "Bugün Ajandama
// ekle" (düzenlenebilir kopya), "Paylaş"; planda "Planı yeniden başlat";
// "Kütüphaneden çıkar".

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';

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
  planiYenidenBaslat,
  planKartiMetni,
  type KartIcerigi,
  type KutuphaneBlogu,
} from '@/mantik/kutuphane';
import { useSorgu } from '@/veri/kancalar';
import { yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { kutuphaneKaydiOku, kutuphanedenCikar } from '@/veri/kutuphane';
import { alanDurumlari, planBaslat } from '@/veri/planlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function KayitAyrintisi() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const paylas = usePaylas();
  const veri = useSorgu(['kutuphane'], (o) => kutuphaneKaydiOku(o, id), [id]);
  const [cikarSorusu, setCikarSorusu] = useState(false);
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

  const yenidenBaslat = async () => {
    if (k?.tur !== 'plan') return;
    try {
      const puan = (await alanDurumlari(oku)).get(k.icerik.alan)?.puan ?? 0;
      const y = planiYenidenBaslat(k.icerik, bugunGun, puan, yeniKimlik);
      await planBaslat(kapi, y, yeniKimlik);
      kisaMesaj('Plan yeniden başladı');
      router.replace({ pathname: '/yasam/plan/[id]', params: { id: y.plan.id } });
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

          {k.tur === 'kart' ? (
            <KartIcerigiGorunumu c={k.icerik} />
          ) : (
            <>
              {!!k.icerik.neden && <Yazi>{`Neden: ${k.icerik.neden}`}</Yazi>}
              {!!k.icerik.hedef && <Yazi>{`Hedef: ${k.icerik.hedef}`}</Yazi>}
              <Bolum>
                <Yazi kalinlik="kalin">Planın kartları</Yazi>
                {k.icerik.kartlar.length === 0 ? (
                  <Yazi tur="ikincil">Bu planda kart yok.</Yazi>
                ) : (
                  k.icerik.kartlar.map((c, i) => <Yazi key={i}>{planKartiMetni(c)}</Yazi>)
                )}
              </Bolum>
            </>
          )}

          <View style={stiller.eylemler}>
            {k.tur === 'kart' ? (
              <Dugme etiket="Bugün Ajandama ekle" onPress={() => void ajandayaEkle(k.icerik)} />
            ) : (
              <Dugme etiket="Planı yeniden başlat" onPress={() => void yenidenBaslat()} />
            )}
            {k.tur === 'kart' && k.paylasilabilir && (
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
            aciklama={k.tur === 'kart' ? "Ajandandaki kopyalar yerinde kalır." : 'Süren plan yerinde kalır.'}
            secenekler={[
              { etiket: 'Çıkar', tur: 'tehlike', onPress: () => void cikar() },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setCikarSorusu(false) },
            ]}
          />
        </Katman>
      )}
      {paylas.oge}
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
      return (
        <Bolum>
          <Yazi kalinlik="kalin">{b.ad || 'Liste'}</Yazi>
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
      return b.dosya ? <Image source={{ uri: b.dosya }} style={stiller.foto} accessibilityLabel="Fotoğraf" /> : null;
    default:
      return <Yazi tur="ikincil">{blokBasligi(b)}</Yazi>;
  }
}

const stiller = StyleSheet.create({
  ust: { gap: 2 },
  eylemler: { gap: 10, marginTop: 8 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },
});
