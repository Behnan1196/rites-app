// Notlar ekranı (N-1, N-3): bütün notlar, sürükleyerek sıralama, not sayfası;
// sağdaki iğne notu Giriş'te gösterir (pilot 21 Ekim). P-106: üstte yeni not yazılır.

import { useState } from 'react';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { MaddeEkle } from '@/bilesen/kart/SatirIci';
import { useNotSayfasi } from '@/bilesen/not/NotSayfasi';
import { SiraliNotlar } from '@/bilesen/not/SiraliNotlar';
import { Yazi } from '@/bilesen/Yazi';
import { useSorgu } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { notEkle, notIgnele, notlariOku, notlariSirala } from '@/veri/notlar';
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
      altBaslik="Aklına gelenler. Üstteki kutuya yaz, Enter'a bas. Bir nota dokun: düzenle, sil ya da ajandana al. İğnelediğin notlar Giriş'te görünür. Sırasını değiştirmek için uzun basıp sürükle."
      kaydirilabilir={!surukleniyor}
    >
      {/* P-106: Notlar'dan da not yazılır; yeni not en üste gelir. */}
      <MaddeEkle
        yer="+ Not yaz ve Enter'a bas"
        etiket="Yeni not"
        onEkle={(metin) =>
          void notEkle(kapi, { id: yeniKimlik(), metin }).catch(() => kisaMesaj('Kaydedilemedi. Yeniden dene.'))
        }
      />
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
