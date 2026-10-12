// Dört sekmeli alt menü (İS-1). Başka sekmeye geçince açık alt ekranlar kapanır.

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
      <Tabs.Screen name="yasam" options={{ title: 'Yaşam Tarzım' }} />
      <Tabs.Screen name="gruplar" options={{ title: 'Gruplar' }} />
    </Tabs>
  );
}
