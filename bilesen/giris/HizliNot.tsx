// Hızlı Not kutusu (G-2, G-2a, G-2b).
// - Yazı kutusu doğrudan görünür; sağda tek düğme: boşken mikrofon, yazı varken ok.
// - Notlar her açılışta ve arka plandan dönüşte gizli başlar.
// - Notlar kapalıyken kaydedilen not için 4 sn "Kaydedildi: …" satırı.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { enYeniNotlar } from '@/mantik/giris';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { notEkle, notlariOku } from '@/veri/notlar';
import { useVeri } from '@/veri/VeriSaglayici';

import { useKisaMesaj } from '../KisaMesaj';
import { useNotSayfasi } from '../not/NotSayfasi';
import { YapiskanNot } from '../not/YapiskanNot';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { useSesKaydi } from './useSesKaydi';

const KAYDEDILDI_SURESI = 4000;

export function HizliNot() {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const notlar = useSorgu(['not'], notlariOku).veri ?? [];
  const notSayfasi = useNotSayfasi();
  const ses = useSesKaydi();

  const [metin, setMetin] = useState('');
  const [gizli, setGizli] = useState(true);
  const [kaydedildi, setKaydedildi] = useState<string | null>(null);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Arka plandan dönünce notlar yine kapalı.
  useEffect(() => {
    const abonelik = AppState.addEventListener('change', (durum) => {
      if (durum !== 'active') setGizli(true);
    });
    return () => abonelik.remove();
  }, []);
  useEffect(
    () => () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    },
    [],
  );

  const eklendi = (yazi: string) => {
    if (!gizli) return;
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

  return (
    <View style={stiller.kutu}>
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

      {kaydedildi && gizli && (
        <View style={stiller.kaydedildi} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={20} color={renk.ana} />
          <Yazi tur="ikincil" numberOfLines={1} style={stiller.esnek}>
            {`Kaydedildi: ${kaydedildi}`}
          </Yazi>
        </View>
      )}

      {notlar.length > 0 && (
        <>
          <View style={stiller.ayrac} />
          <View style={stiller.satir}>
            <Yazi tur="ikincil">{`${notlar.length} not`}</Yazi>
            <Pressable
              onPress={() => setGizli(!gizli)}
              accessibilityRole="button"
              accessibilityLabel={gizli ? 'Notları göster' : 'Notları gizle'}
              style={stiller.goz}
              hitSlop={6}
            >
              <Ionicons name={gizli ? 'eye-outline' : 'eye-off-outline'} size={24} color={renk.ana} />
              <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.gozYazi}>
                {gizli ? 'Göster' : 'Gizle'}
              </Yazi>
            </Pressable>
          </View>
          {!gizli && (
            <View style={stiller.notlar}>
              {enYeniNotlar(notlar).map((n) => (
                <YapiskanNot key={n.id} not={n} onPress={() => notSayfasi.ac(n)} />
              ))}
              {notlar.length > 2 && (
                <Pressable
                  onPress={() => router.push('/giris/notlar')}
                  accessibilityRole="button"
                  style={stiller.tumu}
                  hitSlop={6}
                >
                  <Yazi kalinlik="kalin" renk={renk.ana}>{`Tümünü gör (${notlar.length}) ›`}</Yazi>
                </Pressable>
              )}
            </View>
          )}
        </>
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
  ayrac: { height: 1, backgroundColor: renk.cizgi },
  satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  goz: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: olcu.enAzDokunma },
  gozYazi: { fontSize: 19 },
  notlar: { gap: 10 },
  tumu: { alignSelf: 'flex-start', minHeight: olcu.enAzDokunma, justifyContent: 'center', paddingHorizontal: 4 },
});
