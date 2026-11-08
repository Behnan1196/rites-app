// Yeni kart (pilot 8 Kasım, P-117): önce yalnız ad ve gün; "Oluştur" deyince kartın kendi
// ekranı açılır. Açıklama, liste, video… orada sağ üstteki + ile eklenir (tek görünüm).
// Uzman görünümünde eski form (kart çeşidi, bütün parçalar) kalır.

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { kisaGoreliTarih } from '@/mantik/ajanda';
import { yeniKart } from '@/mantik/kart';
import { gunEkle, type Gun } from '@/mantik/tarih';
import { yeniKartKaydet } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { SecenekHapi } from '../Secim';
import { Yazi } from '../Yazi';

const HER_GUN = { gunSayisi: null, gunler: null, desen: 'hergun' as const };

interface Acilis {
  gun: Gun;
  /** Alışkanlıklar'dan: her gün, alışkanlık olarak izlenir. */
  aliskanlik?: boolean;
  /** Geri yazısı (kartın ekranında). */
  geri?: string;
}

export function useYeniKart() {
  const [acilis, setAcilis] = useState<(Acilis & { n: number }) | null>(null);
  return {
    ac: (a: Acilis) => setAcilis((o) => ({ ...a, n: (o?.n ?? 0) + 1 })),
    oge: acilis ? <YeniKartSayfasi key={acilis.n} {...acilis} onKapat={() => setAcilis(null)} /> : null,
  };
}

function YeniKartSayfasi({ gun: ilkGun, aliskanlik, geri, onKapat }: Acilis & { onKapat: () => void }) {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [baslik, setBaslik] = useState('');
  const [gun, setGun] = useState<Gun>(ilkGun);
  const [takvim, setTakvim] = useState(false);
  const yarin = gunEkle(bugunGun, 1);
  const hazir = [bugunGun, yarin, ...(ilkGun !== bugunGun && ilkGun !== yarin ? [ilkGun] : [])];

  const olustur = () => {
    const ad = baslik.trim();
    if (!ad) return;
    const id = yeniKimlik();
    onKapat();
    void yeniKartKaydet(
      kapi,
      yeniKart(id, { baslik: ad, tarih: gun, ...(aliskanlik ? { tekrar: HER_GUN, aliskanlik: true } : {}) }),
      [],
      yeniKimlik,
    )
      .then(() => router.push({ pathname: '/kart/[id]', params: { id, gun, ...(geri ? { geri } : {}) } }))
      .catch((e: unknown) => {
        console.error(e);
        kisaMesaj('Kaydedilemedi. Yeniden dene.');
      });
  };

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={aliskanlik ? 'Yeni alışkanlık' : 'Yeni kart'}
      solVazgec
      degisti={!!baslik.trim()}
      sagEylem={{ etiket: 'Oluştur', pasif: !baslik.trim(), onPress: olustur }}
    >
      <GirisAlani
        etiket="Kartın başlığı"
        etiketGizli
        placeholder="Kartın başlığı"
        value={baslik}
        onChangeText={setBaslik}
        onSubmitEditing={olustur}
        returnKeyType="done"
        autoFocus
      />
      {aliskanlik ? (
        <Yazi tur="ikincil">
          Her gün; Giriş → Devam edenler’de izlenir. Günlerini kartın ekranında değiştirebilirsin.
        </Yazi>
      ) : (
        <>
          <View style={stiller.cipler}>
            {hazir.map((g) => (
              <SecenekHapi
                key={g}
                etiket={kisaGoreliTarih(g, bugunGun)}
                secili={gun === g && !takvim}
                onPress={() => {
                  setGun(g);
                  setTakvim(false);
                }}
              />
            ))}
            <SecenekHapi etiket="Gün seç" secili={takvim || !hazir.includes(gun)} onPress={() => setTakvim(true)} />
          </View>
          {takvim && <AyTakvimi secili={gun} bugunGun={bugunGun} onSec={setGun} />}
          <Yazi tur="ikincil">Saat, tekrar, açıklama, liste, video… kartın ekranında eklenir.</Yazi>
        </>
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
