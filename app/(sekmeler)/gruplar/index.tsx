// Gruplar: en üstte kapalı "Kişilerim" satırı (P-34: kişi sayısı, seni eklemek
// isteyen varsa sayısı; dokununca Kişilerim ekranı), Seni gruba çağıranlar,
// Gruplarım (bana bekleyen yanıt sayısıyla), + Grup kur (10. görev), Verdiğin kartlar (P-62). Listeler burada
// yok (P-60: Giriş → Listeler → Paylaşılan listeler). Sağ üstte
// Kişilerim simgesi. Ücretsiz sınır göstergesi Ayarlar → Üyelik'te.

import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Dugme } from '@/bilesen/Dugme';
import { EkranKabi } from '@/bilesen/EkranKabi';
import { GrupDavetleri } from '@/bilesen/gruplar/GrupDavetleri';
import { GrupKurSayfasi } from '@/bilesen/gruplar/GrupKurSayfasi';
import { useGrupBekleyenleri } from '@/bilesen/gruplar/useGrupBekleyenleri';
import { useGruplar } from '@/bilesen/gruplar/useGruplar';
import { useKisiler } from '@/bilesen/gruplar/useKisiler';
import { useKartVerme } from '@/bilesen/gruplar/KartVerme';
import { VerilenKartlarListesi, verilenleriSuz } from '@/bilesen/gruplar/VerilenKartlar';
import { OturumGerekli } from '@/bilesen/oturum/OturumGerekli';
import { olcu, renk } from '@/bilesen/tema';
import { Yazi } from '@/bilesen/Yazi';
import { grupBasinaBekleyen } from '@/mantik/grupBekleyenler';
import { grupSayiMetni } from '@/mantik/gruplar';
import { BAGLANAMIYOR } from '@/mantik/kisiler';
import { useOturum } from '@/sunucu/oturum';

const kisileriAc = () => router.push('/gruplar/kisiler');

export default function Gruplar() {
  const oturum = useOturum();
  const { ben, kisiler, istekler, baglanamiyor } = useKisiler(oturum);
  const istekMetni = istekler.length > 0 ? `${istekler.length} kişi seni eklemek istiyor` : '';
  const grup = useGruplar(oturum);
  const bekleyen = useGrupBekleyenleri();
  const bekleyenSayilari = grupBasinaBekleyen(bekleyen.bekleyenler);
  const bekleyenYenile = bekleyen.yenile;
  useFocusEffect(
    useCallback(() => {
      void bekleyenYenile();
    }, [bekleyenYenile]),
  );
  const [grupKurAcik, setGrupKurAcik] = useState(0);
  const kartVerme = useKartVerme();
  const verdiklerim = ben ? verilenleriSuz(kartVerme.verilenler, ben) : [];

  return (
    <EkranKabi
      baslik="Gruplar"
      altBaslik="Kişilerin ve birlikte yürüttüğün gruplar."
    >
      {!ben ? (
        oturum.durum === 'yukleniyor' ? null : (
          <OturumGerekli
            oturum={oturum}
            aciklama="Kişilerine kart göndermek ve gruplarınla birlikte iş yürütmek için e-postanla devam et. Ajandan ve notların yine yalnız bu telefonda kalır."
          />
        )
      ) : (
        <>
          {(baglanamiyor || grup.baglanamiyor) && (
            <Yazi tur="ikincil" renk={renk.hata}>
              {BAGLANAMIYOR}
            </Yazi>
          )}

          <Pressable
            onPress={kisileriAc}
            accessibilityRole="button"
            accessibilityLabel={[`Kişilerim, ${kisiler.length} kişi`, istekMetni].filter(Boolean).join('. ')}
            style={({ pressed }) => [
              stiller.grup,
              istekler.length > 0 && stiller.istekli,
              pressed && { opacity: 0.75 },
            ]}
          >
            <View style={stiller.grupSimge}>
              <Ionicons name="person-outline" size={22} color={renk.ana} />
            </View>
            <View style={stiller.esnek}>
              <Yazi tur="kartBasligi">{`Kişilerim · ${kisiler.length} kişi`}</Yazi>
              {!!istekMetni && (
                <Yazi kalinlik="kalin" renk={renk.vurguYazi}>
                  {istekMetni}
                </Yazi>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
          </Pressable>

          <GrupDavetleri
            davetler={grup.davetler}
            ad={grup.ad}
            onYanit={() => {
              void grup.yenile();
              void bekleyen.yenile();
            }}
          />

          <Yazi tur="bolumBasligi" accessibilityRole="header">
            Gruplarım
          </Yazi>
          {grup.gruplar.length === 0 && !grup.yukleniyor && <Yazi tur="ikincil">Henüz bir grubun yok.</Yazi>}
          {grup.gruplar.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push({ pathname: '/gruplar/grup/[id]', params: { id: g.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${g.ad}, ${grupSayiMetni(g, ben)}`}
              style={({ pressed }) => [stiller.grup, pressed && { opacity: 0.75 }]}
            >
              <View style={stiller.grupSimge}>
                <Ionicons name="people-outline" size={22} color={renk.ana} />
              </View>
              <View style={stiller.esnek}>
                <Yazi tur="kartBasligi">{g.ad}</Yazi>
                <Yazi tur="ikincil">{grupSayiMetni(g, ben)}</Yazi>
                {!!bekleyenSayilari.get(g.id) && (
                  <Yazi
                    kalinlik="kalin"
                    renk={renk.vurguYazi}
                  >{`Senden ${bekleyenSayilari.get(g.id)} yanıt bekleniyor`}</Yazi>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
            </Pressable>
          ))}
          <Dugme tur="ikincil" yaziRengi={renk.ana} etiket="+ Grup kur" onPress={() => setGrupKurAcik((n) => n + 1)} />

          {/* P-62: verdiğim kartların hepsi (grupta da görünür). */}
          {verdiklerim.length > 0 && (
            <>
              <Yazi tur="bolumBasligi" accessibilityRole="header" style={stiller.bolumArasi}>
                Verdiğin kartlar
              </Yazi>
              <VerilenKartlarListesi liste={verdiklerim} ad={grup.ad} />
            </>
          )}

        </>
      )}

      {grupKurAcik > 0 && (
        <GrupKurSayfasi
          key={grupKurAcik}
          onKapat={() => setGrupKurAcik(0)}
          kisiler={kisiler}
          onKuruldu={() => void grup.yenile()}
        />
      )}
    </EkranKabi>
  );
}

const stiller = StyleSheet.create({
  istek: {
    backgroundColor: renk.yuzey,
    borderWidth: 2,
    borderColor: renk.vurgu,
    borderRadius: olcu.kose.kart,
    padding: olcu.kartIci,
    gap: 12,
  },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esnek: { flex: 1 },
  dugmeler: { flexDirection: 'row', gap: 10 },
  baslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liste: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingLeft: olcu.kartIci,
    paddingRight: 4,
  },
  kisi: { paddingVertical: 14 },
  cizgili: { borderTopWidth: 1, borderTopColor: renk.satirCizgi },
  bolumArasi: { marginTop: 8 },
  grup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 72,
  },
  istekli: { borderColor: renk.vurgu, borderWidth: 2 },
  grupSimge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
