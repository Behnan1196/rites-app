// Ortak Listeler (GR-2): her listede ad, kimlerle (gruplar + kişiler), kişi sayısı,
// kalan madde; "+ Yeni liste".

import { router } from 'expo-router';
import { useState } from 'react';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { ListeFormu } from '@/bilesen/listeler/ListeFormu';
import { OrtakListeSatiri } from '@/bilesen/listeler/OrtakListeSatiri';
import { useListeler } from '@/bilesen/listeler/useListeler';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { useOturum } from '@/sunucu/oturum';

export default function OrtakListeler() {
  const oturum = useOturum();
  const { ben, listeler, ad, yukleniyor, baglanamiyor, yenile } = useListeler(oturum);
  // Kişilerim sunucuyla eşleşsin (Yeni liste / düzenle formundaki kişiler için).
  const { kisiler } = useKisiler(oturum);
  const { gruplar } = useGruplar(oturum);
  const [yeni, setYeni] = useState(0);

  return (
    <EkranKabi
      geri="Giriş"
      baslik="Ortak Listeler"
      altBaslik="Kişilerinle ya da gruplarınla birlikte tuttuğun listeler."
    >
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli
            oturum={oturum}
            aciklama="Kişilerinle ortak listeler tutmak için e-postanla devam et. Ajandan ve notların yine yalnız bu telefonda kalır."
          />
        )
      ) : (
        <>
          {baglanamiyor && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}
          {!yukleniyor && !baglanamiyor && listeler.length === 0 && <Yazi tur="ikincil">Henüz ortak listen yok.</Yazi>}
          {listeler.map((l) => (
            <OrtakListeSatiri
              key={l.id}
              liste={l}
              ben={ben}
              ad={ad}
              onPress={() => router.push({ pathname: '/giris/liste/[id]', params: { id: l.id } })}
            />
          ))}
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Yeni liste" onPress={() => setYeni((n) => n + 1)} />
        </>
      )}

      {yeni > 0 && (
        <ListeFormu
          key={yeni}
          onKapat={() => setYeni(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          onKaydedildi={(id) => {
            void yenile();
            router.push({ pathname: '/giris/liste/[id]', params: { id } });
          }}
        />
      )}
    </EkranKabi>
  );
}
