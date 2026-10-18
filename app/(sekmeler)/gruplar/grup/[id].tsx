// Grup ekranı (GR-1): önce grubun içeriği (pilot 18 Ekim): yaklaşan buluşmalar,
// gruba açık listeler ve "+ Ekle" (Buluşma, Liste); sonra üyeler (kuran çıkarır),
// "Kişilerinden ekle" (kuran); kuran için "Grubu sil", üye için "Gruptan ayrıl".
// Grup ekranı bundan derin değildir (`08` karar 38).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { KisiAvatari, ListeKutusu, parcaStilleri } from '@/bilesen/gruplar/parcalar';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { BulusmaFormu } from '@/bilesen/gruplar/BulusmaFormu';
import { BulusmaKarti } from '@/bilesen/gruplar/BulusmaKarti';
import { useBulusmalar } from '@/bilesen/gruplar/Bulusmalar';
import { GrubaEkleSayfasi } from '@/bilesen/gruplar/GrubaEkleSayfasi';
import { IsFormu } from '@/bilesen/gruplar/IsFormu';
import { KararFormu } from '@/bilesen/gruplar/KararFormu';
import { KararKarti } from '@/bilesen/gruplar/KararKarti';
import { useKararlar } from '@/bilesen/gruplar/Kararlar';
import { IsKarti } from '@/bilesen/gruplar/IsKarti';
import { useIsler } from '@/bilesen/gruplar/Isler';
import { NobetFormu } from '@/bilesen/gruplar/NobetFormu';
import { NobetKarti } from '@/bilesen/gruplar/NobetKarti';
import { useNobetler } from '@/bilesen/gruplar/Nobetler';
import { RutinFormu, type RutinFormuKipi } from '@/bilesen/gruplar/RutinFormu';
import { RutinKarti } from '@/bilesen/gruplar/RutinKarti';
import { useRutinler } from '@/bilesen/gruplar/Rutinler';
import { Katman } from '@/bilesen/Katman';
import { ListeFormu } from '@/bilesen/listeler/ListeFormu';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { SecenekHapi } from '@/bilesen/Secim';
import { kaynakRenk, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { cagrilabilecekler, GRUP_LISTELERI_NOTU, grupAdi, grupHatasi, type GrupUyesi } from '@/mantik/gruplar';
import { yaklasanlar, type Bulusma } from '@/mantik/bulusma';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { grubunIsleri, type GrupIsi } from '@/mantik/isler';
import { grubunKararlari } from '@/mantik/karar';
import type { Nobet } from '@/mantik/nobet';
import type { Rutin } from '@/mantik/rutin';
import { grubaCagir, grubuSil, gruptanCikar } from '@/sunucu/gruplar';
import { useOturum } from '@/sunucu/oturum';
import { useBugun } from '@/veri/useBugun';

type Soru = { tur: 'cikar'; uye: GrupUyesi } | { tur: 'sil' } | { tur: 'ayril' } | { tur: 'rutinAyril'; rutin: Rutin };

export default function GrupEkrani() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const oturum = useOturum();
  const kisaMesaj = useKisaMesaj();
  const { ben, gruplar, kisiler, ad, yukleniyor, baglanamiyor, yenile } = useGruplar(oturum);
  const [soru, setSoru] = useState<Soru | null>(null);
  const [listeFormu, setListeFormu] = useState(0);
  const [ekleAcik, setEkleAcik] = useState(false);
  const [bulusmaFormu, setBulusmaFormu] = useState<{ n: number; mevcut?: Bulusma } | null>(null);
  const bugunGun = useBugun();
  const bulusma = useBulusmalar();
  const bulusmaYenile = bulusma.yenile;
  const rutin = useRutinler();
  const rutinYenile = rutin.yenile;
  const nobet = useNobetler();
  const nobetYenile = nobet.yenile;
  const isler = useIsler();
  const isYenile = isler.yenile;
  const karar = useKararlar();
  const kararYenile = karar.yenile;
  const [kararFormu, setKararFormu] = useState(0);
  const [isFormu, setIsFormu] = useState<{ n: number; mevcut?: GrupIsi } | null>(null);
  const isFormuAc = (mevcut?: GrupIsi) => setIsFormu((f) => ({ n: (f?.n ?? 0) + 1, mevcut }));
  const [nobetFormu, setNobetFormu] = useState<{ n: number; mevcut?: Nobet } | null>(null);
  const nobetFormuAc = (mevcut?: Nobet) => setNobetFormu((f) => ({ n: (f?.n ?? 0) + 1, mevcut }));
  const [rutinFormu, setRutinFormu] = useState<{ n: number; kip: RutinFormuKipi } | null>(null);
  const rutinFormuAc = (kip: RutinFormuKipi) => setRutinFormu((f) => ({ n: (f?.n ?? 0) + 1, kip }));
  useFocusEffect(
    useCallback(() => {
      void bulusmaYenile();
      void rutinYenile();
      void nobetYenile();
      void isYenile();
      void kararYenile();
    }, [bulusmaYenile, rutinYenile, nobetYenile, isYenile, kararYenile]),
  );
  const grup = gruplar.find((g) => g.id === id);
  const kuranBenim = !!grup && grup.kurucu === ben;

  const grubunBulusmalari = grup ? yaklasanlar(bulusma.bulusmalar, grup.id, bugunGun) : [];
  const grubunRutinleri = grup ? rutin.rutinler.filter((r) => r.grup === grup.id) : [];
  const grubunNobetleri = grup ? nobet.nobetler.filter((n) => n.grup === grup.id) : [];
  const grubunKararListesi = grup ? grubunKararlari(karar.kararlar, grup.id) : [];
  const grubunIsleriListesi = grup && ben ? grubunIsleri(isler.isler, grup.id, ben) : [];

  const dene = async (is: () => Promise<void>, mesaj: string, sonra?: () => void) => {
    setSoru(null);
    try {
      await is();
      kisaMesaj(mesaj);
      sonra?.();
    } catch (e) {
      console.warn(e);
      kisaMesaj(grupHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    }
    void yenile();
  };

  const onaySorusu = (): { baslik: string; aciklama: string; etiket: string; is: () => void } | null => {
    if (!soru || !grup || !ben) return null;
    if (soru.tur === 'cikar') {
      const kim = ad(soru.uye);
      return {
        baslik: `${kim} gruptan çıkarılsın mı?`,
        aciklama: 'Grubun listelerini artık görmez.',
        etiket: 'Çıkar',
        is: () => void dene(() => gruptanCikar(grup.id, soru.uye.id), `${kim} gruptan çıkarıldı.`),
      };
    }
    if (soru.tur === 'rutinAyril') {
      const r = soru.rutin;
      return {
        baslik: `${r.ad} rutininden ayrılmak istiyor musun?`,
        aciklama: 'Ajandandaki dizisi biter (geçmiş kayıtların kalır); grupta artık sayın görünmez.',
        etiket: 'Ayrıl',
        is: () => void dene(() => rutin.ayril(r), `${r.ad} rutininden ayrıldın.`),
      };
    }
    if (soru.tur === 'sil') {
      return {
        baslik: `${grupAdi(grup.ad)} silinsin mi?`,
        aciklama: 'Grup herkes için silinir. Bu gruba açık listeler grubun üyelerine kapanır.',
        etiket: 'Grubu sil',
        is: () =>
          void dene(
            () => grubuSil(grup.id),
            `${grupAdi(grup.ad)} silindi.`,
            () => router.back(),
          ),
      };
    }
    return {
      baslik: `${grupAdi(grup.ad)}ndan ayrılmak istiyor musun?`,
      aciklama: 'Grubun listelerini artık görmezsin. Yeniden katılmak için kuranın seni çağırması gerekir.',
      etiket: 'Gruptan ayrıl',
      is: () =>
        void dene(
          () => gruptanCikar(grup.id, ben),
          `${grupAdi(grup.ad)}ndan ayrıldın.`,
          () => router.back(),
        ),
    };
  };
  const onay = onaySorusu();

  return (
    <EkranKabi geri="Gruplar" baslik={grup?.ad ?? 'Grup'}>
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli oturum={oturum} aciklama="Gruplarını görmek için e-postanla devam et." />
        )
      ) : !grup ? (
        yukleniyor ? null : (
          <Yazi tur="ikincil" renk={baglanamiyor ? renk.hata : renk.ikincil}>
            {baglanamiyor ? BAGLANAMIYOR : 'Bu grup artık yok.'}
          </Yazi>
        )
      ) : (
        <>
          {baglanamiyor && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}
          {grubunIsleriListesi.length > 0 && (
            <>
              <Yazi tur="bolumBasligi" accessibilityRole="header">
                İşler
              </Yazi>
              {grubunIsleriListesi.map((i) => (
                <IsKarti
                  key={i.id}
                  is={i}
                  ben={ben}
                  bugunGun={bugunGun}
                  ad={(k) => ad(k)}
                  onDuzenle={() => isFormuAc(i)}
                />
              ))}
            </>
          )}

          {grubunKararListesi.length > 0 && (
            <>
              <Yazi
                tur="bolumBasligi"
                accessibilityRole="header"
                style={grubunIsleriListesi.length > 0 && stiller.bolumArasi}
              >
                Kararlar
              </Yazi>
              {grubunKararListesi.map((k) => (
                <KararKarti key={k.id} karar={k} ben={ben} bugunGun={bugunGun} ad={(x) => ad(x)} />
              ))}
            </>
          )}

          <Yazi
            tur="bolumBasligi"
            accessibilityRole="header"
            style={(grubunIsleriListesi.length > 0 || grubunKararListesi.length > 0) && stiller.bolumArasi}
          >
            Buluşmalar
          </Yazi>
          {grubunBulusmalari.length === 0 ? (
            <Yazi tur="ikincil">Yaklaşan buluşma yok. Bir gün önerince herkes geliyorum / belki / gelemem der.</Yazi>
          ) : (
            grubunBulusmalari.map((b) => (
              <BulusmaKarti
                key={b.id}
                bulusma={b}
                ben={ben}
                ad={(k) => ad(k)}
                onDuzenle={() => setBulusmaFormu((f) => ({ n: (f?.n ?? 0) + 1, mevcut: b }))}
              />
            ))
          )}
          {grubunRutinleri.length > 0 && (
            <>
              <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
                Birlikte rutinler
              </Yazi>
              {grubunRutinleri.map((r) => (
                <RutinKarti
                  key={r.id}
                  rutin={r}
                  ben={ben}
                  bugunGun={bugunGun}
                  ad={(k) => ad(k)}
                  onKatil={() => rutinFormuAc({ tur: 'katil', rutin: r })}
                  onAyril={() => setSoru({ tur: 'rutinAyril', rutin: r })}
                  onDuzenle={() => rutinFormuAc({ tur: 'duzenle', rutin: r })}
                />
              ))}
            </>
          )}

          {grubunNobetleri.length > 0 && (
            <>
              <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
                Nöbetler
              </Yazi>
              {grubunNobetleri.map((n) => (
                <NobetKarti
                  key={n.id}
                  nobet={n}
                  ben={ben}
                  bugunGun={bugunGun}
                  ad={(k) => ad(k)}
                  onDuzenle={() => nobetFormuAc(n)}
                />
              ))}
            </>
          )}

          <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
            Listeler
          </Yazi>
          {grup.listeler.length === 0 ? (
            <Yazi tur="ikincil">
              Bu grupta henüz liste yok. Yapılacaklar, hazırlık ya da market listesi açabilirsin.
            </Yazi>
          ) : (
            <>
              <ListeKutusu>
                {grup.listeler.map((l, i) => (
                  <Pressable
                    key={l.id}
                    onPress={() =>
                      router.push({ pathname: '/gruplar/liste/[id]', params: { id: l.id, geri: grup.ad } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${l.ad} listesini aç`}
                    style={({ pressed }) => [
                      parcaStilleri.satir,
                      i > 0 && parcaStilleri.cizgili,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="list-outline" size={22} color={kaynakRenk.liste.serit} />
                    <Yazi kalinlik="kalin" style={parcaStilleri.esnek}>
                      {l.ad}
                    </Yazi>
                    <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
                  </Pressable>
                ))}
              </ListeKutusu>
              <Yazi tur="ikincil">{GRUP_LISTELERI_NOTU}</Yazi>
            </>
          )}
          <Dugme tur="vurgu" etiket="+ Ekle" onPress={() => setEkleAcik(true)} />

          <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
            Üyeler
          </Yazi>
          <ListeKutusu>
            {grup.uyeler.map((u, i) => {
              const kim = ad(u);
              const not = u.id === grup.kurucu ? 'kurucu' : u.durum === 'davet' ? 'davet bekliyor' : null;
              return (
                <View key={u.id} style={[parcaStilleri.satir, i > 0 && parcaStilleri.cizgili]}>
                  <KisiAvatari ad={kim === 'Sen' ? u.ad || 'Sen' : kim} />
                  <View style={parcaStilleri.esnek}>
                    <Yazi kalinlik="kalin">{kim}</Yazi>
                    {!!not && <Yazi tur="ikincil">{not}</Yazi>}
                  </View>
                  {kuranBenim && u.id !== ben && (
                    <Dugme tur="tehlike" etiket="Çıkar" onPress={() => setSoru({ tur: 'cikar', uye: u })} />
                  )}
                </View>
              );
            })}
          </ListeKutusu>

          {kuranBenim && (
            <>
              <Yazi kalinlik="kalin">Kişilerinden ekle</Yazi>
              {cagrilabilecekler(grup, kisiler).length === 0 ? (
                <Yazi tur="ikincil">Bağlı olduğun kişilerin hepsi bu grupta.</Yazi>
              ) : (
                <View style={stiller.cipler}>
                  {cagrilabilecekler(grup, kisiler).map((k) => (
                    <SecenekHapi
                      key={k.id}
                      etiket={`+ ${k.ad}`}
                      erisimEtiketi={`${k.ad} gruba ekle`}
                      secili={false}
                      onPress={() =>
                        void dene(
                          () => grubaCagir(grup.id, k.kullaniciId),
                          `${k.ad} gruba çağrıldı; katılınca grubun listelerini de görecek.`,
                        )
                      }
                    />
                  ))}
                </View>
              )}
            </>
          )}

          <Dugme
            tur="tehlike"
            etiket={kuranBenim ? 'Grubu sil' : 'Gruptan ayrıl'}
            onPress={() => setSoru({ tur: kuranBenim ? 'sil' : 'ayril' })}
            style={stiller.bolumArasi}
          />
        </>
      )}

      {ekleAcik && grup && (
        <GrubaEkleSayfasi
          grupAdi={grup.ad}
          onKapat={() => setEkleAcik(false)}
          onSec={(tur) => {
            setEkleAcik(false);
            if (tur === 'liste') setListeFormu((n) => n + 1);
            else if (tur === 'rutin') rutinFormuAc({ tur: 'kur' });
            else if (tur === 'nobet') nobetFormuAc();
            else if (tur === 'is') isFormuAc();
            else if (tur === 'karar') setKararFormu((n) => n + 1);
            else setBulusmaFormu((f) => ({ n: (f?.n ?? 0) + 1 }));
          }}
        />
      )}
      {bulusmaFormu && grup && (
        <BulusmaFormu
          key={bulusmaFormu.n}
          grup={{ id: grup.id, ad: grup.ad }}
          mevcut={bulusmaFormu.mevcut}
          onKapat={() => setBulusmaFormu(null)}
        />
      )}
      {kararFormu > 0 && grup && (
        <KararFormu key={kararFormu} grup={{ id: grup.id, ad: grup.ad }} onKapat={() => setKararFormu(0)} />
      )}
      {isFormu && grup && (
        <IsFormu
          key={isFormu.n}
          grup={{ id: grup.id, ad: grup.ad }}
          uyeler={grup.uyeler.filter((u) => u.durum === 'uye' && u.id !== ben).map((u) => ({ id: u.id, ad: ad(u) }))}
          mevcut={isFormu.mevcut}
          onKapat={() => setIsFormu(null)}
        />
      )}
      {nobetFormu && grup && (
        <NobetFormu
          key={nobetFormu.n}
          grup={{ id: grup.id, ad: grup.ad }}
          uyeler={grup.uyeler.filter((u) => u.durum === 'uye').map((u) => ({ id: u.id, ad: ad(u) }))}
          mevcut={nobetFormu.mevcut}
          onKapat={() => setNobetFormu(null)}
        />
      )}
      {rutinFormu && grup && (
        <RutinFormu
          key={rutinFormu.n}
          grup={{ id: grup.id, ad: grup.ad }}
          kip={rutinFormu.kip}
          onKapat={() => setRutinFormu(null)}
        />
      )}
      {listeFormu > 0 && grup && (
        <ListeFormu
          key={listeFormu}
          onKapat={() => setListeFormu(0)}
          gruplar={gruplar}
          kisiler={kisiler}
          grup={grup.id}
          onKaydedildi={(lid) => {
            void yenile();
            router.push({ pathname: '/gruplar/liste/[id]', params: { id: lid, geri: grup.ad } });
          }}
        />
      )}

      {onay && (
        <Katman>
          <OnayKutusu
            baslik={onay.baslik}
            aciklama={onay.aciklama}
            secenekler={[
              { etiket: onay.etiket, tur: 'tehlike', onPress: onay.is },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) },
            ]}
          />
        </Katman>
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bolumArasi: { marginTop: 8 },
});
