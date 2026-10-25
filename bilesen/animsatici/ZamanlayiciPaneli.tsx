// Giriş'teki tek zamanlayıcı (pilot 23 Ekim; P-31 / P-32 / P-42 / P-43 / P-44). Anımsatıcılar
// kutusunda (ve Anımsatıcılar ekranında) her zaman görünür. İki satır, yüksekliği hep aynı:
// üstte süre (kadranda küçük halkayla) ve alt yazı, sağda ⚙; altta iki düğme.
//
// - Dururken: Ayarla · Başlat. "Ayarla" dijitalde rakamları çarka çevirir, kadranda
//   kadranı açar (ortasında yalnız "Tamam"); "Tamam" ile süre kalır, başlatmak Başlat'la.
// - Çalışırken: geri sayım; Duraklat / Devam · İptal. Alt yazı "Duraklatıldı" olur.
// - ⚙: görünüm (kadran / dijital), süre dolunca (alarm / bildirim), ses.
//
// En son ayarlanan süre gelir (ilk seferde 5 dk). Ad süredir ("5 dk"). Biri çalışırken
// yenisi kurulmaz; +1 dk yok (çalınca 1 dk ertele var).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Animsatici } from '@/mantik/animsatici';
import {
  carkDegeri,
  carkMs,
  duraklatildiMi,
  geriSayimMetni,
  ilerleme,
  kadranDakikasi,
  KADRAN_DK,
  kalanMs,
  zamanlayiciAyariCoz,
  zamanlayiciSuresiMetni,
  type ZamanlayiciAyari,
} from '@/mantik/zamanlayici';
import { ayarYaz } from '@/veri/ayar';
import { animsaticiSil, zamanlayiciDevam, zamanlayiciDuraklat, zamanlayiciKur } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { useAyar } from '@/veri/kancalar';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { SecenekHapi } from '../Secim';
import { SesSecici } from '../SesSecici';
import { renk } from '../tema';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Yazi } from '../Yazi';
import { Cark } from './Cark';
import { Kadran } from './Kadran';
import { Halka } from './Halka';

/** `sure`: kurulu (çalışan ya da duraklatılmış) zamanlayıcı; yoksa kurulum. */
export function ZamanlayiciPaneli({ sure, simdiMs }: { sure: Animsatici | null; simdiMs: number }) {
  const ham = useAyar('zamanlayici');
  if (ham.yukleniyor) return null;
  return <Panel ayar={zamanlayiciAyariCoz(ham.veri)} sure={sure} simdiMs={simdiMs} />;
}

function Panel({ ayar, sure, simdiMs }: { ayar: ZamanlayiciAyari; sure: Animsatici | null; simdiMs: number }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const [ms, setMs] = useState(ayar.sonMs);
  const [ayarlaniyor, setAyarlaniyor] = useState(false);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const dijital = ayar.gorunum === 'dijital';
  // Kadran tam dakika; dijitalde saniye de.
  const kurulacak = dijital ? ms : kadranDakikasi(ms) * 60_000;

  const hataGoster = (e: unknown) => {
    console.error('Zamanlayıcı değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const ayarDegis = (alanlar: Partial<ZamanlayiciAyari>) =>
    void ayarYaz(kapi, 'zamanlayici', { ...ayar, ...alanlar }).catch(hataGoster);

  const baslat = async () => {
    if (calisiyor || kurulacak <= 0) return;
    setCalisiyor(true);
    try {
      const alarm = ayar.cal === 'alarm' && alarmDestegi;
      if (alarm) await izinIste();
      await zamanlayiciKur(kapi, {
        id: yeniKimlik(),
        ad: zamanlayiciSuresiMetni(kurulacak),
        ms: kurulacak,
        alarm,
        ses: ayar.ses,
      });
      await bildirimIzni(true);
      await ayarYaz(kapi, 'zamanlayici', { ...ayar, sonMs: kurulacak });
    } catch (e) {
      console.error('Zamanlayıcı kurulamadı', e);
      kisaMesaj('Kurulamadı. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  const ayarSayfasi = (
    <AltSayfa gorunur={ayarAcik} onKapat={() => setAyarAcik(false)} baslik="Zamanlayıcı" sagKapat="Kapat">
      <Yazi kalinlik="kalin">Görünüm</Yazi>
      <View style={stiller.haplar}>
        <SecenekHapi etiket="Kadran" secili={!dijital} onPress={() => ayarDegis({ gorunum: 'kadran' })} />
        <SecenekHapi etiket="Dijital" secili={dijital} onPress={() => ayarDegis({ gorunum: 'dijital' })} />
      </View>
      <Yazi tur="ikincil">
        {dijital
          ? 'Rakamları yukarı aşağı kaydırarak dakika ve saniyeyi seçersin.'
          : 'Süreye dokununca kadran açılır; tutamağı çevirerek dakikayı seçersin (en çok 60).'}
      </Yazi>

      <Yazi kalinlik="kalin">Süre dolunca</Yazi>
      <View style={stiller.haplar}>
        <SecenekHapi etiket="Alarm" secili={ayar.cal === 'alarm'} onPress={() => ayarDegis({ cal: 'alarm' })} />
        <SecenekHapi
          etiket="Bildirim"
          secili={ayar.cal === 'bildirim'}
          onPress={() => ayarDegis({ cal: 'bildirim' })}
        />
      </View>
      <Yazi tur="ikincil">
        {ayar.cal === 'alarm'
          ? alarmDestegi
            ? 'Telefon sessizde olsa da çalar; sen durdurana kadar sürer.'
            : 'Bu telefonda alarm yok; bildirim olarak çalar.'
          : 'Kısa bir ses ve ekranda bildirim.'}
      </Yazi>

      <Yazi kalinlik="kalin">Ses</Yazi>
      <SesSecici ses={ayar.ses} onDegis={(ses) => ayarDegis({ ses })} alarm={ayar.cal === 'alarm' && alarmDestegi} />
      {!!sure && <Yazi tur="ikincil">Değişiklikler bir sonraki zamanlayıcıda geçerli olur.</Yazi>}
    </AltSayfa>
  );

  const ayarDugmesi = (
    <Pressable
      onPress={() => setAyarAcik(true)}
      accessibilityRole="button"
      accessibilityLabel="Zamanlayıcı ayarları"
      hitSlop={6}
      style={({ pressed }) => [stiller.ayarDugmesi, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name="settings-outline" size={22} color={renk.ikincil} />
    </Pressable>
  );

  /** Ayarlamayı bitir: süre saklanır (bir dahaki açılışta da gelir). */
  const tamam = () => {
    setAyarlaniyor(false);
    void ayarYaz(kapi, 'zamanlayici', { ...ayar, sonMs: kurulacak }).catch(hataGoster);
  };

  // P-44: kadranı ayarlarken kadranın ortasında yalnız "Tamam"; başlatmak satırdaki Başlat'la.
  if (ayarlaniyor && !dijital && !sure) {
    return (
      <View>
        <Kadran dk={kadranDakikasi(ms)} onDegis={(yeni) => setMs(Math.max(1, yeni) * 60_000)} onTamam={tamam} />
        {ayarSayfasi}
      </View>
    );
  }

  const durdu = !!sure && duraklatildiMi(sure);
  const gosterilen = sure ? kalanMs(sure, simdiMs) : kurulacak;
  const gecen = sure ? ilerleme(sure, simdiMs) : null;
  // Kadranda küçük halka: kurarken seçilen süre, çalışırken kalan.
  const halkaOrani = sure ? (gecen === null ? null : 1 - gecen) : kadranDakikasi(ms) / KADRAN_DK;
  const { dk, sn } = carkDegeri(ms);
  // Alt yazının yeri hep ayrılır (P-44: "Duraklatıldı" gelince yükseklik değişmesin).
  const altYazi = sure ? (durdu ? 'Duraklatıldı' : `${sure.ad} · çalışıyor`) : 'Zamanlayıcı';

  return (
    <View style={stiller.panel}>
      <View style={stiller.satir}>
        {!dijital && (
          <Halka oran={halkaOrani} boyut={52} kalinlik={6} dolu={durdu ? renk.soluk : renk.ana}>
            <Ionicons name="timer-outline" size={20} color={durdu ? renk.soluk : renk.ana} />
          </Halka>
        )}
        {dijital && ayarlaniyor && !sure ? (
          <View style={stiller.carklar}>
            <Cark
              deger={dk}
              adet={KADRAN_DK + 1}
              onDegis={(yeni) => setMs(carkMs(yeni, yeni === KADRAN_DK ? 0 : sn))}
              etiket="Zamanlayıcı, dakika"
              birim="dakika"
            />
            <Yazi kalinlik="kalin" style={stiller.ikiNokta}>
              :
            </Yazi>
            <Cark
              deger={dk === KADRAN_DK ? 0 : sn}
              adet={60}
              onDegis={(yeni) => setMs(carkMs(dk === KADRAN_DK ? KADRAN_DK - 1 : dk, yeni))}
              etiket="Zamanlayıcı, saniye"
              birim="saniye"
            />
          </View>
        ) : (
          <View
            style={stiller.esnek}
            accessible
            accessibilityLabel={`${altYazi}, ${zamanlayiciSuresiMetni(gosterilen)}${sure ? ' kaldı' : ''}`}
          >
            <Yazi kalinlik="kalin" renk={durdu ? renk.ikincil : renk.yazi} style={stiller.rakam}>
              {geriSayimMetni(gosterilen)}
            </Yazi>
            <Yazi tur="etiket" numberOfLines={1}>
              {altYazi}
            </Yazi>
          </View>
        )}
        {ayarDugmesi}
      </View>

      <View style={stiller.dugmeler}>
        {sure ? (
          <>
            <Dugme
              etiket={durdu ? 'Devam' : 'Duraklat'}
              onPress={() =>
                void (durdu ? zamanlayiciDevam(kapi, sure.id) : zamanlayiciDuraklat(kapi, sure.id)).catch(hataGoster)
              }
              style={stiller.dugme}
            />
            <Dugme
              tur="ikincil"
              etiket="İptal"
              onPress={() =>
                void animsaticiSil(kapi, sure.id)
                  .then(() => kisaMesaj(`İptal edildi: ${sure.ad}`))
                  .catch(hataGoster)
              }
              style={stiller.dugme}
            />
          </>
        ) : ayarlaniyor ? (
          <Dugme etiket="Tamam" onPress={tamam} style={stiller.dugme} />
        ) : (
          <>
            <Dugme tur="ikincil" etiket="Ayarla" onPress={() => setAyarlaniyor(true)} style={stiller.dugme} />
            <Dugme
              etiket="Başlat"
              onPress={() => void baslat()}
              pasif={calisiyor || kurulacak <= 0}
              style={stiller.dugme}
            />
          </>
        )}
      </View>
      {ayarSayfasi}
    </View>
  );
}

const stiller = StyleSheet.create({
  panel: { gap: 10 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60 },
  esnek: { flex: 1, minWidth: 0 },
  ayarDugmesi: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carklar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ikiNokta: { fontSize: 34, lineHeight: 40 },
  rakam: { fontSize: 36, lineHeight: 42, fontVariant: ['tabular-nums'] },
  dugmeler: { flexDirection: 'row', gap: 10 },
  dugme: { flex: 1, minHeight: 52 },
  haplar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
