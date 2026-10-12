// Plan ekranı → Plan sekmesi (P-1, PL-2): düzenli kartların bugünkü durumu ve
// adımlar (sıradakiler, tarihsizler, yeni adım kutusu, bitenler).

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { tekrarMetni } from '@/mantik/gorunurluk';
import {
  adimlar as adimlariAyikla,
  BUGUN_DURUMU_METNI,
  bugunDurumu,
  type AdimSatiri as AdimBilgisi,
} from '@/mantik/plan';
import type { Gun } from '@/mantik/tarih';
import type { KartOzeti } from '@/veri/kartlar';

import { Dugme } from '../Dugme';
import { olcu, renk, yazi, boyut } from '../tema';
import { Yazi } from '../Yazi';

interface Ozellikler {
  kartlar: readonly KartOzeti[];
  bugunYapilanlar: ReadonlySet<string>;
  bugunGun: Gun;
  /** Biten planda adım eklenmez, ajandaya alınmaz. */
  etkin: boolean;
  onKartiAc: (kart: KartOzeti) => void;
  onAdimIsaretle: (kart: KartOzeti, yapildi: boolean) => void;
  onAjandayaAl: (kart: KartOzeti) => void;
  onAdimEkle: (baslik: string) => void;
  onAjandamdaGor: () => void;
}

export function PlanSekmesi({
  kartlar,
  bugunYapilanlar,
  bugunGun,
  etkin,
  onKartiAc,
  onAdimIsaretle,
  onAjandayaAl,
  onAdimEkle,
  onAjandamdaGor,
}: Ozellikler) {
  const [yeniAdim, setYeniAdim] = useState('');
  const duzenliler = kartlar.filter((k) => k.tekrar);
  const a = adimlariAyikla(kartlar, bugunGun);

  const ekle = () => {
    const t = yeniAdim.trim();
    if (!t) return;
    onAdimEkle(t);
    setYeniAdim('');
  };

  return (
    <View style={stiller.kap}>
      {duzenliler.length > 0 && (
        <>
          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Bugün
          </Yazi>
          {duzenliler.map((k) => {
            const d = bugunDurumu(k, bugunYapilanlar, bugunGun);
            return (
              <Pressable
                key={k.id}
                onPress={() => onKartiAc(k)}
                accessibilityRole="button"
                accessibilityLabel={`${k.baslik}, ${BUGUN_DURUMU_METNI[d]}`}
                style={({ pressed }) => [stiller.satir, stiller.duzenli, pressed && { opacity: 0.75 }]}
              >
                <View style={stiller.esnek}>
                  <Yazi kalinlik="kalin">{k.baslik}</Yazi>
                  <Yazi tur="ikincil">{[k.tekrar ? tekrarMetni(k.tekrar) : null, k.saat].filter(Boolean).join(' · ')}</Yazi>
                </View>
                <Yazi tur="etiket" kalinlik="kalin" renk={d === 'yapildi' ? renk.ana : d === 'yok' ? renk.ikincil : renk.vurguYazi}>
                  {BUGUN_DURUMU_METNI[d]}
                </Yazi>
                <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
              </Pressable>
            );
          })}
        </>
      )}

      <Yazi tur="bolumBasligi" accessibilityRole="header">
        Adımlar
      </Yazi>
      {a.toplam === 0 && <Yazi tur="ikincil">Tek seferlik işleri buraya yaz; istediğini ajandana alırsın.</Yazi>}
      {a.siradakiler.map((s) => (
        <AdimSatiri key={s.kart.id} s={s} onIsaretle={onAdimIsaretle} onAc={onKartiAc} />
      ))}

      {a.tarihsizler.length > 0 && (
        <>
          <Yazi kalinlik="kalin" renk={renk.ikincil} accessibilityRole="header" style={stiller.altBaslik}>
            Tarihsiz
          </Yazi>
          {a.tarihsizler.map((s) => (
            <AdimSatiri
              key={s.kart.id}
              s={s}
              onIsaretle={onAdimIsaretle}
              onAc={onKartiAc}
              sag={
                etkin ? (
                  <Dugme
                    tur="ikincil"
                    etiket="Ajandaya al"
                    yaziRengi={renk.ana}
                    onPress={() => onAjandayaAl(s.kart)}
                    style={stiller.ajandayaAl}
                  />
                ) : null
              }
            />
          ))}
        </>
      )}

      {etkin && (
        <TextInput
          value={yeniAdim}
          onChangeText={setYeniAdim}
          onSubmitEditing={ekle}
          submitBehavior="submit"
          returnKeyType="done"
          placeholder="+ Yeni adım yaz, Enter'a bas"
          placeholderTextColor={renk.soluk}
          selectionColor={renk.ana}
          accessibilityLabel="Yeni adım"
          style={[stiller.yeniAdim, yazi('normal')]}
        />
      )}

      {a.bitenler.length > 0 && (
        <>
          <Yazi kalinlik="kalin" renk={renk.ikincil} accessibilityRole="header" style={stiller.altBaslik}>
            {`Bitenler (${a.bitenler.length})`}
          </Yazi>
          {a.bitenler.map((s) => (
            <AdimSatiri key={s.kart.id} s={s} onIsaretle={onAdimIsaretle} onAc={onKartiAc} />
          ))}
        </>
      )}

      <Dugme tur="ikincil" etiket="Ajandam'da gör" yaziRengi={renk.ana} onPress={onAjandamdaGor} style={stiller.ajandamdaGor} />
    </View>
  );
}

function AdimSatiri({
  s,
  onIsaretle,
  onAc,
  sag,
}: {
  s: AdimBilgisi<KartOzeti>;
  onIsaretle: (kart: KartOzeti, yapildi: boolean) => void;
  onAc: (kart: KartOzeti) => void;
  sag?: React.ReactNode;
}) {
  const bitti = s.kart.yapildi;
  return (
    <View style={stiller.satir}>
      <Pressable
        onPress={() => onIsaretle(s.kart, !bitti)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: bitti }}
        accessibilityLabel={bitti ? `${s.kart.baslik}: bitti` : `${s.kart.baslik}: bitti olarak işaretle`}
        style={stiller.isaretAlani}
        hitSlop={4}
      >
        <View style={[stiller.kare, bitti && stiller.kareDolu]}>
          {bitti && <Ionicons name="checkmark" size={18} color={renk.yuzey} />}
        </View>
      </Pressable>
      <Pressable
        onPress={() => onAc(s.kart)}
        accessibilityRole="button"
        accessibilityLabel={`${s.kart.baslik}${s.ne ? `, ${s.ne}` : ''}, aç`}
        style={({ pressed }) => [stiller.esnek, stiller.adimGovde, pressed && { opacity: 0.7 }]}
      >
        <Yazi
          kalinlik="kalin"
          renk={bitti ? renk.soluk : renk.yazi}
          style={bitti && stiller.ustuCizili}
          numberOfLines={3}
        >
          {s.kart.baslik}
        </Yazi>
        {!!s.ne && (
          <Yazi tur="ikincil" renk={s.gecikti ? renk.hata : renk.ikincil} kalinlik={s.gecikti ? 'kalin' : 'normal'}>
            {s.ne}
          </Yazi>
        )}
      </Pressable>
      {sag}
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 10 },
  esnek: { flex: 1 },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    minHeight: 64,
    paddingRight: 10,
  },
  duzenli: { paddingLeft: olcu.kartIci, paddingVertical: 10, gap: 8 },
  isaretAlani: { width: 56, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  kare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: renk.soluk,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renk.yuzey,
  },
  kareDolu: { backgroundColor: renk.ana, borderColor: renk.ana },
  adimGovde: { paddingVertical: 10, gap: 2, alignSelf: 'stretch', justifyContent: 'center' },
  ustuCizili: { textDecorationLine: 'line-through' },
  altBaslik: { marginTop: 6 },
  ajandayaAl: { minHeight: 44, paddingHorizontal: 12, borderColor: renk.ana, borderWidth: 2 },
  yeniAdim: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.dugme,
    backgroundColor: renk.yuzey,
    paddingHorizontal: 14,
    fontSize: boyut.govde,
    color: renk.yazi,
  },
  ajandamdaGor: { marginTop: 8, borderColor: renk.ana, borderWidth: 2 },
});
