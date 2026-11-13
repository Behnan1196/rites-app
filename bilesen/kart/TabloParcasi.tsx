// Tablo (pilot 13 Kasım, P-120): 2–5 sütunlu liste. Sütun başlığına dokununca o sütuna göre
// sıralanır (yeniden dokununca ters; üçüncüde eklenme sırası). Satıra dokununca satırın sayfası.
// P-121: soldaki sütunlar (baştaki işaret sütunları ve ilk yazı sütunu) sabit, öbürleri sığmazsa
// sağa kayar. P-122: sütun türleri: Yazı · Sayı (sağa yaslı; istenirse altta toplam) · Tarih
// ("13 Kasım"; takvimden seçilir) · İşaret (kutuya dokununca işaretlenir; ilk işaret sütunu
// işaretli satırın üstünü çizer; altta "İşaretleri kaldır (N)").

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { kisaGoreliTarih } from '@/mantik/ajanda';
import { gunEkle } from '@/mantik/tarih';
import {
  EN_COK_SUTUN,
  hucreMetni,
  isaretliMi,
  satirIsaretliMi,
  satirlariSirala,
  satirUyar,
  sayiMetni,
  SUTUN_TURLERI,
  sutunlariDegistir,
  sutunlariDuzelt,
  sutunToplami,
  tabloOku,
  tabloYaz,
  type Siralama,
  type Sutun,
  type SutunTuru,
  type Tablo,
} from '@/mantik/tablo';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { AcKapa, SecenekHapi } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const ARAMA_ESIGI = 8;
/** Kayan sütunun en dar genişliği; işaret sütununun genişliği. */
const EN_DAR_SUTUN = 88;
const ISARET_GENISLIGI = 64;

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
  const { sutunlar } = tablo;

  const sutunaBas = (i: number) =>
    setSiralama((s) => (!s || s.sutun !== i ? { sutun: i, artan: true } : s.artan ? { sutun: i, artan: false } : null));
  const gorunen = satirlariSirala(tablo.satirlar, siralama, siralama ? sutunlar[siralama.sutun]?.tur : 'yazi').filter(
    (x) => satirUyar(tablo, x.satir, arama),
  );
  const isaretSayisi = tablo.satirlar.reduce(
    (n, s) => n + sutunlar.filter((c, i) => c.tur === 'isaret' && isaretliMi(s[i] ?? '')).length,
    0,
  );
  const hucreYaz = (satir: number, sutun: number, deger: string) =>
    yaz({
      ...tablo,
      satirlar: tablo.satirlar.map((s, k) => (k === satir ? s.map((h, j) => (j === sutun ? deger : h)) : s)),
    });
  const toplamVar = sutunlar.some((c) => c.tur === 'sayi' && c.toplam);

  // Solda sabit: baştaki işaret sütunları ve ilk öbür sütun; kalanlar sığmazsa kayar.
  const ilkYazi = sutunlar.findIndex((c) => c.tur !== 'isaret');
  const sabitSayi = ilkYazi < 0 ? sutunlar.length : ilkYazi + 1;
  const isaretSutunu = sutunlar.filter((c) => c.tur === 'isaret').length;
  const genisSutun = sutunlar.length - isaretSutunu;
  const sutunGenisligi =
    genislik && genisSutun
      ? Math.max(EN_DAR_SUTUN, (genislik - isaretSutunu * ISARET_GENISLIGI) / genisSutun)
      : EN_DAR_SUTUN;
  const genislikOf = (c: Sutun) => (c.tur === 'isaret' ? ISARET_GENISLIGI : sutunGenisligi);
  const kayar = !!genislik && sutunlar.reduce((t, c) => t + genislikOf(c), 0) > genislik + 1;

  const baslik = (c: Sutun, i: number) => {
    const bu = siralama?.sutun === i;
    return (
      <Pressable
        key={i}
        onPress={() => sutunaBas(i)}
        accessibilityRole="button"
        accessibilityLabel={`${c.ad}: ${bu ? (siralama.artan ? 'artan sırada' : 'azalan sırada') : 'bu sütuna göre sırala'}`}
        hitSlop={4}
        style={[stiller.hucre, stiller.baslikHucre, { width: genislikOf(c) }, c.tur === 'sayi' && stiller.sagda]}
      >
        <Yazi
          tur={c.tur === 'isaret' ? 'etiket' : undefined}
          kalinlik="kalin"
          renk={bu ? renk.ana : renk.ikincil}
          numberOfLines={1}
          style={c.tur === 'sayi' ? undefined : stiller.esnek}
        >
          {c.ad}
        </Yazi>
        {bu && <Ionicons name={siralama.artan ? 'arrow-up' : 'arrow-down'} size={14} color={renk.ana} />}
      </Pressable>
    );
  };

  const hucre = (satir: string[], i: number, j: number, cizili: boolean) => {
    const c = sutunlar[j]!;
    const h = satir[j] ?? '';
    if (c.tur === 'isaret') {
      const isaretli = isaretliMi(h);
      return (
        <Pressable
          key={j}
          onPress={() => hucreYaz(i, j, isaretli ? '' : '1')}
          disabled={!onDegis}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isaretli }}
          accessibilityLabel={`${satir[ilkYazi] || 'Satır'}: ${c.ad}`}
          hitSlop={2}
          style={[stiller.isaretHucre, { width: ISARET_GENISLIGI }]}
        >
          <View style={[stiller.kare, isaretli && stiller.kareDolu]}>
            {isaretli && <Ionicons name="checkmark" size={16} color={renk.yuzey} />}
          </View>
        </Pressable>
      );
    }
    const metin = hucreMetni(c.tur, h);
    return (
      <Pressable
        key={j}
        onPress={() => setAcik(i)}
        accessible={j === ilkYazi}
        accessibilityRole={onDegis ? 'button' : 'text'}
        accessibilityLabel={sutunlar
          .map(
            (s, k) =>
              `${s.ad}: ${s.tur === 'isaret' ? (isaretliMi(satir[k] ?? '') ? 'evet' : 'hayır') : hucreMetni(s.tur, satir[k] ?? '') || 'boş'}`,
          )
          .join(', ')}
        style={({ pressed }) => [
          stiller.hucre,
          { width: genislikOf(c) },
          c.tur === 'sayi' && stiller.sagda,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Yazi
          numberOfLines={1}
          renk={!metin ? renk.soluk : cizili ? renk.ikincil : renk.yazi}
          style={[c.tur !== 'sayi' && stiller.esnek, cizili && !!metin && stiller.cizili]}
        >
          {metin || '–'}
        </Yazi>
      </Pressable>
    );
  };

  const toplamHucre = (c: Sutun, j: number) => (
    <View
      key={j}
      style={[stiller.hucre, stiller.toplamHucre, { width: genislikOf(c) }, c.tur === 'sayi' && stiller.sagda]}
    >
      {c.tur === 'sayi' && c.toplam ? (
        <Yazi kalinlik="kalin" numberOfLines={1}>
          {sayiMetni(
            sutunToplami(
              gorunen.map((x) => x.satir),
              j,
            ),
          )}
        </Yazi>
      ) : j === ilkYazi ? (
        <Yazi kalinlik="kalin" renk={renk.ikincil} numberOfLines={1}>
          Toplam
        </Yazi>
      ) : null}
    </View>
  );

  const kisim = (bas: number, son: number) => {
    const aralik = sutunlar.map((c, j) => ({ c, j })).slice(bas, son);
    return (
      <View>
        <View style={[stiller.satir, stiller.baslikSatiri]}>{aralik.map(({ c, j }) => baslik(c, j))}</View>
        {gorunen.map(({ satir, i }, k) => {
          const cizili = satirIsaretliMi(tablo, satir);
          return (
            <View key={i} style={[stiller.satir, k % 2 === 1 && stiller.ciftSatir]}>
              {aralik.map(({ j }) => hucre(satir, i, j, cizili))}
            </View>
          );
        })}
        {toplamVar && (
          <View style={[stiller.satir, stiller.toplamSatiri]}>{aralik.map(({ c, j }) => toplamHucre(c, j))}</View>
        )}
      </View>
    );
  };

  return (
    <View style={stiller.kap}>
      {tablo.satirlar.length > ARAMA_ESIGI && (
        <GirisAlani etiket="Tabloda ara" etiketGizli placeholder="Ara" value={arama} onChangeText={setArama} />
      )}
      <View style={stiller.tablo} onLayout={(e) => setGenislik(e.nativeEvent.layout.width - 2)}>
        {kisim(0, sabitSayi)}
        {sabitSayi < sutunlar.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator style={stiller.esnek} nestedScrollEnabled>
            {kisim(sabitSayi, sutunlar.length)}
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
          onPress={() =>
            yaz({
              ...tablo,
              satirlar: tablo.satirlar.map((s) => s.map((h, j) => (sutunlar[j]?.tur === 'isaret' ? '' : h))),
            })
          }
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
          sutunlar={sutunlar}
          satir={acik >= 0 ? tablo.satirlar[acik]! : null}
          degisir={!!onDegis}
          onKapat={() => setAcik(null)}
          onKaydet={(yeni) => {
            setAcik(null);
            const satirlar = [...tablo.satirlar];
            if (acik >= 0) satirlar[acik] = yeni;
            else satirlar.push(yeni);
            yaz({ ...tablo, satirlar });
          }}
          onSil={
            acik >= 0
              ? () => {
                  setAcik(null);
                  yaz({ ...tablo, satirlar: tablo.satirlar.filter((_, j) => j !== acik) });
                }
              : undefined
          }
        />
      )}
      {sutunSayfasi && (
        <SutunSayfasi
          sutunlar={sutunlar}
          onKapat={() => setSutunSayfasi(false)}
          onKaydet={(yeni, eskiYer) => {
            setSutunSayfasi(false);
            setSiralama(null);
            yaz(sutunlariDegistir(tablo, yeni, eskiYer));
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
  sutunlar: readonly Sutun[];
  /** Düzeltilen satır; yeni satırda null. */
  satir: readonly string[] | null;
  degisir: boolean;
  onKaydet: (s: string[]) => void;
  onSil?: () => void;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  const [degerler, setDegerler] = useState(() => sutunlar.map((_, i) => satir?.[i] ?? ''));
  const [takvim, setTakvim] = useState<number | null>(null);
  const dolu = degerler.some((d, i) => d.trim() && sutunlar[i]?.tur !== 'isaret');
  const degisti = degerler.some((d, i) => d !== (satir?.[i] ?? ''));
  const degistir = (i: number, t: string) => setDegerler((d) => d.map((x, j) => (j === i ? t : x)));
  const ilkYazi = sutunlar.findIndex((c) => c.tur === 'yazi' || c.tur === 'sayi');
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
      {sutunlar.map((c, i) =>
        c.tur === 'isaret' ? (
          <View key={i} style={stiller.anahtarSatiri}>
            <Yazi style={stiller.esnek}>{c.ad}</Yazi>
            {degisir ? (
              <AcKapa acik={isaretliMi(degerler[i]!)} onDegis={(a) => degistir(i, a ? '1' : '')} etiket={c.ad} />
            ) : (
              <Yazi kalinlik="kalin">{isaretliMi(degerler[i]!) ? 'Evet' : 'Hayır'}</Yazi>
            )}
          </View>
        ) : c.tur === 'tarih' ? (
          <View key={i} style={stiller.tarihBolumu}>
            <Yazi kalinlik="kalin">{c.ad}</Yazi>
            {degisir ? (
              <>
                <View style={stiller.cipler}>
                  {[bugunGun, gunEkle(bugunGun, 1)].map((g) => (
                    <SecenekHapi
                      key={g}
                      etiket={kisaGoreliTarih(g, bugunGun)}
                      secili={degerler[i] === g}
                      onPress={() => {
                        degistir(i, g);
                        setTakvim(null);
                      }}
                    />
                  ))}
                  <SecenekHapi
                    etiket={
                      degerler[i] && degerler[i] !== bugunGun && degerler[i] !== gunEkle(bugunGun, 1)
                        ? hucreMetni('tarih', degerler[i]!)
                        : 'Gün seç'
                    }
                    secili={
                      takvim === i ||
                      (!!degerler[i] && degerler[i] !== bugunGun && degerler[i] !== gunEkle(bugunGun, 1))
                    }
                    onPress={() => setTakvim(takvim === i ? null : i)}
                  />
                  {!!degerler[i] && <SecenekHapi etiket="Tarih yok" secili={false} onPress={() => degistir(i, '')} />}
                </View>
                {takvim === i && (
                  <AyTakvimi
                    secili={degerler[i] || null}
                    bugunGun={bugunGun}
                    onSec={(g) => {
                      degistir(i, g);
                      setTakvim(null);
                    }}
                  />
                )}
              </>
            ) : (
              <Yazi>{hucreMetni('tarih', degerler[i]!) || '–'}</Yazi>
            )}
          </View>
        ) : (
          <GirisAlani
            key={i}
            etiket={c.ad}
            value={degerler[i]}
            editable={degisir}
            keyboardType={c.tur === 'sayi' ? 'decimal-pad' : 'default'}
            autoFocus={degisir && !satir && i === ilkYazi}
            onChangeText={(t) => degistir(i, t)}
            returnKeyType="done"
          />
        ),
      )}
      {degisir && onSil && <Dugme tur="tehlike" etiket="Satırı sil" onPress={onSil} />}
    </AltSayfa>
  );
}

/** Sütunlar: ad, tür (Yazı · Sayı · Tarih · İşaret), sayıda "Altta toplam"; ekle, kaldır. */
export function SutunDuzenleyici({
  liste,
  onDegis,
}: {
  liste: readonly (Sutun & { eski?: number | null })[];
  onDegis: (l: (Sutun & { eski?: number | null })[]) => void;
}) {
  const degistir = (i: number, d: Partial<Sutun>) => onDegis(liste.map((y, j) => (j === i ? { ...y, ...d } : y)));
  return (
    <>
      {liste.map((x, i) => (
        <View key={i} style={stiller.sutunKutusu}>
          <View style={stiller.sutunSatiri}>
            <View style={stiller.esnek}>
              <GirisAlani etiket={`${i + 1}. sütun`} value={x.ad} onChangeText={(ad) => degistir(i, { ad })} />
            </View>
            {liste.length > 1 && (
              <Pressable
                onPress={() => onDegis(liste.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel={`${x.ad || `${i + 1}. sütun`}: sütunu kaldır`}
                hitSlop={6}
                style={stiller.kaldir}
              >
                <Ionicons name="trash-outline" size={22} color={renk.hata} />
              </Pressable>
            )}
          </View>
          <View style={stiller.cipler}>
            {SUTUN_TURLERI.map((t) => (
              <SecenekHapi
                key={t.tur}
                etiket={t.ad}
                secili={x.tur === t.tur}
                onPress={() =>
                  degistir(i, { tur: t.tur as SutunTuru, toplam: t.tur === 'sayi' ? x.toplam : undefined })
                }
              />
            ))}
          </View>
          {x.tur === 'sayi' && (
            <View style={stiller.anahtarSatiri}>
              <Yazi style={stiller.esnek}>Altta toplam</Yazi>
              <AcKapa acik={!!x.toplam} onDegis={(a) => degistir(i, { toplam: a })} etiket={`${x.ad}: altta toplam`} />
            </View>
          )}
        </View>
      ))}
      {liste.length < EN_COK_SUTUN && (
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="+ Sütun ekle"
          onPress={() => onDegis([...liste, { ad: '', tur: 'yazi', eski: null }])}
        />
      )}
    </>
  );
}

function SutunSayfasi({
  sutunlar,
  onKaydet,
  onKapat,
}: {
  sutunlar: readonly Sutun[];
  /** Yeni sütunlar ve her yeni sütunun eski yeri (yeni sütunsa null). */
  onKaydet: (sutunlar: Sutun[], eskiYer: (number | null)[]) => void;
  onKapat: () => void;
}) {
  const [liste, setListe] = useState<(Sutun & { eski?: number | null })[]>(() =>
    sutunlar.map((s, i) => ({ ...s, eski: i })),
  );
  const sonuc = sutunlariDuzelt(liste);
  const degisti =
    liste.length !== sutunlar.length ||
    liste.some(
      (x, i) => x.ad !== sutunlar[i]?.ad || x.tur !== sutunlar[i]?.tur || !!x.toplam !== !!sutunlar[i]?.toplam,
    );
  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik="Sütunlar"
      solVazgec
      degisti={degisti}
      sagEylem={{
        etiket: 'Kaydet',
        pasif: !sonuc,
        onPress: () => {
          const dolu = liste.filter((x) => x.ad.trim());
          onKaydet(
            dolu.map(({ eski: _e, ...s }) => ({ ...s, ad: s.ad.trim() })),
            dolu.map((x) => x.eski ?? null),
          );
        },
      }}
    >
      <SutunDuzenleyici liste={liste} onDegis={setListe} />
      <Yazi tur="ikincil">
        En çok beş sütun; sığmazsa tablo sağa kayar. İlk İşaret sütunu işaretli satırın üstünü çizer. Kaldırılan sütunun
        değerleri silinir.
      </Yazi>
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
  toplamSatiri: { height: 44, backgroundColor: renk.zemin },
  ciftSatir: { backgroundColor: renk.zemin },
  isaretHucre: { height: 47, alignItems: 'center', justifyContent: 'center' },
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
  anahtarSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  tarihBolumu: { gap: 8 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  baslikHucre: { height: 44 },
  toplamHucre: { height: 43 },
  hucre: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sagda: { justifyContent: 'flex-end' },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ekle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  sutunKutusu: {
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
  },
  sutunSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  kaldir: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
});
