// Liste çeşitleri (pilot 29 Ekim, P-61) için ortak parçalar; kişisel ve paylaşılan
// liste ekranları kullanır: çeşit seçimi, madde ekleme alanı (alışverişte miktar ve
// önceki alışverişlerden öneri), madde satırı, miktar seçimi, çeşide göre toplu eylem.

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  alisverisOnerileri,
  cesitTanimi,
  gecmiseEkle,
  isaretliMi,
  LISTE_CESITLERI,
  miktarAyir,
  MIKTAR_ORNEKLERI,
  type ListeCesidi,
} from '@/mantik/listeCesidi';
import { ayarYaz } from '@/veri/ayar';
import { useAyar } from '@/veri/kancalar';
import { useVeri } from '@/veri/VeriSaglayici';

import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { IsaretKutusu, parcaStilleri } from '../gruplar/parcalar';
import { Katman } from '../Katman';
import { OnayKutusu } from '../OnayKutusu';
import { Bolum, SecenekHapi } from '../Secim';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

/** "Ne tür bir liste?": dört çip, altında seçilenin açıklaması. */
export function CesitSecimi({ secili, onSec }: { secili: ListeCesidi; onSec: (c: ListeCesidi) => void }) {
  return (
    <Bolum>
      <Yazi kalinlik="kalin">Ne tür bir liste?</Yazi>
      <View style={stiller.cipler}>
        {LISTE_CESITLERI.map((c) => (
          <SecenekHapi key={c.cesit} etiket={c.ad} secili={secili === c.cesit} onPress={() => onSec(c.cesit)} />
        ))}
      </View>
      <Yazi tur="ikincil">{cesitTanimi(secili).aciklama}</Yazi>
    </Bolum>
  );
}

const YER_TUTUCU: Record<ListeCesidi, string> = {
  yapilacak: "Ekle ve Enter'a bas",
  alisveris: 'Ne alınacak? Örneğin: 2 kg domates',
  hazirlik: 'Ne hazırlanacak? Örneğin: Pasaport',
  not: "Ekle ve Enter'a bas",
};

/**
 * Madde ekleme alanı. Alışverişte satırın başındaki miktar ayrılır ("2 kg domates") ve
 * yazarken önceki alışverişlerden öneri çıkar (geçmiş yalnız bu telefonda).
 */
export function MaddeEkleAlani({
  cesit,
  listedekiler,
  onEkle,
}: {
  cesit: ListeCesidi;
  /** Listede henüz alınmamış maddelerin metinleri (öneride tekrar etmesin). */
  listedekiler: readonly string[];
  onEkle: (metin: string, miktar: string) => void;
}) {
  const { kapi } = useVeri();
  const gecmis = useAyar('alisveris_gecmisi').veri ?? [];
  const [yeni, setYeni] = useState('');
  const alisveris = cesit === 'alisveris';
  const oneriler = alisveris ? alisverisOnerileri(gecmis, yeni, listedekiler) : [];

  const ekle = (metin: string, miktar: string) => {
    if (!metin.trim()) return;
    setYeni('');
    onEkle(metin.trim(), miktar);
    if (alisveris) void ayarYaz(kapi, 'alisveris_gecmisi', gecmiseEkle(gecmis, metin)).catch(() => undefined);
  };
  const satirdan = () => {
    const t = yeni.trim();
    if (!t) return;
    const a = alisveris ? miktarAyir(t) : { metin: t, miktar: '' };
    ekle(a.metin, a.miktar);
  };

  return (
    <>
      <GirisAlani
        etiket="Listeye ekle"
        etiketGizli
        value={yeni}
        onChangeText={setYeni}
        placeholder={YER_TUTUCU[cesit]}
        returnKeyType="done"
        submitBehavior="submit"
        onSubmitEditing={satirdan}
      />
      {oneriler.length > 0 && (
        <View style={stiller.cipler} accessibilityLabel="Önceki alışverişlerden">
          {oneriler.map((o) => (
            <SecenekHapi
              key={o}
              etiket={`+ ${o}`}
              erisimEtiketi={`${o} ekle`}
              secili={false}
              onPress={() => ekle(o, miktarAyir(yeni).miktar)}
            />
          ))}
        </View>
      )}
    </>
  );
}

/** Bir madde satırı: işaret kutusu (Not listesinde yok), metin, miktar ve etiketler, ok. */
export function MaddeSatiri({
  cesit,
  metin,
  miktar,
  yapildi,
  etiketler,
  erisimEki,
  cizgili,
  onIsaretle,
  onAc,
}: {
  cesit: ListeCesidi;
  metin: string;
  miktar?: string;
  yapildi: boolean;
  /** Metnin altındaki küçük etiketler (tarih, kime, ekleyen). */
  etiketler?: ReactNode;
  /** Ekran okuyucu için ek ("Bugün"). */
  erisimEki?: string;
  cizgili: boolean;
  onIsaretle: () => void;
  onAc: () => void;
}) {
  const isaretli = isaretliMi(cesit);
  const ustuCizili = isaretli && yapildi && cesit !== 'hazirlik';
  return (
    <View style={[stiller.madde, cizgili && parcaStilleri.cizgili, !isaretli && stiller.isaretsiz]}>
      {isaretli && (
        <Pressable
          onPress={onIsaretle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: yapildi }}
          accessibilityLabel={[miktar, metin].filter(Boolean).join(' ')}
          hitSlop={6}
          style={stiller.isaretAlani}
        >
          <IsaretKutusu secili={yapildi} />
        </Pressable>
      )}
      <Pressable
        onPress={onAc}
        accessibilityRole="button"
        accessibilityLabel={[[miktar, metin].filter(Boolean).join(' '), erisimEki].filter(Boolean).join(', ')}
        style={({ pressed }) => [stiller.maddeGovde, pressed && { opacity: 0.7 }]}
      >
        <View style={parcaStilleri.esnek}>
          <View style={stiller.metinSatiri}>
            {!!miktar && (
              <View style={stiller.miktar}>
                <Yazi tur="etiket" kalinlik="kalin" renk={kaynakRenk.liste.yazi}>
                  {miktar}
                </Yazi>
              </View>
            )}
            <Yazi
              tur="kartBasligi"
              renk={ustuCizili ? renk.ikincil : renk.yazi}
              style={[stiller.esnek, ustuCizili && stiller.cizili]}
            >
              {metin}
            </Yazi>
          </View>
          {etiketler}
        </View>
        <Ionicons name="chevron-forward" size={18} color={renk.soluk} />
      </Pressable>
    </View>
  );
}

/** Madde sayfasında "Ne kadar?" (yalnız alışveriş). */
export function MiktarBolumu({ miktar, onDegis }: { miktar: string; onDegis: (m: string) => void }) {
  const [elle, setElle] = useState(miktar);
  const sec = (m: string) => {
    setElle(m);
    onDegis(m);
  };
  return (
    <Bolum>
      <Yazi kalinlik="kalin">Ne kadar?</Yazi>
      <View style={stiller.cipler}>
        <SecenekHapi etiket="Yok" secili={miktar === ''} onPress={() => sec('')} />
        {MIKTAR_ORNEKLERI.map((m) => (
          <SecenekHapi key={m} etiket={m} secili={miktar === m} onPress={() => sec(m)} />
        ))}
      </View>
      <GirisAlani
        etiket="Başka miktar"
        value={elle}
        onChangeText={setElle}
        onEndEditing={() => elle.trim() !== miktar && onDegis(elle.trim())}
        onSubmitEditing={() => elle.trim() !== miktar && onDegis(elle.trim())}
        placeholder="Örneğin: 6 yumurta, 250 g"
        returnKeyType="done"
        maxLength={40}
      />
    </Bolum>
  );
}

/**
 * Listenin altındaki çeşide özel düğme: Alışveriş → "Alınanları temizle (N)";
 * Hazırlık → "Baştan başla" (onaylı; maddeler kalır, işaretler silinir).
 */
export function CesitEylemi({
  cesit,
  yapilanSayisi,
  onTemizle,
  onBastan,
}: {
  cesit: ListeCesidi;
  yapilanSayisi: number;
  onTemizle: () => void;
  onBastan: () => void;
}) {
  const [soru, setSoru] = useState(false);
  if (yapilanSayisi === 0) return null;
  if (cesit === 'alisveris')
    return <Dugme tur="ikincil" yaziRengi={renk.ana} etiket={`Alınanları temizle (${yapilanSayisi})`} onPress={onTemizle} />;
  if (cesit !== 'hazirlik') return null;
  return (
    <>
      <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Baştan başla" onPress={() => setSoru(true)} />
      {soru && (
        <Katman>
          <OnayKutusu
            baslik="Baştan başlansın mı?"
            aciklama="Maddeler kalır, bütün işaretler silinir. Liste bir dahaki sefere hazır olur."
            secenekler={[
              {
                etiket: 'Baştan başla',
                tur: 'ana',
                onPress: () => {
                  setSoru(false);
                  onBastan();
                },
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(false) },
            ]}
          />
        </Katman>
      )}
    </>
  );
}

/** Hazırlıkta listenin üstünde "3/10 hazır" ilerlemesi. */
export function HazirlikIlerlemesi({ toplam, hazir }: { toplam: number; hazir: number }) {
  if (toplam === 0) return null;
  const oran = hazir / toplam;
  return (
    <View
      style={stiller.ilerleme}
      accessibilityRole="progressbar"
      accessibilityLabel={`${hazir}/${toplam} hazır`}
      accessibilityValue={{ min: 0, max: toplam, now: hazir }}
    >
      <View style={stiller.ilerlemeCubugu}>
        <View style={[stiller.ilerlemeDolu, { width: `${Math.round(oran * 100)}%` }]} />
      </View>
      <Yazi tur="ikincil" kalinlik="kalin">{`${hazir}/${toplam} hazır`}</Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  madde: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  isaretsiz: { paddingLeft: 4 },
  isaretAlani: { width: 48, minHeight: 56, justifyContent: 'center' },
  maddeGovde: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  metinSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  esnek: { flex: 1 },
  cizili: { textDecorationLine: 'line-through' },
  miktar: {
    borderRadius: olcu.kose.etiket,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: kaynakRenk.liste.zemin,
  },
  ilerleme: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ilerlemeCubugu: { flex: 1, height: 10, borderRadius: 5, backgroundColor: renk.cizgi, overflow: 'hidden' },
  ilerlemeDolu: { height: 10, borderRadius: 5, backgroundColor: kaynakRenk.liste.serit },
});
