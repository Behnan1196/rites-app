// Bir maddeyi yerinde düzeltme (pilot 1 Kasım, P-86): kartın listelerinde ve Listeler'de
// maddeye uzun basınca satır yazı alanı olur; sağında (Adımlar'da) gün ve çöp kutusu.
// Enter ya da alandan çıkınca kaydedilir; boş bırakılırsa değişmez.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { boyut, olcu, renk } from './tema';

export function MaddeDuzeltici({
  metin,
  onKaydet,
  onSil,
  onKapat,
  onGun,
}: {
  metin: string;
  onKaydet: (yeni: string) => void;
  onSil: () => void;
  onKapat: () => void;
  /** Adımlar'da maddeye gün (ve paylaşılanda kişi) verme sayfası. */
  onGun?: () => void;
}) {
  const [yeni, setYeni] = useState(metin);
  const bitti = useRef(false);
  const bitir = () => {
    if (bitti.current) return;
    bitti.current = true;
    const t = yeni.trim();
    if (t && t !== metin) onKaydet(t);
    onKapat();
  };
  // Düğmeye basınca alan odağı kaybeder; kaydetme düğmenin işinden sonra olmasın.
  const dugme = (is: () => void) => () => {
    bitti.current = true;
    is();
  };
  return (
    <View style={stiller.satir}>
      <TextInput
        value={yeni}
        onChangeText={setYeni}
        autoFocus
        selectTextOnFocus={false}
        onSubmitEditing={bitir}
        onBlur={() => setTimeout(bitir, 250)}
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        accessibilityLabel="Maddeyi düzelt"
        selectionColor={renk.ana}
        style={stiller.alan}
      />
      {onGun && (
        <Pressable
          onPress={dugme(() => {
            const t = yeni.trim();
            if (t && t !== metin) onKaydet(t);
            onKapat();
            onGun();
          })}
          accessibilityRole="button"
          accessibilityLabel="Gün ver"
          hitSlop={4}
          style={({ pressed }) => [stiller.dugme, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="calendar-outline" size={22} color={renk.ana} />
        </Pressable>
      )}
      <Pressable
        onPress={dugme(() => {
          onKapat();
          onSil();
        })}
        accessibilityRole="button"
        accessibilityLabel="Maddeyi sil"
        hitSlop={4}
        style={({ pressed }) => [stiller.dugme, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="trash-outline" size={22} color={renk.hata} />
      </Pressable>
    </View>
  );
}

const stiller = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 52 },
  alan: {
    flex: 1,
    minWidth: 0,
    width: 0,
    minHeight: 44,
    borderWidth: 1.5,
    borderColor: renk.ana,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: 12,
    fontSize: boyut.govde,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
  },
  dugme: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
