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
