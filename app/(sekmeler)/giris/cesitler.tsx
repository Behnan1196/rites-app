// Kart çeşitleri tasarımı (pilot 24 Ekim, P-41): yalnız tasarımcı (Ayarlar →
// Kart çeşitleri). Çeşitler alan alan; birine dokununca kart formuyla düzenlenir,
// "Yayınla" sunucudaki kataloğa yazar ve telefonun kataloğunu hemen yeniler.
// Gizli (yayında olmayan) çeşit yalnız burada görünür.

import { useCallback, useEffect, useState } from 'react';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { katalogYenile } from '@/bilesen/KatalogGuncelleyici';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { Kutu } from '@/bilesen/kart/CesitSecici';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { CESIT_SIMGELERI, cesitGruplari } from '@/mantik/cesit';
import { gomuluKatalog, katalog } from '@/mantik/katalog';
import { cesitYaz, tasarimCesitleri, type TasarimCesidi } from '@/sunucu/cesit';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

type IonAdi = (typeof CESIT_SIMGELERI)[number];

export default function KartCesitleri() {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const form = useKartFormu();
  const [liste, setListe] = useState<TasarimCesidi[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const yukle = useCallback(
    () =>
      tasarimCesitleri().then(
        (l) => {
          setListe(l);
          setHata(null);
        },
        (e: unknown) => {
          console.warn('Kart çeşitleri okunamadı', e);
          setHata('Sunucuya bağlanılamadı. İnternetini denetleyip yeniden dene.');
        },
      ),
    [],
  );

  useEffect(() => {
    void yukle();
  }, [yukle]);

  /** Telefonun kataloğu hemen yenilenir; olmazsa en geç 6 saatte iner. */
  const katalogu = () => katalogYenile(kapi).catch((e: unknown) => console.warn('Katalog yenilenemedi', e));

  const yayinla = async (c: TasarimCesidi) => {
    await cesitYaz(c);
    await yukle();
    await katalogu();
    kisaMesaj(c.aktif ? `Yayınlandı: ${c.ad}` : `Gizli olarak kaydedildi: ${c.ad}`);
  };

  /** Sunucuda hiç çeşit yoksa uygulamayla gelenler (Beslenme) yüklenir. */
  const hazirlariYukle = async () => {
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      for (const [i, c] of gomuluKatalog().cesitler.entries())
        await cesitYaz({ ...c, aktif: true, sira: (i + 1) * 10 });
      await yukle();
      await katalogu();
      kisaMesaj('Hazır çeşitler yüklendi');
    } catch (e) {
      console.warn(e);
      kisaMesaj('Yüklenemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  const ac = (cesit: TasarimCesidi | null) =>
    form.ac({
      tur: 'cesit',
      cesit,
      bugunGun,
      yeniSira: Math.max(0, ...(liste ?? []).map((c) => c.sira)) + 10,
      onKaydet: yayinla,
    });

  return (
    <EkranKabi
      geri="Giriş"
      baslik="Kart çeşitleri"
      altBaslik={
        'Alan alan kart kalıpları. Yayınladığın çeşit herkesin "Ne tür bir kart?" listesine ve alanın ekranına iner.'
      }
    >
      {!!hata && (
        <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
          {hata}
        </Yazi>
      )}
      {liste && liste.length === 0 && (
        <>
          <Yazi tur="ikincil">
            Sunucuda henüz çeşit yok. Uygulamayla gelen Beslenme çeşitlerini yükleyerek başlayabilirsin.
          </Yazi>
          <Dugme etiket="Hazır çeşitleri yükle" onPress={() => void hazirlariYukle()} pasif={calisiyor} />
        </>
      )}
      {liste &&
        cesitGruplari(liste, katalog().alanlar).map((g) => (
          <EkranGrubu key={g.alan} ad={g.ad}>
            {g.cesitler.map((c) => (
              <Kutu
                key={c.id}
                ikon={(c.ikon as IonAdi | null) ?? 'leaf-outline'}
                ad={c.ad}
                aciklama={c.aciklama}
                sag={c.aktif ? undefined : 'Gizli'}
                onPress={() => ac(c)}
              />
            ))}
          </EkranGrubu>
        ))}
      {liste && <Dugme tur="vurgu" etiket="+ Yeni çeşit" onPress={() => ac(null)} />}
      {form.oge}
    </EkranKabi>
  );
}

function EkranGrubu({ ad, children }: { ad: string; children: React.ReactNode }) {
  return (
    <>
      <Yazi tur="bolumBasligi" accessibilityRole="header">
        {ad}
      </Yazi>
      {children}
    </>
  );
}
