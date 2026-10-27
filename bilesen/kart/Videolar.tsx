// Çoklu video (pilot 27 Ekim, P-53). Görünüm: birden çok video varsa üstte "Video 1 ·
// Video 2" seçici (başlık yazılmaz; uzun başlıklar sığmaz), altında seçilen video gömülü
// oynar. Düzenleme (kart formu): video yokken koyu bir alan ve "+ Video ekle"; eklerken
// alanın içinde bağlantı, isteğe bağlı başlık, Başla / Bitiş (aynı satırda), altında
// Vazgeç · Ekle. Video eklenince oynatılabilir halde görünür; altında ⚙ (seçilen videoyu
// düzenle) ve "+ Video ekle".

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { youtubeVideosu } from '@/mantik/paylasimAl';
import { adrestekiBaslangic, sureCoz, sureYaz, type Video } from '@/mantik/video';

import { Dugme } from '../Dugme';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { gomuluOynatmaVar, YoutubeOynatici } from './YoutubeOynatici';

// ---- Görünüm --------------------------------------------------------------------

/** "Video 1 · Video 2" seçici; tek videoda görünmez. */
function Secici({ adet, secili, onSec }: { adet: number; secili: number; onSec: (i: number) => void }) {
  if (adet < 2) return null;
  return (
    <View style={stiller.secici} accessibilityRole="tablist">
      {Array.from({ length: adet }, (_, i) => (
        <Pressable
          key={i}
          onPress={() => onSec(i)}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === secili }}
          style={({ pressed }) => [stiller.sekme, i === secili && stiller.sekmeSecili, pressed && { opacity: 0.7 }]}
        >
          <Yazi kalinlik="kalin" renk={i === secili ? renk.yuzey : renk.ana}>
            {`Video ${i + 1}`}
          </Yazi>
        </Pressable>
      ))}
    </View>
  );
}

/** Tek videonun oynatıcısı: YouTube ise gömülü (başla / bitiş ile), değilse dışarıda açan koyu alan. */
export function VideoOynat({ video }: { video: Video }) {
  const yt = gomuluOynatmaVar ? youtubeVideosu(video.adres) : null;
  const gecerli = /^https?:\/\//i.test(video.adres);
  if (yt)
    return (
      <View style={stiller.kap}>
        <YoutubeOynatici
          key={`${yt.kimlik}-${video.bas}-${video.bit}`}
          kimlik={yt.kimlik}
          baslangic={video.bas ?? yt.baslangic}
          bitis={video.bit}
        />
        <Pressable
          onPress={() => void Linking.openURL(video.adres)}
          accessibilityRole="link"
          hitSlop={8}
          style={stiller.disariAc}
        >
          <Ionicons name="open-outline" size={16} color={renk.ana} />
          <Yazi tur="ikincil" renk={renk.ana} kalinlik="yariKalin">
            {"YouTube'da aç"}
          </Yazi>
        </Pressable>
      </View>
    );
  return (
    <Pressable
      onPress={() => gecerli && void Linking.openURL(video.adres)}
      disabled={!gecerli}
      accessibilityRole="link"
      accessibilityLabel="Videoyu aç"
      style={({ pressed }) => [stiller.koyu, stiller.ortala, pressed && { opacity: 0.85 }]}
    >
      <View style={stiller.oynat}>
        <Ionicons name="play" size={36} color={renk.yuzey} />
      </View>
      <Yazi renk={renk.yuzey} kalinlik="yariKalin">
        {gecerli ? 'Videoyu aç' : 'Video bağlantısı yok'}
      </Yazi>
    </Pressable>
  );
}

/** Kart görünümündeki video parçası. */
export function VideolarGorunumu({ videolar }: { videolar: readonly Video[] }) {
  const [secili, setSecili] = useState(0);
  const i = Math.min(secili, Math.max(0, videolar.length - 1));
  const video = videolar[i];
  if (!video) return <VideoOynat video={{ adres: '', baslik: '', bas: null, bit: null }} />;
  return (
    <View style={stiller.kap}>
      <Secici adet={videolar.length} secili={i} onSec={setSecili} />
      <VideoOynat video={video} />
      {!!video.baslik && (
        <Yazi tur="ikincil" numberOfLines={2}>
          {video.baslik}
        </Yazi>
      )}
    </View>
  );
}

// ---- Düzenleme --------------------------------------------------------------------

interface Taslak {
  adres: string;
  baslik: string;
  bas: string;
  bit: string;
}

const bosTaslak: Taslak = { adres: '', baslik: '', bas: '', bit: '' };

export function VideolarDuzenleyici({
  videolar,
  onDegis,
}: {
  videolar: readonly Video[];
  onDegis: (videolar: Video[]) => void;
}) {
  const [secili, setSecili] = useState(0);
  /** 'ekle': yeni video; sayı: o videoyu düzenle; null: oynatıcı. */
  const [mod, setMod] = useState<'ekle' | number | null>(null);
  const [taslak, setTaslak] = useState<Taslak>(bosTaslak);
  const [hata, setHata] = useState<string | null>(null);
  const i = Math.min(secili, Math.max(0, videolar.length - 1));

  const ac = (m: 'ekle' | number) => {
    const v = m === 'ekle' ? null : videolar[m];
    setTaslak(v ? { adres: v.adres, baslik: v.baslik, bas: sureYaz(v.bas), bit: sureYaz(v.bit) } : bosTaslak);
    setHata(null);
    setMod(m);
  };

  const tamam = () => {
    const adres = taslak.adres.trim();
    if (!/^https?:\/\/\S+$/i.test(adres)) {
      setHata('Geçerli bir video bağlantısı yapıştır.');
      return;
    }
    const bas = sureCoz(taslak.bas) ?? (taslak.bas.trim() ? null : adrestekiBaslangic(adres));
    const bit = sureCoz(taslak.bit);
    if ((taslak.bas.trim() && sureCoz(taslak.bas) === null) || (taslak.bit.trim() && bit === null)) {
      setHata('Süreleri dakika:saniye olarak yaz (ör. 1:30).');
      return;
    }
    if (bas !== null && bit !== null && bit <= bas) {
      setHata('Bitiş, başlamadan sonra olmalı.');
      return;
    }
    const v: Video = { adres, baslik: taslak.baslik.trim(), bas, bit };
    if (mod === 'ekle') {
      onDegis([...videolar, v]);
      setSecili(videolar.length);
    } else if (typeof mod === 'number') onDegis(videolar.map((x, j) => (j === mod ? v : x)));
    setMod(null);
  };

  const kaldir = () => {
    if (typeof mod !== 'number') return;
    onDegis(videolar.filter((_, j) => j !== mod));
    setSecili(Math.max(0, mod - 1));
    setMod(null);
  };

  const alan = (ad: keyof Taslak, ipucu: string, ek?: object) => (
    <TextInput
      value={taslak[ad]}
      onChangeText={(m) => {
        setTaslak((t) => ({ ...t, [ad]: m }));
        if (hata) setHata(null);
      }}
      placeholder={ipucu}
      placeholderTextColor="rgba(255,255,255,0.55)"
      selectionColor={renk.yuzey}
      accessibilityLabel={ipucu}
      style={[stiller.girdi, yazi('normal')]}
      {...ek}
    />
  );

  if (mod !== null)
    return (
      <View style={stiller.kap}>
        <Secici adet={videolar.length} secili={i} onSec={() => undefined} />
        <View style={[stiller.koyu, stiller.form]}>
          {alan('adres', 'Bağlantı adresi', {
            keyboardType: 'url',
            autoCapitalize: 'none',
            autoCorrect: false,
            autoFocus: mod === 'ekle',
          })}
          {alan('baslik', 'Başlık (isteğe bağlı)')}
          <View style={stiller.sureler}>
            <Yazi renk={renk.yuzey} kalinlik="yariKalin">
              Başla:
            </Yazi>
            <View style={stiller.esnek}>{alan('bas', '0:00', { keyboardType: 'numbers-and-punctuation' })}</View>
            <Yazi renk={renk.yuzey} kalinlik="yariKalin">
              Bitiş:
            </Yazi>
            <View style={stiller.esnek}>{alan('bit', 'sonu', { keyboardType: 'numbers-and-punctuation' })}</View>
          </View>
        </View>
        {!!hata && (
          <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
            {hata}
          </Yazi>
        )}
        <View style={stiller.dugmeler}>
          {typeof mod === 'number' && (
            <Dugme tur="tehlike" etiket="Videoyu kaldır" onPress={kaldir} style={stiller.solda} />
          )}
          <Dugme tur="yazi" etiket="Vazgeç" onPress={() => setMod(null)} />
          <Dugme etiket={mod === 'ekle' ? 'Ekle' : 'Kaydet'} onPress={tamam} style={stiller.kucuk} />
        </View>
      </View>
    );

  const video = videolar[i];
  return (
    <View style={stiller.kap}>
      <Secici adet={videolar.length} secili={i} onSec={setSecili} />
      {video ? <VideoOynat video={video} /> : <View style={stiller.koyu} accessibilityLabel="Video yok" />}
      <View style={stiller.dugmeler}>
        {!!video && (
          <Pressable
            onPress={() => ac(i)}
            accessibilityRole="button"
            accessibilityLabel={`Video ${i + 1} ayarları`}
            hitSlop={6}
            style={({ pressed }) => [stiller.ayar, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="settings-outline" size={22} color={renk.ikincil} />
          </Pressable>
        )}
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket="+ Video ekle"
          onPress={() => ac('ekle')}
          style={stiller.esnek}
        />
      </View>
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 8 },
  koyu: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: olcu.kose.kart,
    backgroundColor: renk.yazi,
  },
  ortala: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  form: { aspectRatio: undefined, minHeight: 180, padding: 12, gap: 8, justifyContent: 'center' },
  oynat: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disariAc: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 },
  girdi: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: renk.yuzey,
    fontSize: boyut.govde,
  },
  sureler: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  solda: { marginRight: 'auto' },
  kucuk: { minHeight: 48, paddingHorizontal: 20 },
  ayar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secici: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sekme: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    justifyContent: 'center',
  },
  sekmeSecili: { backgroundColor: renk.ana, borderColor: renk.ana },
});
