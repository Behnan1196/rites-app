// Setler (pilot 19 Kasım, P-127): egzersiz kartında set set tekrar ve ağırlık. Setler hedefle
// dolu gelir (3 × 10 · 10 kg); kişi yaptıkça kutuyu işaretler, farklı yaptıysa sayıya dokunup
// düzeltir. Üstte "Geçen sefer". Bir set işaretlenince (sonuncusu değilse) dinlenme sayacı başlar;
// bitince kısa bir ses ve titreşim (yalnız Rites açıkken). Bütün setler bitince kart Yaptım olur.

import Ionicons from '@expo/vector-icons/Ionicons';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  Vibration,
  View,
} from 'react-native';

import type { Blok, Kayit } from '@/mantik/kart';
import {
  agirlikDuzelt,
  dinlenmeMetni,
  gecenSefer,
  hedefMetni,
  setHedefiOku,
  setleriOku,
  setleriYaz,
  type SetKaydi,
} from '@/mantik/setler';
import { kisaTarih, type Gun } from '@/mantik/tarih';

import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';

const BIP = require('../../assets/sesler/bip.wav') as number;

function sesCal() {
  try {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    const o = createAudioPlayer(BIP);
    o.play();
    setTimeout(() => o.remove(), 3000);
  } catch (e) {
    console.warn('Ses çalınamadı', e);
  }
  Vibration.vibrate();
}

/** Şimdiki an (ms); dinlenmenin bitişi için. */
const simdi = () => Date.now();

function sureMetni(sn: number): string {
  return `${Math.floor(sn / 60)}:${String(sn % 60).padStart(2, '0')}`;
}

export function SetlerParcasi({
  blok,
  gun,
  kayit,
  kayitlar,
  onKayit,
  onYapildi,
}: {
  blok: Blok;
  gun: Gun;
  kayit: Kayit;
  kayitlar: readonly Kayit[];
  onKayit: (degistir: (k: Kayit) => Kayit) => void;
  /** Bütün setler bitince ya da biri geri alınınca (listenin maddesinde listeyi de günceller). */
  onYapildi?: (yapildi: boolean) => void;
}) {
  const hedef = setHedefiOku(blok);
  const setler = setleriOku(kayit, hedef, blok.id);
  const onceki = gecenSefer(kayitlar, blok, gun);
  const [dinlenmeBitis, setDinlenmeBitis] = useState<number | null>(null);
  const [kalan, setKalan] = useState(0);

  useEffect(() => {
    if (dinlenmeBitis === null) return;
    const tik = () => {
      const k = Math.max(0, Math.ceil((dinlenmeBitis - Date.now()) / 1000));
      setKalan(k);
      if (k === 0) {
        setDinlenmeBitis(null);
        sesCal();
      }
    };
    tik();
    const z = setInterval(tik, 250);
    return () => clearInterval(z);
  }, [dinlenmeBitis]);

  /** Setleri kaydın son hâlinden değiştirir (art arda dokunuşlar kaybolmasın). */
  const degistir = (hesap: (eski: SetKaydi[]) => SetKaydi[]) =>
    onKayit((k) => {
      const eski = setleriOku(k, hedef, blok.id);
      const yeni = hesap(eski);
      const sonuc = setleriYaz(k, blok.id, eski, yeni);
      if (sonuc.yapildi !== k.yapildi && onYapildi) {
        const y = sonuc.yapildi;
        setTimeout(() => onYapildi(y), 0);
      }
      return sonuc;
    });

  const isaretle = (i: number) => {
    const yapildi = !setler[i]?.yapildi;
    degistir((eski) => eski.map((s, j) => (j === i ? { ...s, yapildi } : s)));
    // Dinlenme: işaretlenen set son yapılmamış set değilse.
    const kalanSet = setler.filter((s, j) => j !== i && !s.yapildi).length;
    if (yapildi && hedef.dinlenme > 0 && kalanSet > 0) setDinlenmeBitis(simdi() + hedef.dinlenme * 1000);
    // Son set ya da geri alınan set: dinlenme biter.
    else setDinlenmeBitis(null);
  };
  const hucre = (i: number, alan: Partial<SetKaydi>) =>
    degistir((eski) => eski.map((s, j) => (j === i ? { ...s, ...alan } : s)));
  const ekle = () =>
    degistir((eski) => {
      const son = eski[eski.length - 1];
      return [...eski, { tekrar: son?.tekrar ?? hedef.tekrar, agirlik: son?.agirlik ?? hedef.agirlik, yapildi: false }];
    });
  const sonuSil = () => degistir((eski) => (eski.length > hedef.set ? eski.slice(0, -1) : eski));
  const yapilan = setler.filter((s) => s.yapildi).length;
  const bittiId = `setler-bitti-${blok.id}`;

  return (
    <View style={stiller.kap}>
      <View style={stiller.ust}>
        <Yazi kalinlik="kalin" style={stiller.esnek}>
          {blok.ad || 'Setler'}
        </Yazi>
        <Yazi
          kalinlik="kalin"
          renk={yapilan === setler.length ? renk.ana : renk.ikincil}
          accessibilityLiveRegion="polite"
        >
          {`${yapilan} / ${setler.length} set`}
        </Yazi>
      </View>
      <Yazi tur="ikincil">
        {`Hedef: ${hedefMetni(hedef)}${onceki ? ` · Geçen sefer (${kisaTarih(onceki.gun)}): ${onceki.ozet}` : ''}`}
      </Yazi>

      <View style={stiller.basliklar} importantForAccessibility="no-hide-descendants">
        <View style={stiller.kutuYeri} />
        <Yazi tur="etiket" style={stiller.setAdi}>
          Set
        </Yazi>
        <Yazi tur="etiket" style={stiller.sutunBasligi}>
          Tekrar
        </Yazi>
        <Yazi tur="etiket" style={stiller.sutunBasligi}>
          kg
        </Yazi>
      </View>
      {setler.map((s, i) => (
        <SetSatiri
          key={`${gun}-${i}-${s.tekrar}-${s.agirlik}`}
          sira={i + 1}
          set={s}
          bittiId={Platform.OS === 'ios' ? bittiId : undefined}
          onIsaret={() => isaretle(i)}
          onDegis={(alan) => hucre(i, alan)}
        />
      ))}

      {dinlenmeBitis !== null && (
        <View style={stiller.dinlenme} accessibilityLiveRegion="polite">
          <Ionicons name="hourglass-outline" size={22} color={renk.anaKoyu} />
          <Yazi kalinlik="kalin" renk={renk.anaKoyu} style={stiller.esnek}>
            {`Dinlen · ${sureMetni(kalan)}`}
          </Yazi>
          <Pressable
            onPress={() => setDinlenmeBitis(null)}
            accessibilityRole="button"
            accessibilityLabel="Dinlenmeyi atla"
            hitSlop={8}
            style={({ pressed }) => [stiller.atla, pressed && { opacity: 0.6 }]}
          >
            <Yazi kalinlik="kalin" renk={renk.ana}>
              Atla
            </Yazi>
          </Pressable>
        </View>
      )}

      <View style={stiller.altSatir}>
        <Pressable
          onPress={ekle}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => [stiller.altDugme, pressed && { opacity: 0.6 }]}
        >
          <Yazi kalinlik="kalin" renk={renk.ana}>
            + Set ekle
          </Yazi>
        </Pressable>
        {setler.length > hedef.set && (
          <Pressable
            onPress={sonuSil}
            accessibilityRole="button"
            hitSlop={6}
            style={({ pressed }) => [stiller.altDugme, pressed && { opacity: 0.6 }]}
          >
            <Yazi tur="etiket" renk={renk.ikincil}>
              Son seti sil
            </Yazi>
          </Pressable>
        )}
        <View style={stiller.esnek} />
        {hedef.dinlenme > 0 && dinlenmeBitis === null && (
          <Yazi tur="etiket" renk={renk.soluk}>{`Dinlenme ${dinlenmeMetni(hedef.dinlenme)}`}</Yazi>
        )}
      </View>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={bittiId}>
          <View style={stiller.bittiSatiri}>
            <Pressable onPress={() => Keyboard.dismiss()} accessibilityRole="button" hitSlop={8} style={stiller.bitti}>
              <Yazi kalinlik="kalin" renk={renk.ana}>
                Bitti
              </Yazi>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </View>
  );
}

function SetSatiri({
  sira,
  set,
  bittiId,
  onIsaret,
  onDegis,
}: {
  sira: number;
  set: SetKaydi;
  bittiId?: string;
  onIsaret: () => void;
  onDegis: (alan: Partial<SetKaydi>) => void;
}) {
  const [tekrar, setTekrar] = useState(String(set.tekrar));
  const [agirlik, setAgirlik] = useState(set.agirlik);
  const tekrarBitti = () => {
    const n = Math.round(Number(tekrar.replace(',', '.')));
    if (!Number.isFinite(n) || n < 0) return setTekrar(String(set.tekrar));
    if (n !== set.tekrar) onDegis({ tekrar: Math.min(999, n) });
  };
  const agirlikBitti = () => {
    const d = agirlikDuzelt(agirlik);
    setAgirlik(d);
    if (d !== set.agirlik) onDegis({ agirlik: d });
  };
  const ozet = `${sira}. set: ${set.tekrar} tekrar${set.agirlik ? `, ${set.agirlik} kilo` : ''}`;
  return (
    <View style={[stiller.satir, set.yapildi && stiller.satirYapildi]}>
      <Pressable
        onPress={onIsaret}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.yapildi }}
        accessibilityLabel={ozet}
        hitSlop={8}
        style={stiller.kutuYeri}
      >
        <View style={[stiller.kare, set.yapildi && stiller.kareDolu]}>
          {set.yapildi && <Ionicons name="checkmark" size={20} color={renk.yuzey} />}
        </View>
      </Pressable>
      <Yazi kalinlik="yariKalin" renk={set.yapildi ? renk.ikincil : renk.yazi} style={stiller.setAdi}>
        {String(sira)}
      </Yazi>
      <TextInput
        accessibilityLabel={`${sira}. set, tekrar`}
        value={tekrar}
        onChangeText={setTekrar}
        onBlur={tekrarBitti}
        keyboardType="number-pad"
        inputAccessoryViewID={bittiId}
        selectTextOnFocus
        selectionColor={renk.ana}
        style={[stiller.sayi, yazi('kalin'), set.yapildi && stiller.sayiYapildi]}
      />
      <TextInput
        accessibilityLabel={`${sira}. set, kilo`}
        value={agirlik}
        onChangeText={setAgirlik}
        onBlur={agirlikBitti}
        keyboardType="decimal-pad"
        inputAccessoryViewID={bittiId}
        selectTextOnFocus
        placeholder="–"
        placeholderTextColor={renk.soluk}
        selectionColor={renk.ana}
        style={[stiller.sayi, yazi('kalin'), set.yapildi && stiller.sayiYapildi]}
      />
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 6 },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  esnek: { flex: 1 },
  basliklar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  sutunBasligi: { width: 88, textAlign: 'center' },
  kutuYeri: { width: 44, alignItems: 'center', justifyContent: 'center' },
  setAdi: { width: 32, textAlign: 'center' },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: olcu.enAzDokunma + 8,
    borderRadius: 10,
  },
  satirYapildi: { backgroundColor: renk.anaAcik },
  kare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: renk.soluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kareDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  sayi: {
    width: 88,
    minHeight: 48,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: boyut.govde + 2,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
    fontVariant: ['tabular-nums'],
  },
  sayiYapildi: { borderColor: 'transparent', backgroundColor: 'transparent' },
  dinlenme: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: olcu.kose.kart,
    backgroundColor: renk.anaAcik,
  },
  atla: { minHeight: olcu.enAzDokunma, justifyContent: 'center', paddingHorizontal: 8 },
  altSatir: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  altDugme: { minHeight: olcu.enAzDokunma, justifyContent: 'center' },
  bittiSatiri: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: renk.bolumluZemin,
    borderTopWidth: 1,
    borderTopColor: renk.cizgi,
    paddingHorizontal: 12,
  },
  bitti: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
});
