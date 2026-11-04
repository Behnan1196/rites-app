// Kart formunda kartın içindeki bir parçanın kutusu (K-6): adı ve türüne göre
// alanlar; en altta küçük "Bunu kaldır". P-36 (24 Ekim, sade): "Kayıt / İçerik"
// etiketi ve sıralama okları kalktı. P-50: talimat biçimli metin; liste ve proje adımları
// onay kutulu editörde (her satır bir madde). P-66: başlık satırında ⋯ (kart açıkken
// değiştirilebilir, yukarı, aşağı, sil); görünümde sabitse küçük kilit. "Bunu kaldır" ⋯'ye taşındı.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { dosyayiSakla } from '@/veri/dosyalar';
import { blokVideolari, videolarBlogu } from '@/mantik/video';
import type { BlokTaslagi } from '@/veri/kartlar';

import { Dugme } from '../Dugme';
import { SimgeDugmesi } from '../SimgeDugmesi';
import { ZenginMetinAlani } from '../ZenginMetin';
import { VideolarDuzenleyici } from './Videolar';
import { ArtiEksi, Bolum, SecenekHapi } from '../Secim';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { maddeliListeMi, type BlokTuru } from '@/mantik/kart';

import { BagliListeSecici } from './BagliListe';
import { BLOK_TURLERI } from './blokTurleri';

interface Ozellikler {
  blok: BlokTaslagi;
  onDegis: (blok: BlokTaslagi) => void;
  onKaldir: () => void;
  /** Kart birden çok gün sürüyor: listede "Her gün baştan / İşaretler kalsın" seçimi (P-51). */
  cokGunlu?: boolean;
  /** Kişi listenin davranışını seçti. */
  onListeSecimi?: (tur: BlokTuru) => void;
  /** Videoya Gelenler'den alındı (P-54). */
  onGelendenAlindi?: (id: string) => void;
  /** P-66: başlık satırındaki ⋯; varsa "Bunu kaldır" gösterilmez (menüde Sil). */
  onMenu?: () => void;
  /** P-77: kart görünümündeki ayar sayfasında: kutu, başlık satırı ve "Bunu kaldır" yok (listede adı kalır). */
  basliksiz?: boolean;
}

export function BlokDuzenleyici({
  blok,
  onDegis,
  onKaldir,
  cokGunlu = false,
  onListeSecimi,
  onGelendenAlindi,
  onMenu,
  basliksiz = false,
}: Ozellikler) {
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

  // P-69: listede simge ve "Liste" yazısı yok; başlık satırında liste adı ve ⋯.
  const listeMi = maddeliListeMi(blok.tur) || blok.tur === 'listebag';
  /** P-83: listenin dört kullanımı; maddeli olanlar arasında maddeler kalır, bağlıya geçince boşalır. */
  const listeTuruSec = (yeni: BlokTuru) => {
    if (yeni === blok.tur) return;
    if (maddeliListeMi(yeni) && maddeliListeMi(blok.tur)) onListeSecimi?.(yeni);
    else degis({ tur: yeni, metin: '', ad: '', maddeler: [] });
  };
  const Kap = basliksiz ? DuzKap : Bolum;
  return (
    <Kap>
      {(!basliksiz || listeMi) && (
        <View style={stiller.ust}>
          <View style={[stiller.ad, listeMi && stiller.esnek]} accessibilityRole={listeMi ? undefined : 'header'}>
            {listeMi && blok.tur !== 'listebag' ? (
              <View style={stiller.esnek}>
                <Alan
                  etiket="Liste adı"
                  deger={blok.ad}
                  onDegis={(ad) => degis({ ad })}
                  ipucu="Liste adı (isteğe bağlı)"
                />
              </View>
            ) : listeMi ? (
              <Yazi kalinlik="kalin" style={stiller.esnek}>
                Liste
              </Yazi>
            ) : (
              <>
                <Ionicons name={tur.ikon} size={22} color={tur.kayit ? renk.vurguYazi : renk.ana} />
                <Yazi kalinlik="kalin">{tur.ad}</Yazi>
              </>
            )}
            {!!blok.sabit && (
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={renk.soluk}
                accessibilityLabel="Kart açıkken değiştirilemez"
              />
            )}
          </View>
          {onMenu && <SimgeDugmesi ikon="ellipsis-horizontal" etiket={`${tur.ad}: seçenekler`} onPress={onMenu} />}
        </View>
      )}

      {blok.tur === 'talimat' && (
        <ZenginMetinAlani
          etiket="Talimat"
          deger={blok.metin}
          onDegis={(metin) => degis({ metin })}
          ipucu="Adımları, ayrıntıları yaz"
        />
      )}
      {blok.tur === 'video' && (
        // P-53: çoklu video; ekleme ve ayar videonun alanında.
        <VideolarDuzenleyici
          videolar={blokVideolari(blok)}
          onDegis={(v) => degis(videolarBlogu(v))}
          onGelendenAlindi={onGelendenAlindi}
        />
      )}
      {listeMi && (
        <>
          {/* P-83: listenin kullanımı: işaretler kalır · her gün baştan (çok günlü) · işaretsiz · Listeler'den. */}
          <View style={stiller.turler} accessibilityRole="radiogroup" accessibilityLabel="Liste nasıl kullanılsın">
            {/* P-85: Günlük kontrol tek seferlik kartta da seçilir (o gün işaretlenir; kart tekrarlı olunca her gün baştan). */}
            {/* P-89: "Listelerimden" yeni listede yok; önceden bağlanmış listede seçili durur. */}
            {LISTE_TURLERI.filter((t) => t.tur !== 'listebag' || blok.tur === 'listebag').map((t) => (
              <SecenekHapi
                key={t.tur}
                etiket={t.ad}
                altEtiket={t.tur === 'liste' && !cokGunlu ? 'Tekrarlıda her gün baştan' : t.aciklama}
                secili={blok.tur === t.tur}
                onPress={() => listeTuruSec(t.tur)}
                style={stiller.turHapi}
              />
            ))}
          </View>
          {blok.tur === 'listebag' ? (
            <BagliListeSecici listeId={blok.metin} onSec={(metin, ad) => degis({ metin, ad })} />
          ) : (
            <ZenginMetinAlani
              etiket="Maddeler"
              deger={blok.metin}
              onDegis={(metin) => degis({ metin })}
              ipucu="Her satıra bir madde"
              liste
            />
          )}
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
        <>
          <Alan
            etiket="Soru"
            deger={blok.metin}
            onDegis={(metin) => degis({ metin })}
            ipucu="Soru (isteğe bağlı): Bugün neye minnettarsın?"
          />
          <Yazi tur="ikincil">{'Her seferinde bu soruya kısa bir cevap yazılır. Soru yoksa "Günün notu".'}</Yazi>
        </>
      )}
      {blok.tur === 'kronometre' && (
        <>
          <Alan etiket="Adı" deger={blok.ad} onDegis={(ad) => degis({ ad })} ipucu="Adı (isteğe bağlı): Plank" />
          <Yazi tur="ikincil">{'İleri sayar; "Dur" deyince süre o günün kaydına yazılır.'}</Yazi>
        </>
      )}
      {blok.tur === 'adet' && (
        <>
          <View style={stiller.yanYana}>
            <View style={stiller.esit}>
              <Alan etiket="Ne sayılacak" deger={blok.ad} onDegis={(ad) => degis({ ad })} ipucu="Ne? (Su)" />
            </View>
            <View style={stiller.birim}>
              <Alan etiket="Birim" deger={blok.birim} onDegis={(birim) => degis({ birim })} ipucu="Birim (bardak)" />
            </View>
          </View>
          <View style={stiller.satir}>
            <Yazi>Günlük hedef</Yazi>
            <ArtiEksi
              deger={blok.dakika ? String(blok.dakika) : 'Yok'}
              bos={!blok.dakika}
              onEksi={() => degis({ dakika: blok.dakika && blok.dakika > 1 ? blok.dakika - 1 : null })}
              onArti={() => degis({ dakika: (blok.dakika ?? 0) + 1 })}
              eksiEtiket="Hedefi azalt"
              artiEtiket="Hedefi artır"
            />
          </View>
        </>
      )}
      {blok.tur === 'puan' && (
        <>
          <Alan
            etiket="Ne puanlanacak"
            deger={blok.ad}
            onDegis={(ad) => degis({ ad })}
            ipucu="Ne? (Enerjim, uyku kalitem)"
          />
          <Yazi tur="ikincil">{"Her seferinde 1'den 5'e bir puan verilir."}</Yazi>
        </>
      )}
      {blok.tur === 'gelfoto' && <Yazi tur="ikincil">Kartı uygularken fotoğraf çekip gelişimini kaydedeceksin.</Yazi>}
      {!onMenu && !basliksiz && (
        <Pressable
          onPress={onKaldir}
          accessibilityRole="button"
          accessibilityLabel={`${tur.ad}: bunu karttan kaldır`}
          hitSlop={8}
          style={({ pressed }) => [stiller.kaldir, pressed && { opacity: 0.6 }]}
        >
          <Yazi tur="etiket" renk={renk.hata}>
            Bunu kaldır
          </Yazi>
        </Pressable>
      )}
    </Kap>
  );
}

function DuzKap({ children }: { children: React.ReactNode }) {
  return <View style={stiller.duzKap}>{children}</View>;
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

const LISTE_TURLERI: { tur: BlokTuru; ad: string; aciklama: string }[] = [
  { tur: 'adimlar', ad: 'Adımlar', aciklama: 'İşaretlediğin kalır' },
  { tur: 'liste', ad: 'Günlük kontrol', aciklama: 'Her gün baştan' },
  { tur: 'bilgi', ad: 'Bilgi listesi', aciklama: 'İşaretsiz' },
  { tur: 'listebag', ad: 'Listelerimden', aciklama: 'Market gibi listeler' },
];

const stiller = StyleSheet.create({
  turler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  turHapi: { flexBasis: '47%', flexGrow: 1 },
  duzKap: { gap: 12 },
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ad: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  esnek: { flex: 1 },
  eylemler: { flexDirection: 'row', alignItems: 'center' },
  kaldir: { alignSelf: 'flex-end', minHeight: olcu.enAzDokunma, justifyContent: 'center' },
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
