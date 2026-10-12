// Ajandada arama (A-6): kutu, ipucu, sonuç kartları. Kart listesinin yerine geçer.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ARAMA_EN_AZ, bulunduMetni, type AramaSonucu } from '@/mantik/arama';
import { kaynakAdi, kaynakAnahtari, type KaynakliKart } from '@/mantik/kaynak';
import { trKucuk } from '@/mantik/metin';

import { Dugme } from '../Dugme';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';

export function AramaKutusu({
  deger,
  onDegis,
  onVazgec,
}: {
  deger: string;
  onDegis: (metin: string) => void;
  onVazgec: () => void;
}) {
  const alan = useRef<TextInput>(null);
  useEffect(() => {
    const z = setTimeout(() => alan.current?.focus(), 50);
    return () => clearTimeout(z);
  }, []);

  return (
    <View style={stiller.kutuSatiri}>
      <View style={stiller.kutu}>
        <TextInput
          ref={alan}
          value={deger}
          onChangeText={onDegis}
          placeholder="Ara: tarif, randevu…"
          placeholderTextColor={renk.soluk}
          selectionColor={renk.ana}
          accessibilityLabel="Ajandada ara"
          returnKeyType="search"
          autoCorrect={false}
          style={[stiller.alan, yazi('normal')]}
        />
        {deger.length > 0 && (
          <Pressable
            onPress={() => {
              onDegis('');
              alan.current?.focus();
            }}
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
            style={stiller.temizle}
          >
            <Ionicons name="close" size={24} color={renk.ana} />
          </Pressable>
        )}
      </View>
      <Dugme tur="yazi" etiket="Vazgeç" onPress={onVazgec} />
    </View>
  );
}

export function AramaSonuclari<T extends KaynakliKart>({
  sorgu,
  sonuclar,
  planAdlari,
  onKartiAc,
  onGuneGit,
  onPlaniAc,
}: {
  sorgu: string;
  sonuclar: readonly AramaSonucu<T>[];
  planAdlari: ReadonlyMap<string, string>;
  onKartiAc: (s: AramaSonucu<T>) => void;
  onGuneGit: (s: AramaSonucu<T>) => void;
  onPlaniAc: (s: AramaSonucu<T>) => void;
}) {
  if (trKucuk(sorgu.trim()).length < ARAMA_EN_AZ) {
    return (
      <Yazi tur="ikincil">
        En az iki harf yaz. Bütün ajandanda arar: geçmiş, gelecek ve tekrarlı kartlar; başlık, açıklama ve kartın
        içindekiler.
      </Yazi>
    );
  }
  return (
    <View style={stiller.sonuclar}>
      <Yazi tur="ikincil" accessibilityLiveRegion="polite">
        {bulunduMetni(sonuclar.length)}
      </Yazi>
      {sonuclar.map((s) => (
        <View key={s.kart.id} style={stiller.sonuc}>
          <View style={stiller.metinler}>
            <Yazi tur="kartBasligi">{s.kart.baslik}</Yazi>
            <Yazi>{s.nerede}</Yazi>
            <Yazi tur="ikincil">{kaynakAdi(kaynakAnahtari(s.kart), planAdlari)}</Yazi>
          </View>
          <View style={stiller.dugmeler}>
            <Dugme tur="ana" etiket="Kartı aç" onPress={() => onKartiAc(s)} style={stiller.dugme} />
            {s.gun !== null ? (
              <Dugme
                tur="ikincil"
                etiket="O güne git ›"
                yaziRengi={renk.ana}
                onPress={() => onGuneGit(s)}
                style={[stiller.dugme, stiller.cerceveli]}
              />
            ) : (
              !!s.kart.planId && (
                <Dugme
                  tur="ikincil"
                  etiket="Planı aç ›"
                  yaziRengi={renk.ana}
                  onPress={() => onPlaniAc(s)}
                  style={[stiller.dugme, stiller.cerceveli]}
                />
              )
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const stiller = StyleSheet.create({
  kutuSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kutu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 2,
    borderColor: renk.yazi,
    borderRadius: olcu.kose.dugme,
    backgroundColor: renk.yuzey,
    paddingLeft: 14,
  },
  alan: { flex: 1, minHeight: 52, color: renk.yazi, fontSize: boyut.govde },
  temizle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sonuclar: { gap: 12 },
  sonuc: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
  metinler: { gap: 4 },
  dugmeler: { flexDirection: 'row', gap: 10 },
  dugme: { flex: 1 },
  cerceveli: { borderColor: renk.ana, borderWidth: 2 },
});
