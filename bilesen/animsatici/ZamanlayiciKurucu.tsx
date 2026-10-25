// Giriş'teki tek zamanlayıcı (pilot 23 Ekim, P-31 / P-32 / P-42): form yok, Anımsatıcılar
// kutusunun içinde açılır; en son kurulan süreyle gelir (ilk seferde 5 dk). Görünüm
// ayara göre kadran (tutamak çevrilir, 1–60 dk) ya da dijital çark (dakika ve saniye).
// Sağ üstteki ⚙: görünüm, nasıl çalsın (alarm / bildirim), ses. Ad süredir ("5 dk").
// Zamanlayıcı çalışırken yenisi kurulmaz (kutuda tek satır).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  carkDegeri,
  carkMs,
  kadranDakikasi,
  KADRAN_DK,
  zamanlayiciAyariCoz,
  zamanlayiciSuresiMetni,
  type ZamanlayiciAyari,
} from '@/mantik/zamanlayici';
import { ayarYaz } from '@/veri/ayar';
import { zamanlayiciKur } from '@/veri/animsaticilar';
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

export function ZamanlayiciKurucu({ onKapat }: { onKapat: () => void }) {
  const ham = useAyar('zamanlayici');
  if (ham.yukleniyor) return null;
  return <Kurucu ayar={zamanlayiciAyariCoz(ham.veri)} onKapat={onKapat} />;
}

function Kurucu({ ayar, onKapat }: { ayar: ZamanlayiciAyari; onKapat: () => void }) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const [ms, setMs] = useState(ayar.sonMs);
  const [ayarAcik, setAyarAcik] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const dijital = ayar.gorunum === 'dijital';
  // Kadran tam dakika; dijitalde saniye de.
  const kurulacak = dijital ? ms : kadranDakikasi(ms) * 60_000;

  const ayarDegis = (alanlar: Partial<ZamanlayiciAyari>) =>
    void ayarYaz(kapi, 'zamanlayici', { ...ayar, ...alanlar }).catch((e: unknown) => {
      console.error('Zamanlayıcı ayarı kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    });

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
      onKapat();
    } catch (e) {
      console.error('Zamanlayıcı kurulamadı', e);
      kisaMesaj('Kurulamadı. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  const { dk, sn } = carkDegeri(ms);

  return (
    <View>
      {dijital ? (
        <View style={stiller.dijital}>
          <View style={stiller.carklar}>
            <View style={stiller.carkSutunu}>
              <Cark
                deger={dk}
                adet={KADRAN_DK + 1}
                onDegis={(yeni) => setMs(carkMs(yeni, yeni === KADRAN_DK ? 0 : sn))}
                etiket="Dakika"
                birim="dakika"
              />
              <Yazi tur="etiket">dk</Yazi>
            </View>
            <Yazi kalinlik="kalin" style={stiller.ikiNokta}>
              :
            </Yazi>
            <View style={stiller.carkSutunu}>
              <Cark
                deger={dk === KADRAN_DK ? 0 : sn}
                adet={60}
                onDegis={(yeni) => setMs(carkMs(dk === KADRAN_DK ? KADRAN_DK - 1 : dk, yeni))}
                etiket="Saniye"
                birim="saniye"
              />
              <Yazi tur="etiket">sn</Yazi>
            </View>
          </View>
          <Dugme
            etiket="Başlat"
            onPress={() => void baslat()}
            pasif={calisiyor || kurulacak <= 0}
            style={stiller.baslat}
          />
        </View>
      ) : (
        <Kadran
          dk={kadranDakikasi(ms)}
          onDegis={(yeni) => setMs(Math.max(1, yeni) * 60_000)}
          onBaslat={() => void baslat()}
          pasif={calisiyor}
        />
      )}
      <Pressable
        onPress={() => setAyarAcik(true)}
        accessibilityRole="button"
        accessibilityLabel="Zamanlayıcı ayarları"
        hitSlop={6}
        style={({ pressed }) => [stiller.ayarDugmesi, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="settings-outline" size={24} color={renk.ikincil} />
      </Pressable>

      <AltSayfa gorunur={ayarAcik} onKapat={() => setAyarAcik(false)} baslik="Zamanlayıcı" sagKapat="Kapat">
        <Yazi kalinlik="kalin">Görünüm</Yazi>
        <View style={stiller.haplar}>
          <SecenekHapi etiket="Kadran" secili={!dijital} onPress={() => ayarDegis({ gorunum: 'kadran' })} />
          <SecenekHapi etiket="Dijital" secili={dijital} onPress={() => ayarDegis({ gorunum: 'dijital' })} />
        </View>
        <Yazi tur="ikincil">
          {dijital
            ? 'Dakika ve saniyeyi çarkı kaydırarak seçersin.'
            : 'Tutamağı çevirerek dakikayı seçersin (en çok 60).'}
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
      </AltSayfa>
    </View>
  );
}

const stiller = StyleSheet.create({
  ayarDugmesi: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dijital: { alignItems: 'center', gap: 12, paddingTop: 4 },
  carklar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  carkSutunu: { alignItems: 'center', gap: 2 },
  ikiNokta: { fontSize: 38, lineHeight: 46, marginBottom: 20 },
  baslat: { alignSelf: 'stretch' },
  haplar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
