// Sistemden gelen bağlantılar. Paylaşım eklentisi artık Rites'ı açmıyor (16 Ekim);
// eski eklenti `rites://expo-sharing` ile açarsa Gelenler'e gidilir. Paylaşılanı
// `PaylasimAlici` alır.

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (path.includes('expo-sharing')) return '/giris/gelenler';
    return path;
  } catch {
    return '/';
  }
}
