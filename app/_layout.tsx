// Kök düzen: yazı tipi, veritabanı, ilk açılışta ad sorusu, profil sayfası.

import {
  AtkinsonHyperlegibleNext_400Regular,
  AtkinsonHyperlegibleNext_600SemiBold,
  AtkinsonHyperlegibleNext_700Bold,
  useFonts,
} from "@expo-google-fonts/atkinson-hyperlegible-next";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdSorusu } from "@/bilesen/AdSorusu";
import { BildirimYoneticisi } from "@/bilesen/BildirimYoneticisi";
import { GirisAyariSaglayici } from "@/bilesen/giris/GirisAyari";
import { OturumSaglayici } from "@/bilesen/oturum/OturumSayfasi";
import { KatmanSaglayici } from "@/bilesen/Katman";
import { BanaVerilenlerSaglayici } from "@/bilesen/listeler/BanaVerilenler";
import { KisaMesajSaglayici } from "@/bilesen/KisaMesaj";
import { ProfilSaglayici } from "@/bilesen/Profil";
import { renk, yaziTipiDurumu } from "@/bilesen/tema";
import { Yazi } from "@/bilesen/Yazi";
import { YedekSorusu } from "@/bilesen/YedekSorusu";
import { useAyar } from "@/veri/kancalar";
import { VeriSaglayici } from "@/veri/VeriSaglayici";

// Yazı tipi ve veri hazır olana kadar açılış ekranı kalsın.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function KokDuzen() {
  const [yuklendi, hata] = useFonts({
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_600SemiBold,
    AtkinsonHyperlegibleNext_700Bold,
  });

  if (!yuklendi && !hata) return null;
  // Yazı tipi yüklenemediyse sistem yazı tipiyle devam edilir.
  yaziTipiDurumu(yuklendi);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <VeriSaglayici bekleme={null} hata={<AcilisHatasi />}>
        <AdKapisi>
          <KisaMesajSaglayici>
            <KatmanSaglayici>
              <OturumSaglayici>
                <BanaVerilenlerSaglayici>
                  <GirisAyariSaglayici>
                    <ProfilSaglayici>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: renk.zemin },
                        }}
                      />
                      <BildirimYoneticisi />
                      <YedekSorusu />
                    </ProfilSaglayici>
                  </GirisAyariSaglayici>
                </BanaVerilenlerSaglayici>
              </OturumSaglayici>
            </KatmanSaglayici>
          </KisaMesajSaglayici>
        </AdKapisi>
      </VeriSaglayici>
    </SafeAreaProvider>
  );
}

/** Ad kaydedilmemişse önce adı sorar; kaydedilince uygulamayı açar. */
function AdKapisi({ children }: { children: ReactNode }) {
  const ad = useAyar("ad");
  if (ad.yukleniyor) return null;
  return (
    <>
      <AcilisEkraniniKapat />
      {ad.veri ? children : <AdSorusu />}
    </>
  );
}

function AcilisEkraniniKapat() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return null;
}

function AcilisHatasi() {
  return (
    <View style={stiller.hata}>
      <AcilisEkraniniKapat />
      <Yazi tur="bolumBasligi" style={stiller.ortala}>
        Bir sorun oldu.
      </Yazi>
      <Yazi tur="ikincil" style={stiller.ortala}>
        Uygulamayı kapatıp yeniden aç.
      </Yazi>
    </View>
  );
}

const stiller = StyleSheet.create({
  hata: {
    flex: 1,
    backgroundColor: renk.zemin,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  ortala: { textAlign: "center" },
});
