// Bildirim sesleri (pilot 19 Ekim). Dosyalar `assets/sesler/` altında, Rites'ın
// kendi ürettiği kısa sesler (telifsiz); uygulamanın içine gömülür
// (expo-notifications `sounds`), bu yüzden yeni ses yeni derleme ister.
// null: telefonun bildirim sesi.

export interface SesSecenegi {
  ad: string | null;
  etiket: string;
}

export const SESLER: readonly SesSecenegi[] = [
  { ad: null, etiket: 'Telefonun sesi' },
  { ad: 'zil', etiket: 'Zil' },
  { ad: 'can', etiket: 'Çan' },
  { ad: 'yumusak', etiket: 'Yumuşak' },
  { ad: 'kus', etiket: 'Kuş' },
  { ad: 'bip', etiket: 'Kısa bip' },
];

/** Bilinmeyen ad (silinmiş ses) telefonun sesine döner. */
export function gecerliSes(ad: string | null | undefined): string | null {
  return ad && SESLER.some((s) => s.ad === ad) ? ad : null;
}

/** Bildirimin `sound` değeri: gömülü dosyanın adı ya da 'default'. */
export function bildirimSesi(ad: string | null | undefined): string {
  const g = gecerliSes(ad);
  return g ? `${g}.wav` : 'default';
}

export function sesEtiketi(ad: string | null | undefined): string {
  const g = gecerliSes(ad);
  return SESLER.find((s) => s.ad === g)?.etiket ?? 'Telefonun sesi';
}
