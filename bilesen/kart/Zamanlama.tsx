// Zamanlama çubuğu (K-11): Tarih · Saat · Hatırlat · Tekrar; her bölme kendi
// alttan sayfasını açar ("Tamam" ile kapanır). Değişiklikler forma anında yansır.

import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ComponentProps } from 'react';
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
import { GUN_KISA, gunEkle, uzunTarih, type Gun, type GunKisa } from '@/mantik/tarih';

import { AyTakvimi } from '../AyTakvimi';
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
  tekrar: Tekrar | null;
}

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

// ---- Çubuk -------------------------------------------------------------------

export function ZamanlamaCubugu({
  deger,
  bugunGun,
  onAc,
  tarihYok = false,
  acik = null,
}: {
  deger: Zamanlama;
  bugunGun: Gun;
  onAc: (bolme: ZamanlamaBolmesi) => void;
  /** Ayarı altta açık olan bölme (vurgulanır). */
  acik?: ZamanlamaBolmesi | null;
  /** Tarihsiz plan adımı: tarih bölmesi boş görünür. */
  tarihYok?: boolean;
}) {
  const bolmeler: { k: ZamanlamaBolmesi; ad: string; ikon: IkonAdi; deger: string | null }[] = [
    {
      k: 'tarih',
      ad: 'Tarih',
      ikon: 'calendar-outline',
      deger: tarihYok ? null : kisaGoreliTarih(deger.tarih, bugunGun),
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

// ---- Bölme ayarları (çubuğun altında) -----------------------------------------

interface SayfaOzellikleri {
  acik: ZamanlamaBolmesi | null;
  /** Tarihsiz plan adımı: tarih sayfasında seçili gün yok. */
  tarihYok?: boolean;
  deger: Zamanlama;
  bugunGun: Gun;
  onDegis: (z: Zamanlama) => void;
  onAc: (b: ZamanlamaBolmesi | null) => void;
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
export function ZamanlamaPaneli({ acik, deger, bugunGun, onDegis, onAc, tarihYok = false }: SayfaOzellikleri) {
  const alarm = useAlarmDestegi();
  if (!acik) return null;
  const baslik = acik === 'tarih' && deger.tekrar ? 'Başlangıç tarihi' : BOLME_BASLIGI[acik];
  return (
    <View style={stiller.panel}>
      <View style={stiller.panelUst}>
        <Yazi kalinlik="kalin" style={stiller.esnek} accessibilityRole="header">
          {baslik}
        </Yazi>
        <Dugme tur="yazi" etiket="Tamam" onPress={() => onAc(null)} />
      </View>
      <ScrollView
        style={stiller.panelIcerik}
        contentContainerStyle={stiller.panelIcerikKap}
        keyboardShouldPersistTaps="handled"
      >
        {acik === 'tarih' && (
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
              </>
            )}
          </>
        )}

        {acik === 'tekrar' && <TekrarAyari tekrar={deger.tekrar} onDegis={(tekrar) => onDegis({ ...deger, tekrar })} />}
      </ScrollView>
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

function seciliGunler(tekrar: Tekrar): GunKisa[] {
  if (tekrar.desen === 'haftaici') return GUN_KISA.slice(0, 5);
  if (tekrar.desen === 'haftasonu') return GUN_KISA.slice(5);
  if (tekrar.gunler && tekrar.gunler.length > 0) return tekrar.gunler;
  return [...GUN_KISA];
}

function TekrarAyari({ tekrar, onDegis }: { tekrar: Tekrar | null; onDegis: (t: Tekrar | null) => void }) {
  const ac = (acik: boolean) => onDegis(acik ? { gunSayisi: VARSAYILAN_GUN, gunler: null, desen: null } : null);

  if (!tekrar) {
    return (
      <View style={stiller.satir}>
        <Yazi kalinlik="kalin">Tekrar etsin</Yazi>
        <AcKapa acik={false} onDegis={ac} etiket="Tekrar etsin" />
      </View>
    );
  }

  const gunler = seciliGunler(tekrar);
  const gunDegistir = (g: GunKisa) => {
    const yeni = gunler.includes(g) ? gunler.filter((x) => x !== g) : [...gunler, g];
    if (yeni.length === 0) return; // en az bir gün kalır
    onDegis({ ...tekrar, desen: null, gunler: yeni.length === 7 ? null : GUN_KISA.filter((x) => yeni.includes(x)) });
  };
  const sayi = tekrar.gunSayisi;

  return (
    <>
      <View style={stiller.satir}>
        <Yazi kalinlik="kalin">Tekrar etsin</Yazi>
        <AcKapa acik onDegis={ac} etiket="Tekrar etsin" />
      </View>
      <Bolum>
        <View style={stiller.satir}>
          <Yazi>Kaç gün sürecek?</Yazi>
          <ArtiEksi
            deger={sayi === null ? 'Süresiz' : String(sayi)}
            bos={sayi === null}
            onEksi={() => sayi !== null && onDegis({ ...tekrar, gunSayisi: Math.max(1, sayi - 1) })}
            onArti={() => onDegis({ ...tekrar, gunSayisi: sayi === null ? 7 : sayi + 1 })}
            eksiEtiket="Bir gün azalt"
            artiEtiket="Bir gün artır"
          />
        </View>
        <SecenekHapi
          etiket="Süresiz (bitiş yok)"
          secili={sayi === null}
          onPress={() => onDegis({ ...tekrar, gunSayisi: null })}
          style={stiller.solaYasli}
        />
        <Yazi>Hangi günler?</Yazi>
        <View style={stiller.gunler}>
          {GUN_KISA.map((g) => (
            <Pressable
              key={g}
              onPress={() => gunDegistir(g)}
              accessibilityRole="button"
              accessibilityState={{ selected: gunler.includes(g) }}
              accessibilityLabel={g}
              style={[stiller.gun, gunler.includes(g) && stiller.gunSecili]}
            >
              <Yazi
                kalinlik="kalin"
                renk={gunler.includes(g) ? renk.yuzey : renk.yazi}
                maxFontSizeMultiplier={1.2}
                style={stiller.gunYazi}
              >
                {g}
              </Yazi>
            </Pressable>
          ))}
        </View>
      </Bolum>
    </>
  );
}

const stiller = StyleSheet.create({
  bolmeAcik: { borderColor: renk.ana, borderWidth: 2 },
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
