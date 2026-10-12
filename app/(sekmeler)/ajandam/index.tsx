// Ajandam · Gün görünümü (A-1, A-2, A-2b, A-8). Hafta, takvim, arama ve süzme 5. görevde.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Kalanlar } from '@/bilesen/ajanda/Kalanlar';
import { KartSatiri } from '@/bilesen/ajanda/KartSatiri';
import { GunGezinme, HaftaSeridi } from '@/bilesen/ajanda/GunGezinme';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { Yazi } from '@/bilesen/Yazi';
import { bosGunMetni, gununKartlari, haftaninGunleri, tamamMetni } from '@/mantik/ajanda';
import { kalanlar } from '@/mantik/kalanlar';
import { gecerliGunMu, gunEkle, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, isaretle, kartiBirak, kartlariBuguneAl, tumKartlar, type KartOzeti } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Ajandam() {
  const bugunGun = useBugun();
  const { kapi } = useVeri();
  const [secili, setSecili] = useState<Gun>(bugunGun);
  const form = useKartFormu();
  const kisaMesaj = useKisaMesaj();

  // Giriş'teki "Geçmişten kalan N iş ›" ajandayı bugünün Gün görünümünde açar.
  const { gun: istenenGun, an } = useLocalSearchParams<{ gun?: string; an?: string }>();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dışarıdan gelen gezinme isteği
    if (istenenGun && gecerliGunMu(istenenGun)) setSecili(istenenGun);
  }, [istenenGun, an]);

  const veri = useSorgu(
    ['kart'],
    async (oku) => ({ kartlar: await tumKartlar(oku), yapilanlar: await gunYapilanlari(oku, secili) }),
    [secili],
  );

  const hafta = useMemo(() => haftaninGunleri(secili), [secili]);
  const kartlar = veri.veri?.kartlar;
  const gununKartlariListesi = useMemo(
    () => (kartlar ? gununKartlari(kartlar, secili, bugunGun) : []),
    [kartlar, secili, bugunGun],
  );
  const sayilar = useMemo(() => {
    const m = new Map<Gun, number>();
    if (kartlar) for (const g of hafta) m.set(g, gununKartlari(kartlar, g, bugunGun).length);
    return m;
  }, [kartlar, hafta, bugunGun]);
  const yapilanlar = veri.veri?.yapilanlar ?? new Set<string>();
  const yapilanSayisi = gununKartlariListesi.filter((k) => yapilanlar.has(k.id)).length;
  const kalanListesi = useMemo(
    () => (kartlar && secili === bugunGun ? kalanlar(kartlar, bugunGun) : []),
    [kartlar, secili, bugunGun],
  );

  const buguneAl = async (liste: readonly KartOzeti[]) => {
    await kartlariBuguneAl(kapi, liste, bugunGun);
    kisaMesaj(liste.length === 1 ? `Bugüne alındı: ${liste[0]!.baslik}` : `${liste.length} kart bugüne alındı`);
  };

  const kartiAc = (kart: KartOzeti) => {
    if (kart.blokSayisi > 0 || kart.kilitli) {
      router.push({ pathname: '/kart/[id]', params: { id: kart.id, gun: secili } });
    } else {
      form.ac({ tur: 'duzenle', kart, bloklar: [], gun: secili });
    }
  };

  return (
    <EkranKabi baslik="Ajandam">
      <GunGezinme
        gun={secili}
        bugunGun={bugunGun}
        onOnceki={() => setSecili(gunEkle(secili, -1))}
        onSonraki={() => setSecili(gunEkle(secili, 1))}
        onBugun={() => setSecili(bugunGun)}
      />
      <HaftaSeridi gunler={hafta} secili={secili} bugunGun={bugunGun} sayilar={sayilar} onSec={setSecili} />

      {!veri.yukleniyor && (
        <>
          <Kalanlar
            liste={kalanListesi}
            bugunGun={bugunGun}
            onBuguneAl={(liste) => void buguneAl(liste as KartOzeti[])}
            onBirak={(k) => void kartiBirak(kapi, k.id)}
          />
          <Yazi tur="ikincil">{tamamMetni(yapilanSayisi, gununKartlariListesi.length)}</Yazi>
          {gununKartlariListesi.length === 0 ? (
            <View style={stiller.bos}>
              <Yazi tur="ikincil">{bosGunMetni(secili, bugunGun)}</Yazi>
            </View>
          ) : (
            <View style={stiller.liste}>
              {gununKartlariListesi.map((kart) => (
                <KartSatiri
                  key={kart.id}
                  kart={kart}
                  yapildi={yapilanlar.has(kart.id)}
                  onIsaretle={() => void isaretle(kapi, kart.id, secili, !yapilanlar.has(kart.id))}
                  onAc={() => kartiAc(kart)}
                />
              ))}
            </View>
          )}
        </>
      )}

      <Dugme tur="vurgu" etiket="+ Kart ekle" onPress={() => form.ac({ tur: 'yeni', gun: secili })} />
      {form.oge}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  liste: { gap: 12 },
  bos: { paddingVertical: 16, alignItems: 'center' },
});
