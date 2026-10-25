// Giriş'teki tek zamanlayıcı (pilot 23 Ekim; P-31 / P-32 / P-42 / P-43). Anımsatıcılar
// kutusunda (ve Anımsatıcılar ekranında) her zaman görünür, açıp kapatılmaz. Tek ayar
// düğmesi ⚙: görünüm (kadran / dijital), süre dolunca (alarm / bildirim), ses.
//
// - Dijital: ayrı form yok; göstergenin rakamları çarktır (dakika : saniye), yanında
//   Başlat. Çalışırken aynı yerde geri sayım, Duraklat / Devam ve İptal.
// - Kadran: satırda süre ve Başlat; süreye dokununca kadran açılır (tutamak çevrilir).
//   Çalışırken küçülen halkalı satır (`ZamanlayiciSatiri`).
//
// En son kurulan süre gelir (ilk seferde 5 dk). Ad süredir ("5 dk"). Biri çalışırken
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
import { ZamanlayiciSatiri } from './ZamanlayiciSatiri';

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
  const [kadranAcik, setKadranAcik] = useState(false);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const dijital = ayar.gorunum === 'dijital';
  // Kadran tam dakika; dijitalde saniye de.
  const kurulacak = dijital ? ms : kadranDakikasi(ms) * 60_000;

  const hata = (metin: string) => (e: unknown) => {
    console.error(metin, e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const ayarDegis = (alanlar: Partial<ZamanlayiciAyari>) =>
    void ayarYaz(kapi, 'zamanlayici', { ...ayar, ...alanlar }).catch(hata('Zamanlayıcı ayarı kaydedilemedi'));

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
      setKadranAcik(false);
    } catch (e) {
      console.error('Zamanlayıcı kurulamadı', e);
      kisaMesaj('Kurulamadı. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

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

  let govde: React.ReactNode;
  if (sure && !dijital) {
    govde = (
      <View style={stiller.satir}>
        <View style={stiller.esnek}>
          <ZamanlayiciSatiri a={sure} simdiMs={simdiMs} />
        </View>
        {ayarDugmesi}
      </View>
    );
  } else if (sure) {
    govde = <DijitalCalisan a={sure} simdiMs={simdiMs} ayarDugmesi={ayarDugmesi} />;
  } else if (dijital) {
    const { dk, sn } = carkDegeri(ms);
    govde = (
      <View style={stiller.satir}>
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
        <BaslatDugmesi
          onPress={() => void baslat()}
          pasif={calisiyor || kurulacak <= 0}
          etiket={zamanlayiciSuresiMetni(kurulacak)}
        />
        {ayarDugmesi}
      </View>
    );
  } else {
    const dk = kadranDakikasi(ms);
    govde = (
      <>
        <View style={stiller.satir}>
          <Pressable
            onPress={() => setKadranAcik((a) => !a)}
            accessibilityRole="button"
            accessibilityLabel={`Zamanlayıcı, ${dk} dakika. ${kadranAcik ? 'Kadranı kapat' : 'Süreyi değiştir'}`}
            accessibilityState={{ expanded: kadranAcik }}
            style={({ pressed }) => [stiller.sure, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="timer-outline" size={26} color={renk.ana} />
            <Yazi kalinlik="kalin" style={stiller.rakam}>{`${String(dk).padStart(2, '0')}:00`}</Yazi>
            <Ionicons name={kadranAcik ? 'chevron-up' : 'chevron-down'} size={20} color={renk.soluk} />
          </Pressable>
          {!kadranAcik && (
            <BaslatDugmesi onPress={() => void baslat()} pasif={calisiyor} etiket={zamanlayiciSuresiMetni(kurulacak)} />
          )}
          {ayarDugmesi}
        </View>
        {kadranAcik && (
          <Kadran
            dk={dk}
            onDegis={(yeni) => setMs(Math.max(1, yeni) * 60_000)}
            onBaslat={() => void baslat()}
            pasif={calisiyor}
          />
        )}
      </>
    );
  }

  return (
    <View>
      {govde}
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
    </View>
  );
}

function BaslatDugmesi({ onPress, pasif, etiket }: { onPress: () => void; pasif: boolean; etiket: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pasif}
      accessibilityRole="button"
      accessibilityLabel={`Başlat, ${etiket}`}
      accessibilityState={{ disabled: pasif }}
      style={({ pressed }) => [stiller.baslat, pasif && { opacity: 0.4 }, pressed && { opacity: 0.75 }]}
    >
      <Ionicons name="play" size={22} color={renk.yuzey} />
      <Yazi kalinlik="kalin" renk={renk.yuzey}>
        Başlat
      </Yazi>
    </Pressable>
  );
}

/** Dijitalde çalışan zamanlayıcı: aynı yerde büyük geri sayım, Duraklat / Devam, İptal. */
function DijitalCalisan({ a, simdiMs, ayarDugmesi }: { a: Animsatici; simdiMs: number; ayarDugmesi: React.ReactNode }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const durdu = duraklatildiMi(a);
  const kalan = kalanMs(a, simdiMs);
  const hata = (e: unknown) => {
    console.error('Zamanlayıcı değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  return (
    <View style={stiller.satir}>
      <View
        style={stiller.esnek}
        accessible
        accessibilityLabel={`${zamanlayiciSuresiMetni(kalan)} kaldı${durdu ? ', duraklatıldı' : ''}`}
      >
        <Yazi kalinlik="kalin" renk={durdu ? renk.ikincil : renk.yazi} style={stiller.buyukRakam}>
          {geriSayimMetni(kalan)}
        </Yazi>
        <Yazi tur="etiket">{durdu ? 'Duraklatıldı' : a.ad}</Yazi>
      </View>
      <Pressable
        onPress={() => void (durdu ? zamanlayiciDevam(kapi, a.id) : zamanlayiciDuraklat(kapi, a.id)).catch(hata)}
        accessibilityRole="button"
        accessibilityLabel={durdu ? 'Devam et' : 'Duraklat'}
        style={({ pressed }) => [stiller.yuvarlak, pressed && { opacity: 0.75 }]}
      >
        <Ionicons name={durdu ? 'play' : 'pause'} size={26} color={renk.yuzey} />
      </Pressable>
      <Dugme
        tur="yazi"
        etiket="İptal"
        onPress={() =>
          void animsaticiSil(kapi, a.id)
            .then(() => kisaMesaj(`İptal edildi: ${a.ad}`))
            .catch(hata)
        }
      />
      {ayarDugmesi}
    </View>
  );
}

const stiller = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  sure: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56 },
  rakam: { fontSize: 30, lineHeight: 36, fontVariant: ['tabular-nums'] },
  buyukRakam: { fontSize: 36, lineHeight: 42, fontVariant: ['tabular-nums'] },
  baslat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    backgroundColor: renk.ana,
  },
  yuvarlak: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haplar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
