// Verilen kartları izleme (pilot 29 Ekim, P-62): "Elif · Yatağını topla · Bu hafta 5/7".
// Grup ekranında grubun üyeleri arasındakiler, Gruplar'da verdiklerimin hepsi. Satıra
// dokununca son 14 gün ve (veren için) "Geri al".

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { tekrarMetni } from '@/mantik/gorunurluk';
import type { AdBulucu } from '@/mantik/gruplar';
import { son14Gun, verilenOzeti, type VerilenKart } from '@/mantik/kartVerme';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { gunKisa, uzunTarih } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { useKisaMesaj } from '../KisaMesaj';
import { kaynakRenk, olcu, renk } from '../tema';
import { Yazi } from '../Yazi';
import { useKartVerme } from './KartVerme';

/** `uyeler` verilirse yalnız bu kişilerle aramdaki kartlar; yoksa yalnız verdiklerim. */
export function verilenleriSuz(
  verilenler: readonly VerilenKart[],
  ben: string,
  uyeler?: ReadonlySet<string>,
): VerilenKart[] {
  return verilenler.filter((v) =>
    uyeler ? (v.veren === ben && uyeler.has(v.alan)) || (v.alan === ben && uyeler.has(v.veren)) : v.veren === ben,
  );
}

export function VerilenKartlarListesi({ liste, ad }: { liste: readonly VerilenKart[]; ad: AdBulucu }) {
  const { ben } = useKartVerme();
  const bugunGun = useBugun();
  const [acik, setAcik] = useState<string | null>(null);
  const secilen = liste.find((v) => v.id === acik) ?? null;
  if (!ben) return null;
  return (
    <>
      {liste.map((v) => {
        const verdigim = v.veren === ben;
        const baslik = verdigim ? `${ad(v.alan)} · ${v.kart.baslik}` : v.kart.baslik;
        const alt = verdigim ? (v.kart.tekrar ? tekrarMetni(v.kart.tekrar) : 'Bir kez') : `${ad(v.veren)} verdi`;
        const ozet = verilenOzeti(v, bugunGun);
        return (
          <Pressable
            key={v.id}
            onPress={() => setAcik(v.id)}
            accessibilityRole="button"
            accessibilityLabel={`${baslik}, ${alt}, ${ozet}`}
            style={({ pressed }) => [stiller.satir, pressed && { opacity: 0.75 }]}
          >
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{baslik}</Yazi>
              <Yazi tur="ikincil">{alt}</Yazi>
            </View>
            <Yazi tur="ikincil" kalinlik="kalin" renk={v.durum === 'birakildi' ? renk.hata : kaynakRenk.koc.yazi}>
              {ozet}
            </Yazi>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>
        );
      })}
      {secilen && <VerilenAyrinti v={secilen} ad={ad} onKapat={() => setAcik(null)} />}
    </>
  );
}

function VerilenAyrinti({ v, ad, onKapat }: { v: VerilenKart; ad: AdBulucu; onKapat: () => void }) {
  const { ben, geriAl } = useKartVerme();
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const [soru, setSoru] = useState(false);
  const verdigim = v.veren === ben;
  const serit = son14Gun(v, bugunGun);
  const sil = async () => {
    setSoru(false);
    try {
      await geriAl(v.id);
      kisaMesaj(v.durum === 'birakildi' ? 'Listeden kaldırıldı' : `Geri alındı: ${v.kart.baslik}`);
      onKapat();
    } catch (e) {
      console.warn(e);
      kisaMesaj(BAGLANAMIYOR);
    }
  };
  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={v.kart.baslik}
      sagKapat="Kapat"
      onay={
        soru
          ? {
              baslik: `${v.kart.baslik} geri alınsın mı?`,
              aciklama: `Kart ${ad(v.alan)} kişisinin ajandasından kalkar.`,
              secenekler: [
                { etiket: 'Geri al', tur: 'tehlike', onPress: () => void sil() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSoru(false) },
              ],
            }
          : null
      }
    >
      <Yazi tur="ikincil">
        {[
          verdigim ? `Kime: ${ad(v.alan)}` : `Veren: ${ad(v.veren)}`,
          `Başlangıç: ${uzunTarih(v.baslangic)}`,
          v.kart.tekrar ? tekrarMetni(v.kart.tekrar) : 'Bir kez',
        ].join(' · ')}
      </Yazi>
      <Yazi kalinlik="kalin">{verilenOzeti(v, bugunGun)}</Yazi>
      <Yazi tur="ikincil">Son 14 gün</Yazi>
      <View style={stiller.serit}>
        {serit.map((s) => (
          <View
            key={s.gun}
            style={stiller.hucre}
            accessible
            accessibilityLabel={`${uzunTarih(s.gun)}: ${
              s.durum === 'yapildi' ? 'yaptı' : s.durum === 'yapilmadi' ? 'yapmadı' : 'kart yok'
            }`}
          >
            <View
              style={[
                stiller.daire,
                s.durum === 'yapildi' && stiller.dolu,
                s.durum === 'yapilmadi' && s.gun <= bugunGun && stiller.bos,
              ]}
            >
              {s.durum === 'yapildi' && <Ionicons name="checkmark" size={14} color={renk.yuzey} />}
            </View>
            <Yazi
              tur="etiket"
              kalinlik={s.gun === bugunGun ? 'kalin' : 'normal'}
              renk={s.gun === bugunGun ? renk.yazi : renk.ikincil}
              maxFontSizeMultiplier={1.1}
            >
              {gunKisa(s.gun)}
            </Yazi>
          </View>
        ))}
      </View>
      {verdigim &&
        (v.durum === 'birakildi' ? (
          <>
            <Yazi tur="ikincil" renk={renk.hata}>{`${ad(v.alan)} bu kartı bıraktı.`}</Yazi>
            <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="Listeden kaldır" onPress={() => void sil()} />
          </>
        ) : (
          <Dugme tur="tehlike" etiket="Geri al" onPress={() => setSoru(true)} />
        ))}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderLeftWidth: 6,
    borderLeftColor: kaynakRenk.koc.serit,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 68,
  },
  esnek: { flex: 1 },
  serit: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  hucre: { width: `${100 / 7}%`, alignItems: 'center', gap: 2 },
  daire: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: renk.zemin,
  },
  dolu: { backgroundColor: kaynakRenk.koc.serit },
  bos: { borderWidth: 2, borderColor: renk.cizgi, backgroundColor: renk.yuzey },
});
