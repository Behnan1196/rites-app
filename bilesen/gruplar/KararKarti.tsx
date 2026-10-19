// Grup ekranında bir karar / oylama: soru, seçim türü, her seçenekte oy sayısı ve
// verenlerin adları; dokununca oy verilir ya da geri alınır. Kuran için "Karar ver"
// (seçeneklerden birini seçer) ve "Sil". Karar verildiyse sonuç vurgulu.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  kararHatasi,
  kararMeta,
  ondeOlanlar,
  oyDegistir,
  oylamaAcikMi,
  oylarim,
  oyVerenler,
  secenekMetni,
  type Karar,
} from '@/mantik/karar';
import { yanitlamayanlar } from '@/mantik/grupBekleyenler';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import type { Gun } from '@/mantik/tarih';

import { Dugme } from '../Dugme';
import { Katman } from '../Katman';
import { useKisaMesaj } from '../KisaMesaj';
import { OnayKutusu } from '../OnayKutusu';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { useKararlar } from './Kararlar';

export function KararKarti({
  karar,
  ben,
  bugunGun,
  ad,
  uyeler,
}: {
  karar: Karar;
  ben: string;
  bugunGun: Gun;
  ad: (id: string) => string;
  /** Grubun üyeleri: kuran için "Oy vermedi: …" (pilot 19 Ekim). */
  uyeler?: readonly string[];
}) {
  const { oyla, ver, sil } = useKararlar();
  const kisaMesaj = useKisaMesaj();
  const [secim, setSecim] = useState(false);
  const [soru, setSoru] = useState<{ tur: 'ver'; secenek: string } | { tur: 'sil' } | null>(null);
  const acik = oylamaAcikMi(karar, bugunGun);
  const benim = oylarim(karar, ben);
  const onde = ondeOlanlar(karar);
  const kuran = karar.kuran === ben;
  const sonuc = karar.secenekler.find((s) => s.id === karar.sonuc);
  const oyVermeyen =
    uyeler && kuran && !karar.sonuc
      ? yanitlamayanlar(
          uyeler,
          karar.oylar.map((o) => o.kullanici),
          '',
        ).filter((u) => u !== ben)
      : [];

  const oyVer = (secenek: string) => {
    if (!acik) return;
    void oyla(karar, oyDegistir(karar, ben, secenek)).then((ok) => ok || kisaMesaj(BAGLANAMIYOR));
  };

  const kararVerOnayli = async (secenek: string) => {
    setSoru(null);
    setSecim(false);
    try {
      const bulusma = await ver(karar, secenek);
      kisaMesaj(bulusma ? 'Karar verildi; buluşma kuruldu, ajandana da eklendi' : 'Karar verildi');
    } catch (e) {
      kisaMesaj(kararHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    }
  };

  const secilen = soru?.tur === 'ver' ? karar.secenekler.find((s) => s.id === soru.secenek) : null;

  return (
    <View style={stiller.kart}>
      <View style={stiller.ust}>
        <Ionicons
          name={karar.tur === 'gun' ? 'calendar-number-outline' : 'stats-chart-outline'}
          size={22}
          color={kaynakRenk.grup.serit}
        />
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi">{karar.tur === 'gun' ? `${karar.soru} hangi gün?` : karar.soru}</Yazi>
          <Yazi tur="ikincil">{sonuc ? `Karar: ${secenekMetni(sonuc)}` : kararMeta(karar, bugunGun)}</Yazi>
        </View>
        {kuran && <Dugme tur="yazi" etiket="Sil" onPress={() => setSoru({ tur: 'sil' })} />}
      </View>

      <View style={stiller.secenekler}>
        {karar.secenekler.map((s) => {
          const verenler = oyVerenler(karar, s.id);
          const benimki = benim.includes(s.id);
          const kazanan = karar.sonuc === s.id;
          const onden = !karar.sonuc && onde.includes(s.id);
          const adlar = verenler.map((v) => (v === ben ? 'Sen' : ad(v)));
          return (
            <Pressable
              key={s.id}
              disabled={secim ? false : !acik}
              onPress={() => (secim ? setSoru({ tur: 'ver', secenek: s.id }) : oyVer(s.id))}
              accessibilityRole={secim ? 'button' : karar.coklu ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: benimki, disabled: !secim && !acik }}
              accessibilityLabel={`${secenekMetni(s)}, ${verenler.length} oy${adlar.length ? `: ${adlar.join(', ')}` : ''}${secim ? '. Bunu seç' : ''}`}
              style={({ pressed }) => [
                stiller.secenek,
                benimki && stiller.benimki,
                kazanan && stiller.kazanan,
                secim && stiller.secimKipi,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={
                  kazanan
                    ? 'checkmark-circle'
                    : karar.coklu
                      ? benimki
                        ? 'checkbox'
                        : 'square-outline'
                      : benimki
                        ? 'radio-button-on'
                        : 'radio-button-off'
                }
                size={22}
                color={kazanan || benimki ? renk.ana : renk.soluk}
              />
              <View style={stiller.esnek}>
                <Yazi kalinlik={kazanan || onden ? 'kalin' : undefined}>{secenekMetni(s)}</Yazi>
                {adlar.length > 0 && <Yazi tur="ikincil">{adlar.join(', ')}</Yazi>}
              </View>
              <Yazi kalinlik="kalin" renk={onden || kazanan ? renk.ana : renk.ikincil}>
                {String(verenler.length)}
              </Yazi>
            </Pressable>
          );
        })}
      </View>

      {oyVermeyen.length > 0 && (
        <Yazi tur="ikincil" renk={renk.vurguYazi}>{`Oy vermedi: ${oyVermeyen.map(ad).join(', ')}`}</Yazi>
      )}
      {kuran && !karar.sonuc && (
        <Dugme
          tur={secim ? 'yazi' : 'ikincil'}
          etiket={secim ? 'Vazgeç' : 'Karar ver'}
          onPress={() => setSecim((x) => !x)}
        />
      )}
      {secim && <Yazi tur="ikincil">Sonuç olacak seçeneğe dokun.</Yazi>}
      {karar.bulusma && <Yazi tur="ikincil">{"Buluşma kuruldu; Buluşmalar'dan yanıtlanır."}</Yazi>}

      {soru && (
        <Katman>
          <OnayKutusu
            baslik={
              soru.tur === 'sil' ? `${karar.soru} silinsin mi?` : `Karar: ${secilen ? secenekMetni(secilen) : ''}`
            }
            aciklama={
              soru.tur === 'sil'
                ? 'Oylama grubun herkesi için silinir.'
                : karar.tur === 'gun'
                  ? 'Oylama kapanır ve bu güne buluşma kurulur; herkes Geliyorum / Belki / Gelemem der.'
                  : 'Oylama kapanır; sonuç grupta görünür.'
            }
            secenekler={[
              soru.tur === 'sil'
                ? {
                    etiket: 'Sil',
                    tur: 'tehlike',
                    onPress: () => {
                      setSoru(null);
                      void sil(karar).catch(() => kisaMesaj(BAGLANAMIYOR));
                    },
                  }
                : { etiket: 'Karar ver', tur: 'ana', onPress: () => void kararVerOnayli(soru.secenek) },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(null) },
            ]}
          />
        </Katman>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.grup.serit,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  esnek: { flex: 1, gap: 2 },
  secenekler: { gap: 8 },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  benimki: { borderColor: renk.ana, backgroundColor: renk.anaAcik },
  kazanan: { borderColor: renk.ana, borderWidth: 2 },
  secimKipi: { borderStyle: 'dashed', borderColor: renk.vurgu },
});
