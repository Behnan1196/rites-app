// Alt menü (İS-1). Başka sekmeye geçince açık alt ekranlar kapanır.
// P-133: Giriş · Ajandam · Koçum · Programlar (eski Yaşam Tarzım; yol `yasam`) · Gruplar.

import { Tabs } from 'expo-router/js-tabs';

import { AltMenu } from '@/bilesen/AltMenu';
import { renk } from '@/bilesen/tema';

export default function SekmeDuzeni() {
  return (
    <Tabs
      tabBar={(ozellikler) => <AltMenu {...ozellikler} />}
      screenOptions={{
        headerShown: false,
        popToTopOnBlur: true,
        sceneStyle: { backgroundColor: renk.zemin },
      }}
    >
      <Tabs.Screen name="giris" options={{ title: 'Giriş' }} />
      <Tabs.Screen name="ajandam" options={{ title: 'Ajandam' }} />
      <Tabs.Screen name="kocum" options={{ title: 'Koçum' }} />
      <Tabs.Screen name="yasam" options={{ title: 'Programlar' }} />
      <Tabs.Screen name="gruplar" options={{ title: 'Gruplar' }} />
    </Tabs>
  );
}
