// Avatar menüsü (pilot kararı, 14 Ekim): avatara dokununca küçük menü açılır:
// Profil · Ayarlar (ileride başka seçenekler de eklenebilir).
// - Profil (PR-3): avatar, görünen ad ve e-posta; sağda "Düzenle" (pilot 20 Ekim:
//   fotoğraf seç / çek / kaldır ve görünen ad; fotoğraf yalnız telefonda, ad
//   kişilerine de görünür), "E-postanla devam et", Çıkış yap, Hesabımı sil.
//   Arayüzde "hesap" sözcüğü yalnız "Hesabımı sil"de geçer.
// - Ayarlar: Giriş ekranı (G-7), Yedekleme (PR-2), Üyelik (ücretsiz sınır göstergesi, GR-3).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { adTemizle, AD_EN_UZUN } from '@/mantik/metin';
import { sonYedekMetni, YEDEK_ACIKLAMASI, type YedekDosyasi } from '@/mantik/yedek';
import { adKaydet, ayarSil, ayarYaz } from '@/veri/ayar';
import { dosyayiSakla } from '@/veri/dosyalar';
import { BAGLANAMIYOR, ekledigimSayi } from '@/mantik/kisiler';
import { adiGuncelle, cikisYap, hesabimiSil, useOturum } from '@/sunucu/oturum';
import { useAyar, useSorgu } from '@/veri/kancalar';
import { kisileriOku, kisileriTemizle } from '@/veri/kisiler';
import { telefondakileriSil } from '@/veri/sifirla';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';
import { yedegiGeriYukle, yedekAl, yedekOzeti, yedekSec } from '@/veri/yedekDosyasi';

import { AltSayfa } from './AltSayfa';
import { Avatar } from './Avatar';
import { Dugme } from './Dugme';
import { GirisAlani } from './GirisAlani';
import { useGirisAyari } from './giris/GirisAyari';
import { UcretsizSinir } from './gruplar/UcretsizSinir';
import { Katman } from './Katman';
import { useKisaMesaj } from './KisaMesaj';
import { useOturumAc } from './oturum/OturumSayfasi';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

type Acik = 'menu' | 'profil' | 'ayarlar' | null;

const ProfilBaglami = createContext<{ profiliAc: () => void; ayarlariAc: () => void; menuyuAc: () => void } | null>(
  null,
);

export function ProfilSaglayici({ children }: { children: ReactNode }) {
  const [acik, setAcik] = useState<Acik>(null);
  const ad = useAyar('ad').veri ?? '';
  // Her açılışta sayfa yeniden kurulur; yazı alanı kayıtlı adla başlar.
  const [acilisNo, setAcilisNo] = useState(0);
  const ac = useCallback((s: Acik) => {
    setAcilisNo((n) => n + 1);
    setAcik(s);
  }, []);
  const deger = useMemo(
    () => ({ profiliAc: () => ac('profil'), ayarlariAc: () => ac('ayarlar'), menuyuAc: () => setAcik('menu') }),
    [ac],
  );
  const kapat = () => setAcik(null);
  return (
    <ProfilBaglami.Provider value={deger}>
      {children}
      {acik === 'menu' && <AvatarMenusu ad={ad} onSec={ac} onKapat={kapat} />}
      <ProfilSayfasi key={`p${acilisNo}`} ad={ad} gorunur={acik === 'profil'} onKapat={kapat} />
      <AyarlarSayfasi key={`a${acilisNo}`} gorunur={acik === 'ayarlar'} onKapat={kapat} />
    </ProfilBaglami.Provider>
  );
}

/** Avatarın altında açılan küçük menü. */
function AvatarMenusu({ ad, onSec, onKapat }: { ad: string; onSec: (s: Acik) => void; onKapat: () => void }) {
  const kenar = useSafeAreaInsets();
  const oturum = useOturum();
  const secenekler: { s: Acik; etiket: string; ikon: 'person-outline' | 'settings-outline' }[] = [
    { s: 'profil', etiket: 'Profil', ikon: 'person-outline' },
    { s: 'ayarlar', etiket: 'Ayarlar', ikon: 'settings-outline' },
  ];
  return (
    <Katman>
      <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} accessibilityLabel="Menüyü kapat" />
      <View style={[stiller.menu, { top: kenar.top + 58 }]} accessibilityViewIsModal>
        <View style={stiller.menuKimlik}>
          <Yazi kalinlik="kalin" numberOfLines={1}>
            {ad}
          </Yazi>
          {oturum.durum === 'var' && (
            <Yazi tur="etiket" renk={renk.ikincil} numberOfLines={1}>
              {oturum.eposta}
            </Yazi>
          )}
        </View>
        {secenekler.map((m) => (
          <Pressable
            key={m.etiket}
            onPress={() => onSec(m.s)}
            accessibilityRole="menuitem"
            accessibilityLabel={m.etiket}
            style={({ pressed }) => [stiller.menuSatiri, pressed && { backgroundColor: renk.zemin }]}
          >
            <Ionicons name={m.ikon} size={22} color={renk.ana} />
            <Yazi style={stiller.esnek}>{m.etiket}</Yazi>
          </Pressable>
        ))}
      </View>
    </Katman>
  );
}

export function useProfil() {
  const deger = useContext(ProfilBaglami);
  if (!deger) throw new Error('useProfil, ProfilSaglayici içinde kullanılmalı.');
  return deger;
}

function ProfilSayfasi({ ad, gorunur, onKapat }: { ad: string; gorunur: boolean; onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const kayitliFoto = useAyar('avatar').veri ?? null;
  const [duzenle, setDuzenle] = useState(false);
  const [taslak, setTaslak] = useState(ad);
  const [taslakFoto, setTaslakFoto] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [silSorusu, setSilSorusu] = useState(false);
  const oturum = useOturum();
  const oturumAc = useOturumAc();

  const degisti = duzenle && (adTemizle(taslak) !== ad || taslakFoto !== kayitliFoto);

  const duzenlemeyiAc = () => {
    setTaslak(ad);
    setTaslakFoto(kayitliFoto);
    setHata(null);
    setDuzenle(true);
  };

  const fotografSec = async (kamera: boolean) => {
    try {
      if (kamera) {
        const izin = await ImagePicker.requestCameraPermissionsAsync();
        if (!izin.granted) return;
      }
      const secenek: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      };
      const sonuc = kamera
        ? await ImagePicker.launchCameraAsync(secenek)
        : await ImagePicker.launchImageLibraryAsync(secenek);
      const secilen = sonuc.canceled ? undefined : sonuc.assets[0];
      if (secilen) setTaslakFoto(await dosyayiSakla(secilen.uri, secilen.fileName ?? undefined));
    } catch (e) {
      console.warn(e);
      kisaMesaj('Fotoğraf alınamadı.');
    }
  };

  const kaydet = async () => {
    const sonuc = await adKaydet(kapi, taslak);
    setHata(sonuc);
    if (sonuc) return;
    if (taslakFoto !== kayitliFoto) await ayarYaz(kapi, 'avatar', taslakFoto);
    Keyboard.dismiss();
    if (adTemizle(taslak) !== ad) void adiGuncelle(adTemizle(taslak)).catch(() => undefined);
    setDuzenle(false);
    kisaMesaj('Profil kaydedildi');
  };

  const cikis = async () => {
    try {
      await cikisYap();
      kisaMesaj('Çıkış yapıldı');
    } catch {
      kisaMesaj(BAGLANAMIYOR);
    }
  };

  const hesabiSil = async (telefondakilerDe: boolean) => {
    setSilSorusu(false);
    try {
      await hesabimiSil();
      if (telefondakilerDe) {
        onKapat();
        await telefondakileriSil(kapi);
      } else {
        await kisileriTemizle(kapi);
        await ayarSil(kapi, 'bagli_eposta');
        kisaMesaj("Rites'taki kaydın silindi");
      }
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Profil"
      sagKapat="Kapat"
      degisti={degisti}
      onay={
        silSorusu
          ? {
              baslik: "Rites'taki kaydın silinsin mi?",
              aciklama:
                'Kişilerinle bağlantıların ve sana gelenler sunucudan silinir; bu geri alınamaz. Telefondaki ajandan, notların ve programların da silinsin mi?',
              secenekler: [
                { etiket: 'Sil, telefondakiler kalsın', tur: 'tehlike', onPress: () => void hesabiSil(false) },
                { etiket: 'Sil, telefondakiler de silinsin', tur: 'tehlike', onPress: () => void hesabiSil(true) },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
              ],
            }
          : null
      }
    >
      {!duzenle ? (
        <View style={stiller.kimlik}>
          <Avatar ad={ad} boyut={64} />
          <View style={stiller.ad}>
            <Yazi tur="bolumBasligi" numberOfLines={2}>
              {ad}
            </Yazi>
            {oturum.durum === 'var' && <Yazi tur="ikincil">{oturum.eposta}</Yazi>}
          </View>
          <Dugme tur="yazi" etiket="Düzenle" onPress={duzenlemeyiAc} />
        </View>
      ) : (
        <View style={stiller.kart}>
          <View style={stiller.ortala}>
            <Avatar ad={taslak || ad} boyut={104} foto={taslakFoto} />
          </View>
          <View style={stiller.fotoDugmeleri}>
            <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Fotoğraf seç" onPress={() => void fotografSec(false)} />
            {Platform.OS !== 'web' && (
              <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Fotoğraf çek" onPress={() => void fotografSec(true)} />
            )}
            {!!taslakFoto && <Dugme tur="tehlike" etiket="Fotoğrafı kaldır" onPress={() => setTaslakFoto(null)} />}
          </View>
          <Yazi tur="ikincil">Fotoğrafın yalnız bu telefonda durur.</Yazi>
          <GirisAlani
            etiket="Görünen ad"
            value={taslak}
            onChangeText={(t) => {
              setTaslak(t);
              if (hata) setHata(null);
            }}
            maxLength={AD_EN_UZUN}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void kaydet()}
            hata={hata}
          />
          <Yazi tur="ikincil">Rites sana bu adla hitap eder; kişilerin ve grupların da seni bu adla görür.</Yazi>
          <View style={stiller.ikili}>
            <Dugme tur="yazi" etiket="Vazgeç" onPress={() => setDuzenle(false)} />
            <Dugme etiket="Kaydet" onPress={() => void kaydet()} pasif={!degisti} style={stiller.esnek} />
          </View>
        </View>
      )}

      {(oturum.durum === 'yok' || oturum.durum === 'ayarsiz') && (
        <View style={stiller.kart}>
          <Yazi tur="ikincil">
            Kişilerine kart göndermek ve onlarla ortak listeler tutmak için e-postanla devam et. Şifre yok; e-postana
            gelen kodla girersin.
          </Yazi>
          <Dugme etiket="E-postanla devam et" onPress={oturumAc} pasif={oturum.durum === 'ayarsiz'} />
        </View>
      )}

      {oturum.durum === 'var' && (
        <>
          <Dugme tur="tehlike" etiket="Çıkış yap" onPress={() => void cikis()} />
          <Dugme tur="tehlike" etiket="Hesabımı sil" onPress={() => setSilSorusu(true)} />
        </>
      )}
    </AltSayfa>
  );
}

function AyarlarSayfasi({ gorunur, onKapat }: { gorunur: boolean; onKapat: () => void }) {
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { girisAyariniAc } = useGirisAyari();
  const bugunGun = useBugun();
  const sonYedek = useAyar('son_yedek').veri ?? null;
  const oturum = useOturum();
  const kisiler = useSorgu(['kisi'], (o) => kisileriOku(o), []);
  const [yedekHatasi, setYedekHatasi] = useState<string | null>(null);
  const [geriYuklenecek, setGeriYuklenecek] = useState<YedekDosyasi | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const calistir = async (is: () => Promise<void>, hataMetni: string) => {
    if (calisiyor) return;
    setCalisiyor(true);
    setYedekHatasi(null);
    try {
      await is();
    } catch (e) {
      console.error(hataMetni, e);
      setYedekHatasi(hataMetni);
    } finally {
      setCalisiyor(false);
    }
  };

  const yedekle = () => calistir(() => yedekAl(oku, kapi), 'Yedek alınamadı. Yeniden dene.');

  const geriYukleSec = () =>
    calistir(async () => {
      const secim = await yedekSec(oku);
      if (secim.tur === 'hata') setYedekHatasi(secim.metin);
      if (secim.tur === 'hazir') setGeriYuklenecek(secim.yedek);
    }, 'Yedek okunamadı.');

  const geriYukle = (yedek: YedekDosyasi) =>
    calistir(async () => {
      setGeriYuklenecek(null);
      await yedegiGeriYukle(kapi, yedek);
      kisaMesaj('Yedek geri yüklendi');
    }, 'Yedek geri yüklenemedi. Verilerin değişmedi.');

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik="Ayarlar"
      sagKapat="Kapat"
      onay={
        geriYuklenecek
          ? {
              baslik: 'Yedekten geri yüklensin mi?',
              aciklama: `Bu telefondaki şu anki verilerin yerine yedektekiler gelir: ${yedekOzeti(geriYuklenecek)}.`,
              secenekler: [
                { etiket: 'Geri yükle', tur: 'tehlike', onPress: () => void geriYukle(geriYuklenecek) },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setGeriYuklenecek(null) },
              ],
            }
          : null
      }
    >
      <View style={stiller.kart}>
        <Yazi tur="bolumBasligi" accessibilityRole="header">
          Giriş ekranı
        </Yazi>
        <Yazi tur="ikincil">Giriş&apos;te hangi kutuların görüneceğini seç.</Yazi>
        <Dugme
          tur="ikincil"
          etiket="Giriş'te neler görünsün?"
          onPress={() => {
            onKapat();
            girisAyariniAc();
          }}
        />
      </View>

      <View style={stiller.kart}>
        <Yazi tur="bolumBasligi" accessibilityRole="header">
          Yedekleme
        </Yazi>
        <Yazi tur="ikincil">{YEDEK_ACIKLAMASI}</Yazi>
        <Yazi kalinlik="yariKalin">{sonYedekMetni(sonYedek, bugunGun)}</Yazi>
        <Dugme etiket="Şimdi yedekle" onPress={() => void yedekle()} pasif={calisiyor} />
        <Dugme tur="ikincil" etiket="Yedekten geri yükle" onPress={() => void geriYukleSec()} pasif={calisiyor} />
        {!!yedekHatasi && (
          <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
            {yedekHatasi}
          </Yazi>
        )}
      </View>

      {oturum.durum === 'var' && (
        <View style={stiller.kart}>
          <View style={stiller.baslikSatiri}>
            <Yazi tur="bolumBasligi" accessibilityRole="header">
              Üyelik
            </Yazi>
            <Yazi kalinlik="kalin" renk={renk.ana}>
              Ücretsiz
            </Yazi>
          </View>
          <UcretsizSinir ekledigim={ekledigimSayi(kisiler.veri ?? [])} />
        </View>
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kimlik: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  ortala: { alignItems: 'center' },
  fotoDugmeleri: { gap: 8 },
  ikili: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ad: { flex: 1, gap: 2 },
  baslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menu: {
    position: 'absolute',
    right: olcu.ekranKenari,
    width: 240,
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuKimlik: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: renk.satirCizgi,
    gap: 2,
  },
  menuSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 16 },
  esnek: { flex: 1 },
  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: olcu.kartIci,
    gap: 12,
  },
});
