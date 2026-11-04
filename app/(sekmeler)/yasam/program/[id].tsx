// Program ekranı (pilot 20 Ekim): ad, alanlar, durum; Başlat / Ara ver / Bitir /
// Yeniden başlat; programın kartları (uygulanırken bugünkü durumlarıyla); Gelişim;
// Değerlendirme. Sağ üstte "Düzenle" (ad, alanlar, neden, süre); "⋯": Programı düzenle · Programı sil.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AcilirMenu } from '@/bilesen/AcilirMenu';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { Bolum } from '@/bilesen/Secim';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { AlanSimgesi, IlerlemeCubugu } from '@/bilesen/yasam/parcalar';
import { useProgramFormu } from '@/bilesen/yasam/ProgramFormu';
import { BaslatSayfasi, DegerlendirSayfasi, KutuphanedenSecSayfasi } from '@/bilesen/yasam/ProgramSayfalari';
import { gorunurMu } from '@/mantik/gorunurluk';
import type { KutuphaneKaydi } from '@/mantik/kutuphane';
import {
  alanlarMetni,
  durumMetni,
  etkinDurum,
  kacinciGun,
  kartSirasi,
  kartZamanMetni,
  programBagi,
  uygulamaOzeti,
  YILDIZ_SOZLERI,
  yildizMetni,
  type ProgramKarti,
} from '@/mantik/program';
import { AZ_VERI, kartUyumlari, olcumKarsilastirmalari, ONCE_GUN, programDonemi, type Ortalama } from '@/mantik/deneme';
import { sayiMetni } from '@/mantik/gidisat';
import { gunEkle, kisaTarih, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, type KartOzeti } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import {
  alanDurumlari,
  olcumKayitlari,
  programAjandaKartlari,
  programBaslat,
  programiDegerlendir,
  programiDurdur,
  programKartiEkle,
  programKartlariOku,
  programKayitlari,
  programOku,
  programSil,
} from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

type Sayfa = 'baslat' | 'degerlendir' | 'kutuphane' | null;
type Soru = 'bitir' | 'ara' | 'sil' | null;

export default function ProgramEkrani() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const kenar = useSafeAreaInsets();
  const kartFormu = useKartFormu();
  const programFormu = useProgramFormu();
  const [sayfa, setSayfaDurumu] = useState<Sayfa>(null);
  /** Her açılışta sayfa baştan kurulur (kapanırken kaybolma hareketi kalsın diye kapatınca değişmez). */
  const [acilis, setAcilis] = useState(0);
  const setSayfa = (s: Sayfa) => {
    if (s) setAcilis((n) => n + 1);
    setSayfaDurumu(s);
  };
  const [soru, setSoru] = useState<Soru>(null);
  const [menuAcik, setMenuAcik] = useState(false);

  const veri = useSorgu(
    ['plan', 'kart'],
    async (oku) => {
      await alanDurumlari(oku); // kişinin alan adları
      const program = await programOku(oku, id ?? '');
      if (!program) return null;
      return {
        program,
        kartlar: await programKartlariOku(oku, program.id),
        ajanda: await programAjandaKartlari(oku, program.id),
        yapilanlar: await gunYapilanlari(oku, bugunGun),
        gelisim: program.baslangic ? await programKayitlari(oku, program.id, program.baslangic) : null,
        // P-90: bütün ölçümler, programdan önceki 14 günle birlikte.
        olcum: program.baslangic ? await olcumKayitlari(oku, gunEkle(program.baslangic, -ONCE_GUN)) : null,
      };
    },
    [id, bugunGun],
  );

  const gelisim = useMemo(() => {
    const v = veri.veri;
    if (!v?.gelisim || !v.program.baslangic || v.program.baslangic > bugunGun) return null;
    const donem = programDonemi(v.program, bugunGun);
    const yapilanlar = v.gelisim.kayitlar.filter((k) => k.yapildi);
    return {
      ozet: uygulamaOzeti(v.ajanda, yapilanlar, v.program.baslangic, bugunGun),
      donem,
      uyum: donem ? kartUyumlari(v.ajanda, yapilanlar, donem, bugunGun) : [],
      olcumler: donem && v.olcum ? olcumKarsilastirmalari(v.olcum.parcalar, v.olcum.kayitlar, donem) : [],
    };
  }, [veri.veri, bugunGun]);

  if (veri.yukleniyor) return <EkranKabi geri="Yaşam Tarzım" />;
  if (!veri.veri) {
    return (
      <EkranKabi geri="Yaşam Tarzım">
        <Yazi tur="ikincil">Bu program bulunamadı.</Yazi>
      </EkranKabi>
    );
  }

  const { program, kartlar, ajanda, yapilanlar } = veri.veri;
  const durum = etkinDurum(program, bugunGun);
  const uygulaniyor = durum === 'uygulaniyor';
  const sureDoldu = durum === 'bitti' && program.durum === 'uygulaniyor';
  const bagli = (pk: ProgramKarti) => ajanda.find((k) => k.bag === programBagi(pk.id)) ?? null;

  const hata = (e: unknown) => {
    console.error('Program değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  const kartiAc = (pk: ProgramKarti) => {
    const k = uygulaniyor ? bagli(pk) : null;
    if (k) {
      const gun: Gun = k.tekrar
        ? gorunurMu(k, bugunGun, bugunGun)
          ? bugunGun
          : (k.tarih ?? bugunGun)
        : (k.tarih ?? bugunGun);
      router.push({ pathname: '/kart/[id]', params: { id: k.id, gun, geri: program.ad } });
    } else {
      kartFormu.ac({ tur: 'sablon', program, kart: pk, bugunGun });
    }
  };

  const baslat = (gun: Gun) => {
    setSayfa(null);
    programBaslat(kapi, program.id, gun, bugunGun, yeniKimlik)
      .then(() =>
        kisaMesaj(
          gun === bugunGun ? "Program başladı; kartlar Ajandam'da" : `Program ${kisaTarih(gun)} günü başlayacak`,
        ),
      )
      .catch(hata);
  };

  const durdur = (yeni: 'ara' | 'bitti') => {
    setSoru(null);
    programiDurdur(kapi, program.id, yeni, bugunGun)
      .then(() => {
        kisaMesaj(yeni === 'ara' ? 'Programa ara verildi' : 'Program bitti');
        if (yeni === 'bitti') setSayfa('degerlendir');
      })
      .catch(hata);
  };

  const kutuphanedenEkle = (k: KutuphaneKaydi) => {
    setSayfa(null);
    const c = k.icerik;
    const gun = uygulaniyor ? Math.max(0, (kacinciGun(program, bugunGun) ?? 1) - 1) : 0;
    programKartiEkle(
      kapi,
      program.id,
      {
        gun,
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
    )
      .then(() => kisaMesaj(`Programa eklendi: ${c.baslik}`))
      .catch(hata);
  };

  return (
    <>
      <EkranKabi
        geri="Yaşam Tarzım"
        baslikSag={
          <View style={stiller.ustSag}>
            <Dugme tur="yazi" etiket="Düzenle" onPress={() => programFormu.ac({ tur: 'duzenle', program })} />
            <SimgeDugmesi ikon="ellipsis-horizontal" etiket="Diğer işlemler" onPress={() => setMenuAcik(true)} />
          </View>
        }
      >
        <View style={stiller.ust}>
          <AlanSimgesi alan={program.alanlar[0] ?? ''} buyuk />
          <View style={stiller.esnek}>
            <Yazi tur="ekranBasligi" accessibilityRole="header">
              {program.ad}
            </Yazi>
            {program.alanlar.length > 0 && <Yazi tur="ikincil">{alanlarMetni(program.alanlar)}</Yazi>}
            <Yazi kalinlik="kalin" renk={uygulaniyor ? renk.ana : renk.ikincil}>
              {sureDoldu ? 'Süresi doldu' : durumMetni(program, bugunGun)}
            </Yazi>
          </View>
        </View>
        {!!program.neden && <Yazi>{program.neden}</Yazi>}
        {program.kaynak !== 'Kendim' && <Yazi tur="ikincil">{program.kaynak}</Yazi>}

        {/* Ana eylemler */}
        <View style={stiller.eylemler}>
          {durum === 'hazir' && (
            <Dugme etiket="Başlat" onPress={() => setSayfa('baslat')} pasif={kartlar.length === 0} />
          )}
          {durum === 'hazir' && kartlar.length === 0 && (
            <Yazi tur="ikincil">Başlatmak için önce programa kart ekle.</Yazi>
          )}
          {uygulaniyor && (
            <>
              <Dugme
                tur="ikincil"
                yaziRengi={renk.ana}
                etiket="Ajandam'da gör"
                onPress={() =>
                  router.navigate({ pathname: '/ajandam', params: { gun: bugunGun, an: String(Date.now()) } })
                }
              />
              <View style={stiller.ikili}>
                <Dugme tur="ikincil" etiket="Ara ver" onPress={() => setSoru('ara')} style={stiller.esnek} />
                <Dugme tur="ikincil" etiket="Bitir" onPress={() => setSoru('bitir')} style={stiller.esnek} />
              </View>
            </>
          )}
          {(durum === 'ara' || durum === 'bitti') && (
            <Dugme etiket="Yeniden başlat" onPress={() => setSayfa('baslat')} pasif={kartlar.length === 0} />
          )}
        </View>

        {/* Değerlendirme */}
        {(durum === 'bitti' || durum === 'ara' || program.yildiz > 0) && (
          <Bolum>
            <Yazi kalinlik="kalin">Değerlendirmen</Yazi>
            {program.yildiz > 0 ? (
              <>
                <Yazi tur="bolumBasligi" renk={renk.vurguYazi} accessibilityLabel={`${program.yildiz} yıldız`}>
                  {yildizMetni(program.yildiz)}
                </Yazi>
                <Yazi tur="ikincil">{YILDIZ_SOZLERI[program.yildiz]}</Yazi>
                {!!program.degerlendirme && <Yazi>{program.degerlendirme}</Yazi>}
              </>
            ) : (
              <Yazi tur="ikincil">Uyguladın; sana nasıl geldi? Yıldızlar kütüphanende görünür.</Yazi>
            )}
            <Dugme
              tur="ikincil"
              yaziRengi={renk.ana}
              etiket={program.yildiz > 0 ? 'Değiştir' : 'Değerlendir'}
              onPress={() => setSayfa('degerlendir')}
            />
          </Bolum>
        )}

        {/* Kartlar */}
        <Yazi tur="bolumBasligi" accessibilityRole="header">
          {`Kartlar (${kartlar.length})`}
        </Yazi>
        {kartlar.length === 0 && (
          <Yazi tur="ikincil">
            Programın kartlarını ekle: izlediğin bir video ve notların (1. gün), düzenli yapacakların, ölçümler…
          </Yazi>
        )}
        {kartSirasi(kartlar).map((pk) => (
          <KartSatiri
            key={pk.id}
            pk={pk}
            ajandaKarti={uygulaniyor ? bagli(pk) : null}
            yapilanlar={yapilanlar}
            bugunGun={bugunGun}
            onPress={() => kartiAc(pk)}
          />
        ))}
        <View style={stiller.ikili}>
          <Dugme
            tur="vurgu"
            etiket="+ Yeni kart"
            onPress={() => kartFormu.ac({ tur: 'sablon', program, kart: null, bugunGun })}
            style={stiller.esnek}
          />
          <Dugme
            tur="ikincil"
            yaziRengi={renk.ana}
            etiket="Kütüphanemden"
            onPress={() => setSayfa('kutuphane')}
            style={stiller.esnek}
          />
        </View>
        {uygulaniyor && (
          <Yazi tur="ikincil">Program uygulanırken eklediğin kart bugünden itibaren ajandana düşer.</Yazi>
        )}

        {/* Gelişim */}
        {gelisim && gelisim.ozet.toplam > 0 && (
          <>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Gelişim
            </Yazi>
            <IlerlemeCubugu
              metin={`Bu uygulamada ${gelisim.ozet.toplam} kezin ${gelisim.ozet.yapilan} tanesi yapıldı`}
              oran={gelisim.ozet.yapilan / gelisim.ozet.toplam}
            />
            {/* P-90: kart kart uyum. */}
            {gelisim.uyum.length > 1 && (
              <Bolum style={stiller.olcumler}>
                {gelisim.uyum.map((u, i) => (
                  <View key={u.kartId} style={[stiller.olcum, i > 0 && stiller.cizgili]} accessible>
                    <Yazi style={stiller.esnek} numberOfLines={2}>
                      {u.baslik}
                    </Yazi>
                    <Yazi kalinlik="kalin" renk={u.yapilan === u.toplam ? renk.ana : renk.yazi}>
                      {`${u.yapilan}/${u.toplam} gün`}
                    </Yazi>
                  </View>
                ))}
              </Bolum>
            )}
            {/* P-90: ölçümler: programdan önceki 14 gün → program dönemi (ortalamalar). */}
            {gelisim.olcumler.length > 0 && (
              <>
                <Yazi kalinlik="kalin">{`Ölçümler: önceki ${ONCE_GUN} gün → program`}</Yazi>
                <Bolum style={stiller.olcumler}>
                  {gelisim.olcumler.map((o, i) => (
                    <View
                      key={o.parca.id}
                      style={[stiller.olcum, i > 0 && stiller.cizgili]}
                      accessible
                      accessibilityLabel={`${o.parca.ad}: önce ${ortMetni(o.once)}, programda ${ortMetni(o.sirasinda)}`}
                    >
                      <View style={stiller.esnek}>
                        <Yazi numberOfLines={1}>{o.parca.ad + (o.parca.birim ? ` (${o.parca.birim})` : '')}</Yazi>
                        <Yazi tur="etiket" numberOfLines={1}>
                          {`${o.parca.kartBaslik} · ${o.once.gun} gün → ${o.sirasinda.gun} gün`}
                        </Yazi>
                      </View>
                      <Yazi kalinlik="kalin">{`${ortMetni(o.once)} → ${ortMetni(o.sirasinda)}`}</Yazi>
                    </View>
                  ))}
                </Bolum>
                <Yazi tur="ikincil">
                  {gelisim.olcumler.some((o) => o.once.gun < AZ_VERI || o.sirasinda.gun < AZ_VERI)
                    ? 'Bazı ölçümlerde henüz az gün var; birkaç gün daha doldurunca karşılaştırma anlam kazanır. '
                    : ''}
                  Birlikte değişen ölçümler bir ipucudur; nedenini tek başına göstermez.
                </Yazi>
              </>
            )}
          </>
        )}
      </EkranKabi>

      {kartFormu.oge}
      {programFormu.oge}

      <BaslatSayfasi
        key={`b-${acilis}`}
        program={program}
        gorunur={sayfa === 'baslat'}
        onKapat={() => setSayfa(null)}
        onBaslat={baslat}
      />
      <DegerlendirSayfasi
        key={`d-${acilis}`}
        program={program}
        gorunur={sayfa === 'degerlendir'}
        onKapat={() => setSayfa(null)}
        onKaydet={(yildiz, not) => {
          setSayfa(null);
          programiDegerlendir(kapi, program.id, yildiz, not, bugunGun)
            .then(() => kisaMesaj('Değerlendirme kaydedildi'))
            .catch(hata);
        }}
      />
      <KutuphanedenSecSayfasi gorunur={sayfa === 'kutuphane'} onKapat={() => setSayfa(null)} onSec={kutuphanedenEkle} />

      {menuAcik && (
        <AcilirMenu
          ust={kenar.top + 52}
          onKapat={() => setMenuAcik(false)}
          ogeler={[
            {
              etiket: 'Programı düzenle',
              ikon: 'create-outline',
              onPress: () => programFormu.ac({ tur: 'duzenle', program }),
            },
            { etiket: 'Programı sil', ikon: 'trash-outline', tehlike: true, onPress: () => setSoru('sil') },
          ]}
        />
      )}

      {soru && (
        <Katman>
          <OnayKutusu
            baslik={
              soru === 'ara'
                ? 'Programa ara verilsin mi?'
                : soru === 'bitir'
                  ? 'Program bitsin mi?'
                  : `"${program.ad}" silinsin mi?`
            }
            aciklama={
              soru === 'sil'
                ? 'Program ve kartları silinir. Ajandandaki geçmiş kayıtlar yerinde kalır.'
                : 'Bugünden sonraki kartları ajandandan kalkar; yaptıkların geçmişte kalır. Program kütüphanende durur, istediğinde yeniden başlatırsın.'
            }
            secenekler={[
              soru === 'sil'
                ? {
                    etiket: 'Programı sil',
                    tur: 'tehlike',
                    onPress: () => {
                      setSoru(null);
                      programSil(kapi, program.id, bugunGun)
                        .then(() => {
                          kisaMesaj(`Program silindi: ${program.ad}`);
                          router.back();
                        })
                        .catch(hata);
                    },
                  }
                : {
                    etiket: soru === 'ara' ? 'Ara ver' : 'Bitir',
                    tur: 'ana',
                    onPress: () => durdur(soru === 'ara' ? 'ara' : 'bitti'),
                  },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) },
            ]}
          />
        </Katman>
      )}
    </>
  );
}

function KartSatiri({
  pk,
  ajandaKarti,
  yapilanlar,
  bugunGun,
  onPress,
}: {
  pk: ProgramKarti;
  ajandaKarti: KartOzeti | null;
  yapilanlar: ReadonlySet<string>;
  bugunGun: Gun;
  onPress: () => void;
}) {
  let durum: { metin: string; renk: string } | null = null;
  if (ajandaKarti) {
    if (gorunurMu(ajandaKarti, bugunGun, bugunGun)) {
      durum = yapilanlar.has(ajandaKarti.id)
        ? { metin: 'Bugün yapıldı', renk: renk.ana }
        : { metin: 'Bugün bekliyor', renk: renk.vurguYazi };
    } else if (!ajandaKarti.tekrar && ajandaKarti.yapildi) {
      durum = { metin: 'Yapıldı ✓', renk: renk.ana };
    } else if (ajandaKarti.tarih && ajandaKarti.tarih > bugunGun) {
      durum = { metin: kisaTarih(ajandaKarti.tarih), renk: renk.ikincil };
    }
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[pk.baslik, kartZamanMetni(pk), durum?.metin].filter(Boolean).join(', ')}
      style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.esnek}>
        <Yazi kalinlik="kalin" numberOfLines={3}>
          {pk.baslik}
        </Yazi>
        <Yazi tur="ikincil">{kartZamanMetni(pk)}</Yazi>
      </View>
      {durum && (
        <Yazi tur="etiket" kalinlik="kalin" renk={durum.renk}>
          {durum.metin}
        </Yazi>
      )}
      <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
    </Pressable>
  );
}

function ortMetni(o: Ortalama): string {
  return o.ort === null ? '–' : sayiMetni(o.ort);
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ustSag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  esnek: { flex: 1 },
  eylemler: { gap: 10 },
  ikili: { flexDirection: 'row', gap: 10 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingLeft: olcu.kartIci,
    paddingRight: 10,
    paddingVertical: 10,
    minHeight: 64,
  },
  olcumler: { gap: 0, paddingVertical: 4 },
  olcum: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
});
