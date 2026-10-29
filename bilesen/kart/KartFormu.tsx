// Kart formu (alttan sayfa): yeni kart ve düzenleme (K-1, K-4, K-6, K-11, K-14).
// Programın kartı da bu formla yazılır (pilot 20 Ekim): tarih yerine "N. gün";
// uygulanan programın ajandadaki kartı düzenlenince programdaki karşılığı da değişir.
// P-36 (24 Ekim, 50+ kullanıcı için sade): tek sayfa: "Ne yapacaksın?", açıklama,
// zaman (alttaki düğmeler), "Kartın içinde" (liste, video, ölçüm…; her birinin altında
// "Bunu kaldır") ve "+ Karta ekle". P-37: zaman alttaki çubukta değil, "Ne zaman?"
// başlığı altında soru satırlarında (P-46: kapalı gelir, tek özet satırı; başlık kalktı) ("Hangi gün?", "Saat kaçta?", "Tekrar etsin mi?"). Yeni kartta ekler kapalı gelir. Seri anahtarı
// formda yok: kural işler, istisna kart görünümünden.
// P-45: programa yeni kart eklerken de ("Programa yeni kart"); programın alanları önce.
// P-41: yeni kartın ilk adımı "Ne tür bir kart?" (isimli çeşitler); seçilen çeşidin
// parçaları ve zamanı gelir, kart çeşidini hatırlar. Tasarımcı aynı formla çeşit
// yazar (`cesit` hedefi): çeşidin adı, alanı, simgesi; zamanda yalnız saat ve tekrar.

import { useCallback, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { bolmeSecenekleri, bolmeSorusuGerekirMi, duzenle, type BolmeSecimi, type KartTanimi } from '@/mantik/bolme';
import { adimDurumu, adimlariEsle } from '@/mantik/adimlar';
import { CESIT_SIMGELERI, cesitBul, cesitler as tumCesitler, yeniCesitKimligi } from '@/mantik/cesit';
import { gecerliHatirlatma, yeniKart, type Blok, type BlokTuru, type Kart, type SabitAlan } from '@/mantik/kart';
import { ayarliParcaMi, sabitDegistir } from '@/mantik/gorunumDegisimi';
import { katalog, type KartCesidi } from '@/mantik/katalog';
import {
  blokKopyasi,
  kacinciGun,
  programBagCoz,
  uygulaniyorMu,
  type Program,
  type ProgramKarti,
} from '@/mantik/program';
import { seriVarsayilani, type KartTaslagi } from '@/mantik/karakter';
import type { KartIcerigi } from '@/mantik/kutuphane';
import { gunEkle, gunFarki, type Gun } from '@/mantik/tarih';
import { htmlMaddeleri, maddelerdenHtml } from '@/mantik/zenginMetin';
import type { TasarimCesidi } from '@/sunucu/cesit';
import { islemleriUygula, yeniKartKaydet, type BlokTaslagi } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { notSil } from '@/veri/notlar';
import { paylasilanSil } from '@/veri/paylasilanlar';
import { programaYansit, programKartiEkle, programKartiSil, programKartiYaz } from '@/veri/programlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { SimgeDugmesi } from '../SimgeDugmesi';
import { GirisAlani } from '../GirisAlani';
import { ZenginMetinAlani } from '../ZenginMetin';
import { Dugme } from '../Dugme';
import { AcKapa, SecenekHapi } from '../Secim';
import { useKisaMesaj } from '../KisaMesaj';
import type { OnaySecenegi } from '../OnayKutusu';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { BlokDuzenleyici } from './BlokDuzenleyici';
import { ElemanMenusu } from './ElemanMenusu';
import { BLOK_TURLERI } from './blokTurleri';
import { BlokSecici } from './BlokSecici';
import { CesitSecici } from './CesitSecici';
import { useUzman } from '../useUzman';
import { ZamanRozeti, ZamanSayfasi, ZamanSeridi, type ProgramGunu, type Zamanlama } from './Zamanlama';

export type KartFormuHedefi =
  /**
   * `taslak`: dolu gelen yeni kart: başka uygulamadan paylaşılan video ya da
   * "Karta çevir" denen not (P-35: metni talimat, sesi dosya bloğu olur; kart
   * kaydedilince not silinir).
   */
  | { tur: 'yeni'; gun: Gun; taslak?: KartTaslagi; cesit?: KartCesidi }
  | {
      tur: 'duzenle';
      kart: Kart;
      bloklar: readonly Blok[];
      gun: Gun;
      /** Ekleme seçici hemen açılsın (boş kartta "Karta bir şey ekle"). */
      blokEkle?: boolean;
      /**
       * P-65: kart görünümünden "Değiştir": yalnız bu parça ('baslik': başlık ve açıklama; ya da
       * bloğun kimliği). Yoksa bütün form.
       */
      parca?: string;
    }
  /** Programın kartı; `kart` null ise yeni. */
  | {
      tur: 'sablon';
      program: Program;
      kart: ProgramKarti | null;
      bugunGun: Gun;
    }
  /** Kart çeşidi tasarımı (P-41; yalnız tasarımcı); `cesit` null ise yeni. */
  | {
      tur: 'cesit';
      cesit: TasarimCesidi | null;
      bugunGun: Gun;
      /** Yeni çeşidin sırası (sona). */
      yeniSira: number;
      onKaydet: (c: TasarimCesidi) => Promise<void>;
    }
  /** Kütüphanedeki kart (P-59): tarihsiz kalıp; ajandaya koymadan düzenlenir. */
  | {
      tur: 'kutuphane';
      icerik: KartIcerigi;
      bugunGun: Gun;
      onKaydet: (c: KartIcerigi) => Promise<void>;
    };

export type { KartTaslagi };

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
  /** Tekrarlı kartta seri sayılsın mı; null: kural (P-35). */
  seriSay: boolean | null;
  /** Seçilen isimli çeşit (P-41). */
  cesit: string | null;
  /** Başlık boşken ipucu (çeşitten). */
  baslikIpucu: string;
  /** Yalnız çeşit tasarımında. */
  tasarim: TasarimAlanlari | null;
  /** P-65: kart görünümünde değiştirilemeyen alanlar. */
  sabitler: SabitAlan[];
}

interface TasarimAlanlari {
  ad: string;
  alan: string;
  ikon: string | null;
  aciklama: string;
  aktif: boolean;
  /** Tekrarlıda seri sayılsın mı (P-49); null: kural. */
  seri: boolean | null;
}

const VARSAYILAN_IPUCU = 'Kartın başlığı';

let geciciNo = 0;
const geciciKimlik = () => `yeni-${++geciciNo}`;

/** Formda liste maddeleri `metin` içinde, her satırda bir madde olarak düzenlenir. */
function formaBlok(b: Blok): BlokTaslagi {
  const { kartId: _k, sira: _s, ...taslak } = b;
  // P-50: liste maddeleri editörde onay kutulu liste (HTML).
  return b.tur === 'liste' || b.tur === 'adimlar' ? { ...taslak, metin: maddelerdenHtml(b.maddeler) } : taslak;
}

function kaydaBlok(b: BlokTaslagi): BlokTaslagi {
  if (b.tur !== 'liste' && b.tur !== 'adimlar') return b;
  const maddeler = htmlMaddeleri(b.metin);
  if (b.tur === 'liste') return { ...b, maddeler, metin: '' };
  // Proje adımları: yapılmış adımlar metnine göre yapılmış kalır.
  const eski = adimDurumu(b.durum, b.maddeler.length);
  return {
    ...b,
    maddeler,
    metin: '',
    durum: adimlariEsle(b.maddeler, eski, maddeler),
  };
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

function taslakBloklari(t: KartTaslagi | undefined): BlokTaslagi[] {
  if (!t) return [];
  const b: BlokTaslagi[] = [];
  if (t.videoAdresi) b.push({ ...bosBlok('video'), metin: t.videoAdresi });
  if (t.sesYolu) b.push({ ...bosBlok('dosya'), ad: 'Sesli not', dosya: t.sesYolu });
  return b;
}

/** Çeşidin parçaları formda (liste maddeleri satır satır). */
function cesitBloklari(c: Pick<KartCesidi, 'bloklar'>): BlokTaslagi[] {
  return c.bloklar.map((b) =>
    formaBlok({
      ...b,
      maddeler: [...b.maddeler],
      dosya: null,
      id: geciciKimlik(),
      kartId: '',
      sira: 0,
    }),
  );
}

/** Yeni kart, seçilen çeşitle (P-41). */
function cesittenDurum(c: KartCesidi, gun: Gun): FormDurumu {
  return {
    baslik: c.baslik,
    kisa: '',
    tarihsiz: false,
    zamanlama: {
      tarih: gun,
      saat: c.saat,
      hatirlatma: null,
      alarm: false,
      tekrar: c.tekrar ? { ...c.tekrar, gunler: c.tekrar.gunler ? [...c.tekrar.gunler] : null } : null,
    },
    bloklar: cesitBloklari(c),
    // P-49: çeşit seriyi belirleyebilir (Beslenme: yok).
    seriSay: c.seri,
    cesit: c.id,
    baslikIpucu: c.baslikIpucu,
    tasarim: null,
    sabitler: [],
  };
}

const ekAlanlar = { cesit: null, baslikIpucu: '', tasarim: null, sabitler: [] as SabitAlan[] };

function ilkDurum(hedef: KartFormuHedefi): FormDurumu {
  if (hedef.tur === 'cesit') {
    const c = hedef.cesit;
    return {
      ...(c ? cesittenDurum(c, hedef.bugunGun) : { ...cesittenDurum(BOS_CESIT, hedef.bugunGun), cesit: null }),
      tasarim: {
        ad: c?.ad ?? '',
        alan: c?.alan ?? 'beslenme',
        ikon: c?.ikon ?? null,
        aciklama: c?.aciklama ?? '',
        aktif: c?.aktif ?? true,
        seri: c?.seri ?? null,
      },
    };
  }
  if (hedef.tur === 'kutuphane') {
    const c = hedef.icerik;
    return {
      ...ekAlanlar,
      baslik: c.baslik,
      kisa: c.kisa,
      tarihsiz: false,
      zamanlama: { tarih: hedef.bugunGun, saat: c.saat, hatirlatma: c.hatirlatma, alarm: false, tekrar: c.tekrar },
      bloklar: c.bloklar.map((b) => formaBlok({ ...b, id: geciciKimlik(), kartId: '', sira: 0 })),
      seriSay: null,
      sabitler: [...(c.sabitler ?? [])],
    };
  }
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
      seriSay: null,
      ...ekAlanlar,
      cesit: k?.cesit ?? null,
    };
  }
  if (hedef.tur === 'yeni') {
    if (hedef.cesit) return cesittenDurum(hedef.cesit, hedef.gun);
    return {
      ...ekAlanlar,
      baslik: '',
      kisa: '',
      tarihsiz: false,
      zamanlama: {
        tarih: hedef.gun,
        saat: null,
        hatirlatma: null,
        alarm: false,
        tekrar: null,
      },
      bloklar: taslakBloklari(hedef.taslak),
      seriSay: null,
      // P-51: notun metni açıklamaya (talimat yerine; biçimli).
      ...(hedef.taslak ? { baslik: hedef.taslak.baslik, kisa: hedef.taslak.metin ?? '' } : {}),
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
    seriSay: kart.seriSay ?? null,
    ...ekAlanlar,
    cesit: kart.cesit ?? null,
    sabitler: [...(kart.sabitler ?? [])],
  };
}

const BOS_CESIT: KartCesidi = {
  id: '',
  alan: '',
  ad: '',
  ikon: null,
  seri: null,
  aciklama: '',
  baslik: '',
  baslikIpucu: '',
  saat: null,
  tekrar: null,
  bloklar: [],
};

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

  const [ilk, setIlk] = useState(() => ilkDurum(hedef));
  // P-41: yeni kartta önce "Ne tür bir kart?" (paylaşımdan / nottan gelen ve çeşidi belli olanda sorulmaz).
  const [cesitSorusu, setCesitSorusu] = useState(
    () =>
      tumCesitler().length > 0 &&
      ((hedef.tur === 'yeni' && !hedef.taslak && !hedef.cesit) || (hedef.tur === 'sablon' && !hedef.kart)),
  );
  const [durum, setDurum] = useState<FormDurumu>(ilk);
  const [hata, setHata] = useState<string | null>(null);
  // P-47: zaman sağ üstteki rozetten açılan sayfada.
  // P-57: rozet → tarih ve saat; şerit → süre ya da hatırlatma.
  const [zamanBolum, setZamanBolum] = useState<'tarih' | 'sure' | 'hatirlatma' | null>(null);
  const [blokSeciciAcik, setBlokSeciciAcik] = useState(hedef.tur === 'duzenle' && !!hedef.blokEkle);
  // P-36: yeni kartta "Karta bir şey ekle" kapalı gelir (kartların çoğu başlık ve zamandan ibaret).
  const [soru, setSoru] = useState<Soru | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  // P-66: öğelerin ⋯ menüsü.
  const [menu, setMenu] = useState<{ tur: 'baslik' } | { tur: 'aciklama' } | { tur: 'blok'; id: string } | null>(null);
  // P-66: "Basit kart" sade açılır (başlık, zaman, açıklama); "Kur" ile parça ekleme ve ayarlar.
  const [kur, setKur] = useState(
    () => !(hedef.tur === 'yeni' && !hedef.taslak && !(hedef.cesit && hedef.cesit.bloklar.length > 0)),
  );
  // Paylaşımdan dolu gelen form kaydedilmeden kapatılırken de sorar.
  const degisti = useMemo(
    () => (hedef.tur === 'yeni' && !!hedef.taslak) || JSON.stringify(durum) !== JSON.stringify(ilk),
    [durum, ilk, hedef],
  );
  const duzenleme = hedef.tur === 'duzenle' ? hedef : null;
  const sablon = hedef.tur === 'sablon' ? hedef : null;
  const tasarimHedefi = hedef.tur === 'cesit' ? hedef : null;
  const kutuphaneHedefi = hedef.tur === 'kutuphane' ? hedef : null;
  const tasarim = durum.tasarim;
  /** Tarihsiz kalıp: çeşit tasarımı ve kütüphanedeki kart (yalnız saat ve süre). */
  const kalip = !!tasarim || !!kutuphaneHedefi;
  // P-51: uzman görünümü (çeşit tasarımı her zaman uzman); normal kullanıcıda gün düzeni yok.
  const uzmanAyari = useUzman();
  const uzman = uzmanAyari || !!tasarim;
  const cokGunlu = durum.zamanlama.tekrar !== null;
  /** Bu formda eklenen, davranışı kişinin seçmediği listeler: süreye göre (bir gün → kalır). */
  const [alinanPaylasilanlar, setAlinanPaylasilanlar] = useState<readonly string[]>([]);
  const [otomatikListeler, setOtomatikListeler] = useState<ReadonlySet<string>>(new Set());
  const listeAyarla = (b: BlokTaslagi): BlokTaslagi =>
    otomatikListeler.has(b.id) && (b.tur === 'liste' || b.tur === 'adimlar')
      ? { ...b, tur: cokGunlu ? 'liste' : 'adimlar' }
      : b;
  const secilenCesit = cesitBul(durum.cesit);
  const programGunu: ProgramGunu | null = sablon ? { ref: SABLON_REF, sure: sablon.program.sure } : null;
  const gunGizle = !!programGunu && !uzman;
  /** P-65: görünümden tek parça değiştiriliyor. */
  const parca = duzenleme?.parca ?? null;
  const tekBlok = parca && parca !== 'baslik' ? (durum.bloklar.find((b) => b.id === parca) ?? null) : null;
  const sayfaBasligi = parca
    ? parca === 'baslik'
      ? 'Başlık ve açıklama'
      : tekBlok
        ? BLOK_TURLERI[tekBlok.tur].ad
        : 'Kartı düzenle'
    : tasarimHedefi
      ? tasarimHedefi.cesit
        ? 'Kart çeşidi'
        : 'Yeni kart çeşidi'
      : kutuphaneHedefi
        ? 'Kartı düzenle'
        : sablon
          ? sablon.kart
            ? 'Programın kartı'
            : 'Programa yeni kart'
          : duzenleme
            ? 'Kartı kur'
            : 'Yeni kart';

  const guncelle = (alanlar: Partial<FormDurumu>) => setDurum((d) => ({ ...d, ...alanlar }));
  const tasarimGuncelle = (alanlar: Partial<TasarimAlanlari>) =>
    setDurum((d) => (d.tasarim ? { ...d, tasarim: { ...d.tasarim, ...alanlar } } : d));

  const cesitSec = (c: KartCesidi | null) => {
    if (c && (hedef.tur === 'yeni' || hedef.tur === 'sablon')) {
      // Gün aynı kalır (programda "N. gün").
      const yeni = cesittenDurum(c, durum.zamanlama.tarih);
      setDurum(yeni);
      setIlk(yeni);
      if (c.bloklar.length > 0) setKur(true);
    }
    setCesitSorusu(false);
  };
  const blokDegis = (i: number, b: BlokTaslagi) =>
    setDurum((d) => ({
      ...d,
      bloklar: d.bloklar.map((x, j) => (j === i ? b : x)),
    }));
  const blokKaldir = (i: number) => setDurum((d) => ({ ...d, bloklar: d.bloklar.filter((_, j) => j !== i) }));
  /** P-66: ⋯ → Yukarı / Aşağı. */
  const blokTasi = (id: string, yon: -1 | 1) =>
    setDurum((d) => {
      const i = d.bloklar.findIndex((b) => b.id === id);
      const j = i + yon;
      if (i < 0 || j < 0 || j >= d.bloklar.length) return d;
      const bloklar = [...d.bloklar];
      [bloklar[i], bloklar[j]] = [bloklar[j]!, bloklar[i]!];
      return { ...d, bloklar };
    });
  /** Görünümde sabit ayarı yalnız ajanda kartında ve kütüphanede (program ve çeşit tasarımında yok). */
  const sabitAyari = !tasarim && !sablon;
  const sabitAnahtari = (alan: SabitAlan, etiket: string) => ({
    etiket,
    acik: !durum.sabitler.includes(alan),
    onDegis: (acik: boolean) => guncelle({ sabitler: sabitDegistir(durum.sabitler, alan, !acik) }),
  });

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
    seriSay: durum.zamanlama.tekrar ? durum.seriSay : null,
    sabitler: durum.sabitler.length ? [...durum.sabitler] : null,
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
    if (tasarimHedefi && tasarim) {
      if (tasarim.ad.trim() === '') {
        setHata('Önce çeşidin adını yaz.');
        return;
      }
      void calistir(async () => {
        const c = tasarimHedefi.cesit;
        await tasarimHedefi.onKaydet({
          id: c?.id ?? yeniCesitKimligi(tasarim.alan, yeniKimlik()),
          alan: tasarim.alan,
          ad: tasarim.ad.trim(),
          ikon: tasarim.ikon,
          aciklama: tasarim.aciklama.trim(),
          baslik: durum.baslik.trim(),
          baslikIpucu: durum.baslik.trim() ? '' : durum.baslikIpucu.trim(),
          saat: durum.zamanlama.saat,
          tekrar: durum.zamanlama.tekrar,
          bloklar: durum.bloklar
            .map(listeAyarla)
            .map(kaydaBlok)
            .map((b) => ({ ...blokKopyasi(b), dosya: null })),
          aktif: tasarim.aktif,
          seri: tasarim.seri,
          sira: c?.sira ?? tasarimHedefi.yeniSira,
        });
        onKapat();
      });
      return;
    }
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
      const bloklar = durum.bloklar.map(listeAyarla).map(kaydaBlok);
      if (kutuphaneHedefi) {
        const t = tanim();
        await kutuphaneHedefi.onKaydet({
          baslik: t.baslik,
          kisa: t.kisa,
          saat: t.saat,
          // Hatırlatma burada sorulmaz; kayıtta varsa korunur.
          hatirlatma: gecerliHatirlatma(kutuphaneHedefi.icerik.hatirlatma, t.saat),
          tekrar: t.tekrar,
          bloklar: bloklar.map(blokKopyasi),
          ...(durum.sabitler.length ? { sabitler: [...durum.sabitler] } : {}),
        });
      } else if (sablon) {
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
          cesit: durum.cesit,
        };
        if (sablon.kart) await programKartiYaz(kapi, { ...sablon.kart, ...icerik });
        else await programKartiEkle(kapi, sablon.program.id, icerik, sablon.bugunGun, yeniKimlik);
        onSonuc?.({});
      } else if (!duzenleme) {
        const kart = yeniKart(yeniKimlik(), {
          ...tanim(),
          sira: 0,
          cesit: durum.cesit,
        });
        await yeniKartKaydet(kapi, kart, bloklar, yeniKimlik);
        const notId = hedef.tur === 'yeni' ? hedef.taslak?.notId : undefined;
        if (notId) {
          await notSil(kapi, notId);
          kisaMesaj('Not karta çevrildi');
        }
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
        onSonuc?.({
          yeniKartId: eklenen?.tur === 'kartEkle' ? eklenen.kart.id : undefined,
        });
      }
      // P-54: videoya alınan paylaşımlar Gelenler'den kalkar.
      for (const id of alinanPaylasilanlar) await paylasilanSil(kapi, id);
      onKapat();
    });

  const vazgec: OnaySecenegi = {
    etiket: 'Vazgeç',
    tur: 'yazi',
    onPress: () => setSoru(null),
  };
  const onay = (() => {
    if (!soru || !duzenleme) return null;
    const s = bolmeSecenekleri(duzenleme.gun);
    if (soru.tur === 'kaydet') {
      return {
        baslik: 'Değişiklik hangi günlere uygulansın?',
        aciklama: s.not,
        secenekler: [
          {
            etiket: s.yalnizBuGun,
            tur: 'ikincil' as const,
            onPress: () => void uygulaKaydet('yalnizBuGun'),
          },
          {
            etiket: s.buGunVeSonrasi,
            tur: 'ikincil' as const,
            onPress: () => void uygulaKaydet('buGunVeSonrasi'),
          },
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
        sagEylem={
          cesitSorusu
            ? undefined
            : {
                etiket: tasarimHedefi ? 'Yayınla' : 'Kaydet',
                onPress: () => void kaydet(),
                pasif: calisiyor,
              }
        }
      >
        {cesitSorusu ? (
          <CesitSecici cesitler={tumCesitler()} onSec={cesitSec} oncelikli={sablon?.program.alanlar} />
        ) : (
          <>
            {tasarim && (
              <TasarimAlani
                tasarim={tasarim}
                hata={hata}
                onDegis={(alanlar) => {
                  tasarimGuncelle(alanlar);
                  if (hata) setHata(null);
                }}
              />
            )}
            {!parca && (
              <View style={stiller.baslikSatiri}>
                {/* P-49: "Ne yapacaksın?" kalktı (bilgi kartı da var); solda varsa kartın çeşidi. */}
                {tasarim ? (
                  <Yazi kalinlik="kalin" style={stiller.esnek} numberOfLines={2}>
                    Kartın başlığı (boşsa kişi yazar)
                  </Yazi>
                ) : (
                  <View style={[stiller.esnek, stiller.cesitAdi]}>
                    {!!secilenCesit && (
                      <>
                        <Ionicons
                          name={
                            (secilenCesit.ikon as React.ComponentProps<typeof Ionicons>['name'] | null) ??
                            'leaf-outline'
                          }
                          size={20}
                          color={renk.ikincil}
                        />
                        <Yazi tur="etiket" kalinlik="kalin" numberOfLines={1}>
                          {secilenCesit.ad}
                        </Yazi>
                      </>
                    )}
                  </View>
                )}
                <ZamanRozeti
                  deger={durum.zamanlama}
                  tarihYok={durum.tarihsiz}
                  programGunu={programGunu}
                  gunGizle={gunGizle}
                  kalip={kalip}
                  onPress={() => {
                    Keyboard.dismiss();
                    setZamanBolum('tarih');
                  }}
                />
                {kur && sabitAyari && (
                  <SimgeDugmesi
                    ikon="ellipsis-horizontal"
                    etiket="Başlık ve zaman: seçenekler"
                    onPress={() => {
                      Keyboard.dismiss();
                      setMenu({ tur: 'baslik' });
                    }}
                  />
                )}
              </View>
            )}
            {(!parca || parca === 'baslik') && (
              <>
                <GirisAlani
                  etiket="Kartın başlığı"
                  etiketGizli
                  value={durum.baslik}
                  onChangeText={(baslik) => {
                    guncelle({ baslik });
                    if (hata) setHata(null);
                  }}
                  placeholder={(!tasarim && durum.baslikIpucu) || VARSAYILAN_IPUCU}
                  hata={tasarim ? null : hata}
                  returnKeyType="done"
                  autoFocus={!duzenleme && !sablon?.kart && !kalip && ilk.baslik === ''}
                />
                {tasarim ? (
                  durum.baslik.trim() === '' && (
                    <GirisAlani
                      etiket="Başlık ipucu (isteğe bağlı)"
                      value={durum.baslikIpucu}
                      onChangeText={(baslikIpucu) => guncelle({ baslikIpucu })}
                      placeholder="Örneğin: Mercimek çorbası"
                      returnKeyType="done"
                    />
                  )
                ) : (
                  <View style={stiller.aciklama}>
                    {/* P-66: açıklama da bir öğe: başlık satırı ve ⋯ (kur ekranında). */}
                    {kur && !parca && (
                      <View style={stiller.ogeUst}>
                        <Ionicons name="reader-outline" size={22} color={renk.ana} />
                        <Yazi kalinlik="kalin" style={stiller.esnek}>
                          Açıklama
                        </Yazi>
                        {durum.sabitler.includes('aciklama') && (
                          <Ionicons
                            name="lock-closed-outline"
                            size={16}
                            color={renk.soluk}
                            accessibilityLabel="Kart açıkken değiştirilemez"
                          />
                        )}
                        <SimgeDugmesi
                          ikon="ellipsis-horizontal"
                          etiket="Açıklama: seçenekler"
                          onPress={() => {
                            Keyboard.dismiss();
                            setMenu({ tur: 'aciklama' });
                          }}
                        />
                      </View>
                    )}
                    <ZenginMetinAlani
                      etiket="Açıklama"
                      deger={durum.kisa}
                      onDegis={(kisa) => guncelle({ kisa })}
                      ipucu="Açıklama (isteğe bağlı)"
                      kisa
                    />
                  </View>
                )}
              </>
            )}

            {/* P-57: ikinci şerit: Süre · Hatırlatma · + Karta ekle. */}
            {!parca && kur && (
              <ZamanSeridi
                deger={durum.zamanlama}
                programda={!!programGunu}
                kalip={kalip}
                onSure={() => {
                  Keyboard.dismiss();
                  setZamanBolum('sure');
                }}
                onHatirlatma={() => {
                  Keyboard.dismiss();
                  setZamanBolum('hatirlatma');
                }}
                onEkle={() => {
                  Keyboard.dismiss();
                  setBlokSeciciAcik(true);
                }}
              />
            )}
            <>
              {!parca && kur && durum.bloklar.length > 0 && (
                <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumBasligi}>
                  Kartın içinde
                </Yazi>
              )}
              {durum.bloklar.map(
                (b, i) =>
                  (parca ? b.id === parca : kur) && (
                    <BlokDuzenleyici
                      key={b.id}
                      onMenu={
                        parca
                          ? undefined
                          : () => {
                              Keyboard.dismiss();
                              setMenu({ tur: 'blok', id: b.id });
                            }
                      }
                      blok={listeAyarla(b)}
                      onDegis={(yeni) => blokDegis(i, yeni)}
                      onKaldir={() => blokKaldir(i)}
                      cokGunlu={cokGunlu}
                      onGelendenAlindi={(id) => setAlinanPaylasilanlar((a) => [...a, id])}
                      onListeSecimi={(tur) => {
                        setOtomatikListeler((s) => new Set([...s].filter((x) => x !== b.id)));
                        blokDegis(i, { ...b, tur });
                      }}
                    />
                  ),
              )}
            </>

            {tasarim && (
              <View style={stiller.yayinSatiri}>
                <View style={stiller.esnek}>
                  <Yazi kalinlik="kalin">Yayında</Yazi>
                  <Yazi tur="ikincil">
                    {tasarim.aktif ? 'Herkesin "Ne tür bir kart?" listesinde.' : 'Gizli; yalnız tasarımcılar görür.'}
                  </Yazi>
                </View>
                <AcKapa acik={tasarim.aktif} onDegis={(aktif) => tasarimGuncelle({ aktif })} etiket="Yayında" />
              </View>
            )}
            {tasarim && durum.zamanlama.tekrar && (
              <View style={stiller.yayinSatiri}>
                <View style={stiller.esnek}>
                  <Yazi kalinlik="kalin">Seri sayılsın</Yazi>
                  <Yazi tur="ikincil">
                    Art arda yapılan günler sayılır (alışkanlıklarda). Öğün, tartı gibi kartlarda gerekmez.
                  </Yazi>
                </View>
                <AcKapa
                  acik={tasarim.seri ?? seriVarsayilani(durum.bloklar)}
                  onDegis={(seri) => tasarimGuncelle({ seri })}
                  etiket="Seri sayılsın"
                />
              </View>
            )}

            {/* P-66: sade yeni kart: parça ekleme, süre, hatırlatma ve ayarlar "Kur" ile. */}
            {!kur && (
              <Dugme
                tur="ikincil"
                yaziRengi={renk.ana}
                etiket="Kur: parça ekle, süre, hatırlatma"
                onPress={() => {
                  Keyboard.dismiss();
                  setKur(true);
                }}
              />
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
          </>
        )}
      </AltSayfa>

      <ZamanSayfasi
        gorunur={zamanBolum !== null}
        bolum={zamanBolum ?? 'tarih'}
        onKapat={() => setZamanBolum(null)}
        deger={durum.zamanlama}
        bugunGun={bugunGun}
        tarihYok={durum.tarihsiz}
        programGunu={programGunu}
        gunGizle={gunGizle}
        kalip={kalip}
        onTarihSec={(zamanlama) => guncelle({ zamanlama, tarihsiz: false })}
        onDegis={(zamanlama) => guncelle({ zamanlama, tarihsiz: durum.tarihsiz && zamanlama.tekrar === null })}
      />

      {menu?.tur === 'baslik' && (
        <ElemanMenusu
          baslik="Başlık ve zaman"
          anahtarlar={[sabitAnahtari('baslik', 'Başlık'), sabitAnahtari('zaman', 'Tarih ve saat')]}
          onKapat={() => setMenu(null)}
        />
      )}
      {menu?.tur === 'aciklama' && (
        <ElemanMenusu
          baslik="Açıklama"
          anahtarlar={sabitAyari ? [sabitAnahtari('aciklama', 'Açıklama')] : []}
          onSil={durum.kisa ? () => guncelle({ kisa: '' }) : undefined}
          silEtiketi="Açıklamayı sil"
          onKapat={() => setMenu(null)}
        />
      )}
      {menu?.tur === 'blok' &&
        (() => {
          const i = durum.bloklar.findIndex((b) => b.id === menu.id);
          const b = durum.bloklar[i];
          if (!b) return null;
          return (
            <ElemanMenusu
              baslik={b.ad ? `${BLOK_TURLERI[b.tur].ad} · ${b.ad}` : BLOK_TURLERI[b.tur].ad}
              anahtarlar={
                sabitAyari && ayarliParcaMi(b.tur)
                  ? [
                      {
                        etiket: BLOK_TURLERI[b.tur].ad,
                        acik: !b.sabit,
                        onDegis: (acik: boolean) => blokDegis(i, { ...b, sabit: !acik }),
                      },
                    ]
                  : []
              }
              onYukari={i > 0 ? () => blokTasi(b.id, -1) : undefined}
              onAsagi={i < durum.bloklar.length - 1 ? () => blokTasi(b.id, 1) : undefined}
              onSil={() => blokKaldir(i)}
              silEtiketi="Karttan kaldır"
              onKapat={() => setMenu(null)}
            />
          );
        })()}

      <BlokSecici
        haric={tasarim ? ['foto', 'dosya'] : []}
        uzman={uzman}
        gorunur={blokSeciciAcik}
        onKapat={() => setBlokSeciciAcik(false)}
        onSec={(tur) => {
          const yeni = bosBlok(tur);
          if (tur === 'liste') setOtomatikListeler((s) => new Set([...s, yeni.id]));
          setDurum((d) => ({ ...d, bloklar: [...d.bloklar, yeni] }));
          setBlokSeciciAcik(false);
        }}
      />
    </>
  );
}

/** Çeşit tasarımının üst bölümü: ad, açıklama, alan, simge (P-41). */
function TasarimAlani({
  tasarim,
  hata,
  onDegis,
}: {
  tasarim: TasarimAlanlari;
  hata: string | null;
  onDegis: (alanlar: Partial<TasarimAlanlari>) => void;
}) {
  return (
    <>
      <GirisAlani
        etiket="Çeşidin adı"
        value={tasarim.ad}
        onChangeText={(ad) => onDegis({ ad })}
        placeholder="Örneğin: Tartı"
        hata={hata}
        returnKeyType="done"
        autoFocus={tasarim.ad === ''}
      />
      <GirisAlani
        etiket="Kısa açıklama (listede adın altında)"
        value={tasarim.aciklama}
        onChangeText={(aciklama) => onDegis({ aciklama })}
        placeholder="Örneğin: Haftada bir kilo ve bel"
        returnKeyType="done"
      />
      <Yazi kalinlik="kalin">Alan</Yazi>
      <View style={stiller.haplar}>
        {katalog().alanlar.map((a) => (
          <SecenekHapi
            key={a.anahtar}
            etiket={a.ad}
            secili={tasarim.alan === a.anahtar}
            onPress={() => onDegis({ alan: a.anahtar })}
          />
        ))}
      </View>
      <Yazi kalinlik="kalin">Simge</Yazi>
      <View style={stiller.haplar}>
        {CESIT_SIMGELERI.map((ikon) => {
          const secili = tasarim.ikon === ikon;
          return (
            <Pressable
              key={ikon}
              onPress={() => onDegis({ ikon })}
              accessibilityRole="button"
              accessibilityState={{ selected: secili }}
              accessibilityLabel={`Simge ${ikon.replace('-outline', '')}`}
              style={({ pressed }) => [stiller.simge, secili && stiller.simgeSecili, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={ikon} size={24} color={secili ? renk.yuzey : renk.ana} />
            </Pressable>
          );
        })}
      </View>
      <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumBasligi}>
        Kart
      </Yazi>
    </>
  );
}

/** Kart formunu açıp kapatmak için: `const form = useKartFormu(); form.ac(hedef); {form.oge}` */
export function useKartFormu(onSonuc?: (sonuc: KartFormuSonucu) => void) {
  const [form, setForm] = useState<{
    no: number;
    hedef: KartFormuHedefi;
    acik: boolean;
  } | null>(null);
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
  ekleSatiri: {
    minHeight: 60,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bolumBasligi: { marginTop: 8 },
  esnek: { flex: 1 },
  baslikSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: -4 },
  cesitAdi: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  haplar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  simge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simgeSecili: { backgroundColor: renk.ana, borderColor: renk.ana },
  aciklama: { gap: 8 },
  ogeUst: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yayinSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
});
