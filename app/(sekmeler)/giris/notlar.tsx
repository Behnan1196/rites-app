// Notlar ekranı (N-1, N-3): bütün notlar, sürükleyerek sıralama, not sayfası;
// sağdaki iğne notu Giriş'te gösterir (pilot 21 Ekim).

import { useState } from 'react';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { useNotSayfasi } from '@/bilesen/not/NotSayfasi';
import { SiraliNotlar } from '@/bilesen/not/SiraliNotlar';
import { Yazi } from '@/bilesen/Yazi';
import { useSorgu } from '@/veri/kancalar';
import { notIgnele, notlariOku, notlariSirala } from '@/veri/notlar';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Notlar() {
  const { kapi } = useVeri();
  const notlar = useSorgu(['not'], notlariOku);
  const notSayfasi = useNotSayfasi();
  const kisaMesaj = useKisaMesaj();
  const [surukleniyor, setSurukleniyor] = useState(false);

  return (
    <EkranKabi
      geri="Giriş"
      baslik="Notlar"
      altBaslik="Aklına gelenler. Bir nota dokun: düzenle, sil ya da ajandana al. İğnelediğin notlar Giriş'te görünür. Sırasını değiştirmek için uzun basıp sürükle."
      kaydirilabilir={!surukleniyor}
    >
      {notlar.veri && notlar.veri.length === 0 && <Yazi tur="ikincil">Henüz not yok.</Yazi>}
      {notlar.veri && notlar.veri.length > 0 && (
        <SiraliNotlar
          notlar={notlar.veri}
          onAc={notSayfasi.ac}
          onSira={(kimlikler) => void notlariSirala(kapi, kimlikler)}
          onIgne={(not, igneli) =>
            void notIgnele(kapi, not.id, igneli)
              .then(() => kisaMesaj(igneli ? "Giriş'e iğnelendi" : "Giriş'ten kaldırıldı"))
              .catch(() => kisaMesaj('Kaydedilemedi. Yeniden dene.'))
          }
          onSurukleme={setSurukleniyor}
        />
      )}
      {notSayfasi.oge}
    </EkranKabi>
  );
}
