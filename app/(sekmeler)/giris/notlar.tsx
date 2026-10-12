// Notlar ekranı (N-1, N-3): bütün notlar, sürükleyerek sıralama, not sayfası.

import { useState } from 'react';

import { EkranKabi } from '@/bilesen/EkranKabi';
import { useNotSayfasi } from '@/bilesen/not/NotSayfasi';
import { SiraliNotlar } from '@/bilesen/not/SiraliNotlar';
import { Yazi } from '@/bilesen/Yazi';
import { useSorgu } from '@/veri/kancalar';
import { notlariOku, notlariSirala } from '@/veri/notlar';
import { useVeri } from '@/veri/VeriSaglayici';

export default function Notlar() {
  const { kapi } = useVeri();
  const notlar = useSorgu(['not'], notlariOku);
  const notSayfasi = useNotSayfasi();
  const [surukleniyor, setSurukleniyor] = useState(false);

  return (
    <EkranKabi
      geri="Giriş"
      baslik="Notlar"
      altBaslik="Aklına gelenler. Bir nota dokun: düzenle, sil ya da ajandana al. Sırasını değiştirmek için tutup sürükle."
      kaydirilabilir={!surukleniyor}
    >
      {notlar.veri && notlar.veri.length === 0 && <Yazi tur="ikincil">Henüz not yok.</Yazi>}
      {notlar.veri && notlar.veri.length > 0 && (
        <SiraliNotlar
          notlar={notlar.veri}
          onAc={notSayfasi.ac}
          onSira={(kimlikler) => void notlariSirala(kapi, kimlikler)}
          onSurukleme={setSurukleniyor}
        />
      )}
      {notSayfasi.oge}
    </EkranKabi>
  );
}
