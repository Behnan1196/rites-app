// Zamanlama çubuğu (K-11): Tarih · Saat · Hatırlat · Tekrar; her bölme kendi
// alttan sayfasını açar ("Tamam" ile kapanır). Değişiklikler forma anında yansır.

import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { HATIRLATMA_METNI, kisaGoreliTarih } from '@/mantik/ajanda';
import { tekrarMetni } from '@/mantik/gorunurluk';
import type { HatirlatmaSecimi, Tekrar } from '@/mantik/kart';
import { GUN_KISA, gunEkle, type Gun, type GunKisa } from '@/mantik/tarih';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { Dugme } from '../Dugme';
import { AcKapa, ArtiEksi, Bolum, SecenekHapi } from '../Secim';
import { boyut, olcu, renk, yazi } from '../tema';
import { Yazi } from '../Yazi';

export type ZamanlamaBolmesi = 'tarih' | 'saat' | 'hatirlatma' | 'tekrar';

export interface Zamanlama {
  tarih: Gun;
  saat: string | null;
  hatirlatma: HatirlatmaSecimi | null;
  tekrar: Tekrar | null;
}

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

// ---- Çubuk -------------------------------------------------------------------

export function ZamanlamaCubugu({
  deger,
  bugunGun,
  onAc,
  tarihYok = false,
}: {
  deger: Zamanlama;
  bugunGun: Gun;
  onAc: (bolme: ZamanlamaBolmesi) => void;
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
      ikon: 'notifications-outline',
      deger: deger.hatirlatma ? HATIRLATMA_METNI[deger.hatirlatma] : null,
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
            style={({ pressed }) => [stiller.bolme, ayarli && stiller.bolmeAyarli, pressed && { opacity: 0.7 }]}
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

// ---- Alt sayfalar ------------------------------------------------------------

interface SayfaOzellikleri {
  acik: ZamanlamaBolmesi | null;
  /** Tarihsiz plan adımı: tarih sayfasında seçili gün yok. */
  tarihYok?: boolean;
  deger: Zamanlama;
  bugunGun: Gun;
  onDegis: (z: Zamanlama) => void;
  onAc: (b: ZamanlamaBolmesi | null) => void;
}

/** Dört alt sayfanın hepsi; hangisinin açık olduğu `acik` ile verilir. */
export function ZamanlamaSayfalari({ acik, deger, bugunGun, onDegis, onAc, tarihYok = false }: SayfaOzellikleri) {
  const kapat = () => onAc(null);
  return (
    <>
      <AltSayfa
        gorunur={acik === 'tarih'}
        onKapat={kapat}
        baslik={deger.tekrar ? 'Başlangıç tarihi' : 'Tarih'}
        sagKapat="Tamam"
      >
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
        <Yazi kalinlik="kalin">Başka bir gün</Yazi>
        <Bolum>
          <AyTakvimi secili={tarihYok ? null : deger.tarih} bugunGun={bugunGun} onSec={(tarih) => onDegis({ ...deger, tarih })} />
        </Bolum>
      </AltSayfa>

      <AltSayfa gorunur={acik === 'saat'} onKapat={kapat} baslik="Saat" sagKapat="Tamam">
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
        <Yazi kalinlik="kalin">Başka bir saat</Yazi>
        <SaatSecici saat={deger.saat} onDegis={(saat) => onDegis({ ...deger, saat })} />
        {deger.saat !== null && (
          <Dugme
            tur="tehlike"
            etiket="Saati kaldır"
            onPress={() => onDegis({ ...deger, saat: null, hatirlatma: null })}
          />
        )}
      </AltSayfa>

      <AltSayfa gorunur={acik === 'hatirlatma'} onKapat={kapat} baslik="Hatırlatma" sagKapat="Tamam">
        {deger.saat === null ? (
          <>
            <Yazi>Hatırlatma için önce kartın saatini seç.</Yazi>
            <Dugme tur="ikincil" etiket="Saat seç" onPress={() => onAc('saat')} />
          </>
        ) : (
          <View style={stiller.dikey}>
            {([null, 'saatinde', '15dk', '1sa'] as const).map((h) => (
              <SecenekHapi
                key={h ?? 'yok'}
                etiket={h ? HATIRLATMA_METNI[h] : 'Yok'}
                secili={deger.hatirlatma === h}
                onPress={() => onDegis({ ...deger, hatirlatma: h })}
              />
            ))}
          </View>
        )}
        <Yazi tur="ikincil">
          Göz damlası gibi günde birkaç kez çalması gerekenler için Giriş&apos;teki Anımsatıcılar daha uygun.
        </Yazi>
      </AltSayfa>

      <AltSayfa gorunur={acik === 'tekrar'} onKapat={kapat} baslik="Tekrar" sagKapat="Tamam">
        <TekrarAyari tekrar={deger.tekrar} onDegis={(tekrar) => onDegis({ ...deger, tekrar })} />
      </AltSayfa>
    </>
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

function SaatSecici({ saat, onDegis }: { saat: string | null; onDegis: (saat: string) => void }) {
  if (Platform.OS === 'web') {
    // Yalnız tarayıcıdaki denemeler için.
    return (
      <TextInput
        accessibilityLabel="Başka bir saat"
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
  return (
    <Bolum style={stiller.saatKutusu}>
      <DateTimePicker
        value={saatTarihe(saat)}
        mode="time"
        display="spinner"
        is24Hour
        locale="tr-TR"
        minuteInterval={5}
        onValueChange={(_e, d) => onDegis(tarihSaate(d))}
        textColor={renk.yazi}
        themeVariant="light"
        accessibilityLabel="Başka bir saat"
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
  const ac = (acik: boolean) =>
    onDegis(acik ? { gunSayisi: VARSAYILAN_GUN, gunler: null, desen: null } : null);

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
