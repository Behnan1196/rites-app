// Giriş → Ölçümlerim (pilot 5 Kasım, P-91): kişinin tek ölçüm defteri. Üstte gün seçimi
// (‹ Bugün ›; geçmiş günler sonradan girilir), altında o günün ölçümleri (Sayarak, Sayı, Puan;
// haftalık olan yalnız kendi gününde), en altta "+ Ölçüm" · "Gidişat" · "Düzenle". Kart
// varsayılan olarak ajandada görünmez (kartın ⋯ → Ajandada göster). Program değerlendirmesi
// yalnız buradaki ölçümlere bakar.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ParcaTaslagi } from '@/mantik/blokTaslak';
import { bosKayit, type Kayit } from '@/mantik/kart';
import { COKLU_PARCALAR, olcumGunuMu } from '@/mantik/olcumHazirlari';
import { goreliTarih, gunEkle, haftaGunu, type Gun } from '@/mantik/tarih';
import { useSorgu } from '@/veri/kancalar';
import { blokEkle, blokYaz, kartKayitlari, kayitDegistir, olcumlerimiKur, olcumlerimiOku } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { BlokUygulama, OlcumSadeBaglami } from '../kart/BlokUygulama';
import { OlcumSecici } from '../kart/OlcumSecici';
import { ParcaAyarSayfasi } from '../kart/ParcaAyarSayfasi';
import { useKisaMesaj } from '../KisaMesaj';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { kutuRengi, KutuSimgesi } from './KutuSimgesi';

/** Ölçümlerim ekranının içeriği (P-92: Giriş'te yalnız küçük kutu; dokununca bu ekran). */
export function OlcumlerimIcerigi() {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [gun, setGun] = useState<Gun | null>(null);
  const [secici, setSecici] = useState(false);
  const [ayar, setAyar] = useState<ParcaTaslagi | null>(null);
  const secilen = gun && gun <= bugunGun ? gun : bugunGun;
  const veri = useSorgu(
    ['kart'],
    async (o) => {
      const a = await olcumlerimiOku(o);
      return a ? { ...a, kayitlar: await kartKayitlari(o, a.kart.id) } : null;
    },
    [],
  );
  if (veri.yukleniyor) return null;
  const hata = (e: unknown) => {
    console.error('Kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const kur = async () => {
    try {
      await olcumlerimiKur(kapi, oku, bugunGun, yeniKimlik);
      setSecici(true);
    } catch (e) {
      hata(e);
    }
  };

  const v = veri.veri;
  const kayit: Kayit = (v && v.kayitlar.find((k) => k.tarih === secilen)) ?? bosKayit(v?.kart.id ?? '', secilen);
  const hg = haftaGunu(secilen);
  const olcumler = (v?.bloklar ?? []).filter(
    (b) => COKLU_PARCALAR.includes(b.tur) && olcumGunuMu(b, hg, (kayit.degerler[b.id] ?? '') !== ''),
  );
  const gizli = (v?.bloklar.filter((b) => COKLU_PARCALAR.includes(b.tur)).length ?? 0) - olcumler.length;

  return (
    <OlcumSadeBaglami.Provider value>
      <View style={stiller.icerik}>
        {!v ? (
          <>
            <Yazi tur="ikincil">
              Su, kahve, enerji, uyku gibi ölçümlerini her gün buraya gir; gidişatı ve programlarının etkisini gör.
            </Yazi>
            <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Ölçümlerimi kur" onPress={() => void kur()} />
          </>
        ) : (
          <>
            {/* Gün seçimi: geçmiş günler sonradan girilir; yarın yok. */}
            <View style={stiller.gunSatiri}>
              <Pressable
                onPress={() => setGun(gunEkle(secilen, -1))}
                accessibilityRole="button"
                accessibilityLabel="Önceki gün"
                hitSlop={6}
                style={stiller.ok}
              >
                <Ionicons name="chevron-back" size={22} color={renk.ana} />
              </Pressable>
              {/* P-93: ajandadaki gibi: gün adı ve yanında "bugüne dön" simgesi. */}
              <View style={stiller.gunAdi}>
                <Yazi kalinlik="kalin" accessibilityRole="header">
                  {goreliTarih(secilen, bugunGun)}
                </Yazi>
                {secilen !== bugunGun && (
                  <Pressable
                    onPress={() => setGun(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Bugüne dön"
                    hitSlop={8}
                    style={({ pressed }) => [stiller.bugune, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="arrow-undo" size={18} color={renk.ana} />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => setGun(gunEkle(secilen, 1))}
                disabled={secilen >= bugunGun}
                accessibilityRole="button"
                accessibilityLabel="Sonraki gün"
                hitSlop={6}
                style={[stiller.ok, secilen >= bugunGun && { opacity: 0.3 }]}
              >
                <Ionicons name="chevron-forward" size={22} color={renk.ana} />
              </Pressable>
            </View>

            {olcumler.length === 0 && (
              <Yazi tur="ikincil">
                {gizli > 0 ? 'Bu gün girilecek ölçüm yok (haftalık ölçümler kendi gününde).' : 'Henüz ölçüm yok.'}
              </Yazi>
            )}
            {olcumler.map((b, i) => (
              <Pressable
                key={`${b.id}-${secilen}`}
                onLongPress={() => setAyar(b)}
                accessible={false}
                style={[stiller.olcum, i > 0 && stiller.cizgili]}
              >
                <BlokUygulama
                  blok={b}
                  gun={secilen}
                  kayit={kayit}
                  kayitlar={v.kayitlar}
                  onKayit={(degistir) => void kayitDegistir(kapi, v.kart.id, secilen, degistir).catch(hata)}
                />
              </Pressable>
            ))}

            <View style={stiller.alt}>
              <Pressable
                onPress={() => setSecici(true)}
                accessibilityRole="button"
                accessibilityLabel="Ölçüm ekle"
                hitSlop={6}
                style={({ pressed }) => [stiller.altDugme, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="add" size={20} color={renk.ana} />
                <Yazi kalinlik="kalin" renk={renk.ana}>
                  Ölçüm
                </Yazi>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/kart/gidisat/[id]', params: { id: v.kart.id, geri: 'Ölçümlerim' } })
                }
                accessibilityRole="button"
                accessibilityLabel="Gidişat"
                hitSlop={6}
                style={({ pressed }) => [stiller.altDugme, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="stats-chart-outline" size={18} color={renk.ana} />
                <Yazi kalinlik="kalin" renk={renk.ana}>
                  Gidişat
                </Yazi>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/kart/[id]',
                    params: { id: v.kart.id, gun: secilen, geri: 'Ölçümlerim', olcumlerimden: '1' },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Ölçümleri düzenle: sıra, sıklık, ajandada göster"
                hitSlop={6}
                style={({ pressed }) => [stiller.altDugme, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="create-outline" size={18} color={renk.ana} />
                <Yazi kalinlik="kalin" renk={renk.ana}>
                  Düzenle
                </Yazi>
              </Pressable>
            </View>
          </>
        )}

        <OlcumSecici
          gorunur={secici}
          mevcut={v?.bloklar ?? []}
          onKapat={() => setSecici(false)}
          onHazir={(h) => {
            setSecici(false);
            void olcumlerimiKur(kapi, oku, bugunGun, yeniKimlik)
              .then((id) =>
                blokEkle(kapi, id, { id: yeniKimlik(), tur: h.tur, ad: h.ad, birim: h.birim, dakika: h.hedef }),
              )
              .catch(hata);
          }}
          onTur={(tur) => {
            setSecici(false);
            setAyar({ id: '', tur, ad: '', metin: '', birim: '', dakika: null, maddeler: [], dosya: null });
          }}
        />
        {ayar && (
          <ParcaAyarSayfasi
            blok={ayar}
            yeni={ayar.id === ''}
            cokGunlu
            siklik
            onKaydet={(t) => {
              void olcumlerimiKur(kapi, oku, bugunGun, yeniKimlik)
                .then(async (kartId) => {
                  const { id, ...alanlar } = t;
                  if (id === '') await blokEkle(kapi, kartId, { ...alanlar, id: yeniKimlik() });
                  else await blokYaz(kapi, t);
                })
                .catch(hata);
            }}
            onKapat={() => setAyar(null)}
          />
        )}
      </View>
    </OlcumSadeBaglami.Provider>
  );
}

/**
 * P-92: Giriş'te yarım kutu: "Ölçümlerim", bugün girilen / bugünkü ölçüm sayısı. Dokununca
 * Ölçümlerim ekranı (gün seçimi ve ölçümler).
 */
export function OlcumlerimKutusu() {
  const bugunGun = useBugun();
  const veri = useSorgu(
    ['kart'],
    async (o) => {
      const a = await olcumlerimiOku(o);
      return a ? { ...a, kayitlar: await kartKayitlari(o, a.kart.id) } : null;
    },
    [],
  );
  const v = veri.veri;
  let alt = 'Su, kahve, enerji, uyku…';
  if (v) {
    const kayit = v.kayitlar.find((k) => k.tarih === bugunGun);
    const hg = haftaGunu(bugunGun);
    const bugunku = v.bloklar.filter((b) => COKLU_PARCALAR.includes(b.tur) && olcumGunuMu(b, hg));
    const girilen = bugunku.filter((b) => (kayit?.degerler[b.id] ?? '') !== '').length;
    alt = bugunku.length ? `Bugün ${girilen}/${bugunku.length}` : 'Bugün ölçüm yok';
  }
  return (
    <Pressable
      onPress={() => router.push('/giris/olcumlerim')}
      accessibilityRole="button"
      accessibilityLabel={`Ölçümlerim, ${alt}`}
      style={({ pressed }) => [stiller.kutu, pressed && { opacity: 0.75 }]}
    >
      <View style={[stiller.simge, { backgroundColor: kutuRengi('olcum').zemin }]}>
        <KutuSimgesi k="olcum" boyut={22} />
      </View>
      <Yazi tur="kartBasligi">Ölçümlerim</Yazi>
      <Yazi tur="ikincil">{alt}</Yazi>
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  icerik: { gap: 8 },
  simge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  kutu: {
    flex: 1,
    minHeight: 120,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 8,
  },
  baslik: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  esnek: { flex: 1 },
  gunSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renk.bolumluZemin,
    borderRadius: olcu.kose.kart,
    minHeight: 48,
  },
  ok: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  gunAdi: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48 },
  bugune: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  olcum: { paddingVertical: 6 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi, paddingTop: 10 },
  alt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
    paddingTop: 8,
  },
  altDugme: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 4 },
});
