// Kart görünümünde doğrudan düzeltme (pilot 29 Ekim, P-66). Kartı kuran açık bıraktıysa:
// başlık yazı gibi görünür, dokununca yazılır; açıklama ve talimat dokununca yerinde
// biçimli editöre döner; listeye altta madde eklenir. Kayıt kendiliğinden (alandan çıkınca);
// "Değiştir" düğmesi yok. P-74: editörde "Bitti" yok (dışarı dokununca kapanır); listenin adı
// başlıkta yazı gibi ("Liste"), dokununca yazılır.

import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { ZenginMetin, ZenginMetinAlani } from '../ZenginMetin';
import { metinDoluMu } from '@/mantik/zenginMetin';

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

/** Listeye madde ekleme satırı. */
export function MaddeEkle({ onEkle }: { onEkle: (metin: string) => void }) {
  const [metin, setMetin] = useState('');
  const ekle = () => {
    const t = metin.trim();
    if (!t) return;
    setMetin('');
    onEkle(t);
  };
  return (
    <TextInput
      accessibilityLabel="Listeye ekle"
      value={metin}
      onChangeText={setMetin}
      onSubmitEditing={ekle}
      submitBehavior="submit"
      returnKeyType="done"
      placeholder="+ Ekle ve Enter'a bas"
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
