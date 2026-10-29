// Listeyi paylaş (P-60): kişisel liste "Paylaş" denince bu formla gruplara ve / veya
// kişilere (yalnız bağlı olanlar) açılır; paylaşılan listede "Paylaşımı düzenle" (ad,
// gruplar, kişiler). Gruba açık listeyi gruba sonradan katılan da görür. Kimseyle
// paylaşmamak için formda herkes kaldırılmaz; liste ekranında "Paylaşmayı bırak".

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { bagliKisiler, type Grup } from '@/mantik/gruplar';
import { BAGLANAMIYOR, type Kisi } from '@/mantik/kisiler';
import { GRUP_SECIM_NOTU, listeFormuHatasi, listeHatasi, paylasimHatasi, type OrtakListe } from '@/mantik/listeler';
import { listeDuzenle, listeOlustur } from '@/sunucu/listeler';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

function degistir(s: ReadonlySet<string>, id: string): Set<string> {
  const y = new Set(s);
  if (y.has(id)) y.delete(id);
  else y.add(id);
  return y;
}

export function ListeFormu({
  onKapat,
  gruplar,
  kisiler,
  mevcut,
  onKaydedildi,
  baslangicAdi,
}: {
  onKapat: () => void;
  /** Üyesi olduğum gruplar. */
  gruplar: readonly Grup[];
  kisiler: readonly Kisi[];
  /** Düzenlenen liste; yoksa yeni liste. */
  mevcut?: OrtakListe;
  onKaydedildi: (id: string) => void;
  /** Paylaşılan kişisel listenin adı (P-58). */
  baslangicAdi?: string;
}) {
  const kisaMesaj = useKisaMesaj();
  const [ad, setAd] = useState(mevcut?.ad ?? baslangicAdi ?? '');
  const [secGrup, setSecGrup] = useState<ReadonlySet<string>>(new Set(mevcut ? mevcut.gruplar.map((g) => g.id) : []));
  const [secKisi, setSecKisi] = useState<ReadonlySet<string>>(new Set(mevcut?.kisiler));
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const bagli = bagliKisiler(kisiler);
  // Düzenlerken: listede olup artık bağlı olmayan kişi de seçili görünür (çıkarılabilsin).
  const eskiler = (mevcut?.kisiler ?? [])
    .filter((id) => !bagli.some((k) => k.kullaniciId === id))
    .map((id) => ({ id, ad: mevcut?.uyeler.find((u) => u.id === id)?.ad || 'Eski kişi' }));
  const kisiSecenekleri = [...bagli.map((k) => ({ id: k.kullaniciId, ad: k.ad })), ...eskiler];

  const degisti = mevcut
    ? ad.trim() !== mevcut.ad ||
      secGrup.size !== mevcut.gruplar.length ||
      mevcut.gruplar.some((g) => !secGrup.has(g.id)) ||
      secKisi.size !== mevcut.kisiler.length ||
      mevcut.kisiler.some((k) => !secKisi.has(k))
    : secGrup.size > 0 || secKisi.size > 0;

  const kaydet = async () => {
    const h = listeFormuHatasi(ad) ?? paylasimHatasi(secGrup.size + secKisi.size, !!mevcut);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      if (mevcut) {
        await listeDuzenle(mevcut.id, ad, [...secGrup], [...secKisi]);
        kisaMesaj('Liste kaydedildi');
        onKaydedildi(mevcut.id);
      } else {
        const id = await listeOlustur(ad, [...secGrup], [...secKisi]);
        kisaMesaj(`Paylaşıldı: ${ad.trim()}`);
        onKaydedildi(id);
      }
      onKapat();
    } catch (e) {
      setHata(listeHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={mevcut ? 'Paylaşımı düzenle' : 'Paylaş'}
      solVazgec
      degisti={degisti}
      altAlan={<Dugme etiket={mevcut ? 'Kaydet' : 'Paylaş'} onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      <View style={stiller.kap}>
        {mevcut ? (
          <GirisAlani
            etiket="Listenin adı"
            value={ad}
            onChangeText={(t) => {
              setAd(t);
              setHata(null);
            }}
            hata={hata}
            returnKeyType="done"
          />
        ) : (
          <>
            <Yazi tur="kartBasligi">{ad}</Yazi>
            <Yazi tur="ikincil">
              Bir ya da birkaç grup, istersen kişiler seç. Seçtiklerin listeyi görür ve ekleyebilir.
            </Yazi>
            {!!hata && (
              <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
                {hata}
              </Yazi>
            )}
          </>
        )}
        <Bolum>
          <Yazi kalinlik="kalin">Gruplar</Yazi>
          <Yazi tur="ikincil">{GRUP_SECIM_NOTU}</Yazi>
          {gruplar.length === 0 ? (
            <Yazi tur="ikincil">Henüz bir grubun yok. Grupları Gruplar sekmesinde kurabilirsin.</Yazi>
          ) : (
            <View style={stiller.cipler}>
              {gruplar.map((g) => (
                <SecenekHapi
                  key={g.id}
                  etiket={`${g.ad} (${g.uyeler.filter((u) => u.durum === 'uye').length})`}
                  erisimEtiketi={g.ad}
                  secili={secGrup.has(g.id)}
                  onPress={() => {
                    setSecGrup((s) => degistir(s, g.id));
                    setHata(null);
                  }}
                />
              ))}
            </View>
          )}
        </Bolum>
        {/* P-60: liste bir gruba ya da kişilere açılabilir. */}
        <Bolum>
          <Yazi kalinlik="kalin">Kişiler</Yazi>
          {kisiSecenekleri.length === 0 ? (
            <Yazi tur="ikincil">{"Kişilerim'de henüz bağlı olduğun kimse yok."}</Yazi>
          ) : (
            <View style={stiller.cipler}>
              {kisiSecenekleri.map((k) => (
                <SecenekHapi
                  key={k.id}
                  etiket={k.ad}
                  secili={secKisi.has(k.id)}
                  onPress={() => {
                    setSecKisi((s) => degistir(s, k.id));
                    setHata(null);
                  }}
                />
              ))}
            </View>
          )}
        </Bolum>
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
