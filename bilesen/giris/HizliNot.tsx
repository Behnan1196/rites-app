// Hızlı Not kutusu (G-2, G-2a, G-2b; pilot 21 Ekim).
// - Başlığın solunda yapışkan not simgesi: Notlar'ı açar.
// - Yazı kutusu doğrudan görünür; içinde mikrofon (söyleneni yazıya çevirir; pilot
//   21 Ekim) ve yazı varken kaydet (ok).
// - Başlık satırında sağda "Ses kaydı" (dalga): kayıt sürerken altta "İptal" / "Bitir";
//   kutuya yazılan kaydın adı olur (yoksa "Sesli not").
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
import { useDikte } from './useDikte';
import { useSesKaydi } from './useSesKaydi';

const KAYDEDILDI_SURESI = 4000;

export function HizliNot() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const notlar = useSorgu(['not'], notlariOku).veri ?? [];
  const notSayfasi = useNotSayfasi();
  const ses = useSesKaydi();

  const [metin, setMetin] = useState('');
  const dikte = useDikte(setMetin);
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
    if (dikte.dinliyor) dikte.bitir();
    const temiz = metin.trim();
    if (temiz === '') return;
    setMetin('');
    await notEkle(kapi, { id: yeniKimlik(), metin: temiz });
    eklendi(temiz);
  };

  const dikteyeBas = async () => {
    if (dikte.dinliyor) {
      dikte.bitir();
      return;
    }
    const sorun = await dikte.baslat(metin);
    if (sorun === 'izinYok')
      kisaMesaj("Mikrofon ya da konuşma tanıma izni verilmedi. Telefonun Ayarlar'ından açabilirsin.");
    else if (sorun === 'yok') kisaMesaj('Bu telefonda konuşma tanıma kullanılamıyor.');
    else if (sorun) kisaMesaj('Dinleme başlatılamadı.');
  };

  const kayitIptal = async () => {
    await ses.iptal();
    kisaMesaj('Kayıt iptal edildi');
  };

  const sesKaydi = async () => {
    if (ses.dinliyor) {
      const sonuc = await ses.bitir();
      if (sonuc.tur === 'tamam') {
        // Kutuda yazı varsa kaydın adı olur.
        const ad = metin.trim() || 'Sesli not';
        if (metin.trim()) setMetin('');
        await notEkle(kapi, { id: yeniKimlik(), metin: ad, sesli: true, sesYolu: sonuc.uri });
        eklendi(ad);
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
        <ModulDugmesi
          etiket={`Notlar'ı aç${notlar.length ? `, ${notlar.length} not` : ''}`}
          onPress={notlariAc}
          simge={<MaterialCommunityIcons name="note-multiple-outline" size={24} color={renk.ana} />}
        />
        <Yazi tur="kutuBasligi" accessibilityRole="header" style={stiller.esnek}>
          Hızlı Not
        </Yazi>
        {!ses.dinliyor && (
          <Pressable
            onPress={() => void sesKaydi()}
            accessibilityRole="button"
            accessibilityLabel="Ses kaydı al; kutuya yazdığın kaydın adı olur"
            style={({ pressed }) => [stiller.kayitDugmesi, pressed && { opacity: 0.7 }]}
            hitSlop={4}
          >
            <MaterialCommunityIcons name="waveform" size={22} color={renk.ana} />
            <Yazi kalinlik="kalin" renk={renk.ana}>
              Ses kaydı
            </Yazi>
          </Pressable>
        )}
      </View>
      <View style={[stiller.giris, dikte.dinliyor && stiller.dikteGiris]}>
        <TextInput
          accessibilityLabel="Hızlı not"
          value={metin}
          onChangeText={setMetin}
          placeholder={
            ses.dinliyor ? 'Kaydın adı (isteğe bağlı)' : dikte.dinliyor ? 'Dinliyorum, konuş…' : 'Yaz ya da söyle'
          }
          placeholderTextColor={renk.soluk}
          selectionColor={renk.ana}
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={() => void (ses.dinliyor ? undefined : yaziyiKaydet())}
          style={[stiller.alan, yazi('normal')]}
        />
        {!ses.dinliyor && (
          <Pressable
            onPress={() => void dikteyeBas()}
            accessibilityRole="button"
            accessibilityLabel={dikte.dinliyor ? 'Dinlemeyi bitir' : 'Söyle, yazıya çevireyim'}
            accessibilityState={{ selected: dikte.dinliyor }}
            style={[stiller.yuvarlak, dikte.dinliyor && { backgroundColor: renk.hata }]}
          >
            <Ionicons
              name={dikte.dinliyor ? 'stop' : 'mic-outline'}
              size={dikte.dinliyor ? 22 : 26}
              color={dikte.dinliyor ? renk.yuzey : renk.ana}
            />
          </Pressable>
        )}
        {yaziVar && !ses.dinliyor && (
          <Pressable
            onPress={() => void yaziyiKaydet()}
            accessibilityRole="button"
            accessibilityLabel="Notu kaydet"
            style={[stiller.yuvarlak, { backgroundColor: renk.ana }]}
          >
            <Ionicons name="arrow-up" size={26} color={renk.yuzey} />
          </Pressable>
        )}
      </View>
      {ses.dinliyor && (
        <View style={stiller.kayitSatiri} accessibilityLiveRegion="polite">
          <View style={stiller.kirmiziNokta} />
          <Yazi kalinlik="kalin" renk={renk.hata} style={stiller.esnek}>
            Kaydediliyor…
          </Yazi>
          <Pressable
            onPress={() => void kayitIptal()}
            accessibilityRole="button"
            accessibilityLabel="Kaydı iptal et"
            style={stiller.iptal}
          >
            <Yazi kalinlik="kalin" renk={renk.hata}>
              İptal
            </Yazi>
          </Pressable>
          <Pressable
            onPress={() => void sesKaydi()}
            accessibilityRole="button"
            accessibilityLabel="Kaydı bitir"
            style={stiller.bitir}
          >
            <Yazi kalinlik="kalin" renk={renk.yuzey}>
              Bitir
            </Yazi>
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
    gap: 6,
  },
  kayitSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: renk.hata,
    backgroundColor: '#FBEDEA',
    minHeight: 60,
    paddingLeft: 14,
    paddingRight: 6,
  },
  kayitDugmesi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
  },
  dikteGiris: { borderColor: renk.hata },
  iptal: { minHeight: 48, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  kirmiziNokta: { width: 12, height: 12, borderRadius: 6, backgroundColor: renk.hata },
  bitir: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: renk.hata,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alan: { flex: 1, minWidth: 0, minHeight: 52, fontSize: boyut.govde + 1, color: renk.yazi },
  yuvarlak: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  kaydedildi: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  notlar: { gap: 10 },
  baslik: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ipucu: { paddingHorizontal: 4 },
  tumu: { alignSelf: 'flex-start', minHeight: olcu.enAzDokunma, justifyContent: 'center', paddingHorizontal: 4 },
});
