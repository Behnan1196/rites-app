// Profil sayfası (alttan açılır, avatardan). 1. görevde yalnız ad değiştirme var;
// yedekleme, Giriş ekranı ayarı, üyelik ve çıkış 8. görevde eklenecek.

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import { adTemizle, AD_EN_UZUN } from '@/mantik/metin';
import { adKaydet } from '@/veri/ayar';
import { useAyar } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from './AltSayfa';
import { Avatar } from './Avatar';
import { Dugme } from './Dugme';
import { GirisAlani } from './GirisAlani';
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
  const { kapi } = useVeri();

  const [taslak, setTaslak] = useState(ad);
  const [hata, setHata] = useState<string | null>(null);

  const degisti = adTemizle(taslak) !== ad;

  const kaydet = async () => {
    const sonuc = await adKaydet(kapi, taslak);
    setHata(sonuc);
    if (!sonuc) {
      setTaslak(adTemizle(taslak));
      Keyboard.dismiss();
    }
  };

  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} sagKapat="Kapat" degisti={degisti}>
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
    gap: 16,
  },
});
