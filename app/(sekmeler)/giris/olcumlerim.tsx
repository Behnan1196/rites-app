// Ölçümlerim ekranı (pilot 5 Kasım, P-91, P-92): Giriş'teki küçük kutudan açılır. Gün seçimi,
// o günün ölçümleri, "+ Ölçüm" · "Gidişat". P-99: kartın ⋯ menüsü burada (sağ üstte): Gidişat ·
// Ajandada göster / gösterme · Ölçümlerimi sil. Ölçümün sırası, sıklığı ve kaldırılması ölçüme
// uzun basınca açılan formda.

import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AcilirMenu } from '@/bilesen/AcilirMenu';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { OlcumlerimIcerigi } from '@/bilesen/giris/OlcumlerimKutusu';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { SimgeDugmesi } from '@/bilesen/SimgeDugmesi';
import { ajandadaMi } from '@/mantik/aliskanlik';
import { useSorgu } from '@/veri/kancalar';
import { ajandadaYaz, kartlariSil, olcumlerimiOku } from '@/veri/kartlar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Olcumlerim() {
  const { kapi } = useVeri();
  const kenar = useSafeAreaInsets();
  const kisaMesaj = useKisaMesaj();
  const [menu, setMenu] = useState(false);
  const [silSorusu, setSilSorusu] = useState(false);
  const kart = useSorgu(['kart'], async (o) => (await olcumlerimiOku(o))?.kart ?? null, []).veri ?? null;
  const hata = (e: unknown) => {
    console.error('Kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };

  return (
    <>
      <EkranKabi
        geri="Giriş"
        baslik="Ölçümlerim"
        klavyeKapatir
        baslikSag={
          kart ? (
            <SimgeDugmesi ikon="ellipsis-horizontal" etiket="Diğer işlemler" onPress={() => setMenu(true)} />
          ) : undefined
        }
      >
        <OlcumlerimIcerigi />
      </EkranKabi>
      {menu && kart && (
        <AcilirMenu
          ust={kenar.top + 52}
          onKapat={() => setMenu(false)}
          ogeler={[
            {
              etiket: 'Gidişat',
              ikon: 'stats-chart-outline',
              onPress: () =>
                router.push({ pathname: '/kart/gidisat/[id]', params: { id: kart.id, geri: 'Ölçümlerim' } }),
            },
            {
              etiket: ajandadaMi(kart) ? 'Ajandada gösterme' : 'Ajandada göster',
              ikon: 'calendar-outline',
              onPress: () =>
                void ajandadaYaz(kapi, kart.id, !ajandadaMi(kart))
                  .then(() => kisaMesaj(ajandadaMi(kart) ? 'Ajandada görünmez' : 'Ajandada da görünür'))
                  .catch(hata),
            },
            { etiket: 'Ölçümlerimi sil', ikon: 'trash-outline', tehlike: true, onPress: () => setSilSorusu(true) },
          ]}
        />
      )}
      {silSorusu && kart && (
        <Katman>
          <OnayKutusu
            baslik="Ölçümlerim silinsin mi?"
            aciklama="Bütün ölçümler ve girdiğin değerler silinir; gidişat da kalmaz."
            secenekler={[
              {
                etiket: 'Sil',
                tur: 'tehlike',
                onPress: () => {
                  setSilSorusu(false);
                  void kartlariSil(kapi, [kart.id])
                    .then(() => kisaMesaj('Ölçümlerim silindi'))
                    .catch(hata);
                },
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
            ]}
          />
        </Katman>
      )}
    </>
  );
}
