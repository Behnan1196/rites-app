// Koçum (pilot 19 Kasım, P-133, P-134): koçun ya da diyetisyenin programı, beslenme planı; ileride
// mesajlar ve check-in (`docs/danisan-uygulamasi.md`). Koç bağı (davet kodu, sunucu, koç paneli)
// henüz yok: koçsuz kişiye ne geleceği anlatılır ve "Örnek koçla dene" ile örnek paket kurulur
// (`mantik/kocPaketi`): 4 haftalık antrenman (Pzt · Çar · Cum) ve beslenme planı. Örnek kaldırılır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { BeslenmeParcasi } from '@/bilesen/kart/BeslenmeParcasi';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { SecenekHapi } from '@/bilesen/Secim';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { gorunurMu } from '@/mantik/gorunurluk';
import { bosKayit } from '@/mantik/kart';
import { ORNEK_PAKET, type KocBilgisi } from '@/mantik/kocPaketi';
import { gunEkle, gunKisa, haftaGunu, kisaTarih, type Gun } from '@/mantik/tarih';
import { useAyar, useSorgu } from '@/veri/kancalar';
import { kartAyrinti, kartKayitlari, kayitDegistir, gunYapilanlari } from '@/veri/kartlar';
import { yeniKimlik } from '@/veri/kimlik';
import { kocKartKimlikleri, ornegiKaldir, paketiKur } from '@/veri/kocPaketi';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

const GELECEKLER: { ikon: ComponentProps<typeof Ionicons>['name']; metin: string }[] = [
  { ikon: 'barbell-outline', metin: 'Koçunun hazırladığı antrenmanlar kendi günlerinde ajandana gelir.' },
  { ikon: 'restaurant-outline', metin: 'Diyetisyeninin öğün planı ve tarifleri burada durur.' },
  { ikon: 'chatbubbles-outline', metin: 'Koçunla yazışır, sesli mesaj ve görüntülü görüşme bağlantısı gönderirsin.' },
  { ikon: 'checkbox-outline', metin: 'Haftalık check-in sorularını buradan cevaplarsın.' },
];

export default function Kocum() {
  const koc = useAyar('koc');
  if (koc.yukleniyor) return <EkranKabi baslik="Koçum" />;
  return koc.veri ? <KocluEkran koc={koc.veri} /> : <KocsuzEkran />;
}

function KocsuzEkran() {
  const { kapi } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [kuruluyor, setKuruluyor] = useState(false);
  const ornek = () => {
    setKuruluyor(true);
    void paketiKur(kapi, ORNEK_PAKET, bugunGun, yeniKimlik)
      .then(() => kisaMesaj('Örnek koç ve diyetisyen eklendi.'))
      .catch((e: unknown) => {
        console.error('Örnek kurulamadı', e);
        kisaMesaj('Kurulamadı. Yeniden dene.');
      })
      .finally(() => setKuruluyor(false));
  };
  return (
    <EkranKabi baslik="Koçum">
      <View style={stiller.kutu}>
        <View style={stiller.simge}>
          <Ionicons name="person-add-outline" size={28} color={renk.ana} />
        </View>
        <Yazi tur="bolumBasligi">Koçunla ya da diyetisyeninle bağlan</Yazi>
        <Yazi tur="ikincil">
          {
            "Yakında: koçun ya da diyetisyenin Rites'ı kullanmaya başlayınca sana bir davet kodu verecek. Kodu buraya yazınca bağlanırsınız; neyin ona gideceğini sen seçersin."
          }
        </Yazi>
        {GELECEKLER.map((g) => (
          <View key={g.metin} style={stiller.satir}>
            <Ionicons name={g.ikon} size={22} color={renk.ana} />
            <Yazi style={stiller.esnek}>{g.metin}</Yazi>
          </View>
        ))}
      </View>

      <View style={stiller.kutu}>
        <Yazi tur="kartBasligi">Nasıl olacağını gör</Yazi>
        <Yazi tur="ikincil">
          Örnek bir fitness koçu ve diyetisyen eklenir: 4 haftalık antrenman (Pzt · Çar · Cum) ve beslenme planı
          ajandana düşer. İstediğin zaman kaldırırsın.
        </Yazi>
        <Dugme etiket={kuruluyor ? 'Ekleniyor…' : 'Örnek koçla dene'} pasif={kuruluyor} onPress={ornek} />
      </View>
    </EkranKabi>
  );
}

type Bolum = 'program' | 'beslenme';

function KocluEkran({ koc }: { koc: KocBilgisi }) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [bolum, setBolum] = useState<Bolum>(koc.antrenman ? 'program' : 'beslenme');
  const [kaldirSor, setKaldirSor] = useState(false);
  const haftaBasi = gunEkle(bugunGun, -haftaGunu(bugunGun));
  const [secilenGun, setSecilenGun] = useState<Gun>(bugunGun);
  const gunler = Array.from({ length: 7 }, (_, i) => gunEkle(haftaBasi, i));

  const veri = useSorgu(
    ['kart'],
    async (o) => {
      const { antrenmanlar, beslenme } = await kocKartKimlikleri(o);
      const kartlar = (await Promise.all(antrenmanlar.map((id) => kartAyrinti(o, id)))).flatMap((a) =>
        a ? [a.kart] : [],
      );
      const yapilanlar = await Promise.all(gunler.map((g) => gunYapilanlari(o, g)));
      const bes = beslenme ? await kartAyrinti(o, beslenme) : null;
      return {
        kartlar,
        yapilanlar,
        beslenme: bes ? { kart: bes.kart, bloklar: bes.bloklar, kayitlar: await kartKayitlari(o, bes.kart.id) } : null,
      };
    },
    [haftaBasi],
  );

  const kaldir = () =>
    void ornegiKaldir(kapi, oku)
      .then(() => kisaMesaj('Örnek kaldırıldı.'))
      .catch((e: unknown) => {
        console.error('Kaldırılamadı', e);
        kisaMesaj('Kaldırılamadı. Yeniden dene.');
      });

  const koclar = [koc.antrenman, koc.beslenme].filter((k): k is NonNullable<typeof k> => !!k);
  const besBlok = veri.veri?.beslenme?.bloklar.find((b) => b.tur === 'beslenme');

  return (
    <EkranKabi baslik="Koçum" altBaslik={koc.ornek ? 'Örnek: gerçek bir koç değil' : undefined}>
      {koclar.map((k) => (
        <View key={k.ad} style={stiller.koc}>
          <View style={stiller.avatar}>
            <Yazi kalinlik="kalin" renk={renk.yuzey}>
              {k.bas}
            </Yazi>
          </View>
          <View style={stiller.esnek}>
            <Yazi tur="kartBasligi">{k.ad}</Yazi>
            <Yazi tur="ikincil">{`${k.unvan} · ${k.program}`}</Yazi>
          </View>
        </View>
      ))}

      <View style={stiller.cipler} accessibilityRole="tablist">
        {koc.antrenman && (
          <SecenekHapi etiket="Program" secili={bolum === 'program'} onPress={() => setBolum('program')} />
        )}
        {koc.beslenme && (
          <SecenekHapi etiket="Beslenme" secili={bolum === 'beslenme'} onPress={() => setBolum('beslenme')} />
        )}
      </View>
      <Yazi tur="ikincil">Mesajlar ve check-in koç bağıyla gelecek.</Yazi>

      {bolum === 'program' && veri.veri && (
        <>
          <Yazi tur="kutuBasligi">BU HAFTA</Yazi>
          <View style={stiller.liste}>
            {gunler.flatMap((g, i) =>
              veri
                .veri!.kartlar.filter((k) => gorunurMu(k, g, bugunGun))
                .map((k) => {
                  const yapildi = veri.veri!.yapilanlar[i]!.has(k.id);
                  const bugun = g === bugunGun;
                  return (
                    <View key={`${k.id}-${g}`} style={[stiller.gunSatiri, bugun && stiller.bugun]}>
                      <Yazi kalinlik={bugun ? 'kalin' : 'yariKalin'} renk={renk.ikincil} style={stiller.gunAdi}>
                        {bugun ? 'Bugün' : gunKisa(g)}
                      </Yazi>
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/kart/[id]', params: { id: k.id, gun: g, geri: 'Koçum' } })
                        }
                        accessibilityRole="button"
                        style={stiller.esnek}
                      >
                        <Yazi
                          kalinlik={bugun ? 'kalin' : 'normal'}
                          renk={yapildi ? renk.ikincil : renk.yazi}
                          style={yapildi && stiller.cizik}
                        >
                          {k.baslik}
                        </Yazi>
                        <Yazi tur="ikincil">{kisaTarih(g)}</Yazi>
                      </Pressable>
                      {yapildi ? (
                        <Ionicons name="checkmark-circle" size={26} color={renk.ana} accessibilityLabel="Yapıldı" />
                      ) : (
                        <Pressable
                          onPress={() => router.push({ pathname: '/antrenman/[id]', params: { id: k.id, gun: g } })}
                          accessibilityRole="button"
                          style={({ pressed }) => [stiller.basla, pressed && { opacity: 0.7 }]}
                        >
                          <Yazi kalinlik="kalin" renk={renk.yuzey}>
                            Başla
                          </Yazi>
                        </Pressable>
                      )}
                    </View>
                  );
                }),
            )}
          </View>
          {veri.veri.kartlar.length === 0 && <Yazi tur="ikincil">Bu hafta antrenman yok.</Yazi>}
        </>
      )}

      {bolum === 'beslenme' && veri.veri?.beslenme && besBlok && (
        <>
          <View style={stiller.hafta}>
            {gunler.map((g) => {
              const secili = g === secilenGun;
              return (
                <Pressable
                  key={g}
                  onPress={() => setSecilenGun(g)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: secili }}
                  accessibilityLabel={kisaTarih(g)}
                  style={[stiller.gun, secili && stiller.gunSecili]}
                >
                  <Yazi tur="etiket" renk={secili ? renk.yuzey : renk.ikincil}>
                    {gunKisa(g)}
                  </Yazi>
                  <Yazi kalinlik="kalin" renk={secili ? renk.yuzey : renk.yazi}>
                    {g.slice(8).replace(/^0/, '')}
                  </Yazi>
                </Pressable>
              );
            })}
          </View>
          <View style={stiller.kutu}>
            {gorunurMu(veri.veri.beslenme.kart, secilenGun, bugunGun) ? (
              <BeslenmeParcasi
                blok={besBlok}
                gun={secilenGun}
                kayit={
                  veri.veri.beslenme.kayitlar.find((k) => k.tarih === secilenGun) ??
                  bosKayit(veri.veri.beslenme.kart.id, secilenGun)
                }
                onKayit={(degistir) =>
                  void kayitDegistir(kapi, veri.veri!.beslenme!.kart.id, secilenGun, degistir).catch((e: unknown) => {
                    console.error('Kaydedilemedi', e);
                    kisaMesaj('Kaydedilemedi. Yeniden dene.');
                  })
                }
              />
            ) : (
              <Yazi tur="ikincil">Plan bu günü kapsamıyor.</Yazi>
            )}
          </View>
        </>
      )}

      {koc.ornek && (
        <View style={stiller.kaldir}>
          {kaldirSor ? (
            <>
              <Yazi tur="ikincil">Örneğin bütün kartları ve kayıtları (antrenmanlar, setler, öğünler) silinir.</Yazi>
              <View style={stiller.ikili}>
                <View style={stiller.esnek}>
                  <Dugme tur="ikincil" etiket="Vazgeç" onPress={() => setKaldirSor(false)} />
                </View>
                <View style={stiller.esnek}>
                  <Dugme tur="tehlike" etiket="Kaldır" onPress={kaldir} />
                </View>
              </View>
            </>
          ) : (
            <Dugme tur="tehlike" etiket="Örneği kaldır" onPress={() => setKaldirSor(true)} />
          )}
        </View>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
  },
  simge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satir: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  esnek: { flex: 1 },
  koc: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaKoyu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cipler: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  liste: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    overflow: 'hidden',
  },
  gunSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: renk.satirCizgi,
  },
  bugun: { backgroundColor: renk.anaAcik },
  gunAdi: { width: 52 },
  cizik: { textDecorationLine: 'line-through' },
  basla: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: olcu.kose.dugme,
    backgroundColor: renk.ana,
    justifyContent: 'center',
  },
  hafta: { flexDirection: 'row', gap: 4 },
  gun: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, minHeight: 52 },
  gunSecili: { backgroundColor: renk.ana },
  kaldir: { gap: 8, marginTop: 8 },
  ikili: { flexDirection: 'row', gap: 10 },
});
