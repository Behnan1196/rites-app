// Anımsatıcı ekle (AN-1): alttan sayfa.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ALARM_ACIKLAMASI, ALARM_ERTELEME } from '@/mantik/alarm';
import {
  ANIMSATICI_BILGI,
  ERTELEME_SECENEKLERI,
  formHatasi,
  GUN_SECENEKLERI,
  HAZIR_SAATLER,
  saatleriSirala,
  VARSAYILAN_ERTELEME,
  type Animsatici,
  type AnimsaticiGunleri,
} from '@/mantik/animsatici';
import { alarmIzni, alarmIzniIste } from '@/veri/alarmlar';
import { animsaticiEkle, animsaticiGuncelle, animsaticiSil } from '@/veri/animsaticilar';
import { bildirimIzni } from '@/veri/bildirimler';
import { yeniKimlik } from '@/veri/kimlik';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { AcKapa, Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

interface Form {
  ad: string;
  saatler: string[];
  yeniSaat: string;
  gunler: AnimsaticiGunleri;
  sesli: boolean;
  erteleDk: number;
  alarm: boolean;
}

const ILK: Form = {
  ad: '',
  saatler: ['09:00'],
  yeniSaat: '13:00',
  gunler: 'hergun',
  sesli: true,
  erteleDk: VARSAYILAN_ERTELEME,
  alarm: false,
};

export const ALARM_IZNI_YOK =
  "Alarm izni kapalı. Ayarlar → Rites'tan açabilirsin; o zamana kadar bildirim olarak gelir.";

function formdan(a: Animsatici): Form {
  return {
    ad: a.ad,
    saatler: [...a.saatler],
    yeniSaat: ILK.yeniSaat,
    gunler: a.gunler,
    sesli: a.sesli,
    erteleDk: a.erteleDk,
    alarm: a.alarm,
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
  const baslangic = useMemo(() => (duzenlenen ? formdan(duzenlenen) : ILK), [duzenlenen]);
  const [form, setForm] = useState<Form>(baslangic);
  const [silSoruluyor, setSilSoruluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  // Alarm seçeneği yalnız destekleyen telefonda (iOS 26, kendi derleme) görünür.
  const [alarmDestegi, setAlarmDestegi] = useState(false);
  useEffect(() => {
    let iptal = false;
    void alarmIzni().then((d) => {
      if (!iptal) setAlarmDestegi(d !== 'desteklenmiyor');
    });
    return () => {
      iptal = true;
    };
  }, []);
  const degisti = useMemo(() => JSON.stringify(form) !== JSON.stringify(baslangic), [form, baslangic]);
  const guncelle = (f: Partial<Form>) => {
    setForm((x) => ({ ...x, ...f }));
    setHata(null);
  };

  const alarmiDegistir = async (alarm: boolean) => {
    guncelle({ alarm });
    if (!alarm) return;
    const izin = await alarmIzniIste();
    if (izin === 'yok') kisaMesaj(ALARM_IZNI_YOK);
  };

  const kaydet = async () => {
    const h = formHatasi(form.ad, form.saatler);
    if (h) {
      setHata(h);
      return;
    }
    if (calisiyor) return;
    setCalisiyor(true);
    try {
      const a: Animsatici = {
        id: duzenlenen?.id ?? yeniKimlik(),
        ad: form.ad.trim(),
        saatler: saatleriSirala(form.saatler),
        gunler: form.gunler,
        sesli: form.alarm || form.sesli,
        erteleDk: form.alarm ? ALARM_ERTELEME : form.erteleDk,
        alarm: form.alarm,
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

  return (
    <AltSayfa
      gorunur={gorunur}
      onKapat={onKapat}
      baslik={duzenlenen ? 'Düzenle' : 'Anımsatıcı ekle'}
      solVazgec
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
      altAlan={<Dugme etiket="Kaydet" onPress={() => void kaydet()} pasif={calisiyor} />}
    >
      {!duzenlenen && <Yazi tur="ikincil">{ANIMSATICI_BILGI}</Yazi>}
      <GirisAlani
        etiket="Neyi anımsatalım?"
        value={form.ad}
        onChangeText={(ad) => guncelle({ ad })}
        placeholder="Örneğin: Göz damlası, su iç"
        returnKeyType="done"
        hata={hata && form.ad.trim() === '' ? hata : null}
      />

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Saatler
        </Yazi>
        <View style={stiller.cipler}>
          {saatleriSirala(form.saatler).map((s) => (
            <Pressable
              key={s}
              onPress={() => guncelle({ saatler: form.saatler.filter((x) => x !== s) })}
              accessibilityRole="button"
              accessibilityLabel={`${s} saatini kaldır`}
              style={stiller.saatCipi}
            >
              <Yazi kalinlik="kalin" renk={renk.yuzey}>{`${s}  ×`}</Yazi>
            </Pressable>
          ))}
        </View>
        <View style={stiller.saatSatiri}>
          <View style={stiller.secici}>
            <SaatSecici
              saat={form.yeniSaat}
              onDegis={(yeniSaat) => guncelle({ yeniSaat })}
              kompakt
              etiket="Yeni saat"
            />
          </View>
          <Dugme
            tur="ikincil"
            etiket="Saat ekle"
            yaziRengi={renk.ana}
            style={stiller.ekle}
            onPress={() =>
              guncelle({
                saatler: saatleriSirala([...form.saatler, form.yeniSaat]),
              })
            }
          />
        </View>
        <View style={stiller.ikili}>
          <SecenekHapi
            etiket="Günde 2 kez"
            secili={false}
            onPress={() => guncelle({ saatler: [...HAZIR_SAATLER.ikiKez] })}
            style={stiller.esit}
          />
          <SecenekHapi
            etiket="Günde 3 kez"
            secili={false}
            onPress={() => guncelle({ saatler: [...HAZIR_SAATLER.ucKez] })}
            style={stiller.esit}
          />
        </View>
        {hata && form.ad.trim() !== '' && (
          <Yazi tur="ikincil" renk={renk.hata} accessibilityLiveRegion="polite">
            {hata}
          </Yazi>
        )}
      </Bolum>

      <Bolum>
        <Yazi kalinlik="kalin" accessibilityRole="header">
          Hangi günler?
        </Yazi>
        <View style={stiller.cipler}>
          {GUN_SECENEKLERI.map(([k, ad]) => (
            <SecenekHapi key={k} etiket={ad} secili={form.gunler === k} onPress={() => guncelle({ gunler: k })} />
          ))}
        </View>
      </Bolum>

      {alarmDestegi && (
        <Bolum>
          <View style={stiller.satir}>
            <Yazi kalinlik="kalin" style={stiller.esnek}>
              Alarm olarak çalsın
            </Yazi>
            <AcKapa acik={form.alarm} etiket="Alarm olarak çalsın" onDegis={(alarm) => void alarmiDegistir(alarm)} />
          </View>
          <Yazi tur="ikincil">{ALARM_ACIKLAMASI}</Yazi>
        </Bolum>
      )}

      {!form.alarm && (
        <>
          <Bolum style={stiller.satir}>
            <Yazi kalinlik="kalin" style={stiller.esnek}>
              Sesli uyar
            </Yazi>
            <AcKapa acik={form.sesli} etiket="Sesli uyar" onDegis={(sesli) => guncelle({ sesli })} />
          </Bolum>

          <Bolum>
            <Yazi kalinlik="kalin" accessibilityRole="header">
              Ertele dersem
            </Yazi>
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
        </>
      )}
      {duzenlenen && <Dugme tur="tehlike" etiket="Anımsatıcıyı sil" onPress={() => setSilSoruluyor(true)} />}
    </AltSayfa>
  );
}

/** `const form = useAnimsaticiFormu(); form.ac(); form.ac(anımsatıcı); {form.oge}` */
export function useAnimsaticiFormu() {
  const [durum, setDurum] = useState<{ no: number; acik: boolean; duzenlenen: Animsatici | null } | null>(null);
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
  saatCipi: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: renk.ana,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saatSatiri: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secici: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  ekle: { borderColor: renk.ana, borderWidth: 2, paddingHorizontal: 16 },
  ikili: { flexDirection: 'row', gap: 8 },
  esit: { flex: 1 },
  satir: { flexDirection: 'row', alignItems: 'center' },
  esnek: { flex: 1 },
});
