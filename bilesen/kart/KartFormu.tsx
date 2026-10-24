// Kart formu (alttan sayfa): yeni kart ve düzenleme (K-1, K-4, K-6, K-11, K-14).
// Programın kartı da bu formla yazılır (pilot 20 Ekim): tarih yerine "N. gün";
// uygulanan programın ajandadaki kartı düzenlenince programdaki karşılığı da değişir.

import { useCallback, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { bolmeSecenekleri, bolmeSorusuGerekirMi, duzenle, type BolmeSecimi, type KartTanimi } from '@/mantik/bolme';
import { adimDurumu, adimlariEsle } from '@/mantik/adimlar';
import { gecerliHatirlatma, yeniKart, type Blok, type BlokTuru, type Kart } from '@/mantik/kart';
import {
  blokKopyasi,
  kacinciGun,
  programBagCoz,
  uygulaniyorMu,
  type Program,
  type ProgramKarti,
} from '@/mantik/program';
import { gunEkle, gunFarki, type Gun } from '@/mantik/tarih';
import { islemleriUygula, yeniKartKaydet, type BlokTaslagi } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { programaYansit, programKartiEkle, programKartiSil, programKartiYaz } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { GirisAlani } from '../GirisAlani';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import type { OnaySecenegi } from '../OnayKutusu';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { BlokDuzenleyici } from './BlokDuzenleyici';
import { BlokSecici } from './BlokSecici';
import { BLOK_TURLERI } from './blokTurleri';
import { ZamanlamaCubugu, ZamanlamaPaneli, type ProgramGunu, type Zamanlama, type ZamanlamaBolmesi } from './Zamanlama';

export type KartFormuHedefi =
  /** `taslak`: başka uygulamadan paylaşılan videodan dolu gelen yeni kart. */
  | { tur: 'yeni'; gun: Gun; taslak?: { baslik: string; videoAdresi: string } }
  | {
      tur: 'duzenle';
      kart: Kart;
      bloklar: readonly Blok[];
      gun: Gun;
      /**
       * P-35 (24 Ekim): içerik ile yapı ayrı. `icerik`: kart görünümünde dokunulan
       * bölüm (`odak`: başlık, zaman ya da bir bloğun kimliği) tek başına açılır.
       * `yapi`: "Kartın yapısı" (bloklar: ekle, kaldır, sırala, adları ve birimleri).
       * Verilmezse `tam`: her şey bir arada (eski form).
       */
      kip?: 'tam' | 'icerik' | 'yapi';
      odak?: 'baslik' | 'zaman' | string;
      /** `yapi` kipinde blok seçici hemen açılsın (kartın altındaki "+ Blok ekle"). */
      blokEkle?: boolean;
    }
  /** Programın kartı; `kart` null ise yeni. */
  | { tur: 'sablon'; program: Program; kart: ProgramKarti | null; bugunGun: Gun };

/** Programın kartında "1. gün" sayılan sabit gün (yalnız formun içinde; Pazartesi). */
const SABLON_REF: Gun = '2001-01-01';

export interface KartFormuSonucu {
  /** Düzenlenen gün yeni bir karta geçtiyse onun kimliği. */
  yeniKartId?: string;
  /** Kart o günden kalktı (hangi silme seçilmiş olursa olsun). */
  silindi?: boolean;
}

interface FormDurumu {
  baslik: string;
  kisa: string;
  /** Tarihsiz plan adımı; tarih ya da tekrar seçilince false olur. */
  tarihsiz: boolean;
  zamanlama: Zamanlama;
  bloklar: BlokTaslagi[];
}

let geciciNo = 0;
const geciciKimlik = () => `yeni-${++geciciNo}`;

/** Formda liste maddeleri `metin` içinde, her satırda bir madde olarak düzenlenir. */
function formaBlok(b: Blok): BlokTaslagi {
  const { kartId: _k, sira: _s, ...taslak } = b;
  return b.tur === 'liste' || b.tur === 'adimlar' ? { ...taslak, metin: b.maddeler.join('\n') } : taslak;
}

function kaydaBlok(b: BlokTaslagi): BlokTaslagi {
  if (b.tur !== 'liste' && b.tur !== 'adimlar') return b;
  const maddeler = b.metin
    .split('\n')
    .map((m) => m.trim())
    .filter((m) => m !== '');
  if (b.tur === 'liste') return { ...b, maddeler, metin: '' };
  // Proje adımları: yapılmış adımlar metnine göre yapılmış kalır.
  const eski = adimDurumu(b.durum, b.maddeler.length);
  return { ...b, maddeler, metin: '', durum: adimlariEsle(b.maddeler, eski, maddeler) };
}

function bosBlok(tur: BlokTuru): BlokTaslagi {
  return {
    id: geciciKimlik(),
    tur,
    ad: '',
    metin: '',
    birim: '',
    dakika: tur === 'sayac' ? 10 : null,
    maddeler: [],
    dosya: null,
  };
}

function ilkDurum(hedef: KartFormuHedefi): FormDurumu {
  if (hedef.tur === 'sablon') {
    const k = hedef.kart;
    const p = hedef.program;
    // Uygulanırken eklenen kart bugünden başlar.
    const bugunku = uygulaniyorMu(p, hedef.bugunGun) ? Math.max(0, (kacinciGun(p, hedef.bugunGun) ?? 1) - 1) : 0;
    return {
      baslik: k?.baslik ?? '',
      kisa: k?.kisa ?? '',
      tarihsiz: false,
      zamanlama: {
        tarih: gunEkle(SABLON_REF, k ? k.gun : bugunku),
        saat: k?.saat ?? null,
        hatirlatma: k?.hatirlatma ?? null,
        alarm: k?.alarm ?? false,
        alarmSesi: k?.alarmSesi ?? null,
        tekrar: k?.tekrar ?? null,
      },
      bloklar: (k?.bloklar ?? []).map((b) => formaBlok({ ...b, id: geciciKimlik(), kartId: '', sira: 0 })),
    };
  }
  if (hedef.tur === 'yeni') {
    return {
      baslik: '',
      kisa: '',
      tarihsiz: false,
      zamanlama: { tarih: hedef.gun, saat: null, hatirlatma: null, alarm: false, tekrar: null },
      bloklar: hedef.taslak ? [{ ...bosBlok('video'), metin: hedef.taslak.videoAdresi }] : [],
      ...(hedef.taslak ? { baslik: hedef.taslak.baslik } : {}),
    };
  }
  const { kart } = hedef;
  return {
    baslik: kart.baslik,
    kisa: kart.kisa,
    tarihsiz: kart.tarihsiz,
    zamanlama: {
      tarih: kart.tarih ?? hedef.gun,
      saat: kart.saat,
      hatirlatma: kart.hatirlatma,
      alarm: kart.alarm,
      alarmSesi: kart.alarmSesi ?? null,
      tekrar: kart.tekrar,
    },
    bloklar: hedef.bloklar.map(formaBlok),
  };
}

type Soru = { tur: 'kaydet' };

interface Ozellikler {
  hedef: KartFormuHedefi;
  gorunur: boolean;
  onKapat: () => void;
  onSonuc?: (sonuc: KartFormuSonucu) => void;
}

export function KartFormu({ hedef, gorunur, onKapat, onSonuc }: Ozellikler) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();

  const [ilk] = useState(() => ilkDurum(hedef));
  const [durum, setDurum] = useState<FormDurumu>(ilk);
  const [hata, setHata] = useState<string | null>(null);
  const [altSayfa, setAltSayfa] = useState<ZamanlamaBolmesi | null>(null);
  const [blokSeciciAcik, setBlokSeciciAcik] = useState(hedef.tur === 'duzenle' && !!hedef.blokEkle);
  /** Çubuktaki bölme: klavye kapanır, ayarı çubuğun altında açılır; aynı bölme yeniden kapatır. */
  const bolmeAc = (b: ZamanlamaBolmesi | null) => {
    Keyboard.dismiss();
    setAltSayfa((a) => (a === b ? null : b));
  };
  const [soru, setSoru] = useState<Soru | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  // Paylaşımdan dolu gelen form kaydedilmeden kapatılırken de sorar.
  const degisti = useMemo(
    () => (hedef.tur === 'yeni' && !!hedef.taslak) || JSON.stringify(durum) !== JSON.stringify(ilk),
    [durum, ilk, hedef],
  );
  const duzenleme = hedef.tur === 'duzenle' ? hedef : null;
  const sablon = hedef.tur === 'sablon' ? hedef : null;
  const programGunu: ProgramGunu | null = sablon ? { ref: SABLON_REF, sure: sablon.program.sure } : null;
  const kip = duzenleme?.kip ?? 'tam';
  const odak = kip === 'icerik' ? duzenleme?.odak : undefined;
  const odakBlok = odak && odak !== 'baslik' && odak !== 'zaman' ? odak : null;
  const baslikGorunur = kip === 'tam' || odak === 'baslik';
  const zamanGorunur = kip === 'tam' || odak === 'zaman';
  const bloklarGorunur = kip === 'tam' || kip === 'yapi';
  const odakTuru = odakBlok ? durum.bloklar.find((b) => b.id === odakBlok)?.tur : undefined;
  const sayfaBasligi = sablon
    ? sablon.kart
      ? 'Programın kartı'
      : 'Programa yeni kart'
    : !duzenleme
      ? 'Yeni kart'
      : kip === 'yapi'
        ? 'Kartın yapısı'
        : odak === 'baslik'
          ? 'Başlık'
          : odak === 'zaman'
            ? 'Zaman'
            : odakTuru
              ? BLOK_TURLERI[odakTuru].ad
              : 'Kartı düzenle';

  const guncelle = (alanlar: Partial<FormDurumu>) => setDurum((d) => ({ ...d, ...alanlar }));
  const blokDegis = (i: number, b: BlokTaslagi) =>
    setDurum((d) => ({ ...d, bloklar: d.bloklar.map((x, j) => (j === i ? b : x)) }));
  const blokYukari = (i: number) =>
    setDurum((d) => {
      const bloklar = [...d.bloklar];
      [bloklar[i - 1], bloklar[i]] = [bloklar[i]!, bloklar[i - 1]!];
      return { ...d, bloklar };
    });
  const blokKaldir = (i: number) => setDurum((d) => ({ ...d, bloklar: d.bloklar.filter((_, j) => j !== i) }));

  const tanim = (): KartTanimi => ({
    baslik: durum.baslik.trim(),
    kisa: durum.kisa.trim(),
    tarih: durum.tarihsiz ? null : durum.zamanlama.tarih,
    tarihsiz: durum.tarihsiz,
    saat: durum.zamanlama.saat,
    hatirlatma: gecerliHatirlatma(durum.zamanlama.hatirlatma, durum.zamanlama.saat),
    alarm: !!(gecerliHatirlatma(durum.zamanlama.hatirlatma, durum.zamanlama.saat) && durum.zamanlama.alarm),
    alarmSesi: durum.zamanlama.alarm ? (durum.zamanlama.alarmSesi ?? null) : null,
    tekrar: durum.zamanlama.tekrar,
  });

  const calistir = useCallback(
    async (is: () => Promise<void>) => {
      if (calisiyor) return;
      setCalisiyor(true);
      try {
        await is();
      } catch (e) {
        console.error('Kart kaydedilemedi', e);
        kisaMesaj('Kaydedilemedi. Yeniden dene.');
      } finally {
        setCalisiyor(false);
      }
    },
    [calisiyor, kisaMesaj],
  );

  const kaydet = () => {
    if (durum.baslik.trim() === '') {
      setHata('Önce bir başlık yaz.');
      return;
    }
    if (duzenleme && bolmeSorusuGerekirMi(duzenleme.kart, duzenleme.gun)) {
      setSoru({ tur: 'kaydet' });
      return;
    }
    void uygulaKaydet(null);
  };

  const uygulaKaydet = (secim: BolmeSecimi | null) =>
    calistir(async () => {
      setSoru(null);
      const bloklar = durum.bloklar.map(kaydaBlok);
      if (sablon) {
        const t = tanim();
        const icerik = {
          gun: Math.max(0, gunFarki(SABLON_REF, durum.zamanlama.tarih)),
          baslik: t.baslik,
          kisa: t.kisa,
          saat: t.saat,
          hatirlatma: t.hatirlatma,
          alarm: !!t.alarm,
          alarmSesi: t.alarmSesi ?? null,
          tekrar: t.tekrar,
          bloklar: bloklar.map(blokKopyasi),
        };
        if (sablon.kart) await programKartiYaz(kapi, { ...sablon.kart, ...icerik });
        else await programKartiEkle(kapi, sablon.program.id, icerik, sablon.bugunGun, yeniKimlik);
        onSonuc?.({});
      } else if (!duzenleme) {
        const kart = yeniKart(yeniKimlik(), { ...tanim(), sira: 0 });
        await yeniKartKaydet(kapi, kart, bloklar, yeniKimlik);
        onSonuc?.({});
      } else {
        const sonuc = duzenle(duzenleme.kart, duzenleme.gun, tanim(), secim, yeniKimlik);
        await islemleriUygula(kapi, sonuc.islemler, bloklar, yeniKimlik);
        const eklenen = sonuc.islemler.find((i) => i.tur === 'kartEkle');
        // Uygulanan programın kartı: programdaki karşılığı da değişir ("yalnız bu gün" hariç).
        if (programBagCoz(duzenleme.kart.bag) && secim !== 'yalnizBuGun') {
          await programaYansit(kapi, oku, eklenen?.tur === 'kartEkle' ? eklenen.kart.id : duzenleme.kart.id);
        }
        if (sonuc.mesaj) kisaMesaj(sonuc.mesaj);
        onSonuc?.({ yeniKartId: eklenen?.tur === 'kartEkle' ? eklenen.kart.id : undefined });
      }
      onKapat();
    });

  const vazgec: OnaySecenegi = { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) };
  const onay = (() => {
    if (!soru || !duzenleme) return null;
    const s = bolmeSecenekleri(duzenleme.gun);
    if (soru.tur === 'kaydet') {
      return {
        baslik: 'Değişiklik hangi günlere uygulansın?',
        aciklama: s.not,
        secenekler: [
          { etiket: s.yalnizBuGun, tur: 'ikincil' as const, onPress: () => void uygulaKaydet('yalnizBuGun') },
          { etiket: s.buGunVeSonrasi, tur: 'ikincil' as const, onPress: () => void uygulaKaydet('buGunVeSonrasi') },
          vazgec,
        ],
      };
    }
    return null;
  })();

  return (
    <>
      <AltSayfa
        gorunur={gorunur}
        onKapat={onKapat}
        baslik={sayfaBasligi}
        solVazgec
        degisti={degisti}
        onay={onay}
        sagEylem={{ etiket: 'Kaydet', onPress: () => void kaydet(), pasif: calisiyor }}
        altAlan={
          zamanGorunur ? (
            <View style={stiller.alt}>
              <ZamanlamaCubugu
                deger={durum.zamanlama}
                bugunGun={bugunGun}
                onAc={bolmeAc}
                tarihYok={durum.tarihsiz}
                acik={altSayfa}
                programGunu={programGunu}
              />
              <ZamanlamaPaneli
                acik={altSayfa}
                deger={durum.zamanlama}
                bugunGun={bugunGun}
                tarihYok={durum.tarihsiz}
                programGunu={programGunu}
                onDegis={(zamanlama) =>
                  guncelle({
                    zamanlama,
                    tarihsiz: durum.tarihsiz && altSayfa !== 'tarih' && zamanlama.tekrar === null,
                  })
                }
                onAc={setAltSayfa}
              />
            </View>
          ) : undefined
        }
      >
        {kip === 'icerik' && odak === 'zaman' && (
          <Yazi tur="ikincil">Tarih, saat, hatırlatma ve tekrarı aşağıdan seç.</Yazi>
        )}
        {baslikGorunur && (
          <>
            <GirisAlani
              etiket="Başlık"
              value={durum.baslik}
              onChangeText={(baslik) => {
                guncelle({ baslik });
                if (hata) setHata(null);
              }}
              placeholder="Ne yapacaksın?"
              hata={hata}
              returnKeyType="done"
              autoFocus={(!duzenleme && !sablon?.kart) || odak === 'baslik'}
            />
            <GirisAlani
              etiket="Kısa açıklama"
              etiketGizli
              value={durum.kisa}
              onChangeText={(kisa) => guncelle({ kisa })}
              placeholder="Kısa açıklama (isteğe bağlı)"
              returnKeyType="done"
            />
          </>
        )}

        {odakBlok &&
          durum.bloklar.map((b, i) =>
            b.id === odakBlok ? (
              <BlokDuzenleyici
                key={b.id}
                blok={b}
                ilkMi
                kip="icerik"
                onDegis={(yeni) => blokDegis(i, yeni)}
                onYukari={() => undefined}
                onKaldir={() => undefined}
              />
            ) : null,
          )}

        {kip === 'yapi' && (
          <Yazi tur="ikincil">
            Kartın blokları: ekle, kaldır, sırasını değiştir. İçeriğini kartın üstünde, bölüme dokunarak da
            düzenleyebilirsin.
          </Yazi>
        )}

        {bloklarGorunur &&
          durum.bloklar.map((b, i) => (
            <BlokDuzenleyici
              key={b.id}
              blok={b}
              ilkMi={i === 0}
              onDegis={(yeni) => blokDegis(i, yeni)}
              onYukari={() => blokYukari(i)}
              onKaldir={() => blokKaldir(i)}
            />
          ))}

        {bloklarGorunur && (
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setAltSayfa(null);
              setBlokSeciciAcik(true);
            }}
            accessibilityRole="button"
            style={({ pressed }) => [stiller.blokEkle, pressed && { opacity: 0.7 }]}
          >
            <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.blokEkleYazi}>
              + Blok ekle
            </Yazi>
          </Pressable>
        )}

        {sablon?.kart && (
          <Dugme
            tur="tehlike"
            etiket="Programdan çıkar"
            onPress={() =>
              void calistir(async () => {
                await programKartiSil(kapi, sablon.kart!.id, sablon.bugunGun);
                kisaMesaj('Programdan çıkarıldı');
                onSonuc?.({ silindi: true });
                onKapat();
              })
            }
          />
        )}
      </AltSayfa>

      <BlokSecici
        gorunur={blokSeciciAcik}
        onKapat={() => setBlokSeciciAcik(false)}
        onSec={(tur) => {
          setDurum((d) => ({ ...d, bloklar: [...d.bloklar, bosBlok(tur)] }));
          setBlokSeciciAcik(false);
        }}
      />
    </>
  );
}

/** Kart formunu açıp kapatmak için: `const form = useKartFormu(); form.ac(hedef); {form.oge}` */
export function useKartFormu(onSonuc?: (sonuc: KartFormuSonucu) => void) {
  const [form, setForm] = useState<{ no: number; hedef: KartFormuHedefi; acik: boolean } | null>(null);
  const ac = useCallback((hedef: KartFormuHedefi) => setForm((f) => ({ no: (f?.no ?? 0) + 1, hedef, acik: true })), []);
  const oge = form ? (
    <KartFormu
      key={form.no}
      hedef={form.hedef}
      gorunur={form.acik}
      onKapat={() => setForm((f) => (f ? { ...f, acik: false } : f))}
      onSonuc={onSonuc}
    />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  alt: { gap: 12 },
  blokEkle: {
    minHeight: 60,
    borderRadius: olcu.kose.kart,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blokEkleYazi: { fontSize: 19 },
});
