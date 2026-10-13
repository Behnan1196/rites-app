// Gelenler (G-3): Hızlı Not'un altında tek satır. Oturum yoksa görünmez.
// Grup davetleri de burada sayılır (10. görev kararı).

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { davetOzeti } from "@/mantik/gruplar";
import { gelenlerOzeti } from "@/mantik/paylasim";
import { useOturum } from "@/sunucu/oturum";

import { olcu, renk } from "../tema";
import { useGruplar } from "../gruplar/useGruplar";
import { Yazi } from "../Yazi";
import { useGelenler } from "./useGelenler";

export function GelenlerKutusu() {
  const oturum = useOturum();
  const { ben, gelenler } = useGelenler(oturum);
  const { davetler, ad } = useGruplar(oturum);
  if (!ben) return null;
  const davet = davetOzeti(davetler, ad);
  const sayi = gelenler.length + davetler.length;
  const ozet =
    gelenler.length > 0 || !davet
      ? [
          gelenlerOzeti(
            gelenler.map((g) => ({
              kimden: g.kimdenAd,
              baslik: g.paket.baslik,
            })),
          ),
          davet && davetler.length > 0
            ? `${davetler.length} grup daveti`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : davet;
  return (
    <Pressable
      onPress={() => router.push("/giris/gelenler")}
      accessibilityRole="button"
      accessibilityLabel={`Gelenler${sayi ? `, ${sayi} yeni` : ""}. ${ozet}`}
      style={({ pressed }) => [stiller.kutu, pressed && { opacity: 0.75 }]}
    >
      <View style={stiller.simge}>
        <Ionicons name="file-tray-outline" size={22} color={renk.ana} />
      </View>
      <View style={stiller.esnek}>
        <View style={stiller.ust}>
          <Yazi tur="kartBasligi">Gelenler</Yazi>
          {sayi > 0 && (
            <View style={stiller.rozet}>
              <Yazi tur="etiket" kalinlik="kalin" renk={renk.yuzey}>
                {String(sayi)}
              </Yazi>
            </View>
          )}
        </View>
        <Yazi tur="ikincil" numberOfLines={1}>
          {ozet}
        </Yazi>
      </View>
      <Ionicons name="chevron-forward" size={20} color={renk.soluk} />
    </Pressable>
  );
}

const stiller = StyleSheet.create({
  kutu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: olcu.kose.kart,
    paddingHorizontal: olcu.kartIci,
    paddingVertical: 12,
    minHeight: 64,
  },
  simge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.anaAcik,
    alignItems: "center",
    justifyContent: "center",
  },
  esnek: { flex: 1 },
  ust: { flexDirection: "row", alignItems: "center", gap: 8 },
  rozet: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: renk.vurgu,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
});
