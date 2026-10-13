// Kart formu (alttan sayfa): yeni kart ve düzenleme (K-1, K-4, K-6, K-11, K-14).

import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  bolmeSecenekleri, bolmeSorusuGerekirMi, duzenle, sil, silmeOnayi, type BolmeSecimi, type KartTanimi,
} from '@/mantik/bolme';
import { yeniKart, type Blok, type BlokTuru, type Kart } from '@/mantik/kart';
import type { Gun } from '@/mantik/tarih';
import { islemleriUygula, kayitVarMi, yeniKartKaydet, type BlokTaslagi } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { usePaylas } from '../paylasim/PaylasSayfasi';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import type { OnaySecenegi } from '../OnayKutusu';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { BlokDuzenleyici } from './BlokDuzenleyici';
import { BlokSecici } from './BlokSecici';
import { ZamanlamaCubugu, ZamanlamaSayfalari, type Zamanlama, type ZamanlamaBolmesi } from './Zamanlama';

export type KartFormuHedefi =
  | { tur: 'yeni'; gun: Gun }
  | { tur: 'duzenle'; kart: Kart; bloklar: readonly Blok[]; gun: Gun };

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
  return b.tur === 'liste' ? { ...taslak, metin: b.maddeler.join('\n') } : taslak;
}

function kaydaBlok(b: BlokTaslagi): BlokTaslagi {
  if (b.tur !== 'liste') return b;
  const maddeler = b.metin
    .split('\n')
    .map((m) => m.trim())
    .filter((m) => m !== '');
  return { ...b, maddeler, metin: '' };
}

function bosBlok(tur: BlokTuru): BlokTaslagi {
  return { id: geciciKimlik(), tur, ad: '', metin: '', birim: '', dakika: tur === 'sayac' ? 10 : null, maddeler: [], dosya: null };
}

function ilkDurum(hedef: KartFormuHedefi): FormDurumu {
  if (hedef.tur === 'yeni') {
    return {
      baslik: '',
      kisa: '',
      tarihsiz: false,
      zamanlama: { tarih: hedef.gun, saat: null, hatirlatma: null, tekrar: null },
      bloklar: [],
    };
  }
  const { kart } = hedef;
  return {
    baslik: kart.baslik,
    kisa: kart.kisa,
    tarihsiz: kart.tarihsiz,
    zamanlama: { tarih: kart.tarih ?? hedef.gun, saat: kart.saat, hatirlatma: kart.hatirlatma, tekrar: kart.tekrar },
    bloklar: hedef.bloklar.map(formaBlok),
  };
}

type Soru =
  | { tur: 'kaydet' }
  | { tur: 'sil' }
  | { tur: 'silOnay'; aciklama: string };

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
  const [blokSeciciAcik, setBlokSeciciAcik] = useState(false);
  const [soru, setSoru] = useState<Soru | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const paylas = usePaylas();

  const degisti = useMemo(() => JSON.stringify(durum) !== JSON.stringify(ilk), [durum, ilk]);
  const duzenleme = hedef.tur === 'duzenle' ? hedef : null;

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
    hatirlatma: durum.zamanlama.saat ? durum.zamanlama.hatirlatma : null,
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
      if (!duzenleme) {
        const kart = yeniKart(yeniKimlik(), { ...tanim(), sira: Date.now() });
        await yeniKartKaydet(kapi, kart, bloklar, yeniKimlik);
        onSonuc?.({});
      } else {
        const sonuc = duzenle(duzenleme.kart, duzenleme.gun, tanim(), secim, yeniKimlik);
        await islemleriUygula(kapi, sonuc.islemler, bloklar, yeniKimlik);
        const eklenen = sonuc.islemler.find((i) => i.tur === 'kartEkle');
        if (sonuc.mesaj) kisaMesaj(sonuc.mesaj);
        onSonuc?.({ yeniKartId: eklenen?.tur === 'kartEkle' ? eklenen.kart.id : undefined });
      }
      onKapat();
    });

  const silmeyeBasla = () =>
    calistir(async () => {
      if (!duzenleme) return;
      if (bolmeSorusuGerekirMi(duzenleme.kart, duzenleme.gun)) {
        setSoru({ tur: 'sil' });
        return;
      }
      const onay = silmeOnayi(duzenleme.kart, await kayitVarMi(oku, duzenleme.kart.id));
      setSoru({ tur: 'silOnay', aciklama: onay.aciklama ?? 'Bu işlem geri alınamaz.' });
    });

  const uygulaSil = (secim: BolmeSecimi | null) =>
    calistir(async () => {
      if (!duzenleme) return;
      setSoru(null);
      const sonuc = sil(duzenleme.kart, duzenleme.gun, secim);
      await islemleriUygula(kapi, sonuc.islemler, [], yeniKimlik);
      if (sonuc.mesaj) kisaMesaj(sonuc.mesaj);
      onSonuc?.({ silindi: true });
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
    if (soru.tur === 'sil') {
      return {
        baslik: 'Hangi günler silinsin?',
        aciklama: 'Geçmiş günlerin kayıtları silinmez.',
        secenekler: [
          { etiket: s.yalnizBuGun, tur: 'tehlike' as const, onPress: () => void uygulaSil('yalnizBuGun') },
          { etiket: s.buGunVeSonrasi, tur: 'tehlike' as const, onPress: () => void uygulaSil('buGunVeSonrasi') },
          vazgec,
        ],
      };
    }
    return {
      baslik: 'Kart silinsin mi?',
      aciklama: soru.aciklama,
      secenekler: [{ etiket: 'Sil', tur: 'tehlike' as const, onPress: () => void uygulaSil(null) }, vazgec],
    };
  })();

  return (
    <>
      <AltSayfa
        gorunur={gorunur}
        onKapat={onKapat}
        baslik={duzenleme ? 'Kartı düzenle' : 'Yeni kart'}
        solVazgec
        degisti={degisti}
        onay={onay}
        altAlan={
          <View style={stiller.alt}>
            <ZamanlamaCubugu
              deger={durum.zamanlama}
              bugunGun={bugunGun}
              onAc={setAltSayfa}
              tarihYok={durum.tarihsiz}
            />
            <Dugme etiket="Kaydet" onPress={kaydet} pasif={calisiyor} />
          </View>
        }
      >
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
          autoFocus={!duzenleme}
        />
        <GirisAlani
          etiket="Kısa açıklama"
          etiketGizli
          value={durum.kisa}
          onChangeText={(kisa) => guncelle({ kisa })}
          placeholder="Kısa açıklama (isteğe bağlı)"
          returnKeyType="done"
        />

        {durum.bloklar.map((b, i) => (
          <BlokDuzenleyici
            key={b.id}
            blok={b}
            ilkMi={i === 0}
            onDegis={(yeni) => blokDegis(i, yeni)}
            onYukari={() => blokYukari(i)}
            onKaldir={() => blokKaldir(i)}
          />
        ))}

        <Pressable
          onPress={() => setBlokSeciciAcik(true)}
          accessibilityRole="button"
          style={({ pressed }) => [stiller.blokEkle, pressed && { opacity: 0.7 }]}
        >
          <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.blokEkleYazi}>
            + Blok ekle
          </Yazi>
        </Pressable>

        {duzenleme && !duzenleme.kart.kilitli && (
          <Dugme
            tur="ikincil"
            etiket="Paylaş"
            yaziRengi={renk.ana}
            onPress={() => paylas.ac({ kart: duzenleme.kart, bloklar: duzenleme.bloklar })}
          />
        )}
        {duzenleme && <Dugme tur="tehlike" etiket="Sil" onPress={() => void silmeyeBasla()} />}
      </AltSayfa>

      <ZamanlamaSayfalari
        acik={altSayfa}
        deger={durum.zamanlama}
        bugunGun={bugunGun}
        tarihYok={durum.tarihsiz}
        onDegis={(zamanlama) =>
          guncelle({
            zamanlama,
            tarihsiz: durum.tarihsiz && altSayfa !== 'tarih' && zamanlama.tekrar === null,
          })
        }
        onAc={setAltSayfa}
      />

      {paylas.oge}

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
  const ac = useCallback(
    (hedef: KartFormuHedefi) => setForm((f) => ({ no: (f?.no ?? 0) + 1, hedef, acik: true })),
    [],
  );
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
