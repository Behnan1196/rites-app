// Zamanlama çubuğu (K-11): Tarih · Saat · Hatırlat · Tekrar; her bölme kendi
// alttan sayfasını açar ("Tamam" ile kapanır). Değişiklikler forma anında yansır.
// P-37 (24 Ekim, 50+ için sade): kart formunda çubuk yerine `ZamanSatirlari`: alt
// alta, soru gibi yazılmış satırlar ("Hangi gün?", "Saat kaçta?", "Tekrar etsin
// mi?", "Hatırlatsın mı?"); dokunulan satırın ayarı hemen altında açılır.
// P-46: satırlar kapalı gelir; yerine tek özet satırı ("Bugün · 09:00 · Her gün").
// Dokununca sorular açılır, özet satırına yeniden dokununca kapanır.

import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ComponentProps } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { kisaGoreliTarih } from '@/mantik/ajanda';
import { KART_ALARM_ACIKLAMASI } from '@/mantik/alarm';
import { tekrarMetni } from '@/mantik/gorunurluk';
import {
  EN_COK_GUN_ONCE,
  gecerliHatirlatma,
  hatirlatmaMetni,
  ozelHatirlatmaMi,
  type Hatirlatma,
  type OzelHatirlatma,
  type Tekrar,
} from '@/mantik/kart';
import { GUN_KISA, gunEkle, gunFarki, uzunTarih, type Gun, type GunKisa } from '@/mantik/tarih';

import { AyTakvimi } from '../AyTakvimi';
import { SesSecici } from '../SesSecici';
import { Dugme } from '../Dugme';
import { AcKapa, ArtiEksi, Bolum, SecenekHapi } from '../Secim';
import { boyut, olcu, renk, yazi } from '../tema';
import { useAlarmDestegi } from '../useAlarmDestegi';
import { Yazi } from '../Yazi';

export type ZamanlamaBolmesi = 'tarih' | 'saat' | 'hatirlatma' | 'tekrar';

export interface Zamanlama {
  tarih: Gun;
  saat: string | null;
  hatirlatma: Hatirlatma | null;
  /** Hatırlatma alarm olarak çalar (iOS 26). */
  alarm?: boolean;
  /** Alarmın sesi (P-33); null: telefonun alarm sesi. */
  alarmSesi?: string | null;
  tekrar: Tekrar | null;
}

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

/**
 * Programın kartı (pilot 20 Ekim): tarih yerine programın kaçıncı günü. `ref`
 * programın 1. günü sayılan gündür; `tarih - ref` gün sayısını verir.
 */
export interface ProgramGunu {
  ref: Gun;
  /** Programın süresi (gün); süresizde null. */
  sure: number | null;
}

export function programGunuMetni(pg: ProgramGunu, tarih: Gun): string {
  return `${gunFarki(pg.ref, tarih) + 1}. gün`;
}

// ---- Çubuk -------------------------------------------------------------------

export function ZamanlamaCubugu({
  deger,
  bugunGun,
  onAc,
  tarihYok = false,
  acik = null,
  programGunu = null,
}: {
  deger: Zamanlama;
  bugunGun: Gun;
  onAc: (bolme: ZamanlamaBolmesi) => void;
  /** Ayarı altta açık olan bölme (vurgulanır). */
  acik?: ZamanlamaBolmesi | null;
  /** Tarihsiz plan adımı: tarih bölmesi boş görünür. */
  tarihYok?: boolean;
  /** Programın kartı: tarih yerine "N. gün". */
  programGunu?: ProgramGunu | null;
}) {
  const bolmeler: { k: ZamanlamaBolmesi; ad: string; ikon: IkonAdi; deger: string | null }[] = [
    {
      k: 'tarih',
      ad: programGunu ? 'Gün' : 'Tarih',
      ikon: 'calendar-outline',
      deger: tarihYok
        ? null
        : programGunu
          ? programGunuMetni(programGunu, deger.tarih)
          : kisaGoreliTarih(deger.tarih, bugunGun),
    },
    { k: 'saat', ad: 'Saat', ikon: 'time-outline', deger: deger.saat },
    {
      k: 'hatirlatma',
      ad: 'Hatırlat',
      ikon: deger.hatirlatma && deger.alarm ? 'alarm-outline' : 'notifications-outline',
      deger: !deger.hatirlatma
        ? null
        : ozelHatirlatmaMi(deger.hatirlatma)
          ? deger.hatirlatma.gunOnce === 0
            ? deger.hatirlatma.saat
            : `${deger.hatirlatma.gunOnce} gün önce`
          : hatirlatmaMetni(deger.hatirlatma),
    },
    { k: 'tekrar', ad: 'Tekrar', ikon: 'repeat-outline', deger: deger.tekrar ? tekrarMetni(deger.tekrar) : null },
  ];
  return (
    <View style={stiller.cubuk} accessibilityRole="toolbar" accessibilityLabel="Zamanlama">
      {bolmeler.map((b) => {
        const ayarli = b.deger !== null;
        return (
          <Pressable
            key={b.k}
            onPress={() => onAc(b.k)}
            accessibilityRole="button"
            accessibilityLabel={`${b.ad}: ${b.deger ?? 'seçilmedi'}`}
            accessibilityState={{ expanded: acik === b.k }}
            style={({ pressed }) => [
              stiller.bolme,
              ayarli && stiller.bolmeAyarli,
              acik === b.k && stiller.bolmeAcik,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name={b.ikon} size={22} color={ayarli ? renk.ana : renk.soluk} />
            <Yazi
              tur="etiket"
              kalinlik={ayarli ? 'kalin' : 'normal'}
              renk={ayarli ? renk.yazi : renk.ikincil}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              maxFontSizeMultiplier={1.3}
              style={stiller.bolmeYazi}
            >
              {b.deger ?? b.ad}
            </Yazi>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---- Satırlar (P-37) -----------------------------------------------------------

export function ZamanSatirlari({
  deger,
  bugunGun,
  acik,
  onAc,
  onDegis,
  tarihYok = false,
  programGunu = null,
  kalip = false,
}: {
  deger: Zamanlama;
  bugunGun: Gun;
  acik: ZamanlamaBolmesi | null;
  onAc: (b: ZamanlamaBolmesi | null) => void;
  onDegis: (z: Zamanlama) => void;
  tarihYok?: boolean;
  programGunu?: ProgramGunu | null;
  /** Kart çeşidi tasarımı (P-41): yalnız saat ve tekrar; gün ve hatırlatma kişinin. */
  kalip?: boolean;
}) {
  const hatirlatmaDegeri = !deger.hatirlatma
    ? 'Hayır'
    : `${
        ozelHatirlatmaMi(deger.hatirlatma)
          ? deger.hatirlatma.gunOnce === 0
            ? `Saat ${deger.hatirlatma.saat}`
            : `${deger.hatirlatma.gunOnce} gün önce, ${deger.hatirlatma.saat}`
          : hatirlatmaMetni(deger.hatirlatma)
      }${deger.alarm ? ' · alarm' : ''}`;
  const satirlar: { k: ZamanlamaBolmesi; soru: string; deger: string; ayarli: boolean }[] = [
    {
      k: 'tarih',
      soru: programGunu ? 'Programın kaçıncı günü?' : deger.tekrar ? 'Hangi gün başlasın?' : 'Hangi gün?',
      deger: tarihYok
        ? 'Seçilmedi'
        : programGunu
          ? programGunuMetni(programGunu, deger.tarih)
          : deger.tarih === bugunGun || deger.tarih === gunEkle(bugunGun, 1)
            ? kisaGoreliTarih(deger.tarih, bugunGun)
            : uzunTarih(deger.tarih),
      ayarli: !tarihYok,
    },
    { k: 'saat', soru: 'Saat kaçta?', deger: deger.saat ?? 'Saat yok', ayarli: deger.saat !== null },
    {
      k: 'tekrar',
      soru: 'Tekrar etsin mi?',
      deger: tekrarSatirMetni(deger.tekrar),
      ayarli: deger.tekrar !== null,
    },
  ];
  const [genis, setGenis] = useState(false);
  if (kalip) satirlar.shift();
  // Hatırlatma saat seçilince (ya da zaten kuruluysa) sorulur.
  else if (deger.saat !== null || deger.hatirlatma !== null)
    satirlar.push({ k: 'hatirlatma', soru: 'Hatırlatsın mı?', deger: hatirlatmaDegeri, ayarli: !!deger.hatirlatma });

  const ozet =
    satirlar
      .filter((x) => x.k === 'tarih' || x.ayarli)
      // "Pzt Per" → "Her Pzt Per" (özette tekrar olduğu anlaşılsın).
      .map((x) => (x.k === 'tekrar' && /^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz)/.test(x.deger) ? `Her ${x.deger}` : x.deger))
      .join(' · ') || 'Zaman seçilmedi';
  const ozetSatiri = (
    <Pressable
      onPress={() => {
        if (genis) onAc(null);
        setGenis(!genis);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Ne zaman: ${ozet}`}
      accessibilityState={{ expanded: genis }}
      style={({ pressed }) => [stiller.zamanSatiri, stiller.zamanSatiriUst, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="calendar-outline" size={22} color={renk.ana} />
      <Yazi kalinlik="kalin" renk={renk.ana} style={stiller.esnek}>
        {ozet}
      </Yazi>
      <Ionicons name={genis ? 'chevron-up' : 'chevron-forward'} size={20} color={renk.soluk} />
    </Pressable>
  );
  if (!genis) return ozetSatiri;

  return (
    <View style={stiller.satirlar}>
      {ozetSatiri}
      {satirlar.map((s) => (
        <View key={s.k} style={[stiller.zamanSatiri, acik === s.k && stiller.zamanSatiriAcik]}>
          <Pressable
            onPress={() => onAc(acik === s.k ? null : s.k)}
            accessibilityRole="button"
            accessibilityLabel={`${s.soru} ${s.deger}`}
            accessibilityState={{ expanded: acik === s.k }}
            style={({ pressed }) => [stiller.zamanSatiriUst, pressed && { opacity: 0.7 }]}
          >
            <Yazi kalinlik="kalin" style={stiller.esnek}>
              {s.soru}
            </Yazi>
            <Yazi kalinlik={s.ayarli ? 'kalin' : 'normal'} renk={s.ayarli ? renk.ana : renk.ikincil}>
              {s.deger}
            </Yazi>
            <Ionicons name={acik === s.k ? 'chevron-up' : 'chevron-down'} size={20} color={renk.soluk} />
          </Pressable>
          {acik === s.k && (
            <ZamanlamaPaneli
              acik={s.k}
              deger={deger}
              bugunGun={bugunGun}
              onDegis={onDegis}
              onAc={onAc}
              tarihYok={tarihYok}
              programGunu={programGunu}
              satirIci
            />
          )}
        </View>
      ))}
    </View>
  );
}

// ---- Bölme ayarları (çubuğun altında) -----------------------------------------

interface SayfaOzellikleri {
  acik: ZamanlamaBolmesi | null;
  /** Tarihsiz plan adımı: tarih sayfasında seçili gün yok. */
  tarihYok?: boolean;
  deger: Zamanlama;
  bugunGun: Gun;
  onDegis: (z: Zamanlama) => void;
  onAc: (b: ZamanlamaBolmesi | null) => void;
  programGunu?: ProgramGunu | null;
  /** P-37: satırın altında açılır; başlık satırda, kaydırma sayfanın. */
  satirIci?: boolean;
}

const BOLME_BASLIGI: Record<ZamanlamaBolmesi, string> = {
  tarih: 'Tarih',
  saat: 'Saat',
  hatirlatma: 'Hatırlatma',
  tekrar: 'Tekrar',
};

/**
 * Seçili bölmenin ayarları, çubuğun hemen altında açılan alanda (pilot 17 Ekim:
 * alttan açılan sayfalar klavyenin altında kalıyordu). "Tamam" ya da aynı bölmeye
 * yeniden dokunmak kapatır.
 */
export function ZamanlamaPaneli({
  acik,
  deger,
  bugunGun,
  onDegis,
  onAc,
  tarihYok = false,
  programGunu = null,
  satirIci = false,
}: SayfaOzellikleri) {
  const alarm = useAlarmDestegi();
  if (!acik) return null;
  const baslik =
    acik === 'tarih' && programGunu
      ? deger.tekrar
        ? 'Programın kaçıncı gününden'
        : 'Programın kaçıncı günü'
      : acik === 'tarih' && deger.tekrar
        ? 'Başlangıç tarihi'
        : BOLME_BASLIGI[acik];
  const pgGun = programGunu ? gunFarki(programGunu.ref, deger.tarih) : 0;
  const pgSon = programGunu?.sure ? programGunu.sure - 1 : 365;
  const Kap = satirIci ? View : ScrollView;
  return (
    <View style={satirIci ? stiller.panelSatirIci : stiller.panel}>
      {!satirIci && (
        <View style={stiller.panelUst}>
          <Yazi kalinlik="kalin" style={stiller.esnek} accessibilityRole="header">
            {baslik}
          </Yazi>
          <Dugme tur="yazi" etiket="Tamam" onPress={() => onAc(null)} />
        </View>
      )}
      <Kap
        {...(satirIci
          ? { style: stiller.panelIcerikKap }
          : {
              style: stiller.panelIcerik,
              contentContainerStyle: stiller.panelIcerikKap,
              keyboardShouldPersistTaps: 'handled' as const,
            })}
      >
        {acik === 'tarih' && programGunu && (
          <>
            <View style={stiller.alarmSatiri}>
              <Yazi kalinlik="kalin" style={stiller.esnek}>
                {`${Math.floor(pgGun / 7) + 1}. hafta · ${(pgGun % 7) + 1}. gün`}
              </Yazi>
              <ArtiEksi
                deger={String(pgGun + 1)}
                onEksi={() => onDegis({ ...deger, tarih: gunEkle(programGunu.ref, Math.max(0, pgGun - 1)) })}
                onArti={() => onDegis({ ...deger, tarih: gunEkle(programGunu.ref, Math.min(pgSon, pgGun + 1)) })}
                eksiEtiket="Bir gün önce"
                artiEtiket="Bir gün sonra"
              />
            </View>
            <View style={stiller.haplar}>
              {[0, 7, 14]
                .filter((g) => g <= pgSon)
                .map((g) => (
                  <SecenekHapi
                    key={g}
                    etiket={g === 0 ? '1. gün' : `${g / 7 + 1}. hafta`}
                    secili={pgGun === g}
                    onPress={() => onDegis({ ...deger, tarih: gunEkle(programGunu.ref, g) })}
                    style={stiller.esit}
                  />
                ))}
            </View>
            <Yazi tur="ikincil">
              {deger.tekrar
                ? 'Tekrar bu günden başlar; süreli programda program bitince durur.'
                : 'Programı başlattığın gün 1. gündür.'}
            </Yazi>
          </>
        )}

        {acik === 'tarih' && !programGunu && (
          <>
            <View style={stiller.haplar}>
              <SecenekHapi
                etiket="Bugün"
                secili={!tarihYok && deger.tarih === bugunGun}
                onPress={() => onDegis({ ...deger, tarih: bugunGun })}
                style={stiller.esit}
              />
              <SecenekHapi
                etiket="Yarın"
                secili={!tarihYok && deger.tarih === gunEkle(bugunGun, 1)}
                onPress={() => onDegis({ ...deger, tarih: gunEkle(bugunGun, 1) })}
                style={stiller.esit}
              />
            </View>
            <AyTakvimi
              secili={tarihYok ? null : deger.tarih}
              bugunGun={bugunGun}
              onSec={(tarih) => onDegis({ ...deger, tarih })}
            />
          </>
        )}

        {acik === 'saat' && (
          <>
            <View style={stiller.haplar}>
              {(
                [
                  ['Sabah', '08:00'],
                  ['Öğle', '12:00'],
                  ['Akşam', '19:00'],
                ] as const
              ).map(([ad, saat]) => (
                <SecenekHapi
                  key={saat}
                  etiket={ad}
                  altEtiket={saat}
                  secili={deger.saat === saat}
                  onPress={() => onDegis({ ...deger, saat })}
                  style={stiller.esit}
                />
              ))}
            </View>
            <SaatSecici saat={deger.saat} onDegis={(saat) => onDegis({ ...deger, saat })} />
            {deger.saat !== null && (
              <Dugme
                tur="tehlike"
                etiket="Saati kaldır"
                onPress={() => {
                  const hatirlatma = gecerliHatirlatma(deger.hatirlatma, null);
                  onDegis({ ...deger, saat: null, hatirlatma, alarm: hatirlatma ? deger.alarm : false });
                }}
              />
            )}
          </>
        )}

        {acik === 'hatirlatma' && (
          <>
            <View style={stiller.cipler}>
              {([null, ...(deger.saat ? (['saatinde', '15dk', '1sa'] as const) : [])] as const).map((h) => (
                <SecenekHapi
                  key={h ?? 'yok'}
                  etiket={h ? hatirlatmaMetni(h) : 'Yok'}
                  secili={deger.hatirlatma === h}
                  onPress={() => onDegis({ ...deger, hatirlatma: h, alarm: h ? deger.alarm : false })}
                />
              ))}
              <SecenekHapi
                etiket="Başka zaman"
                secili={ozelHatirlatmaMi(deger.hatirlatma)}
                onPress={() =>
                  ozelHatirlatmaMi(deger.hatirlatma) ||
                  onDegis({
                    ...deger,
                    hatirlatma: { gunOnce: deger.saat ? 1 : 0, saat: deger.saat ?? '09:00' },
                  })
                }
              />
            </View>
            {ozelHatirlatmaMi(deger.hatirlatma) && (
              <OzelHatirlatmaAyari
                deger={deger}
                tarihYok={tarihYok}
                onDegis={(h) => onDegis({ ...deger, hatirlatma: h })}
              />
            )}
            {alarm.destek && deger.hatirlatma !== null && (
              <>
                <View style={stiller.alarmSatiri}>
                  <Yazi kalinlik="kalin" style={stiller.esnek}>
                    Alarm olarak çalsın
                  </Yazi>
                  <AcKapa
                    acik={!!deger.alarm}
                    etiket="Alarm olarak çalsın"
                    onDegis={(a) => {
                      onDegis({ ...deger, alarm: a });
                      if (a) void alarm.izinIste();
                    }}
                  />
                </View>
                <Yazi tur="ikincil">{KART_ALARM_ACIKLAMASI}</Yazi>
                {!!deger.alarm && (
                  <>
                    <Yazi kalinlik="kalin">Alarm sesi</Yazi>
                    <SesSecici
                      ses={deger.alarmSesi ?? null}
                      onDegis={(alarmSesi) => onDegis({ ...deger, alarmSesi })}
                      alarm
                    />
                  </>
                )}
              </>
            )}
          </>
        )}

        {acik === 'tekrar' && (
          <TekrarAyari
            tekrar={deger.tekrar}
            onDegis={(tekrar) => onDegis({ ...deger, tekrar })}
            programda={!!programGunu}
          />
        )}
        {satirIci && <Dugme tur="ikincil" etiket="Tamam" onPress={() => onAc(null)} />}
      </Kap>
    </View>
  );
}

/** "Başka zaman": kartın gününden kaç gün önce ve saat kaçta (pilot 17 Ekim). */
function OzelHatirlatmaAyari({
  deger,
  tarihYok,
  onDegis,
}: {
  deger: Zamanlama;
  tarihYok: boolean;
  onDegis: (h: OzelHatirlatma) => void;
}) {
  const h = deger.hatirlatma as OzelHatirlatma;
  const gun = gunEkle(deger.tarih, -h.gunOnce);
  return (
    <View style={stiller.ozel}>
      <View style={stiller.alarmSatiri}>
        <Yazi style={stiller.esnek}>{h.gunOnce === 0 ? 'Kartın günü' : `${h.gunOnce} gün önce`}</Yazi>
        <ArtiEksi
          deger={String(h.gunOnce)}
          onEksi={() => onDegis({ ...h, gunOnce: Math.max(0, h.gunOnce - 1) })}
          onArti={() => onDegis({ ...h, gunOnce: Math.min(EN_COK_GUN_ONCE, h.gunOnce + 1) })}
          eksiEtiket="Bir gün az"
          artiEtiket="Bir gün daha önce"
        />
      </View>
      <View style={stiller.alarmSatiri}>
        <Yazi style={stiller.esnek}>Saat</Yazi>
        <SaatSecici
          saat={h.saat}
          onDegis={(saat) => onDegis({ ...h, saat })}
          kompakt
          dakikaAraligi={1}
          etiket="Hatırlatma saati"
        />
      </View>
      <Yazi kalinlik="kalin" renk={renk.ana}>
        {deger.tekrar || tarihYok
          ? `Her seferinde kartın gününden ${h.gunOnce === 0 ? 'aynı gün' : `${h.gunOnce} gün önce`}, ${h.saat}`
          : `${uzunTarih(gun)} · ${h.saat}`}
      </Yazi>
    </View>
  );
}

// ---- Saat seçici ---------------------------------------------------------------

function saatTarihe(saat: string | null): Date {
  const d = new Date();
  const [s, dk] = (saat ?? '09:00').split(':').map(Number);
  d.setHours(s ?? 9, dk ?? 0, 0, 0);
  return d;
}

function tarihSaate(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Saat seçici. `kompakt`: iOS'ta dokununca açılan küçük alan (anımsatıcı formu). */
export function SaatSecici({
  saat,
  onDegis,
  kompakt = false,
  etiket = 'Başka bir saat',
  dakikaAraligi = 5,
}: {
  saat: string | null;
  onDegis: (saat: string) => void;
  kompakt?: boolean;
  etiket?: string;
  /** Dakika adımı; anımsatıcıda 1 (pilot 17 Ekim). */
  dakikaAraligi?: 1 | 5;
}) {
  if (Platform.OS === 'web') {
    // Yalnız tarayıcıdaki denemeler için.
    return (
      <TextInput
        accessibilityLabel={etiket}
        defaultValue={saat ?? ''}
        placeholder="SS:dd"
        onChangeText={(metin) => {
          const m = /^(\d{1,2}):(\d{2})$/.exec(metin.trim());
          if (m && Number(m[1]) < 24 && Number(m[2]) < 60) onDegis(`${m[1]!.padStart(2, '0')}:${m[2]}`);
        }}
        style={[stiller.webSaat, yazi('normal')]}
      />
    );
  }
  if (kompakt) {
    return (
      <DateTimePicker
        value={saatTarihe(saat)}
        mode="time"
        display="compact"
        locale="tr-TR"
        minuteInterval={dakikaAraligi}
        onValueChange={(_e, d) => onDegis(tarihSaate(d))}
        themeVariant="light"
        accessibilityLabel={etiket}
      />
    );
  }
  return (
    <Bolum style={stiller.saatKutusu}>
      <DateTimePicker
        value={saatTarihe(saat)}
        mode="time"
        display="spinner"
        is24Hour
        locale="tr-TR"
        minuteInterval={dakikaAraligi}
        onValueChange={(_e, d) => onDegis(tarihSaate(d))}
        textColor={renk.yazi}
        themeVariant="light"
        accessibilityLabel={etiket}
      />
    </Bolum>
  );
}

// ---- Tekrar ------------------------------------------------------------------

const VARSAYILAN_GUN = 30;

type TekrarSecimi = 'yok' | 'hergun' | 'haftaici' | 'haftasonu' | 'gunler';

function tekrarSecimi(tekrar: Tekrar | null): TekrarSecimi {
  if (!tekrar) return 'yok';
  if (tekrar.desen === 'haftaici') return 'haftaici';
  if (tekrar.desen === 'haftasonu') return 'haftasonu';
  if (tekrar.desen === 'hergun' || !tekrar.gunler || tekrar.gunler.length === 0 || tekrar.gunler.length === 7)
    return 'hergun';
  return 'gunler';
}

/** Satırdaki değer (P-37): "Her gün" · "Hafta içi, 30 gün" · "Pzt Çar Cum". */
export function tekrarSatirMetni(tekrar: Tekrar | null): string {
  if (!tekrar) return 'Hayır, bir kez';
  const s = tekrarSecimi(tekrar);
  const ne =
    s === 'haftaici'
      ? 'Hafta içi'
      : s === 'haftasonu'
        ? 'Hafta sonu'
        : s === 'gunler'
          ? GUN_KISA.filter((g) => tekrar.gunler!.includes(g)).join(' ')
          : 'Her gün';
  return tekrar.gunSayisi !== null ? `${ne}, ${tekrar.gunSayisi} gün` : ne;
}

function seciliGunler(tekrar: Tekrar): GunKisa[] {
  if (tekrar.desen === 'haftaici') return GUN_KISA.slice(0, 5);
  if (tekrar.desen === 'haftasonu') return GUN_KISA.slice(5);
  if (tekrar.gunler && tekrar.gunler.length > 0) return tekrar.gunler;
  return [...GUN_KISA];
}

/**
 * P-37 (sade): önce "Ne sıklıkla?" (Bir kez · Her gün · Hafta içi · Hafta sonu ·
 * Seçtiğim günler), sonra "Ne kadar sürsün?" (Bitişi yok · Belli bir süre).
 */
function TekrarAyari({
  tekrar,
  onDegis,
  programda = false,
}: {
  tekrar: Tekrar | null;
  onDegis: (t: Tekrar | null) => void;
  /** Programın kartı: tekrar programla birlikte biter; "Ne kadar sürsün?" sorulmaz. */
  programda?: boolean;
}) {
  const secim = tekrarSecimi(tekrar);
  const sure = tekrar?.gunSayisi ?? null;
  const sec = (s: TekrarSecimi) => {
    if (s === 'yok') return onDegis(null);
    const gunSayisi = tekrar?.gunSayisi ?? null;
    if (s === 'gunler')
      return onDegis({
        gunSayisi,
        desen: null,
        gunler: tekrar && secim === 'gunler' ? tekrar.gunler : ['Pzt', 'Çar', 'Cum'],
      });
    return onDegis({ gunSayisi, gunler: null, desen: s });
  };
  const gunDegistir = (g: GunKisa) => {
    if (!tekrar) return;
    const gunler = seciliGunler(tekrar);
    const yeni = gunler.includes(g) ? gunler.filter((x) => x !== g) : [...gunler, g];
    if (yeni.length === 0) return; // en az bir gün kalır
    onDegis({ ...tekrar, desen: null, gunler: yeni.length === 7 ? null : GUN_KISA.filter((x) => yeni.includes(x)) });
  };
  const SECENEKLER: readonly [TekrarSecimi, string][] = [
    ['yok', 'Bir kez'],
    ['hergun', 'Her gün'],
    ['haftaici', 'Hafta içi'],
    ['haftasonu', 'Hafta sonu'],
    ['gunler', 'Seçtiğim günler'],
  ];

  return (
    <>
      <Yazi kalinlik="kalin">Ne sıklıkla?</Yazi>
      <View style={stiller.cipler}>
        {SECENEKLER.map(([k, ad]) => (
          <SecenekHapi key={k} etiket={ad} secili={secim === k} onPress={() => sec(k)} />
        ))}
      </View>
      {tekrar && secim === 'gunler' && (
        <View style={stiller.gunler}>
          {GUN_KISA.map((g) => {
            const secili = seciliGunler(tekrar).includes(g);
            return (
              <Pressable
                key={g}
                onPress={() => gunDegistir(g)}
                accessibilityRole="button"
                accessibilityState={{ selected: secili }}
                accessibilityLabel={g}
                style={[stiller.gun, secili && stiller.gunSecili]}
              >
                <Yazi
                  kalinlik="kalin"
                  renk={secili ? renk.yuzey : renk.yazi}
                  maxFontSizeMultiplier={1.2}
                  style={stiller.gunYazi}
                >
                  {g}
                </Yazi>
              </Pressable>
            );
          })}
        </View>
      )}
      {tekrar && programda && <Yazi tur="ikincil">Program bitince tekrar da biter.</Yazi>}
      {tekrar && !programda && (
        <>
          <Yazi kalinlik="kalin">Ne kadar sürsün?</Yazi>
          <View style={stiller.cipler}>
            <SecenekHapi
              etiket="Bitişi yok"
              secili={sure === null}
              onPress={() => onDegis({ ...tekrar, gunSayisi: null })}
            />
            <SecenekHapi
              etiket="Belli bir süre"
              secili={sure !== null}
              onPress={() => sure === null && onDegis({ ...tekrar, gunSayisi: VARSAYILAN_GUN })}
            />
          </View>
          {sure !== null && (
            <View style={stiller.satir}>
              <Yazi>Kaç gün?</Yazi>
              <ArtiEksi
                deger={String(sure)}
                onEksi={() => onDegis({ ...tekrar, gunSayisi: Math.max(1, sure - 1) })}
                onArti={() => onDegis({ ...tekrar, gunSayisi: sure + 1 })}
                eksiEtiket="Bir gün azalt"
                artiEtiket="Bir gün artır"
              />
            </View>
          )}
        </>
      )}
    </>
  );
}

const stiller = StyleSheet.create({
  bolmeAcik: { borderColor: renk.ana, borderWidth: 2 },
  satirlar: { gap: 8 },
  zamanSatiri: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
  },
  zamanSatiriAcik: { borderColor: renk.ana, borderWidth: 2, paddingBottom: 12 },
  zamanSatiriUst: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60 },
  panelSatirIci: { borderTopWidth: 1, borderTopColor: renk.satirCizgi, paddingTop: 12 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ozel: { gap: 10 },
  panel: {
    borderTopWidth: 1,
    borderTopColor: renk.satirCizgi,
    paddingTop: 4,
  },
  panelUst: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  panelIcerik: { maxHeight: 380 },
  panelIcerikKap: { gap: 12, paddingBottom: 8 },
  alarmSatiri: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  esnek: { flex: 1 },
  cubuk: {
    flexDirection: 'row',
    backgroundColor: renk.bolumluZemin,
    borderRadius: olcu.kose.kart,
    padding: 4,
    gap: 4,
  },
  bolme: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  bolmeAyarli: { backgroundColor: renk.yuzey },
  bolmeYazi: { fontSize: 15, lineHeight: 18, textAlign: 'center' },
  haplar: { flexDirection: 'row', gap: 10 },
  esit: { flex: 1 },
  dikey: { gap: 10 },
  satir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  solaYasli: { alignSelf: 'flex-start' },
  gunler: { flexDirection: 'row', gap: 6 },
  gun: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gunSecili: { backgroundColor: renk.ana, borderColor: renk.ana },
  gunYazi: { fontSize: 15 },
  saatKutusu: { alignItems: 'center', paddingVertical: 4 },
  webSaat: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: boyut.govde + 1,
    backgroundColor: renk.yuzey,
    color: renk.yazi,
  },
});
