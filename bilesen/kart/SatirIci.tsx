// Kart görünümünde doğrudan düzeltme (pilot 29 Ekim, P-66). Kartı kuran açık bıraktıysa:
// başlık yazı gibi görünür, dokununca yazılır; açıklama ve talimat dokununca yerinde
// biçimli editöre döner ("Bitti"); listeye altta madde eklenir. Kayıt kendiliğinden
// (alandan çıkınca / Bitti); "Değiştir" düğmesi yok.

import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Dugme } from '../Dugme';
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
}: {
  metin: string;
  etiket: string;
  /** Boşken görünen davet: "+ Açıklama ekle". */
  bosIpucu: string;
  onKaydet: (yeni: string) => void;
}) {
  const [duzenle, setDuzenle] = useState(false);
  const [taslak, setTaslak] = useState(metin);
  if (!duzenle) {
    const dolu = metinDoluMu(metin);
    return (
      <Pressable
        onPress={() => {
          setTaslak(metin);
          setDuzenle(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={dolu ? `${etiket}. Değiştirmek için dokun` : bosIpucu}
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
      <ZenginMetinAlani etiket={etiket} deger={taslak} onDegis={setTaslak} ipucu={etiket} kisa />
      <Dugme
        tur="ikincil"
        yaziRengi={renk.ana}
        etiket="Bitti"
        onPress={() => {
          setDuzenle(false);
          if (taslak !== metin) onKaydet(taslak);
        }}
        style={stiller.bitti}
      />
    </View>
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
  dokun: { minHeight: 32, justifyContent: 'center' },
  editor: { gap: 8 },
  bitti: { alignSelf: 'flex-end' },
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
