// Ölçümlerin gidişatı (pilot 4 Kasım, P-87): kartın ⋯ → Gidişat. Son 4 hafta satır satır
// (en yeni üstte), her ölçüm bir sütun; hücrede o günün değeri, zemininin koyuluğu büyüklüğü.
// Üstte son 7 günün ortalaması. Hesap ve yorum yok: kişi ölçümleri yan yana görür.

import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { programDonemleri } from '@/mantik/deneme';
import { gidisatTablosu, sayiMetni } from '@/mantik/gidisat';
import { gunKisa, haftaGunu, kisaTarih } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { kartAyrinti, kartKayitlari } from '@/veri/kartlar';
import { programlariOku } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';

const GUN_SUTUNU = 80;
const SUTUN = 60;

export default function Gidisat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bugunGun = useBugun();
  const { width } = useWindowDimensions();
  const veri = useSorgu(
    ['kart', 'plan'],
    async (oku) => {
      const a = await kartAyrinti(oku, id);
      return a ? { ...a, kayitlar: await kartKayitlari(oku, id), programlar: await programlariOku(oku) } : null;
    },
    [id],
  );
  if (veri.yukleniyor) return <EkranKabi geri="Kart" />;
  if (!veri.veri)
    return (
      <EkranKabi geri="Kart" baslik="Gidişat">
        <Yazi tur="ikincil">Bu kart artık yok.</Yazi>
      </EkranKabi>
    );
  const { kart, bloklar, kayitlar, programlar } = veri.veri;
  const t = gidisatTablosu(bloklar, kayitlar, bugunGun, 28);
  // P-90: programların günleri tabloda solda şeritle işaretli (önce / sırası göz ile karşılaştırılsın).
  const enEski = t.satirlar[t.satirlar.length - 1]?.gun ?? bugunGun;
  const donemler = programDonemleri(programlar, bugunGun).filter((d) => d.son >= enEski);
  const donemi = (gun: string) => donemler.find((d) => gun >= d.ilk && gun <= d.son);
  // Sütunlar ekrana sığıyorsa genişler; sığmıyorsa tablo yana kayar.
  const kullanilabilir = width - olcu.ekranKenari * 2 - GUN_SUTUNU;
  const sutun = Math.max(SUTUN, t.sutunlar.length ? Math.floor(kullanilabilir / t.sutunlar.length) : SUTUN);
  const girilenGun = t.satirlar.filter((s) => s.hucreler.some((h) => h.deger !== null)).length;

  const tablo = (
    <View accessibilityRole="list">
      <View style={[stiller.satir, stiller.baslikSatiri]}>
        <View style={[stiller.gunHucresi, { width: GUN_SUTUNU }]} />
        {t.sutunlar.map((s) => (
          <View key={s.id} style={[stiller.baslikHucresi, { width: sutun }]}>
            <Yazi kalinlik="kalin" numberOfLines={2} style={stiller.orta} maxFontSizeMultiplier={1.3}>
              {s.ad}
            </Yazi>
            {!!s.birim && (
              <Yazi tur="etiket" numberOfLines={1} style={stiller.orta}>
                {s.birim}
              </Yazi>
            )}
          </View>
        ))}
      </View>
      <View style={[stiller.satir, stiller.ortalamaSatiri]}>
        <View style={[stiller.gunHucresi, { width: GUN_SUTUNU }]}>
          <Yazi tur="etiket" kalinlik="kalin">
            7 gün ort.
          </Yazi>
        </View>
        {t.ortalama.map((o, j) => (
          <View key={t.sutunlar[j]!.id} style={[stiller.hucre, { width: sutun - 4 }]}>
            <Yazi kalinlik="kalin" renk={renk.anaKoyu}>
              {o === null ? '–' : sayiMetni(o)}
            </Yazi>
          </View>
        ))}
      </View>
      {t.satirlar.map((s) => (
        <View
          key={s.gun}
          style={[stiller.satir, haftaGunu(s.gun) === 6 && stiller.haftaSonu]}
          accessible
          accessibilityLabel={`${kisaTarih(s.gun)}: ${t.sutunlar
            .map((c, j) => `${c.ad} ${s.hucreler[j]!.deger === null ? 'yok' : sayiMetni(s.hucreler[j]!.deger!)}`)
            .join(', ')}`}
        >
          <View style={[stiller.gunHucresi, { width: GUN_SUTUNU }]}>
            {!!donemi(s.gun) && <View style={stiller.programSeridi} />}
            <Yazi kalinlik={s.gun === bugunGun ? 'kalin' : undefined} numberOfLines={1}>
              {s.gun === bugunGun ? 'Bugün' : `${gunKisa(s.gun)} ${kisaTarih(s.gun).split(' ')[0]}`}
            </Yazi>
          </View>
          {s.hucreler.map((h, j) => (
            <View key={t.sutunlar[j]!.id} style={[stiller.hucre, { width: sutun - 4 }]}>
              {h.deger !== null && <View style={[stiller.dolgu, { opacity: 0.12 + 0.6 * h.yogunluk }]} />}
              <Yazi kalinlik="yariKalin" renk={h.deger === null ? renk.soluk : renk.yazi}>
                {h.deger === null ? '·' : sayiMetni(h.deger)}
              </Yazi>
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <EkranKabi geri="Kart" baslik="Gidişat" altBaslik={`${kart.baslik} · son 4 hafta`}>
      {t.sutunlar.length === 0 ? (
        <Yazi tur="ikincil">
          {'Bu kartta ölçüm yok. Karta "+ Ekle → Ölçüm" ile su, kahve, enerji gibi ölçümler ekle.'}
        </Yazi>
      ) : (
        <>
          {girilenGun < 7 && (
            <Yazi tur="ikincil">
              {`Şimdilik ${girilenGun} günün kaydı var. Birkaç hafta doldurdukça ölçümleri yan yana görmek anlam kazanır.`}
            </Yazi>
          )}
          {donemler.map((d) => (
            <View key={d.programId} style={stiller.programNotu}>
              <View style={stiller.programSimgesi} />
              <Yazi tur="ikincil" style={stiller.esnek}>
                {`${d.ad}: ${kisaTarih(d.ilk)} – ${d.son === bugunGun ? 'bugün' : kisaTarih(d.son)}`}
              </Yazi>
            </View>
          ))}
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={stiller.kaydirma}>
            {tablo}
          </ScrollView>
          <Yazi tur="ikincil">
            {
              "Koyu hücre büyük değer demek (Sayarak'ta hedefe, Puan'da 5'e göre). Birlikte değişen ölçümler bir ipucudur; nedenini tek başına göstermez."
            }
          </Yazi>
        </>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  kaydirma: { paddingBottom: 4 },
  satir: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: renk.satirCizgi },
  baslikSatiri: { borderBottomWidth: 2, borderBottomColor: renk.cizgi },
  ortalamaSatiri: { backgroundColor: renk.anaAcik, borderBottomWidth: 2, borderBottomColor: renk.cizgi },
  haftaSonu: { borderBottomWidth: 2, borderBottomColor: renk.cizgi },
  gunHucresi: { justifyContent: 'center', paddingVertical: 8, paddingRight: 6, paddingLeft: 10 },
  programSeridi: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: kaynakRenk.plan.serit,
  },
  programNotu: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  programSimgesi: { width: 5, height: 20, borderRadius: 2, backgroundColor: kaynakRenk.plan.serit },
  esnek: { flex: 1 },
  baslikHucresi: { justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  hucre: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dolgu: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: renk.ana },
  orta: { textAlign: 'center' },
});
