// Bu sekmenin alt ekranları (sonraki görevlerde eklenecek) bu yığında açılır.

import { Stack } from 'expo-router/stack';

import { renk } from '@/bilesen/tema';

export default function SekmeYigini() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: renk.zemin } }} />;
}
