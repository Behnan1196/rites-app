// Kart görünümü (K-7, K-12, K-13): tam ekran, alt menü görünmez. Pilot 21 Ekim: tek
// uzun kart; başlık bölümü (başlık, zaman, program, kısa açıklama), seri, sonra her
// blok kendi bölümünde, türünün simgesi ve adıyla. Kart hangi
// günden açıldıysa o günün kaydını gösterir ve ona yazar.
// Pilot 16 Ekim: alttaki "Yaptım" çubuğu kalktı (yapıldı işareti ajandadaki
// satırda); Kütüphaneye kaydet · Paylaş · Sil sağ üstteki "⋯" menüsünde.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AcilirMenu } from '@/bilesen/AcilirMenu';
import { BlokUygulama } from '@/bilesen/kart/BlokUygulama';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { useKartSil } from '@/bilesen/kart/KartSil';
import { Dugme } from '@/bilesen/Dugme';
import { useKutuphaneyeKaydet } from '@/bilesen/kutuphane/KaydetSayfasi';
import { usePaylas } from '@/bilesen/paylasim/PaylasSayfasi';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { BLOK_TURLERI } from '@/bilesen/kart/blokTurleri';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { kaynakAnahtari, kaynakTuru } from '@/mantik/kaynak';
import { Yazi } from '@/bilesen/Yazi';
import { gunBasligi, yapilanGunler } from '@/mantik/ajanda';
import { seri, seriMetni, son7Gun, tekrarMetni, type SeritGunu } from '@/mantik/gorunurluk';
import { bosKayit, type Kart, type Kayit } from '@/mantik/kart';
import { gunKisa, uzunTarih, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { kartAyrinti, kartKayitlari, kayitDegistir } from '@/veri/kartlar';
import { karttanProgramaEkle, programOku } from '@/veri/programlar';
import { ProgramSecSayfasi } from '@/bilesen/yasam/ProgramSayfalari';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function KartGorunumu() {
  const { id, gun: gunParam, geri } = useLocalSearchParams<{ id: string; gun?: string; geri?: string }>();
  const geriYazisi = geri || 'Ajandam';
  const bugunGun = useBugun();
  const gun: Gun = gunParam ?? bugunGun;
  const kenar = useSafeAreaInsets();
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const [programSec, setProgramSec] = useState(0);

  const form = useKartFormu((sonuc) => {
    if (sonuc.silindi) router.back();
    else if (sonuc.yeniKartId) router.setParams({ id: sonuc.yeniKartId });
  });

  const paylas = usePaylas();
  const [menuAcik, setMenuAcik] = useState(false);
  const kartSil = useKartSil(() => router.back());
  const kutuphane = useKutuphaneyeKaydet(({ kaldirildi }) => {
    if (kaldirildi) router.back();
  });
  const veri = useSorgu(
    ['kart', 'plan'],
    async (oku) => {
      const ayrinti = await kartAyrinti(oku, id);
      if (!ayrinti) return null;
      const program = ayrinti.kart.planId ? await programOku(oku, ayrinti.kart.planId) : null;
      return {
        ...ayrinti,
        kayitlar: await kartKayitlari(oku, id),
        program,
      };
    },
    [id],
  );

  // Kart başka yerden silindiyse geri dön.
  const yok = !veri.yukleniyor && veri.veri === null;
  useEffect(() => {
    if (yok && router.canGoBack()) router.back();
  }, [yok]);

  if (veri.yukleniyor || !veri.veri) return <View style={[stiller.kap, { paddingTop: kenar.top }]} />;

  const { kart, bloklar, kayitlar, program } = veri.veri;

  const programaEkle = async (programId: string) => {
    setProgramSec(0);
    try {
      const sonuc = await karttanProgramaEkle(kapi, oku, kart.id, programId, bugunGun, yeniKimlik);
      kisaMesaj(sonuc === 'baglandi' ? 'Kart artık programın parçası' : 'Programa eklendi');
    } catch (e) {
      console.warn(e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    }
  };
  const kayit: Kayit = kayitlar.find((k) => k.tarih === gun) ?? bosKayit(kart.id, gun);
  // Ajandadaki gibi: kendi kartında şerit yok; program, grup, gelen… kartında kaynağın rengi.
  const kaynak = kaynakTuru(kaynakAnahtari(kart));
  const serit = kaynak === 'kendim' ? null : kaynakRenk[kaynak].serit;
  const meta = [kart.saat, kart.tekrar ? tekrarMetni(kart.tekrar) : null].filter(Boolean).join(' · ');
  const kayitDegis = (degistir: (k: Kayit) => Kayit) => void kayitDegistir(kapi, kart.id, gun, degistir);

  return (
    <View style={[stiller.kap, { paddingTop: kenar.top }]}>
      <View style={stiller.ust}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={`${geriYazisi} ekranına dön`}
          style={stiller.geri}
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={22} color={renk.ana} />
          <Yazi renk={renk.ana} style={stiller.ustYazi}>
            {geriYazisi}
          </Yazi>
        </Pressable>
        <View style={stiller.ustSag}>
          {!kart.kilitli && (
            <Dugme tur="yazi" etiket="Düzenle" onPress={() => form.ac({ tur: 'duzenle', kart, bloklar, gun })} />
          )}
          <SimgeDugmesi ikon="ellipsis-horizontal" etiket="Diğer işlemler" onPress={() => setMenuAcik(true)} />
        </View>
      </View>

      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        <View style={stiller.kart}>
          {serit && <View style={[stiller.kaynakSeridi, { backgroundColor: serit }]} />}
          <View style={[stiller.bolum, stiller.baslikAlani]}>
            <Yazi tur="ekranBasligi" accessibilityRole="header">
              {kart.baslik}
            </Yazi>
            {!!meta && (
              <View style={stiller.metaSatiri}>
                <Ionicons name={kart.tekrar ? 'repeat-outline' : 'calendar-outline'} size={18} color={renk.ikincil} />
                <Yazi tur="ikincil">{meta}</Yazi>
              </View>
            )}
            {!!program && (
              <Pressable
                onPress={() => router.push({ pathname: '/yasam/program/[id]', params: { id: program.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Program: ${program.ad}, aç`}
                style={stiller.planEtiketi}
                hitSlop={8}
              >
                <Yazi tur="etiket" kalinlik="kalin" renk={kaynakRenk.plan.yazi}>
                  {`Program: ${program.ad} ›`}
                </Yazi>
              </Pressable>
            )}
            {!!kart.kisa && <Yazi style={stiller.kisa}>{kart.kisa}</Yazi>}
          </View>

          {kart.tekrar && (
            <View style={[stiller.bolum, stiller.cizgili]}>
              <SeriKutusu kart={kart} gun={gun} bugunGun={bugunGun} kayitlar={kayitlar} />
            </View>
          )}

          {bloklar.map((b) => {
            const tur = BLOK_TURLERI[b.tur];
            const ad = (b.tur === 'liste' || b.tur === 'adimlar') && b.ad ? `${tur.ad} · ${b.ad}` : tur.ad;
            const r = tur.kayit ? renk.vurguYazi : renk.ana;
            return (
              <View key={`${b.id}-${gun}`} style={[stiller.bolum, stiller.cizgili]}>
                <View style={stiller.blokBasligi} accessibilityRole="header">
                  <View style={[stiller.blokSimgesi, { backgroundColor: tur.kayit ? renk.vurguAcik : renk.anaAcik }]}>
                    <Ionicons name={tur.ikon} size={18} color={r} />
                  </View>
                  <Yazi tur="etiket" kalinlik="kalin" renk={r} style={stiller.blokAdi} numberOfLines={1}>
                    {ad.toLocaleUpperCase('tr')}
                  </Yazi>
                </View>
                <BlokUygulama blok={b} gun={gun} kayit={kayit} kayitlar={kayitlar} onKayit={kayitDegis} />
              </View>
            );
          })}

          {bloklar.length === 0 && !kart.kilitli && (
            <View style={[stiller.bolum, stiller.cizgili]}>
              <Yazi tur="ikincil">
                {'Bu kartta blok yok. "Düzenle"den talimat, liste, video, ölçüm… ekleyebilirsin.'}
              </Yazi>
            </View>
          )}
        </View>

        {kart.kilitli && (
          <Yazi tur="ikincil">Koçundan gelen kart paylaşılamaz; kendi kütüphanene kaydedebilirsin.</Yazi>
        )}
      </ScrollView>

      {menuAcik && (
        <AcilirMenu
          ust={kenar.top + 52}
          onKapat={() => setMenuAcik(false)}
          ogeler={[
            {
              etiket: 'Kütüphaneye kaydet',
              ikon: 'bookmark-outline',
              onPress: () => kutuphane.ac({ tur: 'kart', kart, bloklar, alanlar: program?.alanlar ?? [] }),
            },
            ...(!kart.planId && !kart.bag && !kart.kilitli
              ? [
                  {
                    etiket: 'Programa ekle',
                    ikon: 'albums-outline' as const,
                    onPress: () => setProgramSec((n) => n + 1),
                  },
                ]
              : []),
            ...(kart.kilitli
              ? []
              : [
                  { etiket: 'Paylaş', ikon: 'share-outline' as const, onPress: () => paylas.ac({ kart, bloklar }) },
                  {
                    etiket: 'Sil',
                    ikon: 'trash-outline' as const,
                    tehlike: true,
                    onPress: () => kartSil.baslat(kart, gun),
                  },
                ]),
          ]}
        />
      )}
      {form.oge}
      {paylas.oge}
      {kutuphane.oge}
      {kartSil.oge}
      {programSec > 0 && (
        <ProgramSecSayfasi
          key={programSec}
          baslik={kart.baslik}
          gorunur
          onKapat={() => setProgramSec(0)}
          onSec={(pid) => void programaEkle(pid)}
        />
      )}
    </View>
  );
}

function SeriKutusu({
  kart,
  gun,
  bugunGun,
  kayitlar,
}: {
  kart: Kart;
  gun: Gun;
  bugunGun: Gun;
  kayitlar: readonly Kayit[];
}) {
  const yapilan = yapilanGunler(kayitlar);
  const serit = son7Gun(kart, gun, yapilan, bugunGun);
  return (
    <View style={stiller.seri}>
      <Yazi kalinlik="kalin">{`Kayıt: ${gunBasligi(gun, bugunGun)}`}</Yazi>
      <View style={stiller.serit}>
        {serit.map((s) => (
          <SeritHucresi key={s.gun} s={s} acilan={s.gun === gun} bugunGun={bugunGun} />
        ))}
      </View>
      <Yazi kalinlik="kalin" renk={renk.ana}>
        {seriMetni(seri(kart, yapilan, bugunGun))}
      </Yazi>
    </View>
  );
}

const SERIT_ETIKETI: Record<SeritGunu['durum'], string> = {
  yapildi: 'yapıldı',
  yapilmadi: 'yapılmadı',
  gelecek: 'henüz gelmedi',
  yok: 'kart yok',
};

function SeritHucresi({ s, acilan, bugunGun }: { s: SeritGunu; acilan: boolean; bugunGun: Gun }) {
  return (
    <View style={stiller.hucre} accessible accessibilityLabel={`${uzunTarih(s.gun)}: ${SERIT_ETIKETI[s.durum]}`}>
      <View
        style={[
          stiller.daire,
          s.durum === 'yapildi' && stiller.daireDolu,
          (s.durum === 'yapilmadi' || s.durum === 'gelecek') && stiller.daireBos,
        ]}
      >
        {s.durum === 'yapildi' && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
        {s.durum === 'yapilmadi' && <Yazi renk={renk.soluk}>–</Yazi>}
        {s.durum === 'yok' && <Yazi renk={renk.pasif}>·</Yazi>}
      </View>
      <Yazi
        tur="etiket"
        kalinlik={acilan ? 'kalin' : 'normal'}
        renk={acilan ? renk.yazi : renk.ikincil}
        maxFontSizeMultiplier={1.2}
      >
        {s.gun === bugunGun ? 'Bugün' : gunKisa(s.gun)}
      </Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  ustSag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planEtiketi: {
    alignSelf: 'flex-start',
    backgroundColor: kaynakRenk.plan.zemin,
    borderRadius: olcu.kose.etiket,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  kap: { flex: 1, backgroundColor: renk.zemin },
  ust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: olcu.ekranKenari - 6,
    minHeight: 56,
  },
  geri: { flexDirection: 'row', alignItems: 'center', minHeight: olcu.enAzDokunma, paddingHorizontal: 6 },
  ustYazi: { fontSize: 18 },
  icerik: { paddingHorizontal: olcu.ekranKenari, paddingBottom: 32, gap: olcu.bolumArasi },
  baslikAlani: { gap: 6 },
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#17212B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kaynakSeridi: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  bolum: { paddingHorizontal: olcu.kartIci + 4, paddingVertical: 16, gap: 12 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  metaSatiri: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kisa: { marginTop: 4 },
  blokBasligi: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blokSimgesi: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  blokAdi: { flex: 1, letterSpacing: 0.5 },
  seri: { gap: 10 },
  serit: { flexDirection: 'row', justifyContent: 'space-between' },
  hucre: { alignItems: 'center', gap: 4, flex: 1 },
  daire: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  daireDolu: { backgroundColor: renk.ana },
  daireBos: { borderWidth: 2, borderColor: renk.cizgi, backgroundColor: renk.yuzey },
});
