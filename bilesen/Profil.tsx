// Profil sayfası (alttan açılır, avatardan): ad, Yedekleme (PR-2), Giriş ekranı (G-7).
// E-posta, Üyelik, Çıkış yap ve Hesabımı sil sunucuyla birlikte (9. görev) gelecek.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { adTemizle, AD_EN_UZUN } from '@/mantik/metin';
import { sonYedekMetni, YEDEK_ACIKLAMASI, type YedekDosyasi } from '@/mantik/yedek';
import { adKaydet } from '@/veri/ayar';
import { useAyar } from '@/veri/kancalar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';
import { yedegiGeriYukle, yedekAl, yedekOzeti, yedekSec } from '@/veri/yedekDosyasi';

import { AltSayfa } from './AltSayfa';
import { Avatar } from './Avatar';
import { Dugme } from './Dugme';
import { GirisAlani } from './GirisAlani';
import { useGirisAyari } from './giris/GirisAyari';
import { useKisaMesaj } from './KisaMesaj';
import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

const ProfilBaglami = createContext<{ profiliAc: () => void } | null>(null);

export function ProfilSaglayici({ children }: { children: ReactNode }) {
  const [acik, setAcik] = useState(false);
  const ad = useAyar('ad').veri ?? '';
  // Her açılışta sayfa yeniden kurulur; yazı alanı kayıtlı adla başlar.
  const [acilisNo, setAcilisNo] = useState(0);
  const profiliAc = useCallback(() => {
    setAcilisNo((n) => n + 1);
    setAcik(true);
  }, []);
  const deger = useMemo(() => ({ profiliAc }), [profiliAc]);
  return (
    <ProfilBaglami.Provider value={deger}>
      {children}
      <ProfilSayfasi key={acilisNo} ad={ad} gorunur={acik} onKapat={() => setAcik(false)} />
    </ProfilBaglami.Provider>
  );
}

export function useProfil() {
  const deger = useContext(ProfilBaglami);
  if (!deger) throw new Error('useProfil, ProfilSaglayici içinde kullanılmalı.');
  return deger;
}

function ProfilSayfasi({ ad, gorunur, onKapat }: { ad: string; gorunur: boolean; onKapat: () => void }) {
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { girisAyariniAc } = useGirisAyari();
  const bugunGun = useBugun();
  const sonYedek = useAyar('son_yedek').veri ?? null;

  const [taslak, setTaslak] = useState(ad);
  const [hata, setHata] = useState<string | null>(null);
  const [yedekHatasi, setYedekHatasi] = useState<string | null>(null);
  const [geriYuklenecek, setGeriYuklenecek] = useState<YedekDosyasi | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const degisti = adTemizle(taslak) !== ad;

  const kaydet = async () => {
    const sonuc = await adKaydet(kapi, taslak);
    setHata(sonuc);
    if (!sonuc) {
      setTaslak(adTemizle(taslak));
      Keyboard.dismiss();
    }
  };

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
      sagKapat="Kapat"
      degisti={degisti}
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
      <View style={stiller.kimlik}>
        <Avatar ad={ad} boyut={64} />
        <Yazi tur="bolumBasligi" style={stiller.ad} numberOfLines={2}>
          {ad}
        </Yazi>
      </View>

      <View style={stiller.kart}>
        <GirisAlani
          etiket="Sana nasıl hitap edelim?"
          value={taslak}
          onChangeText={(t) => {
            setTaslak(t);
            if (hata) setHata(null);
          }}
          maxLength={AD_EN_UZUN}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={kaydet}
          hata={hata}
        />
        <Dugme etiket="Kaydet" onPress={kaydet} pasif={!degisti} />
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
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kimlik: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  ad: { flex: 1 },
  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: olcu.kartIci,
    gap: 12,
  },
});
