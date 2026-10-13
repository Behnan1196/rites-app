// Grup ekranı (GR-1): üyeler (kuran çıkarır), "Kişilerinden ekle" (kuran),
// bu gruba açık listeler; kuran için "Grubu sil", üye için "Gruptan ayrıl".
// Grup ekranı bundan derin değildir (`08` karar 38).

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { KisiAvatari, ListeKutusu, parcaStilleri } from '@/bilesen/gruplar/parcalar';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { Katman } from '@/bilesen/Katman';
import { useKisaMesaj } from '@/bilesen/KisaMesaj';
import { OnayKutusu } from '@/bilesen/OnayKutusu';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { SecenekHapi } from '@/bilesen/Secim';
import { kaynakRenk, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { cagrilabilecekler, GRUP_LISTELERI_NOTU, grupAdi, grupHatasi, type GrupUyesi } from '@/mantik/gruplar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { grubaCagir, grubuSil, gruptanCikar } from '@/sunucu/gruplar';
import { useOturum } from '@/sunucu/oturum';

type Soru = { tur: 'cikar'; uye: GrupUyesi } | { tur: 'sil' } | { tur: 'ayril' };

export default function GrupEkrani() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const oturum = useOturum();
  const kisaMesaj = useKisaMesaj();
  const { ben, gruplar, kisiler, ad, yukleniyor, baglanamiyor, yenile } = useGruplar(oturum);
  const [soru, setSoru] = useState<Soru | null>(null);
  const grup = gruplar.find((g) => g.id === id);
  const kuranBenim = !!grup && grup.kurucu === ben;

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
    if (soru.tur === 'sil') {
      return {
        baslik: `${grupAdi(grup.ad)} silinsin mi?`,
        aciklama: 'Grup herkes için silinir. Bu gruba açık listeler grubun üyelerine kapanır.',
        etiket: 'Grubu sil',
        is: () => void dene(() => grubuSil(grup.id), `${grupAdi(grup.ad)} silindi.`, () => router.back()),
      };
    }
    return {
      baslik: `${grupAdi(grup.ad)}ndan ayrılmak istiyor musun?`,
      aciklama: 'Grubun listelerini artık görmezsin. Yeniden katılmak için kuranın seni çağırması gerekir.',
      etiket: 'Gruptan ayrıl',
      is: () => void dene(() => gruptanCikar(grup.id, ben), `${grupAdi(grup.ad)}ndan ayrıldın.`, () => router.back()),
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
          {baglanamiyor && <Yazi tur="ikincil" renk={renk.hata}>{BAGLANAMIYOR}</Yazi>}
          <Yazi tur="bolumBasligi" accessibilityRole="header">
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

          <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
            Bu grubun listeleri
          </Yazi>
          {grup.listeler.length === 0 ? (
            <Yazi tur="ikincil">{"Bu gruba açık liste yok. Ortak listeler Giriş'ten açılır."}</Yazi>
          ) : (
            <>
              <ListeKutusu>
                {grup.listeler.map((l, i) => (
                  <Pressable
                    key={l.id}
                    onPress={() => router.push({ pathname: '/gruplar/liste/[id]', params: { id: l.id, geri: grup.ad } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${l.ad} listesini aç`}
                    style={({ pressed }) => [parcaStilleri.satir, i > 0 && parcaStilleri.cizgili, pressed && { opacity: 0.7 }]}
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

          <Dugme
            tur="tehlike"
            etiket={kuranBenim ? 'Grubu sil' : 'Gruptan ayrıl'}
            onPress={() => setSoru({ tur: kuranBenim ? 'sil' : 'ayril' })}
            style={stiller.bolumArasi}
          />
        </>
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
