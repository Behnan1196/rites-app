// Grup ekranında "+ Ekle → Kart ver" (pilot 29 Ekim, P-62): hangi kart? Önce Kütüphanem,
// sonra Rites önerileri; üstte arama. Seçilen kart "Kart ver" sayfasında açılır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { alanAdi } from '@/mantik/alanlar';
import { katalog } from '@/mantik/katalog';
import { etiketMetni } from '@/mantik/kutuphane';
import { trKucuk } from '@/mantik/metin';
import { kartPaketi, type KartPaketi } from '@/mantik/paylasim';
import { useSorgu } from '@/veri/kancalar';
import { kutuphaneyiOku } from '@/veri/kutuphane';

import { AltSayfa } from '../AltSayfa';
import { GirisAlani } from '../GirisAlani';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

export function VerilecekKartSecici({ onSec, onKapat }: { onSec: (p: KartPaketi) => void; onKapat: () => void }) {
  const [sorgu, setSorgu] = useState('');
  const kayitlar = useSorgu(['kutuphane'], (o) => kutuphaneyiOku(o), []).veri ?? [];
  const uyar = (metin: string) => !sorgu.trim() || trKucuk(metin).includes(trKucuk(sorgu.trim()));
  const benimkiler = kayitlar.filter((k) => uyar(`${k.baslik} ${etiketMetni(k)}`));
  const oneriler = katalog().kartlar.filter((k) => uyar(`${k.baslik} ${k.alanlar.map(alanAdi).join(' ')} ${k.tur}`));

  const satir = (anahtar: string, baslik: string, alt: string, paket: () => KartPaketi) => (
    <Pressable
      key={anahtar}
      onPress={() => onSec(paket())}
      accessibilityRole="button"
      accessibilityLabel={`${baslik}, ${alt}`}
      style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.esnek}>
        <Yazi tur="kartBasligi">{baslik}</Yazi>
        {!!alt && <Yazi tur="ikincil">{alt}</Yazi>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
    </Pressable>
  );

  return (
    <AltSayfa gorunur onKapat={onKapat} baslik="Hangi kart?" sagKapat="Kapat">
      <GirisAlani etiket="Kart ara" etiketGizli value={sorgu} onChangeText={setSorgu} placeholder="Ara" />
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Kütüphanem
      </Yazi>
      {kayitlar.length === 0 && (
        <Yazi tur="ikincil">
          {
            'Kütüphanende kart yok. Ajandandaki bir kartı vermek için kartı aç, ⋯ menüsünden "Birine ver" de.'
          }
        </Yazi>
      )}
      {benimkiler.map((k) =>
        satir(`k-${k.id}`, k.baslik, etiketMetni(k), () => kartPaketi(k.icerik, k.icerik.bloklar)),
      )}
      {oneriler.length > 0 && (
        <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolum}>
          Rites önerileri
        </Yazi>
      )}
      {oneriler.map((k) =>
        satir(`o-${k.id}`, k.baslik, [...k.alanlar.map(alanAdi), k.tur].join(' · '), () => kartPaketi(k, k.bloklar)),
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  esnek: { flex: 1, gap: 2 },
  bolum: { marginTop: 8 },
});
