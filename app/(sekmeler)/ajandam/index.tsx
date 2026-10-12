// Ajandam · Gün görünümü (A-1, A-2, A-2b, A-8). Hafta, takvim, arama ve süzme 5. görevde.

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { KartSatiri } from '@/bilesen/ajanda/KartSatiri';
import { GunGezinme, HaftaSeridi } from '@/bilesen/ajanda/GunGezinme';
import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { Yazi } from '@/bilesen/Yazi';
import { bosGunMetni, gununKartlari, haftaninGunleri, tamamMetni } from '@/mantik/ajanda';
import { gunEkle, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { gunYapilanlari, isaretle, tumKartlar, type KartOzeti } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Ajandam() {
  const bugunGun = useBugun();
  const { kapi } = useVeri();
  const [secili, setSecili] = useState<Gun>(bugunGun);
  const form = useKartFormu();

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
