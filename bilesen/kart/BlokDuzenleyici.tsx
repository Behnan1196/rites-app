// Kart formunda tek bir bloğun düzenleme kutusu (K-6): türü, "Yukarı taşı", "Kaldır"
// ve türüne göre alanlar.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { dosyayiSakla } from '@/veri/dosyalar';
import type { BlokTaslagi } from '@/veri/kartlar';

import { Dugme } from '../Dugme';
import { ArtiEksi, Bolum } from '../Secim';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { BLOK_TURLERI } from './blokTurleri';

interface Ozellikler {
  blok: BlokTaslagi;
  ilkMi: boolean;
  onDegis: (blok: BlokTaslagi) => void;
  onYukari: () => void;
  onKaldir: () => void;
}

export function BlokDuzenleyici({ blok, ilkMi, onDegis, onYukari, onKaldir }: Ozellikler) {
  const tur = BLOK_TURLERI[blok.tur];
  const degis = (alanlar: Partial<BlokTaslagi>) => onDegis({ ...blok, ...alanlar });

  const fotografSec = async (kamera: boolean) => {
    if (kamera) {
      const izin = await ImagePicker.requestCameraPermissionsAsync();
      if (!izin.granted) return;
    }
    const sonuc = kamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    const secilen = sonuc.canceled ? undefined : sonuc.assets[0];
    if (secilen) degis({ dosya: await dosyayiSakla(secilen.uri, secilen.fileName ?? undefined) });
  };

  const dosyaSec = async () => {
    const sonuc = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    const secilen = sonuc.canceled ? undefined : sonuc.assets[0];
    if (secilen) degis({ dosya: await dosyayiSakla(secilen.uri, secilen.name), ad: secilen.name });
  };

  return (
    <Bolum>
      <View style={stiller.ust}>
        <View style={stiller.ad}>
          <Ionicons name={tur.ikon} size={22} color={tur.kayit ? renk.vurguYazi : renk.ana} />
          <Yazi kalinlik="kalin">{tur.ad}</Yazi>
          <Yazi tur="etiket">{tur.kayit ? 'Kayıt' : 'İçerik'}</Yazi>
        </View>
        <View style={stiller.eylemler}>
          {!ilkMi && (
            <Pressable
              onPress={onYukari}
              accessibilityRole="button"
              accessibilityLabel={`${tur.ad}: yukarı taşı`}
              style={stiller.ok}
            >
              <Ionicons name="arrow-up" size={22} color={renk.ana} />
            </Pressable>
          )}
          <Dugme tur="tehlike" etiket="Kaldır" onPress={onKaldir} />
        </View>
      </View>

      {blok.tur === 'talimat' && (
        <Alan
          etiket="Talimat"
          deger={blok.metin}
          onDegis={(metin) => degis({ metin })}
          ipucu="Adımları, ayrıntıları yaz"
          cokSatir
        />
      )}
      {blok.tur === 'video' && (
        <Alan
          etiket="Video bağlantısı"
          deger={blok.metin}
          onDegis={(metin) => degis({ metin: metin.trim() })}
          ipucu="Video bağlantısını yapıştır"
          url
        />
      )}
      {blok.tur === 'liste' && (
        <>
          <Alan etiket="Liste adı" deger={blok.ad} onDegis={(ad) => degis({ ad })} ipucu="Liste adı (örneğin Malzemeler)" />
          <Alan
            etiket="Maddeler"
            deger={blok.metin}
            onDegis={(metin) => degis({ metin })}
            ipucu="Her satıra bir madde"
            cokSatir
          />
        </>
      )}
      {blok.tur === 'foto' && (
        <>
          {!!blok.dosya && (
            <Image source={{ uri: blok.dosya }} style={stiller.foto} accessibilityLabel="Seçilen fotoğraf" />
          )}
          <View style={stiller.yanYana}>
            <Dugme tur="ikincil" etiket="Fotoğraf çek" onPress={() => fotografSec(true)} style={stiller.esit} />
            <Dugme tur="ikincil" etiket="Galeriden seç" onPress={() => fotografSec(false)} style={stiller.esit} />
          </View>
        </>
      )}
      {blok.tur === 'dosya' && (
        <>
          {!!blok.dosya && (
            <View style={stiller.dosyaSatiri}>
              <Ionicons name="document-outline" size={22} color={renk.ana} />
              <Yazi numberOfLines={1} style={stiller.esit}>
                {blok.ad || 'Dosya'}
              </Yazi>
            </View>
          )}
          <Dugme tur="ikincil" etiket={blok.dosya ? 'Başka dosya seç' : 'Dosya seç'} onPress={dosyaSec} />
        </>
      )}
      {blok.tur === 'sayac' && (
        <>
          <Alan etiket="Adı" deger={blok.ad} onDegis={(ad) => degis({ ad })} ipucu="Adı (isteğe bağlı)" />
          <View style={stiller.satir}>
            <Yazi>Kaç dakika?</Yazi>
            <ArtiEksi
              deger={String(blok.dakika ?? 10)}
              onEksi={() => degis({ dakika: Math.max(1, (blok.dakika ?? 10) - 1) })}
              onArti={() => degis({ dakika: (blok.dakika ?? 10) + 1 })}
              eksiEtiket="Bir dakika azalt"
              artiEtiket="Bir dakika artır"
            />
          </View>
        </>
      )}
      {blok.tur === 'olcum' && (
        <View style={stiller.yanYana}>
          <View style={stiller.esit}>
            <Alan etiket="Ne ölçülecek" deger={blok.ad} onDegis={(ad) => degis({ ad })} ipucu="Ne? (Kilo)" />
          </View>
          <View style={stiller.birim}>
            <Alan etiket="Birim" deger={blok.birim} onDegis={(birim) => degis({ birim })} ipucu="Birim (kg)" />
          </View>
        </View>
      )}
      {blok.tur === 'gunnot' && (
        <Yazi tur="ikincil">Kartı uygularken o günle ilgili kısa bir not yazacaksın.</Yazi>
      )}
      {blok.tur === 'gelfoto' && (
        <Yazi tur="ikincil">Kartı uygularken fotoğraf çekip gelişimini kaydedeceksin.</Yazi>
      )}
    </Bolum>
  );
}

function Alan({
  etiket,
  deger,
  onDegis,
  ipucu,
  cokSatir = false,
  url = false,
}: {
  etiket: string;
  deger: string;
  onDegis: (metin: string) => void;
  ipucu: string;
  cokSatir?: boolean;
  url?: boolean;
}) {
  return (
    <TextInput
      accessibilityLabel={etiket}
      value={deger}
      onChangeText={onDegis}
      placeholder={ipucu}
      placeholderTextColor={renk.soluk}
      selectionColor={renk.ana}
      multiline={cokSatir}
      keyboardType={url ? 'url' : 'default'}
      autoCapitalize={url ? 'none' : 'sentences'}
      autoCorrect={!url}
      style={[stiller.alan, yazi('normal'), cokSatir && stiller.cokSatir]}
    />
  );
}

const stiller = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ad: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  eylemler: { flexDirection: 'row', alignItems: 'center' },
  ok: { width: olcu.enAzDokunma, height: olcu.enAzDokunma, alignItems: 'center', justifyContent: 'center' },
  alan: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: boyut.govde + 1,
    color: renk.yazi,
    backgroundColor: renk.yuzey,
  },
  cokSatir: { minHeight: 110, textAlignVertical: 'top' },
  yanYana: { flexDirection: 'row', gap: 10 },
  esit: { flex: 1 },
  birim: { width: 130 },
  satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: renk.satirCizgi },
  dosyaSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
