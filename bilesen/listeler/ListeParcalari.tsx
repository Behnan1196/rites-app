// Liste çeşitleri için ortak parçalar (P-61; P-86: Adımlar · Günlük kontrol · Bilgi listesi);
// kişisel ve paylaşılan liste ekranları kullanır: çeşit seçimi, madde ekleme alanı, madde
// satırı (dokun: işaret, uzun bas: yerinde düzelt), Adımlar'da "Yapılanları temizle".

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { cesitTanimi, isaretliMi, LISTE_CESITLERI, type ListeCesidi } from '@/mantik/listeCesidi';

import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { IsaretKutusu, parcaStilleri } from '../gruplar/parcalar';
import { MaddeDuzeltici } from '../MaddeDuzeltici';
import { Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

/** "Ne tür bir liste?": üç çip, altında seçilenin açıklaması. */
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
  gunluk: "Ekle ve Enter'a bas",
  not: "Ekle ve Enter'a bas",
};

/** Madde ekleme alanı (P-86: miktar ve öneri yok). */
export function MaddeEkleAlani({ cesit, onEkle }: { cesit: ListeCesidi; onEkle: (metin: string) => void }) {
  const [yeni, setYeni] = useState('');
  const ekle = () => {
    const t = yeni.trim();
    if (!t) return;
    setYeni('');
    onEkle(t);
  };
  return (
    <GirisAlani
      etiket="Listeye ekle"
      etiketGizli
      value={yeni}
      onChangeText={setYeni}
      placeholder={YER_TUTUCU[cesit]}
      returnKeyType="done"
      submitBehavior="submit"
      onSubmitEditing={ekle}
    />
  );
}

/**
 * Bir madde satırı (P-86): dokununca işaret (Bilgi listesinde yok), uzun basınca yerinde
 * düzeltme (`duzeltiliyor`); Adımlar'da düzeltmenin yanında gün düğmesi.
 */
export function MaddeSatiri({
  cesit,
  metin,
  yapildi,
  etiketler,
  erisimEki,
  cizgili,
  duzeltiliyor,
  onIsaretle,
  onDuzelt,
  onDuzeltKapat,
  onKaydet,
  onSil,
  onGun,
}: {
  cesit: ListeCesidi;
  metin: string;
  /** Ekranda işaretli mi (günlükte yalnız bugünkü). */
  yapildi: boolean;
  /** Metnin altındaki küçük etiketler (tarih, kime, ekleyen). */
  etiketler?: ReactNode;
  /** Ekran okuyucu için ek ("Bugün"). */
  erisimEki?: string;
  cizgili: boolean;
  duzeltiliyor: boolean;
  onIsaretle: () => void;
  onDuzelt: () => void;
  onDuzeltKapat: () => void;
  onKaydet: (metin: string) => void;
  onSil: () => void;
  onGun?: () => void;
}) {
  const isaretli = isaretliMi(cesit);
  if (duzeltiliyor)
    return (
      <View style={[stiller.duzelt, cizgili && parcaStilleri.cizgili]}>
        <MaddeDuzeltici metin={metin} onKaydet={onKaydet} onSil={onSil} onKapat={onDuzeltKapat} onGun={onGun} />
      </View>
    );
  const etiket = [metin, erisimEki].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={isaretli ? onIsaretle : undefined}
      onLongPress={onDuzelt}
      accessibilityRole={isaretli ? 'checkbox' : 'text'}
      accessibilityState={isaretli ? { checked: yapildi } : undefined}
      accessibilityLabel={etiket}
      accessibilityHint="Düzeltmek için uzun bas"
      style={({ pressed }) => [
        stiller.madde,
        cizgili && parcaStilleri.cizgili,
        !isaretli && stiller.isaretsiz,
        pressed && { opacity: 0.75 },
      ]}
    >
      {isaretli ? (
        <View style={stiller.isaretAlani}>
          <IsaretKutusu secili={yapildi} />
        </View>
      ) : (
        <Yazi renk={renk.ikincil} style={stiller.nokta}>
          •
        </Yazi>
      )}
      <View style={[parcaStilleri.esnek, stiller.maddeGovde]}>
        <Yazi
          tur="kartBasligi"
          renk={isaretli && yapildi ? renk.ikincil : renk.yazi}
          style={isaretli && yapildi && stiller.cizili}
        >
          {metin}
        </Yazi>
        {etiketler}
      </View>
    </Pressable>
  );
}

/** Adımlar'ın altında "Yapılanları temizle (N)". */
export function CesitEylemi({
  cesit,
  yapilanSayisi,
  onTemizle,
}: {
  cesit: ListeCesidi;
  yapilanSayisi: number;
  onTemizle: () => void;
}) {
  if (yapilanSayisi === 0 || cesit !== 'yapilacak') return null;
  return (
    <Dugme tur="ikincil" yaziRengi={renk.ana} etiket={`Yapılanları temizle (${yapilanSayisi})`} onPress={onTemizle} />
  );
}

const stiller = StyleSheet.create({
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  madde: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  duzelt: { paddingVertical: 6 },
  isaretsiz: { paddingLeft: 4 },
  isaretAlani: { width: 48, minHeight: 56, justifyContent: 'center' },
  nokta: { width: 24 },
  maddeGovde: { paddingVertical: 12 },
  cizili: { textDecorationLine: 'line-through' },
});
