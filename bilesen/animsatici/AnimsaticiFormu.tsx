// Anımsatıcı ekle / düzenle (AN-1; pilot 17 Ekim'de yeniden): alttan sayfa,
// solda Vazgeç, sağda Kaydet. İlaç gibi düzenli olanlar: ad, 1 dakika
// hassasiyetinde saatler, hafta günleri; uyarı türü (Bildirim / Alarm) ve
// ertele süresi.
// Pilot 23 Ekim: "Süre sonra" türü buradan çıktı; yerine Zamanlayıcı
// (ZamanlayiciSayfasi) geldi.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ALARM_ACIKLAMASI } from '@/mantik/alarm';
import {
  ERTELEME_SECENEKLERI,
  dakika,
  formHatasi,
  HER_GUN,
  saatleriSirala,
  saatMetni,
  VARSAYILAN_ERTELEME,
  type Animsatici,
} from '@/mantik/animsatici';
import { GUN_KISA } from '@/mantik/tarih';
import { animsaticiEkle, animsaticiGuncelle, animsaticiSil } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { SesSecici } from '../SesSecici';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Yazi } from '../Yazi';

interface Form {
  ad: string;
  saatler: string[];
  gunler: number[];
  alarm: boolean;
  erteleDk: number;
  ses: string | null;
}

function simdiSaati(): string {
  const d = new Date();
  return saatMetni(d.getHours() * 60 + d.getMinutes());
}

/** "+ Saat ekle": son saatten bir saat sonrası (aynı saat iki kez olmasın). */
function sonrakiSaat(saatler: readonly string[]): string {
  const son = saatler[saatler.length - 1];
  if (!son) return simdiSaati();
  let dk = dakika(son) + 60;
  while (saatler.includes(saatMetni(dk))) dk += 1;
  return saatMetni(dk);
}

function ilkForm(duzenlenen: Animsatici | null): Form {
  if (duzenlenen)
    return {
      ad: duzenlenen.ad,
      saatler: [...duzenlenen.saatler],
      gunler: [...duzenlenen.gunler],
      alarm: duzenlenen.alarm,
      erteleDk: duzenlenen.erteleDk,
      ses: duzenlenen.ses ?? null,
    };
  return {
    ad: '',
    saatler: [simdiSaati()],
    gunler: [...HER_GUN],
    alarm: false,
    erteleDk: VARSAYILAN_ERTELEME,
    ses: null,
  };
}

function AnimsaticiFormu({
  gorunur,
  onKapat,
  duzenlenen,
}: {
  gorunur: boolean;
  onKapat: () => void;
  /** Verilirse düzenleme: form dolu açılır, altta "Anımsatıcıyı sil" var. */
  duzenlenen: Animsatici | null;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const [baslangic] = useState(() => ilkForm(duzenlenen));
  const [form, setForm] = useState<Form>(baslangic);
  const [alarmDokunuldu, setAlarmDokunuldu] = useState(!!duzenlenen);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [silSoruluyor, setSilSoruluyor] = useState(false);
  const degisti = useMemo(() => JSON.stringify(form) !== JSON.stringify(baslangic), [form, baslangic]);
  const guncelle = (f: Partial<Form>) => {
    setForm((x) => ({ ...x, ...f }));
    setHata(null);
  };

  const alarm = alarmDestegi && alarmDokunuldu && form.alarm;
  const alarmSec = (a: boolean) => {
    setAlarmDokunuldu(true);
    guncelle({ alarm: a });
    if (a) void izinIste();
  };

  const kaydet = async () => {
    if (calisiyor) return;
    const h = formHatasi(form.ad, form.saatler, form.gunler);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      const a: Animsatici = {
        id: duzenlenen?.id ?? yeniKimlik(),
        ad: form.ad.trim(),
        saatler: saatleriSirala(form.saatler),
        gunler: [...form.gunler].sort(),
        sesli: true,
        erteleDk: form.erteleDk,
        alarm,
        bitis: null,
        ses: form.ses,
      };
      if (duzenlenen) await animsaticiGuncelle(kapi, a);
      else await animsaticiEkle(kapi, a);
      await bildirimIzni(true);
      kisaMesaj(duzenlenen ? `Kaydedildi: ${a.ad}` : `Anımsatıcı eklendi: ${a.ad}`);
      onKapat();
    } catch (e) {
      console.error('Anımsatıcı kaydedilemedi', e);
      kisaMesaj('Kaydedilemedi. Yeniden dene.');
    } finally {
      setCalisiyor(false);
    }
  };

  const sil = async () => {
    if (!duzenlenen) return;
    setSilSoruluyor(false);
    try {
      await animsaticiSil(kapi, duzenlenen.id);
      kisaMesaj(`Silindi: ${duzenlenen.ad}`);
      onKapat();
    } catch (e) {
      console.error('Anımsatıcı silinemedi', e);
      kisaMesaj('Silinemedi. Yeniden dene.');
    }
  };

  const saatDegis = (i: number, saat: string) =>
    guncelle({ saatler: form.saatler.map((s, j) => (j === i ? saat : s)) });
  const gunDegis = (g: number) =>
    guncelle({ gunler: form.gunler.includes(g) ? form.gunler.filter((x) => x !== g) : [...form.gunler, g].sort() });

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik={duzenlenen ? 'Düzenle' : 'Anımsatıcı'}
      solVazgec
      sagEylem={{ etiket: 'Kaydet', onPress: () => void kaydet(), pasif: calisiyor }}
      degisti={degisti}
      onay={
        silSoruluyor && duzenlenen
          ? {
              baslik: 'Anımsatıcı silinsin mi?',
              aciklama: duzenlenen.ad,
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void sil() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSoruluyor(false) },
              ],
            }
          : null
      }
    >
      <>
        <GirisAlani
          etiket="Neyi anımsatalım?"
          value={form.ad}
          onChangeText={(ad) => guncelle({ ad })}
          placeholder="Örneğin: Tansiyon ilacı 5 mg"
          returnKeyType="done"
          hata={hata && form.ad.trim() === '' ? hata : null}
        />
        <Bolum>
          <Yazi kalinlik="kalin" accessibilityRole="header">
            Saatler
          </Yazi>
          {form.saatler.map((s, i) => (
            <View key={i} style={stiller.satir}>
              <View style={stiller.esnek}>
                <SaatSecici
                  saat={s}
                  onDegis={(saat) => saatDegis(i, saat)}
                  kompakt
                  dakikaAraligi={1}
                  etiket={`${i + 1}. saat`}
                />
              </View>
              {form.saatler.length > 1 && (
                <Pressable
                  onPress={() => guncelle({ saatler: form.saatler.filter((_, j) => j !== i) })}
                  accessibilityRole="button"
                  accessibilityLabel={`${s} saatini kaldır`}
                  hitSlop={8}
                  style={stiller.kaldir}
                >
                  <Ionicons name="close-circle" size={26} color={renk.soluk} />
                </Pressable>
              )}
            </View>
          ))}
          <Dugme
            tur="yazi"
            etiket="+ Saat ekle"
            onPress={() => guncelle({ saatler: [...form.saatler, sonrakiSaat(form.saatler)] })}
          />
        </Bolum>
        <Bolum>
          <Yazi kalinlik="kalin" accessibilityRole="header">
            Günler
          </Yazi>
          <View style={stiller.gunler}>
            {GUN_KISA.map((ad, g) => {
              const secili = form.gunler.includes(g);
              return (
                <Pressable
                  key={ad}
                  onPress={() => gunDegis(g)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: secili }}
                  accessibilityLabel={ad}
                  style={[stiller.gun, secili && stiller.gunSecili]}
                >
                  <Yazi tur="etiket" kalinlik="kalin" renk={secili ? renk.yuzey : renk.yazi}>
                    {ad}
                  </Yazi>
                </Pressable>
              );
            })}
          </View>
        </Bolum>
        {hata && form.ad.trim() !== '' && (
          <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
            {hata}
          </Yazi>
        )}
      </>

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Nasıl uyarsın?
        </Yazi>
        <View style={stiller.ikili}>
          <SecenekHapi etiket="Bildirim" secili={!alarm} onPress={() => alarmSec(false)} style={stiller.esnek} />
          {alarmDestegi && (
            <SecenekHapi etiket="Alarm" secili={alarm} onPress={() => alarmSec(true)} style={stiller.esnek} />
          )}
        </View>
        {alarm && <Yazi tur="ikincil">{ALARM_ACIKLAMASI}</Yazi>}
        {!alarm && (
          <>
            <Yazi kalinlik="kalin">Ses</Yazi>
            <SesSecici ses={form.ses} onDegis={(ses) => guncelle({ ses })} />
          </>
        )}
        {/* Pilot 19 Ekim: erteleme yalnız alarmda; bildirim tek ve düğmesiz. */}
        {alarm && (
          <>
            <Yazi kalinlik="kalin">Ertele dersem</Yazi>
            <View style={stiller.cipler}>
              {ERTELEME_SECENEKLERI.map((dk) => (
                <SecenekHapi
                  key={dk}
                  etiket={`${dk} dk`}
                  secili={form.erteleDk === dk}
                  onPress={() => guncelle({ erteleDk: dk })}
                />
              ))}
            </View>
          </>
        )}
      </Bolum>

      {duzenlenen && <Dugme tur="tehlike" etiket="Anımsatıcıyı sil" onPress={() => setSilSoruluyor(true)} />}
    </AltSayfa>
  );
}

/** `const form = useAnimsaticiFormu(); form.ac(); form.ac(anımsatıcı); {form.oge}` */
export function useAnimsaticiFormu() {
  const [durum, setDurum] = useState<{
    no: number;
    acik: boolean;
    duzenlenen: Animsatici | null;
  } | null>(null);
  /** Anımsatıcı verilirse düzenleme açılır. */
  const ac = useCallback(
    (duzenlenen: Animsatici | null = null) => setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true, duzenlenen })),
    [],
  );
  const oge = durum ? (
    <AnimsaticiFormu
      key={durum.no}
      duzenlenen={durum.duzenlenen}
      gorunur={durum.acik}
      onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))}
    />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  kaldir: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  ikili: { flexDirection: 'row', gap: 8 },
  esnek: { flex: 1 },
  gunler: { flexDirection: 'row', gap: 6 },
  gun: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gunSecili: { backgroundColor: renk.ana, borderColor: renk.ana },
});
