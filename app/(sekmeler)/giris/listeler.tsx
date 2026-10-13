// Ortak Listeler (GR-2): her listede ad, kimlerle (gruplar + kişiler), kişi sayısı,
// kalan madde; "+ Yeni liste".

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { ListeFormu } from '@/bilesen/listeler/ListeFormu';
import { useListeler } from '@/bilesen/listeler/useListeler';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { kalanMetni, kimlerleMetni, kisiSayisiMetni } from '@/mantik/listeler';
import { useOturum } from '@/sunucu/oturum';

export default function OrtakListeler() {
  const oturum = useOturum();
  const { ben, listeler, ad, yukleniyor, baglanamiyor, yenile } = useListeler(oturum);
  // Kişilerim sunucuyla eşleşsin (Yeni liste / düzenle formundaki kişiler için).
  const { kisiler } = useKisiler(oturum);
  const { gruplar } = useGruplar(oturum);
  const [yeni, setYeni] = useState(0);

  return (
    <EkranKabi geri="Giriş" baslik="Ortak Listeler" altBaslik="Kişilerinle ya da gruplarınla birlikte tuttuğun listeler.">
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli
            oturum={oturum}
            aciklama="Kişilerinle ortak listeler tutmak için e-postanla devam et. Ajandan ve notların yine yalnız bu telefonda kalır."
          />
        )
      ) : (
        <>
          {baglanamiyor && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}
          {!yukleniyor && !baglanamiyor && listeler.length === 0 && <Yazi tur="ikincil">Henüz ortak listen yok.</Yazi>}
          {listeler.map((l) => {
            const alt = `${kimlerleMetni(l, ben, ad)} · ${kisiSayisiMetni(l)}`;
            return (
              <Pressable
                key={l.id}
                onPress={() => router.push({ pathname: '/giris/liste/[id]', params: { id: l.id } })}
                accessibilityRole="button"
                accessibilityLabel={`${l.ad}, ${alt}, ${kalanMetni(l.kalan)}`}
                style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
              >
                <View style={stiller.esnek}>
                  <Yazi tur="kartBasligi">{l.ad}</Yazi>
                  <Yazi tur="ikincil">{alt}</Yazi>
                </View>
                <Yazi tur="ikincil" kalinlik="kalin" renk={kaynakRenk.liste.yazi}>
                  {kalanMetni(l.kalan)}
                </Yazi>
                <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
              </Pressable>
            );
          })}
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Yeni liste" onPress={() => setYeni((n) => n + 1)} />
        </>
      )}

      {yeni > 0 && (
        <ListeFormu
          key={yeni}
          onKapat={() => setYeni(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          onKaydedildi={(id) => {
            void yenile();
            router.push({ pathname: '/giris/liste/[id]', params: { id } });
          }}
        />
      )}
    </EkranKabi>
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
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.liste.serit,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 14,
    minHeight: 72,
  },
  esnek: { flex: 1 },
});
