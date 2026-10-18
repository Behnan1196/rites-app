// Grup ekranında bir iş: ad, ne zaman, durum ("Ali aldı", "Senden istiyor"…) ve
// kişinin yapabilecekleri (Ben alırım / Kabul et / Alamam / Yaptım / Bırak / Geri al).
// İsteyen için Düzenle (ret gelince "Başkasına ver" de buradan).

import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { kisaGoreliTarih } from '@/mantik/ajanda';
import { eylemEtiketi, isDurumMetni, isEylemleri, isHatasi, type GrupIsi } from '@/mantik/isler';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import type { Gun } from '@/mantik/tarih';

import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { useIsler } from './Isler';

export function IsKarti({
  is,
  ben,
  bugunGun,
  ad,
  onDuzenle,
}: {
  is: GrupIsi;
  ben: string;
  bugunGun: Gun;
  ad: (id: string) => string;
  onDuzenle: () => void;
}) {
  const { yanitla, yenile } = useIsler();
  const kisaMesaj = useKisaMesaj();
  const eylemler = isEylemleri(is, ben);
  const yapildi = is.durum === 'yapildi';
  const vurgu = (is.durum === 'istendi' && is.kime === ben) || (is.durum === 'reddedildi' && is.isteyen === ben);
  const meta = [
    is.tarih ? kisaGoreliTarih(is.tarih, bugunGun) : null,
    is.isteyen === ben ? null : `${ad(is.isteyen)} ekledi`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[stiller.kart, yapildi && stiller.soluk]}>
      <View style={stiller.ust}>
        <Ionicons
          name={yapildi ? 'checkmark-circle' : 'hand-left-outline'}
          size={22}
          color={yapildi ? renk.ana : kaynakRenk.grup.serit}
        />
        <View style={stiller.esnek}>
          <Yazi tur="kartBasligi" style={yapildi && stiller.cizili}>
            {is.baslik}
          </Yazi>
          {!!meta && <Yazi tur="ikincil">{meta}</Yazi>}
          <Yazi kalinlik="kalin" renk={vurgu ? renk.vurguYazi : kaynakRenk.grup.yazi}>
            {isDurumMetni(is, ben, ad)}
          </Yazi>
        </View>
        {is.isteyen === ben && !yapildi && (
          <Dugme tur="yazi" etiket={is.durum === 'reddedildi' ? 'Başkasına ver' : 'Düzenle'} onPress={onDuzenle} />
        )}
      </View>
      {eylemler.length > 0 && (
        <View style={stiller.dugmeler}>
          {eylemler.map((e, j) => (
            <Dugme
              key={e}
              tur={e === 'geri' ? 'yazi' : j === 0 ? 'ana' : 'ikincil'}
              etiket={eylemEtiketi(is, e)}
              style={stiller.esnekDugme}
              onPress={() =>
                void yanitla(is, e)
                  .then(() => {
                    if (e === 'al') kisaMesaj('Ajandana eklendi');
                    else if (e === 'yaptim') kisaMesaj('Yapıldı; grupta görünüyor');
                    else if (e === 'birak') kisaMesaj('Bıraktın');
                  })
                  .catch((h: unknown) => {
                    kisaMesaj(isHatasi(h instanceof Error ? h.message : String(h)) ?? BAGLANAMIYOR);
                    void yenile();
                  })
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}

const stiller = StyleSheet.create({
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.grup.serit,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
  soluk: { opacity: 0.75 },
  cizili: { textDecorationLine: 'line-through' },
  ust: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  esnek: { flex: 1, gap: 2 },
  dugmeler: { flexDirection: 'row', gap: 10 },
  esnekDugme: { flex: 1 },
});
