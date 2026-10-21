// Hızlı Not kutusu (G-2, G-2a, G-2b; pilot 21 Ekim).
// - Başlık hizasında sağda yapışkan not simgesi: Notlar'ı açar.
// - Yazı kutusu doğrudan görünür; sağda tek düğme: boşken mikrofon, yazı varken ok.
// - Altında yalnız iğnelenen notlar (en çok 3, fazlası "N not daha"); "Göster /
//   Gizle" ve en yeni iki not kalktı. Kaydedilen not için 4 sn "Kaydedildi: …".

import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { igneliNotlar } from '@/mantik/giris';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { notEkle, notlariOku } from '@/veri/notlar';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { useNotSayfasi } from '../not/NotSayfasi';
import { YapiskanNot } from '../not/YapiskanNot';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { ModulDugmesi } from './ModulDugmesi';
import { useSesKaydi } from './useSesKaydi';

const KAYDEDILDI_SURESI = 4000;

export function HizliNot() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const notlar = useSorgu(['not'], notlariOku).veri ?? [];
  const notSayfasi = useNotSayfasi();
  const ses = useSesKaydi();

  const [metin, setMetin] = useState('');
  const [kaydedildi, setKaydedildi] = useState<string | null>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    },
    [],
  );

  const eklendi = (yazi: string) => {
    setKaydedildi(yazi);
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(() => setKaydedildi(null), KAYDEDILDI_SURESI);
  };

  const yaziyiKaydet = async () => {
    const temiz = metin.trim();
    if (temiz === '') return;
    setMetin('');
    await notEkle(kapi, { id: yeniKimlik(), metin: temiz });
    eklendi(temiz);
  };

  const mikrofon = async () => {
    if (ses.dinliyor) {
      const sonuc = await ses.bitir();
      if (sonuc.tur === 'tamam') {
        await notEkle(kapi, { id: yeniKimlik(), metin: 'Sesli not', sesli: true, sesYolu: sonuc.uri });
        eklendi('Sesli not');
      } else {
        kisaMesaj('Ses kaydedilemedi.');
      }
      return;
    }
    const sorun = await ses.baslat();
    if (sorun?.tur === 'izinYok') kisaMesaj("Mikrofon izni verilmedi. Telefonun Ayarlar'ından açabilirsin.");
    else if (sorun) kisaMesaj('Ses kaydı başlatılamadı.');
  };

  const yaziVar = metin.trim() !== '';

  const { gosterilen, fazla } = igneliNotlar(notlar);
  const notlariAc = () => router.push('/giris/notlar');

  return (
    <View style={stiller.kutu}>
      <View style={stiller.baslik}>
        <Yazi tur="kutuBasligi" accessibilityRole="header">
          Hızlı Not
        </Yazi>
        <ModulDugmesi
          etiket={`Notlar'ı aç${notlar.length ? `, ${notlar.length} not` : ''}`}
          onPress={notlariAc}
          simge={<MaterialCommunityIcons name="note-multiple-outline" size={24} color={renk.ana} />}
        />
      </View>
      {ses.dinliyor ? (
        <View style={[stiller.giris, stiller.dinliyor]} accessibilityLiveRegion="polite">
          <View style={stiller.kirmiziNokta} />
          <Yazi kalinlik="kalin" renk={renk.hata} style={stiller.esnek}>
            Dinliyorum…
          </Yazi>
          <Pressable
            onPress={() => void mikrofon()}
            accessibilityRole="button"
            accessibilityLabel="Kaydı bitir"
            style={stiller.bitir}
          >
            <Yazi kalinlik="kalin" renk={renk.yuzey}>
              Bitir
            </Yazi>
          </Pressable>
        </View>
      ) : (
        <View style={stiller.giris}>
          <TextInput
            accessibilityLabel="Hızlı not"
            value={metin}
            onChangeText={setMetin}
            placeholder="Aklına geleni yaz ya da söyle"
            placeholderTextColor={renk.soluk}
            selectionColor={renk.ana}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={() => void yaziyiKaydet()}
            style={[stiller.alan, yazi('normal')]}
          />
          <Pressable
            onPress={() => void (yaziVar ? yaziyiKaydet() : mikrofon())}
            accessibilityRole="button"
            accessibilityLabel={yaziVar ? 'Notu kaydet' : 'Sesli not al'}
            style={[stiller.yuvarlak, yaziVar && { backgroundColor: renk.ana }]}
          >
            <Ionicons name={yaziVar ? 'arrow-up' : 'mic-outline'} size={26} color={yaziVar ? renk.yuzey : renk.ana} />
          </Pressable>
        </View>
      )}

      {kaydedildi && (
        <View style={stiller.kaydedildi} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={20} color={renk.ana} />
          <Yazi tur="ikincil" numberOfLines={1} style={stiller.esnek}>
            {`Kaydedildi: ${kaydedildi}`}
          </Yazi>
        </View>
      )}

      {gosterilen.length > 0 && (
        <View style={stiller.notlar}>
          {gosterilen.map((n) => (
            <YapiskanNot key={n.id} not={n} onPress={() => notSayfasi.ac(n)} />
          ))}
          {fazla > 0 && (
            <Pressable onPress={notlariAc} accessibilityRole="button" style={stiller.tumu} hitSlop={6}>
              <Yazi kalinlik="kalin" renk={renk.ana}>{`${fazla} iğneli not daha ›`}</Yazi>
            </Pressable>
          )}
        </View>
      )}
      {gosterilen.length === 0 && notlar.length > 0 && !kaydedildi && (
        <Yazi tur="ikincil" style={stiller.ipucu}>
          {"Bir notu burada görmek için Notlar'da iğnele."}
        </Yazi>
      )}
      {notSayfasi.oge}
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: 12,
    gap: 10,
  },
  giris: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 16,
    minHeight: 64,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
  },
  dinliyor: { borderColor: renk.hata, backgroundColor: '#FBEDEA' },
  kirmiziNokta: { width: 12, height: 12, borderRadius: 6, backgroundColor: renk.hata },
  bitir: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: renk.hata,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alan: { flex: 1, minHeight: 52, fontSize: boyut.govde + 1, color: renk.yazi },
  yuvarlak: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  kaydedildi: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  notlar: { gap: 10 },
  baslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 },
  ipucu: { paddingHorizontal: 4 },
  tumu: { alignSelf: 'flex-start', minHeight: olcu.enAzDokunma, justifyContent: 'center', paddingHorizontal: 4 },
});
