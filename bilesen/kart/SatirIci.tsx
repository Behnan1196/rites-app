// Kart görünümünde doğrudan düzeltme (pilot 29 Ekim, P-66). Kartı kuran açık bıraktıysa:
// başlık yazı gibi görünür, dokununca yazılır; açıklama ve talimat dokununca yerinde
// biçimli editöre döner; listeye altta madde eklenir. Kayıt kendiliğinden (alandan çıkınca);
// "Değiştir" düğmesi yok. P-74: editörde "Bitti" yok (dışarı dokununca kapanır); listenin adı
// başlıkta yazı gibi ("Liste"), dokununca yazılır. P-75: açıklama başlık satırlı öğe (Aa · ⋯).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { metinDoluMu } from '@/mantik/zenginMetin';

import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { ZenginMetin, ZenginMetinAlani } from '../ZenginMetin';

/** Başlık: yazı gibi; dokununca yazılır, çıkınca kaydedilir (boş bırakılırsa eskisi kalır). */
export function SatirIciBaslik({ baslik, onKaydet }: { baslik: string; onKaydet: (yeni: string) => void }) {
  const [metin, setMetin] = useState(baslik);
  const [onceki, setOnceki] = useState(baslik);
  // Kart başka yerden değişince (Kur) alan da yenilenir.
  if (baslik !== onceki) {
    setOnceki(baslik);
    setMetin(baslik);
  }
  const bitir = () => {
    const t = metin.trim();
    if (!t) setMetin(baslik);
    else if (t !== baslik) onKaydet(t);
  };
  return (
    <TextInput
      accessibilityLabel="Kartın başlığı"
      value={metin}
      onChangeText={setMetin}
      onEndEditing={bitir}
      onBlur={bitir}
      onSubmitEditing={bitir}
      returnKeyType="done"
      submitBehavior="blurAndSubmit"
      multiline
      selectionColor={renk.ana}
      style={[stiller.baslik, yazi('kalin')]}
    />
  );
}

/** Biçimli metin (açıklama, talimat): dokununca yerinde editör; "Bitti" kaydeder. */
export function SatirIciZengin({
  metin,
  etiket,
  bosIpucu,
  onKaydet,
  ilkDuzenleme = false,
  onBitti,
}: {
  metin: string;
  etiket: string;
  /** Boşken görünen davet: "+ Açıklama ekle"; null: boşken hiç görünmez (P-72: şeritten eklenir). */
  bosIpucu: string | null;
  onKaydet: (yeni: string) => void;
  /** P-72: şeritten eklenince editör açık gelir. */
  ilkDuzenleme?: boolean;
  onBitti?: () => void;
}) {
  const [duzenle, setDuzenle] = useState(ilkDuzenleme);
  const [taslak, setTaslak] = useState(metin);
  const taslakRef = useRef(metin);
  const kapanis = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (kapanis.current) clearTimeout(kapanis.current);
    },
    [],
  );
  /** P-74: editörden çıkınca (biraz bekleyip; araç çubuğuna basınca odak geri gelir) kaydedip kapanır. */
  const odakDegis = (odak: boolean) => {
    if (kapanis.current) clearTimeout(kapanis.current);
    kapanis.current = null;
    if (odak) return;
    kapanis.current = setTimeout(() => {
      kapanis.current = null;
      setDuzenle(false);
      if (taslakRef.current !== metin) onKaydet(taslakRef.current);
      onBitti?.();
    }, 400);
  };
  if (!duzenle) {
    const dolu = metinDoluMu(metin);
    if (!dolu && bosIpucu === null) return null;
    return (
      <Pressable
        onPress={() => {
          setTaslak(metin);
          taslakRef.current = metin;
          setDuzenle(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={dolu ? `${etiket}. Değiştirmek için dokun` : (bosIpucu ?? etiket)}
        style={({ pressed }) => [stiller.dokun, pressed && { opacity: 0.7 }]}
      >
        {dolu ? (
          <ZenginMetin metin={metin} />
        ) : (
          <Yazi tur="ikincil" renk={renk.ana}>
            {bosIpucu}
          </Yazi>
        )}
      </Pressable>
    );
  }
  return (
    <View style={stiller.editor}>
      <ZenginMetinAlani
        etiket={etiket}
        deger={taslak}
        onDegis={(y) => {
          taslakRef.current = y;
          setTaslak(y);
        }}
        ipucu={etiket}
        kisa
        otomatikOdak
        onOdakDegis={odakDegis}
      />
    </View>
  );
}

/** P-74: parçanın adı (liste): yazı gibi; boşken soluk "Liste". Dokununca yazılır, çıkınca kaydedilir. */
export function SatirIciAd({ ad, ipucu, onKaydet }: { ad: string; ipucu: string; onKaydet: (yeni: string) => void }) {
  const [metin, setMetin] = useState(ad);
  const [onceki, setOnceki] = useState(ad);
  if (ad !== onceki) {
    setOnceki(ad);
    setMetin(ad);
  }
  const bitir = () => {
    const t = metin.trim();
    if (t !== ad) onKaydet(t);
  };
  return (
    <TextInput
      accessibilityLabel={`${ipucu} adı`}
      accessibilityHint="Değiştirmek için dokun"
      value={metin}
      onChangeText={setMetin}
      onEndEditing={bitir}
      onBlur={bitir}
      onSubmitEditing={bitir}
      returnKeyType="done"
      submitBehavior="blurAndSubmit"
      placeholder={ipucu}
      placeholderTextColor={renk.ana}
      selectionColor={renk.ana}
      style={[stiller.ad, yazi('kalin')]}
    />
  );
}

/**
 * P-75: kart görünümünde açıklama bir öğe: başlık satırı ("Açıklama" · Aa · ⋯). Aa biçim çubuğunu
 * açar (normalde gizli); ⋯ menü (Karttan kaldır). Boşken de yerinde kalır ("Yazmak için dokun").
 * Dokununca yerinde editör; dışarı dokununca kaydedilir.
 */
export function AciklamaAlani({
  metin,
  ilkDuzenleme = false,
  degisir,
  onKaydet,
  onMenu,
}: {
  metin: string;
  ilkDuzenleme?: boolean;
  /** Kart açıkken değişebilir mi (kuranın ayarı). */
  degisir: boolean;
  onKaydet: (yeni: string) => void;
  onMenu?: () => void;
}) {
  const [duzenle, setDuzenle] = useState(ilkDuzenleme && degisir);
  const [cubuk, setCubuk] = useState(false);
  const [odakIstegi, setOdakIstegi] = useState(0);
  const [taslak, setTaslak] = useState(metin);
  const taslakRef = useRef(metin);
  const ilkRef = useRef(metin);
  const kaydetRef = useRef(onKaydet);
  useEffect(() => {
    kaydetRef.current = onKaydet;
  });
  const kapanis = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duzenleRef = useRef(duzenle);
  useEffect(() => {
    duzenleRef.current = duzenle;
  });
  // Ekrandan çıkarken editör açıksa yazılan kaybolmasın.
  useEffect(
    () => () => {
      if (kapanis.current) clearTimeout(kapanis.current);
      if (duzenleRef.current && taslakRef.current !== ilkRef.current) kaydetRef.current(taslakRef.current);
    },
    [],
  );
  const ac = () => {
    setTaslak(metin);
    taslakRef.current = metin;
    ilkRef.current = metin;
    setDuzenle(true);
  };
  const kapat = () => {
    if (kapanis.current) clearTimeout(kapanis.current);
    kapanis.current = null;
    setDuzenle(false);
    duzenleRef.current = false;
    setCubuk(false);
    if (taslakRef.current !== ilkRef.current) onKaydet(taslakRef.current);
    ilkRef.current = taslakRef.current;
  };
  const odakDegis = (odak: boolean) => {
    if (kapanis.current) clearTimeout(kapanis.current);
    kapanis.current = null;
    if (odak) return;
    kapanis.current = setTimeout(() => {
      kapanis.current = null;
      kapat();
    }, 400);
  };
  const dolu = metinDoluMu(duzenle ? taslak : metin);
  return (
    <View style={stiller.aciklama}>
      <View style={stiller.aciklamaUst}>
        {/* P-84: öbür parçalar gibi sade başlık: "Açıklama ⌄"; dokununca menü. Aa yalnız yazarken. */}
        <Pressable
          onPress={
            onMenu
              ? () => {
                  // Menüden önce yazılan kaydedilir (kaldırınca geri gelmesin).
                  if (duzenleRef.current) kapat();
                  onMenu();
                }
              : undefined
          }
          disabled={!onMenu}
          accessibilityRole={onMenu ? 'button' : 'header'}
          accessibilityLabel={onMenu ? 'Açıklama: seçenekler' : 'Açıklama'}
          hitSlop={6}
          style={({ pressed }) => [stiller.aciklamaAdi, pressed && { opacity: 0.6 }]}
        >
          <Yazi kalinlik="kalin" renk={renk.ikincil} numberOfLines={1}>
            Açıklama
          </Yazi>
          {!!onMenu && <Ionicons name="chevron-down" size={16} color={renk.soluk} />}
        </Pressable>
        <View style={stiller.esnek} />
        {!degisir && (
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={renk.soluk}
            accessibilityLabel="Kart açıkken değiştirilemez"
          />
        )}
        {degisir && duzenle && (
          <Pressable
            onPress={() => {
              // Editörden çıkış sayılmasın: çubuk açılır, editör açık kalır.
              if (kapanis.current) clearTimeout(kapanis.current);
              kapanis.current = null;
              if (!duzenle) ac();
              else setOdakIstegi((n) => n + 1);
              setCubuk((c) => !c);
            }}
            accessibilityRole="button"
            accessibilityLabel="Biçimlendirme"
            accessibilityState={{ selected: cubuk }}
            hitSlop={4}
            style={({ pressed }) => [stiller.aa, cubuk && stiller.aaAcik, pressed && { opacity: 0.6 }]}
          >
            <Yazi kalinlik="kalin" renk={cubuk ? renk.yuzey : renk.ana} style={stiller.aaYazi}>
              Aa
            </Yazi>
          </Pressable>
        )}
      </View>
      {duzenle ? (
        <ZenginMetinAlani
          etiket="Açıklama"
          deger={taslak}
          onDegis={(y) => {
            taslakRef.current = y;
            setTaslak(y);
          }}
          ipucu="Açıklama"
          kisa
          otomatikOdak
          cubukGizli={!cubuk}
          odakIstegi={odakIstegi}
          onOdakDegis={odakDegis}
        />
      ) : (
        <Pressable
          onPress={degisir ? ac : undefined}
          disabled={!degisir}
          accessibilityRole={degisir ? 'button' : 'text'}
          accessibilityLabel={dolu ? 'Açıklama. Değiştirmek için dokun' : 'Açıklama boş. Yazmak için dokun'}
          style={({ pressed }) => [stiller.dokun, pressed && { opacity: 0.7 }]}
        >
          {dolu ? (
            <ZenginMetin metin={metin} />
          ) : (
            <Yazi tur="ikincil" renk={renk.soluk}>
              Yazmak için dokun
            </Yazi>
          )}
        </Pressable>
      )}
    </View>
  );
}

/** Listeye madde ekleme satırı. */
export function MaddeEkle({
  onEkle,
  yer = "+ Ekle ve Enter'a bas",
  etiket = 'Listeye ekle',
}: {
  onEkle: (metin: string) => void;
  /** Yer tutucu yazı (Notlar'da "+ Not yaz ve Enter'a bas"). */
  yer?: string;
  etiket?: string;
}) {
  const [metin, setMetin] = useState('');
  const ekle = () => {
    const t = metin.trim();
    if (!t) return;
    setMetin('');
    onEkle(t);
  };
  return (
    <TextInput
      accessibilityLabel={etiket}
      value={metin}
      onChangeText={setMetin}
      onSubmitEditing={ekle}
      submitBehavior="submit"
      returnKeyType="done"
      placeholder={yer}
      placeholderTextColor={renk.soluk}
      selectionColor={renk.ana}
      style={[stiller.ekle, yazi('normal')]}
    />
  );
}

const stiller = StyleSheet.create({
  baslik: {
    flex: 1,
    fontSize: boyut.bolumBasligi,
    color: renk.yazi,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  dokun: { minHeight: 32, justifyContent: 'center', alignItems: 'flex-start' },
  aciklama: { gap: 6 },
  aciklamaUst: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  aciklamaAdi: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
  esnek: { flex: 1 },
  aa: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  aaAcik: { backgroundColor: renk.ana },
  aaYazi: { fontSize: 18 },
  ad: { flex: 1, fontSize: boyut.govde, color: renk.ana, paddingVertical: 4, paddingHorizontal: 0 },
  editor: { gap: 8 },
  ekle: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: 12,
    fontSize: boyut.govde,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
  },
});
