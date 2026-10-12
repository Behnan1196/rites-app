// Kart görünümü (K-7, K-12, K-13): tam ekran, alt menü görünmez. Kart hangi
// günden açıldıysa o günün kaydını gösterir ve ona yazar.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlokUygulama } from '@/bilesen/kart/BlokUygulama';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { Dugme } from '@/bilesen/Dugme';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { gunBasligi, yapilanGunler } from '@/mantik/ajanda';
import { seri, seriMetni, son7Gun, tekrarMetni, type SeritGunu } from '@/mantik/gorunurluk';
import { bosKayit, type Kart, type Kayit } from '@/mantik/kart';
import { gunKisa, uzunTarih, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { isaretle, kartAyrinti, kartKayitlari, kayitDegistir } from '@/veri/kartlar';
import { planOku } from '@/veri/planlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function KartGorunumu() {
  const { id, gun: gunParam, geri } = useLocalSearchParams<{ id: string; gun?: string; geri?: string }>();
  const geriYazisi = geri || 'Ajandam';
  const bugunGun = useBugun();
  const gun: Gun = gunParam ?? bugunGun;
  const kenar = useSafeAreaInsets();
  const { kapi } = useVeri();

  const form = useKartFormu((sonuc) => {
    if (sonuc.silindi) router.back();
    else if (sonuc.yeniKartId) router.setParams({ id: sonuc.yeniKartId });
  });

  const veri = useSorgu(
    ['kart', 'plan'],
    async (oku) => {
      const ayrinti = await kartAyrinti(oku, id);
      if (!ayrinti) return null;
      const plan = ayrinti.kart.planId ? await planOku(oku, ayrinti.kart.planId) : null;
      return { ...ayrinti, kayitlar: await kartKayitlari(oku, id), planAdi: plan?.ad ?? null };
    },
    [id],
  );

  // Kart başka yerden silindiyse geri dön.
  const yok = !veri.yukleniyor && veri.veri === null;
  useEffect(() => {
    if (yok && router.canGoBack()) router.back();
  }, [yok]);

  if (veri.yukleniyor || !veri.veri) return <View style={[stiller.kap, { paddingTop: kenar.top }]} />;

  const { kart, bloklar, kayitlar, planAdi } = veri.veri;
  const kayit: Kayit = kayitlar.find((k) => k.tarih === gun) ?? bosKayit(kart.id, gun);
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
        {!kart.kilitli && (
          <Dugme tur="yazi" etiket="Düzenle" onPress={() => form.ac({ tur: 'duzenle', kart, bloklar, gun })} />
        )}
      </View>

      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        <View style={stiller.baslikAlani}>
          <Yazi tur="ekranBasligi" accessibilityRole="header">
            {kart.baslik}
          </Yazi>
          {!!meta && <Yazi tur="ikincil">{meta}</Yazi>}
          {!!planAdi && (
            <View style={stiller.planEtiketi}>
              <Yazi tur="etiket" kalinlik="kalin" renk={kaynakRenk.plan.yazi}>
                {planAdi}
              </Yazi>
            </View>
          )}
        </View>

        {kart.tekrar && <SeriKutusu kart={kart} gun={gun} bugunGun={bugunGun} kayitlar={kayitlar} />}

        {!!kart.kisa && <Yazi>{kart.kisa}</Yazi>}

        {bloklar.map((b) => (
          <BlokUygulama
            key={`${b.id}-${gun}`}
            blok={b}
            gun={gun}
            kayit={kayit}
            kayitlar={kayitlar}
            onKayit={kayitDegis}
          />
        ))}
      </ScrollView>

      <View style={[stiller.alt, { paddingBottom: Math.max(kenar.bottom, 12) + 8 }]}>
        {kayit.yapildi ? (
          <View style={stiller.yapildi}>
            <View style={stiller.yapildiSol}>
              <Ionicons name="checkmark" size={26} color={renk.ana} />
              <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.yapildiYazi}>
                {gun === bugunGun ? 'Bugün yapıldı' : `Yapıldı · ${uzunTarih(gun)}`}
              </Yazi>
            </View>
            <Dugme tur="yazi" etiket="Geri al" onPress={() => void isaretle(kapi, kart.id, gun, false)} />
          </View>
        ) : (
          <Dugme
            etiket="Yaptım"
            onPress={async () => {
              await isaretle(kapi, kart.id, gun, true);
              router.back();
            }}
          />
        )}
      </View>

      {form.oge}
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
      <Yazi tur="etiket" kalinlik={acilan ? 'kalin' : 'normal'} renk={acilan ? renk.yazi : renk.ikincil} maxFontSizeMultiplier={1.2}>
        {s.gun === bugunGun ? 'Bugün' : gunKisa(s.gun)}
      </Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
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
  baslikAlani: { gap: 4 },
  seri: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 10,
  },
  serit: { flexDirection: 'row', justifyContent: 'space-between' },
  hucre: { alignItems: 'center', gap: 4, flex: 1 },
  daire: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  daireDolu: { backgroundColor: renk.ana },
  daireBos: { borderWidth: 2, borderColor: renk.cizgi, backgroundColor: renk.yuzey },
  alt: {
    backgroundColor: renk.yuzey,
    borderTopWidth: 1,
    borderTopColor: renk.cizgi,
    paddingHorizontal: olcu.ekranKenari,
    paddingTop: 12,
  },
  yapildi: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  yapildiSol: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  yapildiYazi: { fontSize: 20 },
});
