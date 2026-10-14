// Sistemden gelen bağlantılar. Paylaşım eklentisi (expo-sharing) uygulamayı
// `rites://expo-sharing` ile açar; Ajandam paylaşılanı alıp yeni kart formunu açar.

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (path.includes('expo-sharing')) return `/ajandam?paylasim=${Date.now()}`;
    return path;
  } catch {
    return '/';
  }
}
