// Beslenme planı (pilot 19 Kasım, P-134; çizim: Beslenme satırı). Günün öğünleri saatleriyle;
// işaretli, farklı yenen ve sıradaki ayrı görünür. Öğüne dokununca: ne kadar (gram ve ev ölçüsü),
// değişimler, diyetisyenin notu, tarif; altta Yedim · Farklı yedim · Tabağım. Farklı yedim: önce
// diyetisyenin aynı değişimlerdeki seçenekleri, yoksa serbest yazı ve Az · Normal · Çok. Altta
// "Tarifler ve alışveriş": tarifler ve haftanın malzemelerini Listeler'e "Market" olarak ekleme.

import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  durumlariOku,
  durumMetni,
  fotoAnahtari,
  gununOgunleri,
  MIKTARLAR,
  ogunYaz,
  planOku,
  siradakiOgun,
  type Miktar,
  type Ogun,
  type OgunDurumu,
  type Tarif,
} from '@/mantik/beslenme';
import type { Blok, Kayit } from '@/mantik/kart';
import { RUTIN_KALICI } from '@/mantik/rutinAdimlari';
import type { Gun } from '@/mantik/tarih';
import { dosyayiSakla } from '@/veri/dosyalar';
import { yeniKimlik } from '@/veri/kimlik';
import { listeKartiKur } from '@/veri/listeKartlari';
import { useBugun } from '@/veri/useBugun';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { SecenekHapi } from '../Secim';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { BuyutulebilirFoto } from './BuyutulebilirFoto';

export function BeslenmeParcasi({
  blok,
  gun,
  kayit,
  onKayit,
}: {
  blok: Blok;
  gun: Gun;
  kayit: Kayit;
  onKayit: (degistir: (k: Kayit) => Kayit) => void;
}) {
  const plan = planOku(blok.metin);
  const ogunler = gununOgunleri(plan, gun);
  const durumlar = durumlariOku(kayit, blok.id);
  const siradaki = siradakiOgun(ogunler, durumlar);
  const [acik, setAcik] = useState<Ogun | null>(null);
  const [tarifler, setTarifler] = useState(false);

  const yaz = (ogunId: string, d: OgunDurumu | null) => onKayit((k) => ogunYaz(k, blok.id, ogunler, ogunId, d));

  return (
    <View style={stiller.kap}>
      <View style={stiller.ust}>
        <Yazi kalinlik="kalin" style={stiller.esnek}>
          {blok.ad || 'Öğünler'}
        </Yazi>
        <Yazi kalinlik="kalin" renk={renk.ikincil}>
          {`${ogunler.filter((o) => durumlar[o.id]).length} / ${ogunler.length}`}
        </Yazi>
      </View>
      {ogunler.length === 0 && <Yazi tur="ikincil">Bugün için öğün yok.</Yazi>}
      {ogunler.map((o) => {
        const d = durumlar[o.id];
        const sirada = siradaki?.id === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => setAcik(o)}
            accessibilityRole="button"
            accessibilityLabel={`${o.ad}${o.saat ? `, ${o.saat}` : ''}: ${o.icerik}${d ? `. ${durumMetni(d)}` : ''}`}
            style={({ pressed }) => [stiller.ogun, sirada && stiller.sirada, pressed && { opacity: 0.7 }]}
          >
            <View style={[stiller.kutu, d && stiller.kutuDolu]}>
              {d && <Ionicons name={d.d === 'yedi' ? 'checkmark' : 'swap-horizontal'} size={18} color={renk.yuzey} />}
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="etiket" kalinlik="kalin" renk={sirada ? renk.anaKoyu : renk.ikincil}>
                {`${o.ad.toLocaleUpperCase('tr')}${o.saat ? ` · ${o.saat}` : ''}${sirada ? ' · SIRADAKİ' : ''}`}
              </Yazi>
              <Yazi renk={d ? renk.ikincil : renk.yazi} kalinlik={sirada ? 'kalin' : 'normal'}>
                {d?.d === 'farkli' ? durumMetni(d) : o.icerik}
              </Yazi>
            </View>
            <Ionicons name="chevron-forward" size={18} color={renk.soluk} />
          </Pressable>
        );
      })}
      {(plan.tarifler.length > 0 || plan.alisveris.length > 0) && (
        <Pressable
          onPress={() => setTarifler(true)}
          accessibilityRole="button"
          hitSlop={6}
          style={({ pressed }) => [stiller.tarifDugme, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="book-outline" size={20} color={renk.ana} />
          <Yazi kalinlik="kalin" renk={renk.ana}>
            Tarifler ve alışveriş
          </Yazi>
        </Pressable>
      )}

      <AltSayfa gorunur={!!acik} onKapat={() => setAcik(null)} baslik={acik?.ad} sagKapat="Kapat">
        {acik && (
          <OgunSayfasi
            ogun={acik}
            durum={durumlar[acik.id]}
            foto={kayit.fotolar[fotoAnahtari(blok.id, acik.id)]}
            tarif={plan.tarifler.find((t) => t.id === acik.tarif) ?? null}
            onDurum={(d) => {
              yaz(acik.id, d);
              if (d) setAcik(null);
            }}
            onFoto={(uri) =>
              onKayit((k) => ({ ...k, fotolar: { ...k.fotolar, [fotoAnahtari(blok.id, acik.id)]: uri } }))
            }
          />
        )}
      </AltSayfa>
      <AltSayfa gorunur={tarifler} onKapat={() => setTarifler(false)} baslik="Tarifler ve alışveriş" sagKapat="Kapat">
        <TariflerSayfasi tarifler={plan.tarifler} alisveris={plan.alisveris} />
      </AltSayfa>
    </View>
  );
}

function OgunSayfasi({
  ogun,
  durum,
  foto,
  tarif,
  onDurum,
  onFoto,
}: {
  ogun: Ogun;
  durum: OgunDurumu | undefined;
  foto: string | undefined;
  tarif: Tarif | null;
  onDurum: (d: OgunDurumu | null) => void;
  onFoto: (uri: string) => void;
}) {
  const [farkli, setFarkli] = useState(false);
  const [ne, setNe] = useState(durum?.d === 'farkli' ? durum.ne : '');
  const [miktar, setMiktar] = useState<Miktar>(durum?.d === 'farkli' ? durum.m : 'normal');
  const [tarifAcik, setTarifAcik] = useState(false);
  const cek = async () => {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) return;
    const sonuc = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    const secilen = sonuc.canceled ? undefined : sonuc.assets[0];
    if (secilen) onFoto(await dosyayiSakla(secilen.uri, secilen.fileName ?? 'tabak.jpg'));
  };
  return (
    <View style={stiller.sayfa}>
      <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
        {`${ogun.ad.toLocaleUpperCase('tr')}${ogun.saat ? ` · ${ogun.saat}` : ''}`}
      </Yazi>
      <Yazi tur="bolumBasligi">{ogun.icerik}</Yazi>
      {ogun.degisimler.length > 0 && (
        <View style={stiller.cipler}>
          {ogun.degisimler.map((d) => (
            <View key={d} style={stiller.cip}>
              <Yazi tur="etiket" kalinlik="kalin" renk={renk.anaKoyu}>
                {d}
              </Yazi>
            </View>
          ))}
        </View>
      )}
      {ogun.miktarlar.length > 0 && (
        <View style={stiller.kutuAlan}>
          <Yazi kalinlik="kalin">Ne kadar</Yazi>
          {ogun.miktarlar.map((m) => (
            <View key={m.ad} style={stiller.miktar}>
              <Yazi style={stiller.esnek}>{m.ad}</Yazi>
              <Yazi tur="ikincil">{m.miktar}</Yazi>
            </View>
          ))}
        </View>
      )}
      {!!ogun.not && (
        <View style={stiller.not}>
          <Yazi>
            <Yazi kalinlik="kalin" renk={renk.vurguYazi}>
              Diyetisyenin notu:{' '}
            </Yazi>
            {ogun.not}
          </Yazi>
        </View>
      )}
      {tarif && (
        <Dugme
          tur="yazi"
          etiket={tarifAcik ? `${tarif.ad} tarifini gizle` : `${tarif.ad} tarifi ›`}
          onPress={() => setTarifAcik((a) => !a)}
        />
      )}
      {tarif && tarifAcik && <TarifAyrintisi tarif={tarif} />}
      {foto && <BuyutulebilirFoto uri={foto} style={stiller.foto} etiket="Tabağın" />}

      {durum ? (
        <View style={stiller.kutuAlan}>
          <Yazi kalinlik="kalin" renk={renk.ana}>
            {durumMetni(durum)}
          </Yazi>
          <Dugme tur="ikincil" etiket="Geri al" onPress={() => onDurum(null)} />
        </View>
      ) : farkli ? (
        <View style={stiller.kutuAlan}>
          {ogun.secenekler.length > 0 && (
            <>
              <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
                DİYETİSYENİNİN SEÇENEKLERİ
              </Yazi>
              {ogun.secenekler.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => onDurum({ d: 'farkli', ne: s, m: 'normal' })}
                  accessibilityRole="button"
                  style={({ pressed }) => [stiller.secenek, pressed && { opacity: 0.7 }]}
                >
                  <Yazi>{s}</Yazi>
                </Pressable>
              ))}
            </>
          )}
          <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
            BAŞKA BİR ŞEY YEDİM
          </Yazi>
          <GirisAlani etiket="Ne yedin?" value={ne} onChangeText={setNe} placeholder="Örnek: lahmacun, ayran" />
          <View style={stiller.cipler} accessibilityRole="radiogroup" accessibilityLabel="Ne kadar">
            {MIKTARLAR.map((x) => (
              <SecenekHapi key={x.m} etiket={x.ad} secili={miktar === x.m} onPress={() => setMiktar(x.m)} />
            ))}
          </View>
          <Dugme
            etiket="Kaydet"
            pasif={!ne.trim()}
            onPress={() => onDurum({ d: 'farkli', ne: ne.trim(), m: miktar })}
          />
          <Yazi tur="ikincil">Hesap yapman gerekmez; diyetisyenin ne yediğini görür.</Yazi>
        </View>
      ) : (
        <View style={stiller.dugmeler}>
          <Dugme etiket="Yedim" onPress={() => onDurum({ d: 'yedi' })} />
          <View style={stiller.ikili}>
            <View style={stiller.esnek}>
              <Dugme tur="ikincil" etiket="Farklı yedim" onPress={() => setFarkli(true)} />
            </View>
            <View style={stiller.esnek}>
              <Dugme tur="ikincil" etiket={foto ? 'Yeniden çek' : 'Tabağım'} onPress={() => void cek()} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function TarifAyrintisi({ tarif }: { tarif: Tarif }) {
  return (
    <View style={stiller.kutuAlan}>
      <Yazi tur="ikincil">{`${tarif.sure} · ${tarif.degisim}`}</Yazi>
      <Yazi kalinlik="kalin">Malzemeler</Yazi>
      {tarif.malzemeler.map((m) => (
        <Yazi key={m}>{`• ${m}`}</Yazi>
      ))}
      <Yazi kalinlik="kalin">Yapılışı</Yazi>
      {tarif.yapilis.map((y, i) => (
        <Yazi key={y}>{`${i + 1}. ${y}`}</Yazi>
      ))}
    </View>
  );
}

function TariflerSayfasi({ tarifler, alisveris }: { tarifler: readonly Tarif[]; alisveris: readonly string[] }) {
  const { kapi, oku } = useVeri();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [acik, setAcik] = useState<string | null>(null);
  const [eklendi, setEklendi] = useState(false);
  const marketeEkle = () =>
    void listeKartiKur(
      kapi,
      oku,
      'Market',
      RUTIN_KALICI,
      bugunGun,
      yeniKimlik,
      alisveris.map((metin) => ({ metin })),
    )
      .then(() => {
        setEklendi(true);
        kisaMesaj('Listeler’e "Market" eklendi.');
      })
      .catch((e: unknown) => {
        console.error('Liste kurulamadı', e);
        kisaMesaj('Kaydedilemedi. Yeniden dene.');
      });
  return (
    <View style={stiller.sayfa}>
      {alisveris.length > 0 && (
        <View style={stiller.kutuAlan}>
          <Yazi kalinlik="kalin">Bu haftanın alışverişi</Yazi>
          <Yazi tur="ikincil">{alisveris.join(', ')}</Yazi>
          <Dugme
            etiket={eklendi ? 'Listeler’e eklendi ✓' : 'Listeler’e "Market" olarak ekle'}
            pasif={eklendi}
            onPress={marketeEkle}
          />
          <Yazi tur="ikincil">Evde olanları sonra listeden silersin; istersen paylaşırsın.</Yazi>
        </View>
      )}
      {tarifler.length > 0 && (
        <Yazi tur="etiket" kalinlik="kalin" renk={renk.ikincil}>
          DİYETİSYENİNİN TARİFLERİ
        </Yazi>
      )}
      {tarifler.map((t) => (
        <View key={t.id} style={stiller.kutuAlan}>
          <Pressable
            onPress={() => setAcik(acik === t.id ? null : t.id)}
            accessibilityRole="button"
            accessibilityState={{ expanded: acik === t.id }}
            style={stiller.tarifBaslik}
          >
            <View style={stiller.esnek}>
              <Yazi kalinlik="kalin">{t.ad}</Yazi>
              <Yazi tur="ikincil">{`${t.sure} · ${t.degisim}`}</Yazi>
            </View>
            <Ionicons name={acik === t.id ? 'chevron-up' : 'chevron-down'} size={20} color={renk.soluk} />
          </Pressable>
          {acik === t.id && <TarifAyrintisi tarif={t} />}
        </View>
      ))}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 8 },
  ust: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  esnek: { flex: 1 },
  ogun: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sirada: { backgroundColor: renk.anaAcik },
  kutu: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: renk.soluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  tarifDugme: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: olcu.enAzDokunma },
  sayfa: { gap: 12 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cip: { backgroundColor: renk.anaAcik, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  kutuAlan: {
    gap: 8,
    backgroundColor: renk.yuzey,
    borderRadius: olcu.kose.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: 14,
  },
  miktar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  not: { backgroundColor: renk.vurguAcik2, borderRadius: 14, padding: 12 },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: olcu.kose.kart },
  dugmeler: { gap: 10 },
  ikili: { flexDirection: 'row', gap: 10 },
  secenek: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: renk.cizgi,
  },
  tarifBaslik: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: olcu.enAzDokunma },
});
