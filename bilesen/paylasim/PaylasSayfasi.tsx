// Kartı bağlı bir kişiye göndermek (L-4, `05` §13): bir kopya gider.

import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Blok, Kart } from '@/mantik/kart';
import { BAGLANAMIYOR, kisiBasHarf } from '@/mantik/kisiler';
import { kartPaketi, type KartPaketi } from '@/mantik/paylasim';
import { kartGonder } from '@/sunucu/gelenler';
import { useOturum } from '@/sunucu/oturum';

import { AltSayfa } from '../AltSayfa';
import { useKisiler } from '../gruplar/useKisiler';
import { useKisaMesaj } from '../KisaMesaj';
import { OturumGerekli } from '../oturum/OturumGerekli';
import { useOturumAc } from '../oturum/OturumSayfasi';
import { olcu, renk } from '../tema';
import { Yazi } from '../Yazi';

type Paylasilan =
  | { kart: Kart; bloklar: readonly Pick<Blok, 'tur' | 'ad' | 'metin' | 'birim' | 'dakika' | 'maddeler'>[] }
  /** Kütüphaneden: hazır paket (etiketleriyle). */
  | { paket: KartPaketi };

const paketi = (h: Paylasilan): KartPaketi => ('paket' in h ? h.paket : kartPaketi(h.kart, h.bloklar));

function PaylasSayfasi({ hedef, gorunur, onKapat }: { hedef: Paylasilan; gorunur: boolean; onKapat: () => void }) {
  const oturum = useOturum();
  // Sayfa üst katmanda çizilir; oturum açma işlevi buradan (ekranın bağlamından) verilir.
  const oturumAc = useOturumAc();
  const kisaMesaj = useKisaMesaj();
  // Pilot 19 Ekim: sayfa açılınca Kişilerim sunucuyla eşleşir; yalnız sunucuda bağlı olanlar listelenir.
  const kisiler = useKisiler(oturum);
  const baglilar = kisiler.kisiler.filter((k) => k.durum === 'bagli' && k.kullaniciId);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async (kime: string, ad: string) => {
    if (oturum.durum !== 'var' || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      await kartGonder(oturum.id, kime, paketi(hedef));
      kisaMesaj(`Gönderildi: ${ad}`);
      onKapat();
    } catch (e) {
      console.warn(e);
      // Satır düzeyi yetki: sunucuda bu kişiyle bağlantı yok (silinmiş ya da eski kalmış).
      if ((e as { code?: string } | null)?.code === '42501') {
        kisaMesaj(`${ad} ile bağlantın sunucuda görünmüyor; Kişilerim yenilendi.`);
        void kisiler.yenile();
      } else kisaMesaj(BAGLANAMIYOR);
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <AltSayfa gorunur={gorunur} onKapat={onKapat} baslik="Paylaş" sagKapat="Kapat">
      {oturum.durum !== 'var' ? (
        <OturumGerekli
          oturum={oturum}
          aciklama="Kartı göndermek için önce e-postanla devam et."
          oturumAc={() => {
            onKapat();
            oturumAc();
          }}
        />
      ) : (
        <>
          <Yazi tur="ikincil">
            {`"${paketi(hedef).baslik}" kartının bir kopyası gider; senin kartın değişmez. Fotoğraflar ve dosyalar gitmez.`}
          </Yazi>
          {baglilar.length === 0 ? (
            <Yazi>{"Bağlı kişin yok. Gruplar'dan kişi ekleyebilirsin."}</Yazi>
          ) : (
            <View style={stiller.liste}>
              {baglilar.map((k, i) => (
                <Pressable
                  key={k.id}
                  onPress={() => void gonder(k.kullaniciId!, k.ad)}
                  disabled={gonderiliyor}
                  accessibilityRole="button"
                  accessibilityLabel={`${k.ad} kişisine gönder`}
                  style={({ pressed }) => [stiller.satir, i > 0 && stiller.cizgili, pressed && { opacity: 0.7 }]}
                >
                  <View style={stiller.avatar}>
                    <Yazi kalinlik="kalin" renk={renk.ana}>
                      {kisiBasHarf(k.ad)}
                    </Yazi>
                  </View>
                  <View style={stiller.esnek}>
                    <Yazi kalinlik="kalin">{k.ad}</Yazi>
                    <Yazi tur="ikincil">{k.eposta}</Yazi>
                  </View>
                  <Yazi kalinlik="kalin" renk={renk.ana}>
                    Gönder
                  </Yazi>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </AltSayfa>
  );
}

/** `const paylas = usePaylas(); paylas.ac({ kart, bloklar }); {paylas.oge}` */
export function usePaylas() {
  const [durum, setDurum] = useState<{ no: number; acik: boolean; hedef: Paylasilan } | null>(null);
  const ac = useCallback((hedef: Paylasilan) => setDurum((d) => ({ no: (d?.no ?? 0) + 1, acik: true, hedef })), []);
  const oge = durum ? (
    <PaylasSayfasi
      key={durum.no}
      hedef={durum.hedef}
      gorunur={durum.acik}
      onKapat={() => setDurum((d) => (d ? { ...d, acik: false } : d))}
    />
  ) : null;
  return { ac, oge };
}

const stiller = StyleSheet.create({
  liste: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: 14,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 8 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
});
