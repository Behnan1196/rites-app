// Kur ekranında bir öğenin ⋯ menüsü (pilot 29 Ekim, P-66): kart açıkken değiştirilebilsin mi
// (anahtar), yukarı / aşağı taşı, sil. Başlık satırının ⋯'sinde yalnız anahtarlar (başlık,
// tarih ve saat).

import { StyleSheet, View } from 'react-native';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { AcKapa } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

export interface MenuAnahtari {
  etiket: string;
  acik: boolean;
  onDegis: (acik: boolean) => void;
}

export function ElemanMenusu({
  baslik,
  anahtarlar,
  onYukari,
  onAsagi,
  onSil,
  silEtiketi = 'Sil',
  onKapat,
  onDuzenle,
  duzenleEtiketi = 'Düzenle',
}: {
  baslik: string;
  anahtarlar: readonly MenuAnahtari[];
  onYukari?: () => void;
  onAsagi?: () => void;
  onSil?: () => void;
  silEtiketi?: string;
  onKapat: () => void;
  /** P-77: kart görünümünde parçanın ayar sayfası ("Ayarla", "Maddeleri düzenle"). */
  onDuzenle?: () => void;
  duzenleEtiketi?: string;
}) {
  return (
    <AltSayfa gorunur onKapat={onKapat} baslik={baslik} sagKapat="Tamam">
      {onDuzenle && (
        <Dugme
          tur="ikincil"
          yaziRengi={renk.ana}
          etiket={duzenleEtiketi}
          onPress={() => {
            onKapat();
            onDuzenle();
          }}
        />
      )}
      {anahtarlar.map((a) => (
        <View key={a.etiket} style={stiller.satir}>
          <View style={stiller.esnek}>
            <Yazi>{a.etiket}</Yazi>
            <Yazi tur="ikincil">{a.acik ? 'Kart açıkken değiştirilebilir' : 'Kart açıkken değiştirilemez'}</Yazi>
          </View>
          <AcKapa acik={a.acik} onDegis={a.onDegis} etiket={`${a.etiket} kart açıkken değiştirilebilsin`} />
        </View>
      ))}
      {(onYukari || onAsagi) && (
        <View style={stiller.yanYana}>
          <Dugme
            tur="ikincil"
            yaziRengi={renk.ana}
            etiket="↑ Yukarı"
            onPress={() => onYukari?.()}
            pasif={!onYukari}
            style={stiller.esnek}
          />
          <Dugme
            tur="ikincil"
            yaziRengi={renk.ana}
            etiket="↓ Aşağı"
            onPress={() => onAsagi?.()}
            pasif={!onAsagi}
            style={stiller.esnek}
          />
        </View>
      )}
      {onSil && (
        <Dugme
          tur="tehlike"
          etiket={silEtiketi}
          onPress={() => {
            onKapat();
            onSil();
          }}
        />
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  esnek: { flex: 1 },
  yanYana: { flexDirection: 'row', gap: 10 },
});
