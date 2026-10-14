// Paylaşım menüsünde "expo-sharing-extension" yerine "Rites" yazsın diye
// paylaşım eklentisinin görünen adını değiştirir. app.json'da expo-sharing'den ÖNCE
// yazılır: önce yazılan eklentinin değişikliği sonra uygulanır.
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const HEDEF = 'expo-sharing-extension';

function plistiDuzelt(dosya, ad) {
  if (!fs.existsSync(dosya)) return;
  const s = fs.readFileSync(dosya, 'utf8');
  const yeni = s.replace(
    /(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${ad}$2`,
  );
  fs.writeFileSync(dosya, yeni);
}

module.exports = function paylasimAdi(config, { ad = config.name } = {}) {
  config = withXcodeProject(config, (c) => {
    const yapilandirmalar = c.modResults.pbxXCBuildConfigurationSection();
    for (const k of Object.keys(yapilandirmalar)) {
      const ayar = yapilandirmalar[k]?.buildSettings;
      const deger = ayar?.INFOPLIST_KEY_CFBundleDisplayName;
      if (deger === HEDEF || deger === `"${HEDEF}"`) ayar.INFOPLIST_KEY_CFBundleDisplayName = `"${ad}"`;
    }
    return c;
  });
  config = withDangerousMod(config, [
    'ios',
    (c) => {
      plistiDuzelt(path.join(c.modRequest.platformProjectRoot, HEDEF, 'Info.plist'), ad);
      return c;
    },
  ]);
  return config;
};
