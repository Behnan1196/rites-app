// Çoklu video (pilot 27 Ekim, P-53). Görünüm: birden çok video varsa üstte "Video 1 ·
// Video 2" seçici (başlık yazılmaz; uzun başlıklar sığmaz), altında seçilen video gömülü
// oynar. Düzenleme (kart formu): video yokken koyu bir alan ve "+ Video ekle"; eklerken
// alanın içinde bağlantı, isteğe bağlı başlık, Başla / Bitiş (aynı satırda), altında
// Vazgeç · Ekle. Video eklenince oynatılabilir halde görünür; altında ⚙ (seçilen videoyu
// düzenle) ve "+ Video ekle". P-54: eklerken "Gelenlerden al": YouTube'dan Rites'a paylaşılan
// videolar listelenir, seçilen bu karta eklenir (kart kaydedilince Gelenler'den kalkar).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { instagramGomme, kaynakAdi, youtubeMu, youtubeVideosu } from '@/mantik/paylasimAl';
import { adrestekiBaslangic, sureCoz, sureYaz, type Video } from '@/mantik/video';

import { useSorgu } from '@/veri/kancalar';
import { paylasilanlariOku, type Paylasilan } from '@/veri/paylasilanlar';

import { Dugme } from '../Dugme';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';
import { GomuluSayfa, gomuluOynatmaVar, YoutubeOynatici } from './YoutubeOynatici';

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
  // P-55: Instagram gönderisi / reel'i de kartın içinde (başla / bitiş yok).
  const insta = gomuluOynatmaVar ? instagramGomme(video.adres) : null;
  if (insta) return <GomuluSayfa key={insta} adres={insta} />;
  if (yt)
    return (
      <YoutubeOynatici
        key={`${yt.kimlik}-${video.bas}-${video.bit}`}
        kimlik={yt.kimlik}
        baslangic={video.bas ?? yt.baslangic}
        bitis={video.bit}
      />
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
  onGelendenAlindi,
}: {
  videolar: readonly Video[];
  onDegis: (videolar: Video[]) => void;
  /** P-54: Gelenler'deki paylaşılan video bu karta alındı (kart kaydedilince Gelenler'den kalkar). */
  onGelendenAlindi?: (id: string) => void;
}) {
  const [alinanlar, setAlinanlar] = useState<readonly string[]>([]);
  const paylasilanlar = (useSorgu(['paylasilan'], (o) => paylasilanlariOku(o), []).veri ?? []).filter(
    (p) => !alinanlar.includes(p.id) && !videolar.some((v) => v.adres === p.adres),
  );
  const [gelenlerAcik, setGelenlerAcik] = useState(false);
  const gelendenAl = (p: Paylasilan) => {
    onDegis([...videolar, { adres: p.adres, baslik: p.baslik, bas: adrestekiBaslangic(p.adres), bit: null }]);
    setSecili(videolar.length);
    setAlinanlar((a) => [...a, p.id]);
    onGelendenAlindi?.(p.id);
    setGelenlerAcik(false);
    setMod(null);
  };
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
    setGelenlerAcik(false);
    setMod(m);
  };

  const tamam = () => {
    const adres = taslak.adres.trim();
    if (!/^https?:\/\/\S+$/i.test(adres)) {
      setHata('Geçerli bir video bağlantısı yapıştır.');
      return;
    }
    // P-55: başla / bitiş yalnız YouTube'da.
    const yt = youtubeMu(adres);
    const bas = yt ? (sureCoz(taslak.bas) ?? (taslak.bas.trim() ? null : adrestekiBaslangic(adres))) : null;
    const bit = yt ? sureCoz(taslak.bit) : null;
    if (yt && ((taslak.bas.trim() && sureCoz(taslak.bas) === null) || (taslak.bit.trim() && bit === null))) {
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
          {/* P-55: başla / bitiş yalnız YouTube'da (Instagram'da verilemez). */}
          {(!taslak.adres.trim() || youtubeMu(taslak.adres)) && (
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
          )}
        </View>
        {!!hata && (
          <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
            {hata}
          </Yazi>
        )}
        {mod === 'ekle' && paylasilanlar.length > 0 && (
          <View style={stiller.gelenler}>
            <Pressable
              onPress={() => setGelenlerAcik((a) => !a)}
              accessibilityRole="button"
              accessibilityState={{ expanded: gelenlerAcik }}
              style={({ pressed }) => [stiller.gelenlerBaslik, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="mail-open-outline" size={20} color={renk.ana} />
              <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.esnek}>
                {`Gelenlerden al (${paylasilanlar.length})`}
              </Yazi>
              <Ionicons name={gelenlerAcik ? 'chevron-up' : 'chevron-down'} size={20} color={renk.soluk} />
            </Pressable>
            {gelenlerAcik &&
              paylasilanlar.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => gelendenAl(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`Bu karta al: ${p.baslik}`}
                  style={({ pressed }) => [stiller.gelen, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons
                    name={
                      instagramGomme(p.adres) ? 'logo-instagram' : youtubeMu(p.adres) ? 'logo-youtube' : 'link-outline'
                    }
                    size={22}
                    color={renk.ikincil}
                  />
                  <View style={stiller.esnek}>
                    <Yazi numberOfLines={2}>{p.baslik}</Yazi>
                    <Yazi tur="etiket" numberOfLines={1}>{`${kaynakAdi(p.adres)}'dan paylaştın`}</Yazi>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={renk.ana} />
                </Pressable>
              ))}
          </View>
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
  gelenler: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: 12,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  gelenlerBaslik: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12 },
  gelen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
  },
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
