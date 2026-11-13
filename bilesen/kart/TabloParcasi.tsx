// Tablo (pilot 13 Kasım, P-120): 2–3 sütunlu liste. Sütun başlığına dokununca o sütuna göre
// sıralanır (yeniden dokununca ters; üçüncüde eklenme sırası). Satıra dokununca satırın sayfası
// (her sütun bir alan; Kaydet · Satırı sil). Altta "+ Satır ekle" ve "Sütunlar". Satır çoksa
// üstte arama. Değiştirilemeyen tabloda yalnız okunur ve sıralanır.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

const ARAMA_ESIGI = 8;

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
  const yaz = (t: Tablo) => onDegis?.(tabloYaz(t));

  const sutunaBas = (i: number) =>
    setSiralama((s) => (!s || s.sutun !== i ? { sutun: i, artan: true } : s.artan ? { sutun: i, artan: false } : null));
  const gorunen = satirlariSirala(tablo.satirlar, siralama).filter((x) => satirUyar(x.satir, arama));

  return (
    <View style={stiller.kap}>
      {tablo.satirlar.length > ARAMA_ESIGI && (
        <GirisAlani etiket="Tabloda ara" etiketGizli placeholder="Ara" value={arama} onChangeText={setArama} />
      )}
      <View style={stiller.tablo}>
        <View style={[stiller.satir, stiller.baslikSatiri]}>
          {tablo.sutunlar.map((s, i) => {
            const bu = siralama?.sutun === i;
            return (
              <Pressable
                key={i}
                onPress={() => sutunaBas(i)}
                accessibilityRole="button"
                accessibilityLabel={`${s}: ${bu ? (siralama.artan ? 'artan sırada' : 'azalan sırada') : 'bu sütuna göre sırala'}`}
                hitSlop={4}
                style={stiller.hucre}
              >
                <Yazi kalinlik="kalin" renk={bu ? renk.ana : renk.ikincil} numberOfLines={1} style={stiller.esnek}>
                  {s}
                </Yazi>
                {bu && <Ionicons name={siralama.artan ? 'arrow-up' : 'arrow-down'} size={14} color={renk.ana} />}
              </Pressable>
            );
          })}
        </View>
        {gorunen.map(({ satir, i }, k) => (
          <Pressable
            key={i}
            onPress={() => setAcik(i)}
            accessibilityRole={onDegis ? 'button' : 'text'}
            accessibilityLabel={tablo.sutunlar.map((s, j) => `${s}: ${satir[j] || 'boş'}`).join(', ')}
            style={({ pressed }) => [stiller.satir, k % 2 === 1 && stiller.ciftSatir, pressed && { opacity: 0.6 }]}
          >
            {satir.map((h, j) => (
              <View key={j} style={stiller.hucre}>
                <Yazi numberOfLines={2} renk={h ? renk.yazi : renk.soluk} style={stiller.esnek}>
                  {h || '–'}
                </Yazi>
              </View>
            ))}
          </Pressable>
        ))}
        {tablo.satirlar.length === 0 && (
          <View style={stiller.satir}>
            <Yazi tur="ikincil" style={stiller.bos}>
              Henüz satır yok.
            </Yazi>
          </View>
        )}
        {tablo.satirlar.length > 0 && gorunen.length === 0 && (
          <View style={stiller.satir}>
            <Yazi tur="ikincil" style={stiller.bos}>
              Aranan bulunamadı.
            </Yazi>
          </View>
        )}
      </View>
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
      {acik !== null && (
        <SatirSayfasi
          sutunlar={tablo.sutunlar}
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
          sutunlar={tablo.sutunlar}
          onKapat={() => setSutunSayfasi(false)}
          onKaydet={(adlar, eskiYer) => {
            setSutunSayfasi(false);
            setSiralama(null);
            yaz(sutunlariDegistir(tablo, adlar, eskiYer));
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
  onKaydet,
  onKapat,
}: {
  sutunlar: readonly string[];
  /** Yeni adlar ve her yeni sütunun eski yeri (yeni sütunsa null). */
  onKaydet: (adlar: string[], eskiYer: (number | null)[]) => void;
  onKapat: () => void;
}) {
  const [liste, setListe] = useState(() => sutunlar.map((ad, i) => ({ ad, eski: i as number | null })));
  const sonuc = sutunlariDuzelt(liste.map((x) => x.ad));
  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik="Sütunlar"
      solVazgec
      degisti={liste.length !== sutunlar.length || liste.some((x, i) => x.ad !== sutunlar[i])}
      sagEylem={{
        etiket: 'Kaydet',
        pasif: !sonuc,
        onPress: () => {
          const dolu = liste.filter((x) => x.ad.trim());
          onKaydet(
            dolu.map((x) => x.ad.trim()),
            dolu.map((x) => x.eski),
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
      <Yazi tur="ikincil">En çok üç sütun. Kaldırılan sütunun değerleri silinir.</Yazi>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 10 },
  tablo: { borderWidth: 1, borderColor: renk.cizgi, borderRadius: olcu.kose.kart, overflow: 'hidden' },
  satir: { flexDirection: 'row', minHeight: 48, borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  baslikSatiri: { borderTopWidth: 0, backgroundColor: renk.zemin },
  ciftSatir: { backgroundColor: renk.zemin },
  hucre: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  esnek: { flex: 1 },
  bos: { padding: 12 },
  dugmeler: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ekle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  sutunSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  kaldir: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
});
