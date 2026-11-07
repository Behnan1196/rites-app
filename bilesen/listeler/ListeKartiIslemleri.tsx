// Listeler'deki listenin (P-110: maddeleri kart olan kart) ⋯ işlemleri: başkalarıyla paylaş
// (maddeler yazı olarak ortak listeye gider, liste telefondan silinir) ve listeyi sil.

import { router } from 'expo-router';

import type { Kart } from '@/mantik/kart';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { rutinCesidi, rutindenListeCesidi } from '@/mantik/rutinAdimlari';
import type { Gun } from '@/mantik/tarih';
import { maddeDegistir, maddeEkle } from '@/sunucu/listeler';
import { useOturum } from '@/sunucu/oturum';
import { listeKartiSil, listeMaddeleri } from '@/veri/listeKartlari';
import { useVeri } from '@/veri/VeriSaglayici';

import { useGruplar } from '../gruplar/useGruplar';
import { useKisiler } from '../gruplar/useKisiler';
import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu } from '../OnayKutusu';
import { ListeFormu } from './ListeFormu';

/** "Başkalarıyla paylaş": yalnız açıkken bağlanır (gruplar, kişiler). */
export function ListeyiPaylas({
  kart,
  gun,
  onKapat,
}: {
  kart: Pick<Kart, 'id' | 'baslik' | 'rutin'>;
  gun: Gun;
  onKapat: () => void;
}) {
  const { kapi, oku } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const oturum = useOturum();
  const ben = oturum.durum === 'var' ? oturum.id : null;
  const { kisiler } = useKisiler(oturum);
  const { gruplar } = useGruplar(oturum);

  const tasi = async (ortakId: string) => {
    onKapat();
    if (!ben) return;
    try {
      for (const m of await listeMaddeleri(oku, kart, gun)) {
        const yeni = await maddeEkle(ortakId, ben, m.metin);
        if (m.yapildi || m.tarih)
          await maddeDegistir(yeni.id, { yapildi: m.yapildi, yapildi_gun: m.yapildiGun, tarih: m.tarih });
      }
      await listeKartiSil(kapi, kart.id);
      router.replace({ pathname: '/giris/liste/[id]', params: { id: ortakId } });
    } catch (e) {
      console.warn(e);
      kisaMesaj(`${BAGLANAMIYOR} Liste telefonda da duruyor.`);
    }
  };

  return (
    <ListeFormu
      onKapat={onKapat}
      gruplar={gruplar}
      kisiler={kisiler}
      baslangicAdi={kart.baslik}
      cesit={rutindenListeCesidi(rutinCesidi(kart))}
      onKaydedildi={(ortakId) => void tasi(ortakId)}
    />
  );
}

/** "Listeyi sil" onayı (maddeleriyle). */
export function ListeyiSilSorusu({ kart, onKapat }: { kart: Pick<Kart, 'id' | 'baslik'>; onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  return (
    <Katman>
      <OnayKutusu
        baslik={`${kart.baslik} listesi silinsin mi?`}
        aciklama="Listedeki maddeler de silinir."
        secenekler={[
          {
            etiket: 'Listeyi sil',
            tur: 'tehlike',
            onPress: () => {
              onKapat();
              void listeKartiSil(kapi, kart.id)
                .then(() => {
                  kisaMesaj(`Silindi: ${kart.baslik}`);
                  router.back();
                })
                .catch((e: unknown) => {
                  console.warn(e);
                  kisaMesaj('Kaydedilemedi. Yeniden dene.');
                });
            },
          },
          { etiket: 'Vazgeç', tur: 'yazi', onPress: onKapat },
        ]}
      />
    </Katman>
  );
}
