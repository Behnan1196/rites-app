// Kütüphanedeki ya da katalogdaki kartın içeriği, salt okunur: meta, kısa açıklama, bloklar.

import { Linking, StyleSheet } from 'react-native';

import { blokBasligi, icerikMetaMetni, type KartIcerigi, type KutuphaneBlogu } from '@/mantik/kutuphane';

import { Dugme } from '../Dugme';
import { BuyutulebilirFoto } from '../kart/BuyutulebilirFoto';
import { Bolum } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { ZenginMetin } from '../ZenginMetin';

/** Kartın içeriği, salt okunur: meta, kısa açıklama, bloklar. */
export function KartIcerigiGorunumu({ c }: { c: KartIcerigi }) {
  const meta = icerikMetaMetni(c);
  return (
    <>
      {!!meta && <Yazi tur="ikincil">{meta}</Yazi>}
      <ZenginMetin metin={c.kisa} />
      {c.bloklar.map((b, i) => (
        <BlokGorunumu key={i} b={b} />
      ))}
    </>
  );
}

function BlokGorunumu({ b }: { b: KutuphaneBlogu }) {
  switch (b.tur) {
    case 'talimat':
      return <ZenginMetin metin={b.metin} />;
    case 'liste':
    case 'adimlar':
      return (
        <Bolum>
          <Yazi kalinlik="kalin">{b.ad || 'Liste'}</Yazi>
          {b.maddeler.map((m, i) => (
            <Yazi key={i}>{`• ${m}`}</Yazi>
          ))}
        </Bolum>
      );
    case 'video':
      return /^https?:\/\//i.test(b.metin) ? (
        <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Videoyu aç" onPress={() => void Linking.openURL(b.metin)} />
      ) : (
        <Yazi tur="ikincil">Video</Yazi>
      );
    case 'foto':
      return b.dosya ? <BuyutulebilirFoto uri={b.dosya} style={stiller.foto} etiket="Fotoğraf" /> : null;
    default:
      return <Yazi tur="ikincil">{blokBasligi(b)}</Yazi>;
  }
}

const stiller = StyleSheet.create({
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },
});
