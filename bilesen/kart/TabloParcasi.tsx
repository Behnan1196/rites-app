// Tablo (pilot 13 Kasım, P-120): 2–5 sütunlu liste. P-121: ilk sütun (ve isteğe bağlı "Aldım"
// işaret kutusu) solda sabit, öbürleri sığmazsa sağa kayar; işaretli satır yerinde kalır, üstü
// çizilir, altta "İşaretleri kaldır (N)". Sütun başlığına dokununca o sütuna göre
// sıralanır (yeniden dokununca ters; üçüncüde eklenme sırası). Satıra dokununca satırın sayfası
// (her sütun bir alan; Kaydet · Satırı sil). Altta "+ Satır ekle" ve "Sütunlar". Satır çoksa
// üstte arama. Değiştirilemeyen tabloda yalnız okunur ve sıralanır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  EN_COK_SUTUN,
  satirlariSirala,
  satirUyar,
  sutunlariDegistir,
  sutunlariDuzelt,
  tabloOku,
  tabloYaz,
  type Siralama,
  type Tablo,
} from '@/mantik/tablo';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { AcKapa } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const ARAMA_ESIGI = 8;
/** Kayan sütunun en dar genişliği; işaret kutusunun genişliği. */
const EN_DAR_SUTUN = 88;
const KUTU = 44;

export function TabloParcasi({
  blok,
  onDegis,
}: {
  blok: { metin: string; maddeler: readonly string[] };
  /** Verilmezse tablo değiştirilemez. */
  onDegis?: (d: { metin: string; maddeler: string[] }) => void;
}) {
  const tablo = tabloOku(blok);
  const [siralama, setSiralama] = useState<Siralama>(null);
  const [arama, setArama] = useState('');
  /** Açık satır: düzeltilen satırın yeri ya da yeni satır (-1). */
  const [acik, setAcik] = useState<number | null>(null);
  const [sutunSayfasi, setSutunSayfasi] = useState(false);
  const [genislik, setGenislik] = useState(0);
  const yaz = (t: Tablo) => onDegis?.(tabloYaz(t));

  const sutunaBas = (i: number) =>
    setSiralama((s) => (!s || s.sutun !== i ? { sutun: i, artan: true } : s.artan ? { sutun: i, artan: false } : null));
  const gorunen = satirlariSirala(tablo.satirlar, siralama).filter((x) => satirUyar(x.satir, arama));
  const isaretSayisi = tablo.isaret ? tablo.isaretli.filter(Boolean).length : 0;
  const isaretle = (i: number) =>
    yaz({ ...tablo, isaretli: tablo.satirlar.map((_, k) => (k === i ? !tablo.isaretli[k] : !!tablo.isaretli[k])) });

  // P-121: ilk sütun (ve işaret kutusu) solda sabit; öbür sütunlar ekrana sığmazsa sağa kayar.
  const kutu = tablo.isaret ? KUTU : 0;
  const n = tablo.sutunlar.length;
  const sutunGenisligi = genislik ? Math.max(EN_DAR_SUTUN, (genislik - kutu) / n) : EN_DAR_SUTUN;
  const kayar = !!genislik && kutu + n * sutunGenisligi > genislik + 1;

  const baslik = (s: string, i: number) => {
    const bu = siralama?.sutun === i;
    return (
      <Pressable
        key={i}
        onPress={() => sutunaBas(i)}
        accessibilityRole="button"
        accessibilityLabel={`${s}: ${bu ? (siralama.artan ? 'artan sırada' : 'azalan sırada') : 'bu sütuna göre sırala'}`}
        hitSlop={4}
        style={[stiller.hucre, stiller.baslikHucre, { width: sutunGenisligi }]}
      >
        <Yazi kalinlik="kalin" renk={bu ? renk.ana : renk.ikincil} numberOfLines={1} style={stiller.esnek}>
          {s}
        </Yazi>
        {bu && <Ionicons name={siralama.artan ? 'arrow-up' : 'arrow-down'} size={14} color={renk.ana} />}
      </Pressable>
    );
  };
  const hucre = (h: string, j: number, isaretli: boolean) => (
    <View key={j} style={[stiller.hucre, { width: sutunGenisligi }]}>
      <Yazi
        numberOfLines={1}
        renk={!h ? renk.soluk : isaretli ? renk.ikincil : renk.yazi}
        style={[stiller.esnek, isaretli && !!h && stiller.cizili]}
      >
        {h || '–'}
      </Yazi>
    </View>
  );
  const satirAc = (i: number) => setAcik(i);

  return (
    <View style={stiller.kap}>
      {tablo.satirlar.length > ARAMA_ESIGI && (
        <GirisAlani etiket="Tabloda ara" etiketGizli placeholder="Ara" value={arama} onChangeText={setArama} />
      )}
      <View style={stiller.tablo} onLayout={(e) => setGenislik(e.nativeEvent.layout.width - 2)}>
        {/* Solda sabit: işaret kutusu ve ilk sütun. */}
        <View>
          <View style={[stiller.satir, stiller.baslikSatiri]}>
            {tablo.isaret && <View style={stiller.kutuHucre} />}
            {baslik(tablo.sutunlar[0]!, 0)}
          </View>
          {gorunen.map(({ satir, i }, k) => {
            const isaretli = tablo.isaret && !!tablo.isaretli[i];
            return (
              <View key={i} style={[stiller.satir, k % 2 === 1 && stiller.ciftSatir]}>
                {tablo.isaret && (
                  <Pressable
                    onPress={() => isaretle(i)}
                    disabled={!onDegis}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isaretli }}
                    accessibilityLabel={`${satir[0] || 'Satır'}: alındı`}
                    hitSlop={4}
                    style={stiller.kutuHucre}
                  >
                    <View style={[stiller.kare, isaretli && stiller.kareDolu]}>
                      {isaretli && <Ionicons name="checkmark" size={16} color={renk.yuzey} />}
                    </View>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => satirAc(i)}
                  accessibilityRole={onDegis ? 'button' : 'text'}
                  accessibilityLabel={tablo.sutunlar.map((s, j) => `${s}: ${satir[j] || 'boş'}`).join(', ')}
                  style={({ pressed }) => pressed && { opacity: 0.6 }}
                >
                  {hucre(satir[0] ?? '', 0, isaretli)}
                </Pressable>
              </View>
            );
          })}
        </View>
        {/* Sağda öbür sütunlar; sığmazsa kayar. */}
        {n > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator style={stiller.esnek} nestedScrollEnabled>
            <View>
              <View style={[stiller.satir, stiller.baslikSatiri]}>
                {tablo.sutunlar.slice(1).map((s, j) => baslik(s, j + 1))}
              </View>
              {gorunen.map(({ satir, i }, k) => (
                <Pressable
                  key={i}
                  onPress={() => satirAc(i)}
                  accessible={false}
                  style={({ pressed }) => [
                    stiller.satir,
                    k % 2 === 1 && stiller.ciftSatir,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  {satir.slice(1).map((h, j) => hucre(h, j + 1, tablo.isaret && !!tablo.isaretli[i]))}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
      {kayar && (
        <Yazi tur="etiket" style={stiller.sagaYasli}>
          Öbür sütunlar için tabloyu sola kaydır ›
        </Yazi>
      )}
      {tablo.satirlar.length === 0 && <Yazi tur="ikincil">Henüz satır yok.</Yazi>}
      {tablo.satirlar.length > 0 && gorunen.length === 0 && <Yazi tur="ikincil">Aranan bulunamadı.</Yazi>}
      {!!onDegis && (
        <View style={stiller.dugmeler}>
          <Pressable
            onPress={() => setAcik(-1)}
            accessibilityRole="button"
            hitSlop={6}
            style={({ pressed }) => [stiller.ekle, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="add" size={20} color={renk.ana} />
            <Yazi kalinlik="kalin" renk={renk.ana}>
              Satır ekle
            </Yazi>
          </Pressable>
          <Pressable
            onPress={() => setSutunSayfasi(true)}
            accessibilityRole="button"
            hitSlop={6}
            style={({ pressed }) => [stiller.ekle, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="options-outline" size={18} color={renk.ikincil} />
            <Yazi renk={renk.ikincil}>Sütunlar</Yazi>
          </Pressable>
        </View>
      )}
      {!!onDegis && isaretSayisi > 0 && (
        <Pressable
          onPress={() => yaz({ ...tablo, isaretli: tablo.satirlar.map(() => false) })}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => [stiller.ekle, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="refresh-outline" size={18} color={renk.ana} />
          <Yazi renk={renk.ana}>{`İşaretleri kaldır (${isaretSayisi})`}</Yazi>
        </Pressable>
      )}
      {acik !== null && (
        <SatirSayfasi
          sutunlar={tablo.sutunlar}
          satir={acik >= 0 ? tablo.satirlar[acik]! : null}
          degisir={!!onDegis}
          onKapat={() => setAcik(null)}
          onKaydet={(yeni) => {
            setAcik(null);
            const satirlar = [...tablo.satirlar];
            const isaretli = tablo.satirlar.map((_, k) => !!tablo.isaretli[k]);
            if (acik >= 0) satirlar[acik] = yeni;
            else {
              satirlar.push(yeni);
              isaretli.push(false);
            }
            yaz({ ...tablo, satirlar, isaretli });
          }}
          onSil={
            acik >= 0
              ? () => {
                  setAcik(null);
                  yaz({
                    ...tablo,
                    satirlar: tablo.satirlar.filter((_, j) => j !== acik),
                    isaretli: tablo.satirlar.map((_, j) => !!tablo.isaretli[j]).filter((_, j) => j !== acik),
                  });
                }
              : undefined
          }
        />
      )}
      {sutunSayfasi && (
        <SutunSayfasi
          sutunlar={tablo.sutunlar}
          isaret={tablo.isaret}
          onKapat={() => setSutunSayfasi(false)}
          onKaydet={(adlar, eskiYer, isaret) => {
            setSutunSayfasi(false);
            setSiralama(null);
            yaz({ ...sutunlariDegistir(tablo, adlar, eskiYer), isaret });
          }}
        />
      )}
    </View>
  );
}

function SatirSayfasi({
  sutunlar,
  satir,
  degisir,
  onKaydet,
  onSil,
  onKapat,
}: {
  sutunlar: readonly string[];
  /** Düzeltilen satır; yeni satırda null. */
  satir: readonly string[] | null;
  degisir: boolean;
  onKaydet: (s: string[]) => void;
  onSil?: () => void;
  onKapat: () => void;
}) {
  const [degerler, setDegerler] = useState(() => sutunlar.map((_, i) => satir?.[i] ?? ''));
  const dolu = degerler.some((d) => d.trim());
  const degisti = degerler.some((d, i) => d !== (satir?.[i] ?? ''));
  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={satir ? (degisir ? 'Satırı düzelt' : 'Satır') : 'Yeni satır'}
      solVazgec={degisir}
      sagKapat={degisir ? undefined : 'Tamam'}
      degisti={degisir && degisti}
      sagEylem={
        degisir
          ? { etiket: satir ? 'Kaydet' : 'Ekle', pasif: !dolu, onPress: () => onKaydet(degerler.map((d) => d.trim())) }
          : undefined
      }
    >
      {sutunlar.map((s, i) => (
        <GirisAlani
          key={i}
          etiket={s}
          value={degerler[i]}
          editable={degisir}
          autoFocus={degisir && !satir && i === 0}
          onChangeText={(t) => setDegerler((d) => d.map((x, j) => (j === i ? t : x)))}
          returnKeyType={i === sutunlar.length - 1 ? 'done' : 'next'}
        />
      ))}
      {degisir && onSil && <Dugme tur="tehlike" etiket="Satırı sil" onPress={onSil} />}
    </AltSayfa>
  );
}

function SutunSayfasi({
  sutunlar,
  isaret: ilkIsaret,
  onKaydet,
  onKapat,
}: {
  sutunlar: readonly string[];
  isaret: boolean;
  /** Yeni adlar, her yeni sütunun eski yeri (yeni sütunsa null) ve işaret kutusu. */
  onKaydet: (adlar: string[], eskiYer: (number | null)[], isaret: boolean) => void;
  onKapat: () => void;
}) {
  const [liste, setListe] = useState(() => sutunlar.map((ad, i) => ({ ad, eski: i as number | null })));
  const [isaret, setIsaret] = useState(ilkIsaret);
  const sonuc = sutunlariDuzelt(liste.map((x) => x.ad));
  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik="Sütunlar"
      solVazgec
      degisti={isaret !== ilkIsaret || liste.length !== sutunlar.length || liste.some((x, i) => x.ad !== sutunlar[i])}
      sagEylem={{
        etiket: 'Kaydet',
        pasif: !sonuc,
        onPress: () => {
          const dolu = liste.filter((x) => x.ad.trim());
          onKaydet(
            dolu.map((x) => x.ad.trim()),
            dolu.map((x) => x.eski),
            isaret,
          );
        },
      }}
    >
      {liste.map((x, i) => (
        <View key={i} style={stiller.sutunSatiri}>
          <View style={stiller.esnek}>
            <GirisAlani
              etiket={`${i + 1}. sütun`}
              value={x.ad}
              onChangeText={(ad) => setListe((l) => l.map((y, j) => (j === i ? { ...y, ad } : y)))}
            />
          </View>
          {liste.length > 1 && (
            <Pressable
              onPress={() => setListe((l) => l.filter((_, j) => j !== i))}
              accessibilityRole="button"
              accessibilityLabel={`${x.ad || `${i + 1}. sütun`}: sütunu kaldır`}
              hitSlop={6}
              style={stiller.kaldir}
            >
              <Ionicons name="trash-outline" size={22} color={renk.hata} />
            </Pressable>
          )}
        </View>
      ))}
      {liste.length < EN_COK_SUTUN && (
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="+ Sütun ekle"
          onPress={() => setListe((l) => [...l, { ad: '', eski: null }])}
        />
      )}
      <Yazi tur="ikincil">En çok beş sütun; sığmazsa tablo sağa kayar. Kaldırılan sütunun değerleri silinir.</Yazi>
      {/* P-121: "Aldım" işareti (market gibi); satır yerinde kalır, üstü çizilir. */}
      <View style={stiller.anahtarSatiri}>
        <View style={stiller.esnek}>
          <Yazi>İşaret kutusu</Yazi>
          <Yazi tur="etiket">Alınanı işaretle: satır yerinde kalır, üstü çizilir.</Yazi>
        </View>
        <AcKapa acik={isaret} onDegis={setIsaret} etiket="Satırlarda işaret kutusu" />
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 10 },
  tablo: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    overflow: 'hidden',
  },
  // Sabit ve kayan kısımlar hizalı kalsın diye satırlar sabit yükseklikte.
  satir: { flexDirection: 'row', height: 48, borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  baslikSatiri: { borderTopWidth: 0, height: 44, backgroundColor: renk.zemin },
  ciftSatir: { backgroundColor: renk.zemin },
  kutuHucre: { width: KUTU, alignItems: 'center', justifyContent: 'center' },
  kare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: renk.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kareDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  cizili: { textDecorationLine: 'line-through' },
  sagaYasli: { alignSelf: 'flex-end', marginTop: -4 },
  anahtarSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  baslikHucre: { height: 44 },
  hucre: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ekle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  sutunSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  kaldir: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
});
