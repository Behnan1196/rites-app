// Anımsatıcı ekle / düzenle (AN-1; pilot 17 Ekim'de yeniden): alttan sayfa,
// solda Vazgeç, sağda Kaydet.
//
// İki tür:
// - "Süre sonra": hızlı zamanlayıcı (ocağın altı). Hazır süreler ya da dakika;
//   ad isteğe bağlı (yoksa "20 dk"). Bir kez çalar, durdurulunca silinir.
// - "Saatinde": ilaç gibi düzenli olanlar. Ad, 1 dakika hassasiyetinde saatler,
//   hafta günleri.
// İkisinde de uyarı türü (Bildirim / Alarm) ve ertele süresi seçilir.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ALARM_ACIKLAMASI } from '@/mantik/alarm';
import {
  EN_UZUN_SURE,
  ERTELEME_SECENEKLERI,
  dakika,
  formHatasi,
  HER_GUN,
  saatleriSirala,
  saatMetni,
  SURE_SECENEKLERI,
  sureMetni,
  VARSAYILAN_ERTELEME,
  VARSAYILAN_SURE,
  type Animsatici,
} from '@/mantik/animsatici';
import { GUN_KISA } from '@/mantik/tarih';
import { animsaticiEkle, animsaticiGuncelle, animsaticiSil } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { yeniKimlik } from '@/veri/kimlik';
import { useSimdiMs } from '@/veri/useSimdi';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { BolumluDugme } from '../BolumluDugme';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { ArtiEksi, Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Yazi } from '../Yazi';

export type AnimsaticiTuru = 'sure' | 'saat';

interface Form {
  tur: AnimsaticiTuru;
  ad: string;
  saatler: string[];
  gunler: number[];
  sureDk: number;
  alarm: boolean;
  erteleDk: number;
}

/** En son hangi tür kullanıldıysa yeni anımsatıcı onunla açılır (oturum boyunca). */
let sonTur: AnimsaticiTuru = 'saat';

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

function ilkForm(duzenlenen: Animsatici | null, tur: AnimsaticiTuru | undefined): Form {
  if (duzenlenen)
    return {
      tur: 'saat',
      ad: duzenlenen.ad,
      saatler: [...duzenlenen.saatler],
      gunler: [...duzenlenen.gunler],
      sureDk: VARSAYILAN_SURE,
      alarm: duzenlenen.alarm,
      erteleDk: duzenlenen.erteleDk,
    };
  const t = tur ?? sonTur;
  return {
    tur: t,
    ad: '',
    saatler: [simdiSaati()],
    gunler: [...HER_GUN],
    sureDk: VARSAYILAN_SURE,
    alarm: false,
    erteleDk: VARSAYILAN_ERTELEME,
  };
}

function AnimsaticiFormu({
  gorunur,
  onKapat,
  duzenlenen,
  tur,
}: {
  gorunur: boolean;
  onKapat: () => void;
  /** Verilirse düzenleme ("Saatinde"): form dolu açılır, altta "Anımsatıcıyı sil" var. */
  duzenlenen: Animsatici | null;
  /** Yeni anımsatıcının türü (ör. Giriş'teki "Süre sonra" kısayolu). */
  tur?: AnimsaticiTuru;
}) {
  const { kapi } = useVeri();
  const kisaMesaj = useKisaMesaj();
  const { destek: alarmDestegi, izinIste } = useAlarmDestegi();
  const simdiMs = useSimdiMs();
  const [baslangic] = useState(() => ilkForm(duzenlenen, tur));
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

  // "Süre sonra" varsayılan olarak alarmdır (gözden kaçmamalı); kişi seçtiyse ona dokunulmaz.
  const alarm = alarmDestegi && (alarmDokunuldu ? form.alarm : form.tur === 'sure');
  const alarmSec = (a: boolean) => {
    setAlarmDokunuldu(true);
    guncelle({ alarm: a });
    if (a) void izinIste();
  };

  const kaydet = async () => {
    if (calisiyor) return;
    const sure = form.tur === 'sure';
    if (!sure) {
      const h = formHatasi(form.ad, form.saatler, form.gunler);
      if (h) {
        setHata(h);
        return;
      }
    }
    setCalisiyor(true);
    try {
      const bitis = sure ? new Date(Date.now() + form.sureDk * 60_000) : null;
      const a: Animsatici = {
        id: duzenlenen?.id ?? yeniKimlik(),
        ad: form.ad.trim() || (sure ? sureMetni(form.sureDk) : ''),
        saatler: bitis ? [saatMetni(bitis.getHours() * 60 + bitis.getMinutes())] : saatleriSirala(form.saatler),
        gunler: sure ? [] : [...form.gunler].sort(),
        sesli: true,
        erteleDk: form.erteleDk,
        alarm,
        bitis: bitis ? bitis.toISOString() : null,
      };
      if (duzenlenen) await animsaticiGuncelle(kapi, a);
      else await animsaticiEkle(kapi, a);
      if (!duzenlenen) sonTur = form.tur;
      await bildirimIzni(true);
      kisaMesaj(
        duzenlenen
          ? `Kaydedildi: ${a.ad}`
          : sure
            ? `Kuruldu: ${a.ad} · ${a.saatler[0]}`
            : `Anımsatıcı eklendi: ${a.ad}`,
      );
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
  const caldigiSaat = (() => {
    const d = new Date(simdiMs + form.sureDk * 60_000);
    return saatMetni(d.getHours() * 60 + d.getMinutes());
  })();
  const hazirSure = (SURE_SECENEKLERI as readonly number[]).includes(form.sureDk);
  const adim = form.sureDk < 30 ? 1 : 5;

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
      {!duzenlenen && (
        <BolumluDugme
          erisimEtiketi="Anımsatıcı türü"
          secenekler={[
            { deger: 'sure', etiket: 'Süre sonra' },
            { deger: 'saat', etiket: 'Saatinde' },
          ]}
          secili={form.tur}
          onSec={(t) => guncelle({ tur: t })}
        />
      )}

      {form.tur === 'sure' ? (
        <>
          <Bolum>
            <Yazi kalinlik="kalin" accessibilityRole="header">
              Ne kadar sonra?
            </Yazi>
            <View style={stiller.cipler}>
              {SURE_SECENEKLERI.map((dk) => (
                <SecenekHapi
                  key={dk}
                  etiket={sureMetni(dk)}
                  secili={form.sureDk === dk}
                  onPress={() => guncelle({ sureDk: dk })}
                />
              ))}
            </View>
            <View style={stiller.satir}>
              <Yazi style={stiller.esnek} renk={hazirSure ? renk.ikincil : renk.yazi}>
                Başka bir süre
              </Yazi>
              <ArtiEksi
                deger={sureMetni(form.sureDk)}
                onEksi={() => guncelle({ sureDk: Math.max(1, form.sureDk - adim) })}
                onArti={() => guncelle({ sureDk: Math.min(EN_UZUN_SURE, form.sureDk + adim) })}
                eksiEtiket="Süreyi azalt"
                artiEtiket="Süreyi artır"
              />
            </View>
            <Yazi kalinlik="kalin" renk={renk.ana} accessibilityLiveRegion="polite">
              {`Çalacağı saat: ${caldigiSaat}`}
            </Yazi>
          </Bolum>
          <GirisAlani
            etiket="Ad (isteğe bağlı)"
            value={form.ad}
            onChangeText={(ad) => guncelle({ ad })}
            placeholder={`Örneğin: Ocağın altı (boş kalırsa "${sureMetni(form.sureDk)}")`}
            returnKeyType="done"
          />
        </>
      ) : (
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
      )}

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
      </Bolum>

      {duzenlenen && <Dugme tur="tehlike" etiket="Anımsatıcıyı sil" onPress={() => setSilSoruluyor(true)} />}
    </AltSayfa>
  );
}

/** `const form = useAnimsaticiFormu(); form.ac(); form.ac(anımsatıcı); form.ac(null, 'sure'); {form.oge}` */
export function useAnimsaticiFormu() {
  const [durum, setDurum] = useState<{
    no: number;
    acik: boolean;
    duzenlenen: Animsatici | null;
    tur?: AnimsaticiTuru;
  } | null>(null);
  /** Anımsatıcı verilirse düzenleme açılır; `tur` yeni anımsatıcının türü. */
  const ac = useCallback(
    (duzenlenen: Animsatici | null = null, tur?: AnimsaticiTuru) =>
      setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true, duzenlenen, tur })),
    [],
  );
  const oge = durum ? (
    <AnimsaticiFormu
      key={durum.no}
      duzenlenen={durum.duzenlenen}
      tur={durum.tur}
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
