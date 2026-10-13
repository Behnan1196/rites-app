// E-posta + tek kullanımlık kodla giriş (PR-1). Şifre yok.

import { useEffect, useState } from 'react';

import { epostaDuzelt } from '@/mantik/kisiler';

import { sunucu, sunucuGerekli } from './istemci';

export type Oturum =
  | { durum: 'yukleniyor' }
  | { durum: 'ayarsiz' }
  | { durum: 'yok' }
  | { durum: 'var'; id: string; eposta: string };

/** Oturum durumu; giriş/çıkışta kendiliğinden değişir. */
export function useOturum(): Oturum {
  const [oturum, setOturum] = useState<Oturum>(() => (sunucu ? { durum: 'yukleniyor' } : { durum: 'ayarsiz' }));
  useEffect(() => {
    if (!sunucu) return;
    const cevir = (s: { user: { id: string; email?: string } } | null): Oturum =>
      s ? { durum: 'var', id: s.user.id, eposta: s.user.email ?? '' } : { durum: 'yok' };
    void sunucu.auth.getSession().then(({ data }) => setOturum(cevir(data.session)));
    const { data } = sunucu.auth.onAuthStateChange((_olay, s) => setOturum(cevir(s)));
    return () => data.subscription.unsubscribe();
  }, []);
  return oturum;
}

export type KodSonucu = 'gonderildi' | 'bekle' | 'baglanamiyor';

/** Kod gönderir; Rites'ta yoksa kişi kaydı da açılır. */
export async function kodGonder(eposta: string): Promise<KodSonucu> {
  try {
    const { error } = await sunucuGerekli().auth.signInWithOtp({
      email: epostaDuzelt(eposta),
      options: { shouldCreateUser: true },
    });
    if (!error) return 'gonderildi';
    return error.status === 429 || /rate|seconds/i.test(error.message) ? 'bekle' : 'baglanamiyor';
  } catch {
    return 'baglanamiyor';
  }
}

export type DogrulamaSonucu = 'tamam' | 'yanlis' | 'baglanamiyor';

export async function koduDogrula(eposta: string, kod: string, ad: string): Promise<DogrulamaSonucu> {
  try {
    const s = sunucuGerekli();
    const { data, error } = await s.auth.verifyOtp({ email: epostaDuzelt(eposta), token: kod.trim(), type: 'email' });
    if (error || !data.user) return error && error.status && error.status >= 500 ? 'baglanamiyor' : 'yanlis';
    await adiGuncelle(ad);
    return 'tamam';
  } catch {
    return 'baglanamiyor';
  }
}

/** Kişinin kendi adı (bağlantı isteklerinde karşı tarafa görünür). */
export async function adiGuncelle(ad: string): Promise<void> {
  if (!sunucu) return;
  const { data } = await sunucu.auth.getSession();
  if (!data.session) return;
  await sunucu.from('kullanici').update({ ad }).eq('id', data.session.user.id);
}

export async function cikisYap(): Promise<void> {
  await sunucuGerekli().auth.signOut();
}

/** Sunucudaki kullanıcı, bağlantılar ve Gelenler silinir; ardından çıkış. */
export async function hesabimiSil(): Promise<void> {
  const s = sunucuGerekli();
  const { error } = await s.rpc('hesabimi_sil');
  if (error) throw error;
  await s.auth.signOut({ scope: 'local' });
}

export const KOD_METINLERI = {
  aciklama: 'E-postana tek kullanımlık bir kod gönderelim. Şifre yok.',
  bekle: 'Biraz bekle, bir dakika sonra yeniden dene.',
  yanlis: 'Kod yanlış ya da süresi geçmiş.',
  baglanamiyor: 'Şu an bağlanamıyor. Biraz sonra yeniden dene.',
  kodGeldi: (eposta: string) => `${eposta} adresine gelen kodu yaz.`,
} as const;
