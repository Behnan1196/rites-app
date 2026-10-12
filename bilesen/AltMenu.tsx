// Alt menü (İS-1): dört sekme, her birinde ikon ve yazı.
// Seçili sekme: renk + kalın yazı + ikonun arkasında 60×32 açık "hap".

import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { olcu, renk } from './tema';
import { Yazi } from './Yazi';

type IkonAdi = ComponentProps<typeof Ionicons>['name'];

const IKONLAR: Record<string, IkonAdi> = {
  giris: 'home-outline',
  ajandam: 'calendar-outline',
  yasam: 'leaf-outline',
  gruplar: 'people-outline',
};

export function AltMenu({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      style={[stiller.cubuk, { paddingBottom: Math.max(insets.bottom, 8) }]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, sira) => {
        const secili = state.index === sira;
        const etiket = descriptors[route.key]?.options.title ?? route.name;
        const yaziRengi = secili ? renk.ana : renk.ikincil;

        const bas = () => {
          const olay = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!secili && !olay.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={bas}
            accessibilityRole="tab"
            accessibilityState={{ selected: secili }}
            accessibilityLabel={etiket}
            style={stiller.sekme}
          >
            <View style={[stiller.hap, secili && { backgroundColor: renk.anaAcik }]}>
              <Ionicons name={IKONLAR[route.name] ?? 'ellipse-outline'} size={26} color={yaziRengi} />
            </View>
            <Yazi
              tur="etiket"
              kalinlik={secili ? 'kalin' : 'normal'}
              renk={yaziRengi}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={stiller.etiket}
            >
              {etiket}
            </Yazi>
          </Pressable>
        );
      })}
    </View>
  );
}

const stiller = StyleSheet.create({
  cubuk: {
    flexDirection: 'row',
    backgroundColor: renk.yuzey,
    borderTopWidth: 1,
    borderTopColor: renk.cizgi,
    paddingTop: 8,
  },
  sekme: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: olcu.altMenuYukseklik,
    gap: 4,
  },
  hap: {
    width: 60,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiket: { fontSize: 15 },
});
