// Alışkanlıklar ve gidişat (pilot 31 Ekim, P-78): Giriş → Devam edenler → "Alışkanlıklar ›".
// Süren her alışkanlık bir kutuda: ad (dokununca kart), programı, son 4 haftanın şeridi
// (yapıldı · yapılmadı · günü değil), seri ve süreli olanda ilerleme; "Ajandada göster" anahtarı.
// Üstte "+ Alışkanlık ekle" (her gün tekrarlı, alışkanlık olarak izlenen yeni kart). Kartlardan
// kaldırılan seri gösterimi (P-73) burada.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { useAliskanliklar, type AliskanlikOzeti } from '@/bilesen/giris/useAliskanliklar';
import { useKartFormu } from '@/bilesen/kart/KartFormu';
import { useYeniKart } from '@/bilesen/kart/YeniKart';
import { useUzman } from '@/bilesen/useUzman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { AcKapa } from '@/bilesen/Secim';
import { kaynakRenk, olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { ajandadaMi, ilerleme, sonGunler } from '@/mantik/aliskanlik';
import { tekrarMetni } from '@/mantik/gorunurluk';
import { gunKisa, uzunTarih } from '@/mantik/tarih';
import { ajandadaYaz } from '@/veri/kartlar';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

const HAFTA = 4;

export default function Aliskanliklar() {
  const { yukleniyor, aliskanliklar } = useAliskanliklar();
  const bugunGun = useBugun();
  const form = useKartFormu();
  // P-117: önce ad; sonra kartın ekranı (uzmanda eski form).
  const yeni = useYeniKart();
  const uzman = useUzman();

  return (
    <>
      <EkranKabi
        geri="Giriş"
        baslik="Alışkanlıklar"
        altBaslik="Yerleştirmek istediklerin ve programlarının her gün tekrarlanan kartları."
      >
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="+ Alışkanlık ekle"
          onPress={() =>
            uzman
              ? form.ac({ tur: 'yeni', gun: bugunGun, aliskanlik: true })
              : yeni.ac({ gun: bugunGun, aliskanlik: true, geri: 'Alışkanlıklar' })
          }
        />
        {!yukleniyor && aliskanliklar.length === 0 && (
          <Yazi tur="ikincil">
            {
              'Henüz alışkanlığın yok. Her gün tekrarlanan bir kartın ⋯ menüsünden "Alışkanlık olarak izle" de diyebilirsin.'
            }
          </Yazi>
        )}
        {aliskanliklar.map((a) => (
          <AliskanlikKutusu key={a.kart.id} a={a} />
        ))}
      </EkranKabi>
      {form.oge}
      {yeni.oge}
    </>
  );
}

function AliskanlikKutusu({ a }: { a: AliskanlikOzeti }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const bugunGun = useBugun();
  const serit = sonGunler(a.kart, a.yapilan, bugunGun, HAFTA * 7);
  const yapilanSayi = serit.filter((g) => g.durum === 'yapildi').length;
  const gunSayi = serit.filter((g) => g.durum !== 'yok').length;
  const il = ilerleme(a.kart, bugunGun);
  const haftalar = Array.from({ length: HAFTA }, (_, i) => serit.slice(i * 7, i * 7 + 7));
  return (
    <View style={stiller.kutu}>
      {a.program && <View style={stiller.serit} />}
      <Pressable
        onPress={() =>
          router.push({ pathname: '/kart/[id]', params: { id: a.kart.id, gun: bugunGun, geri: 'Alışkanlıklar' } })
        }
        accessibilityRole="button"
        accessibilityLabel={`${a.kart.baslik}, aç`}
        style={({ pressed }) => [stiller.ust, pressed && { opacity: 0.75 }]}
      >
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi" numberOfLines={2}>
            {a.kart.baslik}
          </Yazi>
          <Yazi tur="etiket" numberOfLines={1}>
            {[
              a.kart.tekrar ? tekrarMetni(a.kart.tekrar) : null,
              a.program ? `Program: ${a.program.ad}` : null,
              a.liste ? `Liste: ${a.liste}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Yazi>
        </View>
        <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
      </Pressable>

      <View
        style={stiller.izgara}
        accessibilityLabel={`Son ${HAFTA} haftada ${gunSayi} günün ${yapilanSayi}'inde yaptın`}
      >
        {haftalar.map((h, i) => (
          <View key={i} style={stiller.hafta}>
            {h.map((g) => (
              <View
                key={g.gun}
                accessible
                accessibilityLabel={`${uzunTarih(g.gun)}: ${g.durum === 'yapildi' ? 'yapıldı' : g.durum === 'yok' ? 'günü değil' : 'yapılmadı'}`}
                style={[
                  stiller.hucre,
                  g.durum === 'yapildi' && stiller.hucreDolu,
                  g.durum === 'yapilmadi' && stiller.hucreBos,
                  g.gun === bugunGun && stiller.hucreBugun,
                ]}
              />
            ))}
          </View>
        ))}
        <View style={stiller.hafta}>
          {haftalar[HAFTA - 1]!.map((g) => (
            <Yazi key={g.gun} tur="etiket" style={stiller.gunAdi} maxFontSizeMultiplier={1.2}>
              {g.gun === bugunGun ? 'Bugün' : gunKisa(g.gun)}
            </Yazi>
          ))}
        </View>
      </View>

      <View style={stiller.ozet}>
        <Yazi kalinlik="kalin" renk={renk.ana}>
          {a.seri > 0 ? `${a.seri} gün üst üste` : 'Seri henüz başlamadı'}
        </Yazi>
        <Yazi tur="ikincil">
          {[`Son ${HAFTA} haftada ${yapilanSayi}/${gunSayi}`, il ? `${il.gun}/${il.toplam}. gün` : null]
            .filter(Boolean)
            .join(' · ')}
        </Yazi>
      </View>

      {/* P-110: listenin maddesi ajandada listesiyle görünür; anahtar yok. */}
      {!a.liste && (
        <View style={stiller.anahtar}>
          <View style={stiller.esnek}>
            <Yazi>Ajandada göster</Yazi>
            <Yazi tur="etiket">{ajandadaMi(a.kart) ? 'Ajandada da görünür' : 'Yalnız burada ve Giriş’te'}</Yazi>
          </View>
          <AcKapa
            acik={ajandadaMi(a.kart)}
            etiket={`${a.kart.baslik} ajandada görünsün`}
            onDegis={(acik) =>
              void ajandadaYaz(kapi, a.kart.id, acik).catch((e: unknown) => {
                console.error('Kaydedilemedi', e);
                kisaMesaj('Kaydedilemedi. Yeniden dene.');
              })
            }
          />
        </View>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
    overflow: 'hidden',
  },
  serit: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: kaynakRenk.plan.serit },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  esnek: { flex: 1, gap: 2 },
  izgara: { gap: 4 },
  hafta: { flexDirection: 'row', gap: 4 },
  hucre: { flex: 1, height: 22, borderRadius: 6, backgroundColor: renk.satirCizgi },
  hucreDolu: { backgroundColor: renk.ana },
  hucreBos: { backgroundColor: renk.yuzey, borderWidth: 1.5, borderColor: renk.cizgi },
  hucreBugun: { borderWidth: 2, borderColor: renk.anaKoyu },
  gunAdi: { flex: 1, textAlign: 'center', fontSize: 12 },
  ozet: { gap: 2 },
  anahtar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
    paddingTop: 10,
  },
});
