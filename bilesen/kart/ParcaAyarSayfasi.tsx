// Kart görünümünde parça ayarı (pilot 31 Ekim, P-77): Kur'a gitmeden bir parçayı kurar ya da
// düzeltir. Kur'daki parça düzenleyicisinin (BlokDuzenleyici) aynısı küçük bir sayfada:
// ölçümün adı ve birimi, puanın sorusu, zamanlayıcının dakikası, günün notunun sorusu, dosya,
// fotoğraf; listenin maddeleri (düzeltme, silme). Yeni parça (Daha'dan) burada kurulup eklenir.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formaBlok, kaydaBlok, type ParcaTaslagi } from '@/mantik/blokTaslak';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { BlokDuzenleyici } from './BlokDuzenleyici';
import { BLOK_TURLERI } from './blokTurleri';

export function ParcaAyarSayfasi({
  blok,
  yeni = false,
  cokGunlu,
  siklik = false,
  onKaydet,
  onKapat,
  onYukari,
  onAsagi,
  onSil,
}: {
  blok: ParcaTaslagi;
  /** Daha'dan yeni parça: "Ekle" ile karta eklenir. */
  yeni?: boolean;
  cokGunlu: boolean;
  /** P-91: Ölçümlerim'de ölçümün sıklığı. */
  siklik?: boolean;
  onKaydet: (b: ParcaTaslagi) => void;
  onKapat: () => void;
  /** P-99: Ölçümlerim'de ölçümün formunda sıra ve kaldırma. */
  onYukari?: () => void;
  onAsagi?: () => void;
  onSil?: () => void;
}) {
  const [ilk] = useState(() => formaBlok(blok));
  const [taslak, setTaslak] = useState(ilk);
  const degisti = JSON.stringify(taslak) !== JSON.stringify(ilk);
  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={BLOK_TURLERI[blok.tur].ad}
      solVazgec
      degisti={degisti}
      sagEylem={{
        etiket: yeni ? 'Ekle' : 'Kaydet',
        onPress: () => {
          if (yeni || degisti) onKaydet(kaydaBlok(taslak));
          onKapat();
        },
      }}
    >
      <BlokDuzenleyici
        blok={taslak}
        onDegis={setTaslak}
        onKaldir={onKapat}
        cokGunlu={cokGunlu}
        onListeSecimi={(tur) => setTaslak((t) => ({ ...t, tur }))}
        onMenu={undefined}
        basliksiz
        siklik={siklik}
      />
      {(onYukari || onAsagi) && (
        <View style={stiller.ikili}>
          <Dugme
            tur="ikincil"
            etiket="↑ Yukarı"
            pasif={!onYukari}
            onPress={() => {
              onYukari?.();
              onKapat();
            }}
            style={stiller.esnek}
          />
          <Dugme
            tur="ikincil"
            etiket="↓ Aşağı"
            pasif={!onAsagi}
            onPress={() => {
              onAsagi?.();
              onKapat();
            }}
            style={stiller.esnek}
          />
        </View>
      )}
      {!!onSil && (
        <Dugme
          tur="tehlike"
          etiket="Ölçümü kaldır"
          onPress={() => {
            onSil();
            onKapat();
          }}
        />
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  ikili: { flexDirection: 'row', gap: 8 },
  esnek: { flex: 1 },
});
