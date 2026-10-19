// Sunucu istemcisi (Supabase). Adres ve yayımlanabilir anahtar `.env.local`ten
// gelir (depoya girmez). Yoksa uygulama çökmez: çevrimiçi bölümler
// "Şu an bağlanamıyor" der, yerel her şey çalışır (`07`).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const adres = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anahtar = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const sunucu: SupabaseClient | null =
  adres && anahtar
    ? createClient(adres, anahtar, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Oturum yenilemesi yalnız uygulama öndeyken çalışsın.
if (sunucu && Platform.OS !== 'web') {
  AppState.addEventListener('change', (durum) => {
    if (durum === 'active') void sunucu.auth.startAutoRefresh();
    else void sunucu.auth.stopAutoRefresh();
  });
}

export function sunucuGerekli(): SupabaseClient {
  if (!sunucu) throw new Error('Sunucu ayarı yok');
  return sunucu;
}

/**
 * Tablolardaki değişiklikleri dinler (Supabase Realtime; pilot 19 Ekim). Haber
 * yalnız "değişti" demektir: dinleyen kendi yetkisiyle yeniden okur. Art arda
 * gelen haberler birleştirilir (yarım saniye). Dönen işlev aboneliği kapatır.
 */
export function tablolariDinle(ad: string, tablolar: readonly string[], onDegisti: () => void): () => void {
  const s = sunucu;
  if (!s || tablolar.length === 0) return () => undefined;
  let zaman: ReturnType<typeof setTimeout> | null = null;
  const haber = () => {
    if (zaman) clearTimeout(zaman);
    zaman = setTimeout(onDegisti, 500);
  };
  let kanal = s.channel(`${ad}-${Math.random().toString(36).slice(2, 8)}`);
  for (const t of tablolar) kanal = kanal.on('postgres_changes', { event: '*', schema: 'public', table: t }, haber);
  kanal.subscribe();
  return () => {
    if (zaman) clearTimeout(zaman);
    void s.removeChannel(kanal);
  };
}
