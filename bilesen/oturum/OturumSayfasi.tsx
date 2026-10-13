// "E-postanla devam et" (PR-1): e-posta → tek kullanımlık kod. Profil, Gruplar
// ve Paylaş aynı sayfayı açar. Arayüzde "hesap" sözcüğü geçmez.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { baskaEpostaUyarisi, epostaDuzelt, epostaGecerliMi } from '@/mantik/kisiler';
import { sunucu } from '@/sunucu/istemci';
import { KOD_METINLERI, kodGonder, koduDogrula } from '@/sunucu/oturum';
import { ayarOku, ayarYaz } from '@/veri/ayar';
import { useAyar } from '@/veri/kancalar';
import { telefondakileriSil } from '@/veri/sifirla';
import { useVeri } from '@/veri/VeriSaglayici';

import { AltSayfa } from '../AltSayfa';
import { Dugme } from '../Dugme';
import { GirisAlani } from '../GirisAlani';
import { useKisaMesaj } from '../KisaMesaj';
import { Katman } from '../Katman';
import { OnayKutusu } from '../OnayKutusu';
import { renk } from '../tema';
import { Yazi } from '../Yazi';

const Baglam = createContext<{ oturumAc: () => void } | null>(null);

export function OturumSaglayici({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<{ no: number; acik: boolean }>({ no: 0, acik: false });
  const oturumAc = useCallback(() => setDurum((d) => ({ no: d.no + 1, acik: true })), []);
  const deger = useMemo(() => ({ oturumAc }), [oturumAc]);
  const { kapi, oku } = useVeri();

  // Oturum açıkken telefon o e-postaya bağlanır (önceki sürümde girilmiş olsa da).
  useEffect(() => {
    if (!sunucu) return;
    const bagla = (eposta: string | undefined) => {
      if (!eposta) return;
      void ayarOku(oku, 'bagli_eposta').then((b) => {
        if (!b) void ayarYaz(kapi, 'bagli_eposta', epostaDuzelt(eposta));
      });
    };
    void sunucu.auth.getSession().then(({ data }) => bagla(data.session?.user.email));
    const { data } = sunucu.auth.onAuthStateChange((_o, s) => bagla(s?.user.email));
    return () => data.subscription.unsubscribe();
  }, [kapi, oku]);

  return (
    <Baglam.Provider value={deger}>
      {children}
      {durum.no > 0 && (
        <OturumSayfasi key={durum.no} gorunur={durum.acik} onKapat={() => setDurum((d) => ({ ...d, acik: false }))} />
      )}
    </Baglam.Provider>
  );
}

export function useOturumAc() {
  const d = useContext(Baglam);
  if (!d) throw new Error('useOturumAc, OturumSaglayici içinde kullanılmalı.');
  return d.oturumAc;
}

function OturumSayfasi({ gorunur, onKapat }: { gorunur: boolean; onKapat: () => void }) {
  const kisaMesaj = useKisaMesaj();
  const { kapi } = useVeri();
  const ad = useAyar('ad').veri ?? '';
  const bagli = useAyar('bagli_eposta');
  const [adim, setAdim] = useState<'eposta' | 'kod'>('eposta');
  const [eposta, setEposta] = useState('');
  const [baskasi, setBaskasi] = useState<string | null>(null);
  const [silSorusu, setSilSorusu] = useState(false);
  // Telefonun bağlı e-postası varsa alan onunla dolu gelir.
  const [doldu, setDoldu] = useState(false);
  if (!doldu && !bagli.yukleniyor) {
    setDoldu(true);
    if (bagli.veri) setEposta(bagli.veri);
  }
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [calisiyor, setCalisiyor] = useState(false);

  const gonder = async () => {
    if (!epostaGecerliMi(eposta)) {
      setHata('E-posta adresi eksik ya da hatalı görünüyor.');
      return;
    }
    const uyari = baskaEpostaUyarisi(bagli.veri ?? null, eposta);
    if (uyari) {
      setBaskasi(uyari);
      return;
    }
    setCalisiyor(true);
    const sonuc = await kodGonder(eposta);
    setCalisiyor(false);
    if (sonuc === 'gonderildi') {
      setHata(null);
      setKod('');
      setAdim('kod');
    } else setHata(KOD_METINLERI[sonuc]);
  };

  const dogrula = async () => {
    if (kod.trim().length < 6) {
      setHata(KOD_METINLERI.yanlis);
      return;
    }
    setCalisiyor(true);
    const sonuc = await koduDogrula(eposta, kod, ad);
    setCalisiyor(false);
    if (sonuc === 'tamam') {
      kisaMesaj('Giriş yapıldı');
      onKapat();
    } else setHata(KOD_METINLERI[sonuc]);
  };

  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="E-postanla devam et" solVazgec>
      {adim === 'eposta' ? (
        <View style={stiller.kap}>
          <Yazi tur="ikincil">{KOD_METINLERI.aciklama}</Yazi>
          <GirisAlani
            etiket="E-posta"
            value={eposta}
            onChangeText={(t) => {
              setEposta(t);
              setHata(null);
              setBaskasi(null);
            }}
            placeholder="ornek@eposta.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={() => void gonder()}
            hata={hata}
            autoFocus
          />
          <Dugme etiket="Kod gönder" onPress={() => void gonder()} pasif={calisiyor} />
          {baskasi && (
            <View style={stiller.kap}>
              <Yazi renk={renk.hata} accessibilityLiveRegion="polite">
                {baskasi}
              </Yazi>
              <Dugme tur="tehlike" etiket="Telefondaki verileri sil" onPress={() => setSilSorusu(true)} />
            </View>
          )}
        </View>
      ) : (
        <View style={stiller.kap}>
          <Yazi tur="ikincil">{KOD_METINLERI.kodGeldi(eposta.trim())}</Yazi>
          <GirisAlani
            etiket="Kod"
            value={kod}
            onChangeText={(t) => {
              setKod(t.replace(/\D/g, ''));
              setHata(null);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={() => void dogrula()}
            hata={hata}
            autoFocus
          />
          <Dugme etiket="Devam et" onPress={() => void dogrula()} pasif={calisiyor} />
          <Dugme tur="yazi" etiket="Kodu yeniden gönder" onPress={() => void gonder()} pasif={calisiyor} />
          <Dugme
            tur="yazi"
            etiket="E-postayı değiştir"
            onPress={() => {
              setAdim('eposta');
              setHata(null);
            }}
          />
        </View>
      )}
      {silSorusu && (
        <Katman>
          <OnayKutusu
            baslik="Telefondaki bütün veriler silinsin mi?"
            aciklama="Ajandan, notların, planların, anımsatıcıların ve kişilerin bu telefondan silinir. Yedeğin varsa sonra geri yükleyebilirsin."
            secenekler={[
              {
                etiket: 'Sil',
                tur: 'tehlike',
                onPress: () => {
                  setSilSorusu(false);
                  onKapat();
                  void telefondakileriSil(kapi);
                },
              },
              { etiket: 'Vazgeç', tur: 'yazi', onPress: () => setSilSorusu(false) },
            ]}
          />
        </Katman>
      )}
    </AltSayfa>
  );
}

const stiller = StyleSheet.create({
  kap: { gap: 14 },
});
