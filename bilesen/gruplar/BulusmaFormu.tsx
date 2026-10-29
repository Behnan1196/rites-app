// Buluşma ekle / düzenle (pilot 18 Ekim): ad (örneklerle), gün (takvim), isteğe
// bağlı saat ve yer. Düzenlemede kuran için "Buluşmayı sil".
// P-62 (29 Ekim): isteğe bağlı görüntülü görüşme bağlantısı (WhatsApp arama bağlantısı ya da başka);
// "WhatsApp'ı aç" bağlantıyı oluşturmak için WhatsApp'a geçer.
// Pilot 19 Ekim: yeni buluşmada "Günü oylayalım": birkaç gün önerilir, herkes uyan
// günleri işaretler; kuran karar verince o güne buluşma kurulur (Karar, tur 'gun').

import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import {
  BULUSMA_NOTU,
  BULUSMA_ORNEKLERI,
  bulusmaFormuHatasi,
  bulusmaHatasi,
  GORUSME_NOTU,
  gorusmeBaglantisi,
  gorusmeBaglantisiHatasi,
  type Bulusma,
} from '@/mantik/bulusma';
import { GUN_KARARI_NOTU, kararFormuHatasi, kararHatasi } from '@/mantik/karar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { uzunTarih, type Gun } from '@/mantik/tarih';
import { useBugun } from '@/veri/useBugun';

import { AltSayfa } from '../AltSayfa';
import { AyTakvimi } from '../AyTakvimi';
import { BolumluDugme } from '../BolumluDugme';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { SaatSecici } from '../kart/Zamanlama';
import { useKisaMesaj } from '../KisaMesaj';
import { Bolum, SecenekHapi } from '../Secim';
import { renk } from '../tema';
import { Yazi } from '../Yazi';
import { useBulusmalar } from './Bulusmalar';
import { useKararlar } from './Kararlar';

export function BulusmaFormu({
  grup,
  mevcut,
  onKapat,
}: {
  grup: { id: string; ad: string };
  mevcut?: Bulusma;
  onKapat: () => void;
}) {
  const bugunGun = useBugun();
  const kisaMesaj = useKisaMesaj();
  const { kur, duzenle, sil } = useBulusmalar();
  const karar = useKararlar();
  const [oylama, setOylama] = useState(false);
  const [gunler, setGunler] = useState<Gun[]>([]);
  const [baslik, setBaslik] = useState(mevcut?.baslik ?? '');
  const [gun, setGun] = useState<Gun | null>(mevcut?.gun ?? null);
  const [saat, setSaat] = useState<string | null>(mevcut?.saat ?? null);
  const [saatVar, setSaatVar] = useState(mevcut ? mevcut.saat !== null : true);
  const [yer, setYer] = useState(mevcut?.yer ?? '');
  const [baglanti, setBaglanti] = useState(mevcut?.baglanti ?? '');
  const [baglantiHatasi, setBaglantiHatasi] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);
  const [silSorusu, setSilSorusu] = useState(false);

  const sonSaat = saatVar ? (saat ?? '19:00') : null;
  const degisti = mevcut
    ? baslik.trim() !== mevcut.baslik ||
      gun !== mevcut.gun ||
      sonSaat !== mevcut.saat ||
      yer.trim() !== mevcut.yer ||
      gorusmeBaglantisi(baglanti) !== (mevcut.baglanti ?? '')
    : baslik.trim() !== '' || gun !== null || yer.trim() !== '' || baglanti.trim() !== '';
  const zamanDegisti = !!mevcut && (gun !== mevcut.gun || sonSaat !== mevcut.saat);

  const oylamaAc = async () => {
    const secenekler = [...gunler].sort().map((g) => ({ metin: '', gun: g, saat: sonSaat }));
    const h = kararFormuHatasi(baslik, 'gun', secenekler);
    if (h) {
      setHata(h);
      return;
    }
    setCalisiyor(true);
    try {
      await karar.kur(grup.id, { soru: baslik, tur: 'gun', coklu: true, sonGun: null, yer, secenekler });
      kisaMesaj('Gün oylaması açıldı');
      onKapat();
    } catch (e) {
      setHata(kararHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const kaydet = async () => {
    if (oylama && !mevcut) {
      await oylamaAc();
      return;
    }
    const h = bulusmaFormuHatasi(baslik, gun);
    if (h || !gun) {
      setHata(h);
      return;
    }
    const bh = gorusmeBaglantisiHatasi(baglanti);
    if (bh) {
      setBaglantiHatasi(bh);
      return;
    }
    setCalisiyor(true);
    try {
      const t = { baslik, gun, saat: sonSaat, yer, baglanti: gorusmeBaglantisi(baglanti) };
      if (mevcut) {
        await duzenle(mevcut, t);
        kisaMesaj(zamanDegisti ? 'Kaydedildi; herkes yeniden yanıtlayacak' : 'Buluşma kaydedildi');
      } else {
        await kur(grup, t);
        kisaMesaj(`${baslik.trim()} önerildi; ajandana da eklendi`);
      }
      onKapat();
    } catch (e) {
      setHata(bulusmaHatasi(e instanceof Error ? e.message : String(e)) ?? BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  const silOnayli = async () => {
    if (!mevcut) return;
    setCalisiyor(true);
    try {
      await sil(mevcut);
      kisaMesaj(`Silindi: ${mevcut.baslik}`);
      onKapat();
    } catch (e) {
      console.warn(e);
      setHata(BAGLANAMIYOR);
    } finally {
      setCalisiyor(false);
    }
  };

  return (
    <AltSayfa
      gorunur
      onKapat={onKapat}
      baslik={mevcut ? 'Buluşmayı düzenle' : `${grup.ad} · Buluşma`}
      solVazgec
      degisti={degisti}
      onay={
        silSorusu
          ? {
              baslik: `${mevcut?.baslik ?? 'Buluşma'} silinsin mi?`,
              aciklama: 'Grubun herkesi için silinir; ajandalardaki kartı da kalkar.',
              secenekler: [
                { etiket: 'Sil', tur: 'tehlike', onPress: () => void silOnayli() },
                { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
              ],
            }
          : null
      }
      altAlan={
        <Dugme
          etiket={mevcut ? 'Kaydet' : oylama ? 'Oylamayı aç' : 'Öner'}
          onPress={() => void kaydet()}
          pasif={calisiyor}
        />
      }
    >
      <View style={stiller.kap}>
        {!mevcut && (
          <BolumluDugme
            secenekler={[
              { deger: 'belli', etiket: 'Gün belli' },
              { deger: 'oylama', etiket: 'Günü oylayalım' },
            ]}
            secili={oylama ? 'oylama' : 'belli'}
            erisimEtiketi="Gün nasıl seçilsin"
            onSec={(d) => {
              setOylama(d === 'oylama');
              setHata(null);
            }}
          />
        )}
        <GirisAlani
          etiket="Ne yapılacak?"
          value={baslik}
          onChangeText={(t) => {
            setBaslik(t);
            setHata(null);
          }}
          placeholder="Örneğin: Akşam yemeği"
          hata={hata}
          returnKeyType="done"
        />
        {!mevcut && (
          <View style={stiller.cipler}>
            {BULUSMA_ORNEKLERI.map((o) => (
              <SecenekHapi
                key={o}
                etiket={o}
                erisimEtiketi={`Ad: ${o}`}
                secili={baslik.trim() === o}
                onPress={() => {
                  setBaslik(o);
                  setHata(null);
                }}
              />
            ))}
          </View>
        )}

        {oylama && !mevcut ? (
          <Bolum>
            <Yazi kalinlik="kalin">{gunler.length ? `Önerilen günler (${gunler.length})` : 'Önerilen günler'}</Yazi>
            <Yazi tur="ikincil">Uyabilecek günlere dokun; yeniden dokununca çıkar.</Yazi>
            <AyTakvimi
              secili={null}
              secililer={new Set(gunler)}
              bugunGun={bugunGun}
              onSec={(g) => {
                setHata(null);
                setGunler((l) => (l.includes(g) ? l.filter((x) => x !== g) : [...l, g]));
              }}
            />
            {gunler.length > 0 && <Yazi tur="ikincil">{[...gunler].sort().map(uzunTarih).join(' · ')}</Yazi>}
          </Bolum>
        ) : (
          <Bolum>
            <Yazi kalinlik="kalin">{gun ? `Gün: ${uzunTarih(gun)}` : 'Gün'}</Yazi>
            <AyTakvimi
              secili={gun}
              bugunGun={bugunGun}
              onSec={(g) => {
                setGun(g);
                setHata(null);
              }}
            />
          </Bolum>
        )}

        <Bolum>
          <Yazi kalinlik="kalin">Saat</Yazi>
          <View style={stiller.cipler}>
            <SecenekHapi etiket="Saatli" secili={saatVar} onPress={() => setSaatVar(true)} />
            <SecenekHapi etiket="Saat yok" secili={!saatVar} onPress={() => setSaatVar(false)} />
          </View>
          {saatVar && <SaatSecici saat={sonSaat} onDegis={setSaat} kompakt etiket="Saat" />}
        </Bolum>

        <GirisAlani
          etiket="Yer (isteğe bağlı)"
          value={yer}
          onChangeText={setYer}
          placeholder="Örneğin: Bizde, Moda sahili"
          returnKeyType="done"
        />
        {!(oylama && !mevcut) && (
          <Bolum>
            <Yazi kalinlik="kalin">Görüntülü görüşme (isteğe bağlı)</Yazi>
            <GirisAlani
              etiket="Görüşme bağlantısı"
              etiketGizli
              value={baglanti}
              onChangeText={(t) => {
                setBaglanti(t);
                setBaglantiHatasi(null);
              }}
              placeholder="https://call.whatsapp.com/…"
              hata={baglantiHatasi}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
            />
            <Yazi tur="ikincil">{GORUSME_NOTU}</Yazi>
            <Dugme
              tur="ikincil"
              yaziRengi={renk.ana}
              etiket="WhatsApp'ı aç"
              onPress={() =>
                void Linking.openURL('whatsapp://').catch(() => kisaMesaj('WhatsApp bu telefonda açılamadı.'))
              }
            />
          </Bolum>
        )}
        <Yazi tur="ikincil">{oylama && !mevcut ? GUN_KARARI_NOTU : BULUSMA_NOTU}</Yazi>
        {mevcut && <Dugme tur="tehlike" etiket="Buluşmayı sil" onPress={() => setSilSorusu(true)} />}
      </View>
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
