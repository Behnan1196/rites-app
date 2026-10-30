// Giriş'teki tek zamanlayıcı (pilot 23 Ekim; P-31 / P-42 / P-43 / P-44; P-70 sade). Anımsatıcılar
// kutusunda (ve Anımsatıcılar ekranında) her zaman görünür. Tek satır: solda süre ve alt yazı,
// sağda düğme ve ⚙.
//
// - Dururken: süre · Başlat · ⚙. Süreye dokununca rakamlar saat : dakika : saniye çarklarına
//   döner; altta Tamam · Başlat · ⚙ ("Ayarla" düğmesi yok; P-70).
// - Çalışırken: geri sayım · Duraklat / Devam · İptal (✕). Alt yazı "Duraklatıldı" olur.
// - ⚙: süre dolunca (alarm / bildirim), ses. Kadran kalktı; 1 saat sınırı yok (en çok 23:59:59).
// - Bildirimle çalan zamanlayıcı bir kez çalar ve kendiliğinden biter (ertelemesi yok).
//
// En son ayarlanan süre gelir (ilk seferde 5 dk). Ad süredir ("5 dk"). Biri çalışırken
// yenisi kurulmaz.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Animsatici } from '@/mantik/animsatici';
import {
  duraklatildiMi,
  geriSayimMetni,
  kalanMs,
  parcalardanMs,
  sureParcalari,
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

  const hataGoster = (e: unknown) => {
    console.error('Zamanlayıcı değişikliği kaydedilemedi', e);
    kisaMesaj('Kaydedilemedi. Yeniden dene.');
  };
  const ayarDegis = (alanlar: Partial<ZamanlayiciAyari>) =>
    void ayarYaz(kapi, 'zamanlayici', { ...ayar, ...alanlar }).catch(hataGoster);

  const baslat = async () => {
    if (calisiyor || ms <= 0) return;
    setCalisiyor(true);
    setAyarlaniyor(false);
    try {
      const alarm = ayar.cal === 'alarm' && alarmDestegi;
      if (alarm) await izinIste();
      await zamanlayiciKur(kapi, {
        id: yeniKimlik(),
        ad: zamanlayiciSuresiMetni(ms),
        ms,
        alarm,
        ses: ayar.ses,
      });
      await bildirimIzni(true);
      await ayarYaz(kapi, 'zamanlayici', { ...ayar, sonMs: ms });
    } catch (e) {
      console.error('Zamanlayıcı kurulamadı', e);
      kisaMesaj('Kurulamadı. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  /** Ayarlamayı bitir: süre saklanır (bir dahaki açılışta da gelir). */
  const tamam = () => {
    setAyarlaniyor(false);
    void ayarYaz(kapi, 'zamanlayici', { ...ayar, sonMs: ms }).catch(hataGoster);
  };

  const ayarSayfasi = (
    <AltSayfa gorunur={ayarAcik} onKapat={() => setAyarAcik(false)} baslik="Zamanlayıcı" sagKapat="Kapat">
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
            : 'Bu telefonda alarm yok; bir kez bildirim gelir ve zamanlayıcı kendiliğinden biter.'
          : 'Bir kez kısa bir ses ve bildirim gelir; zamanlayıcı kendiliğinden biter.'}
      </Yazi>

      <Yazi kalinlik="kalin">Ses</Yazi>
      <SesSecici ses={ayar.ses} onDegis={(ses) => ayarDegis({ ses })} alarm={ayar.cal === 'alarm' && alarmDestegi} />
      {!!sure && <Yazi tur="ikincil">Değişiklikler bir sonraki zamanlayıcıda geçerli olur.</Yazi>}
    </AltSayfa>
  );

  const ayarDugmesi = (
    <YuvarlakDugme ikon="settings-outline" etiket="Zamanlayıcı ayarları" onPress={() => setAyarAcik(true)} />
  );

  // Ayarlarken: rakamlar çarka döner (saat : dakika : saniye); altta Tamam · Başlat · ⚙.
  if (ayarlaniyor && !sure) {
    const { sa, dk, sn } = sureParcalari(ms);
    return (
      <View style={stiller.panel}>
        <View style={stiller.carklar}>
          <Cark
            deger={sa}
            adet={24}
            onDegis={(y) => setMs(parcalardanMs(y, dk, sn))}
            etiket="Zamanlayıcı, saat"
            birim="saat"
          />
          <Yazi kalinlik="kalin" style={stiller.ikiNokta}>
            :
          </Yazi>
          <Cark
            deger={dk}
            adet={60}
            onDegis={(y) => setMs(parcalardanMs(sa, y, sn))}
            etiket="Zamanlayıcı, dakika"
            birim="dakika"
          />
          <Yazi kalinlik="kalin" style={stiller.ikiNokta}>
            :
          </Yazi>
          <Cark
            deger={sn}
            adet={60}
            onDegis={(y) => setMs(parcalardanMs(sa, dk, y))}
            etiket="Zamanlayıcı, saniye"
            birim="saniye"
          />
        </View>
        <View style={stiller.satir}>
          <Dugme tur="ikincil" etiket="Tamam" onPress={tamam} style={stiller.esnekDugme} />
          <Dugme
            etiket="Başlat"
            onPress={() => void baslat()}
            pasif={calisiyor || ms <= 0}
            style={stiller.esnekDugme}
          />
          {ayarDugmesi}
        </View>
        {ayarSayfasi}
      </View>
    );
  }

  const durdu = !!sure && duraklatildiMi(sure);
  const gosterilen = sure ? kalanMs(sure, simdiMs) : ms;
  // Alt yazının yeri hep ayrılır (P-44: "Duraklatıldı" gelince yükseklik değişmesin).
  const altYazi = sure ? (durdu ? 'Duraklatıldı' : `${sure.ad} · çalışıyor`) : 'Zamanlayıcı';
  const rakam = (
    <>
      <Yazi
        kalinlik="kalin"
        renk={durdu ? renk.ikincil : renk.yazi}
        style={stiller.rakam}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {geriSayimMetni(gosterilen)}
      </Yazi>
      <Yazi tur="etiket" numberOfLines={1}>
        {altYazi}
      </Yazi>
    </>
  );

  return (
    <View style={stiller.satir}>
      {sure ? (
        <View
          style={stiller.esnek}
          accessible
          accessibilityLabel={`${altYazi}, ${zamanlayiciSuresiMetni(gosterilen)} kaldı`}
        >
          {rakam}
        </View>
      ) : (
        <Pressable
          onPress={() => setAyarlaniyor(true)}
          accessibilityRole="button"
          accessibilityLabel={`Zamanlayıcı, ${zamanlayiciSuresiMetni(ms)}`}
          accessibilityHint="Süreyi ayarlamak için dokun"
          style={({ pressed }) => [stiller.esnek, pressed && { opacity: 0.6 }]}
        >
          {rakam}
        </Pressable>
      )}
      {sure ? (
        <>
          <Dugme
            etiket={durdu ? 'Devam' : 'Duraklat'}
            onPress={() =>
              void (durdu ? zamanlayiciDevam(kapi, sure.id) : zamanlayiciDuraklat(kapi, sure.id)).catch(hataGoster)
            }
            style={stiller.dugme}
          />
          <YuvarlakDugme
            ikon="close"
            etiket="Zamanlayıcıyı iptal et"
            onPress={() =>
              void animsaticiSil(kapi, sure.id)
                .then(() => kisaMesaj(`İptal edildi: ${sure.ad}`))
                .catch(hataGoster)
            }
          />
        </>
      ) : (
        <>
          <Dugme etiket="Başlat" onPress={() => void baslat()} pasif={calisiyor || ms <= 0} style={stiller.dugme} />
          {ayarDugmesi}
        </>
      )}
      {ayarSayfasi}
    </View>
  );
}

function YuvarlakDugme({
  ikon,
  etiket,
  onPress,
}: {
  ikon: ComponentProps<typeof Ionicons>['name'];
  etiket: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      hitSlop={6}
      style={({ pressed }) => [stiller.yuvarlak, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={ikon} size={22} color={renk.ikincil} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  panel: { gap: 10 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 },
  esnek: { flex: 1, minWidth: 0 },
  yuvarlak: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carklar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ikiNokta: { fontSize: 30, lineHeight: 36 },
  rakam: { fontSize: 36, lineHeight: 42, fontVariant: ['tabular-nums'] },
  dugme: { minHeight: 52, paddingHorizontal: 18 },
  esnekDugme: { flex: 1, minHeight: 52 },
  haplar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
