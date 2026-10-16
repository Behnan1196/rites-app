// expo-sharing'in iOS paylaşım eklentisini Rites'a uyarlar. app.json'da
// expo-sharing'den ÖNCE yazılır: önce yazılan eklentinin değişikliği sonra uygulanır.
//
// 1. Paylaşım menüsünde "expo-sharing-extension" yerine "Rites" yazar.
// 2. (Pilot 16 Ekim) Paylaşım Rites'ı açmaz: paylaşılan, telefonda biriken listeye
//    eklenir (her paylaşımın başında bir işaret öğesi, bkz. `PAYLASIM_ISARETI`),
//    kısa bir "Gelenler'e eklendi." gösterilir ve paylaşım sayfası kapanır.
//    Rites açılınca `PaylasimAlici` listeyi Gelenler'e yazar. (Eklentinin ana
//    uygulamayı açması Apple'ın desteklemediği bir yoldu; bu da ortadan kalktı.)
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

const DENETLEYICI = 'ShareIntoViewController.swift';
const ESKI = `        saveToUserDefaults(payload)
        openParentApp()`;
const YENI = `        appendToUserDefaults(payload)
        showSavedAndClose()`;
const EK_ISLEVLER = `
  // MARK: - Rites: paylaşılanlar birikir, Rites açılmaz

  private func appendToUserDefaults(_ payload: [SharePayload]) {
    guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
      return
    }
    var all: [SharePayload] = []
    if let data = userDefaults.data(forKey: SHARE_INTO_DEFAULTS_KEY),
       let existing = try? JSONDecoder().decode([SharePayload].self, from: data) {
      all = existing
    }
    let marker = SharePayload(
      type: .text,
      value: "rites-paylasim:\\(Int(Date().timeIntervalSince1970 * 1000))",
      mimeType: "text/plain",
      metadata: nil
    )
    all.append(marker)
    all.append(contentsOf: payload)
    if let encoded = try? JSONEncoder().encode(all) {
      userDefaults.set(encoded, forKey: SHARE_INTO_DEFAULTS_KEY)
    }
  }

  @MainActor
  private func showSavedAndClose() {
    let alert = UIAlertController(title: "Rites", message: "Gelenler'e eklendi.", preferredStyle: .alert)
    present(alert, animated: true)
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
      alert.dismiss(animated: true) {
        self?.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
      }
    }
  }

  // MARK: - Provider Parsing`;

function denetleyiciyiDuzelt(dosya) {
  if (!fs.existsSync(dosya)) throw new Error(`paylasimAdi: ${dosya} bulunamadı`);
  let s = fs.readFileSync(dosya, 'utf8');
  if (s.includes('appendToUserDefaults')) return;
  if (!s.includes(ESKI) || !s.includes('  // MARK: - Provider Parsing')) {
    throw new Error('paylasimAdi: expo-sharing eklentisinin kodu değişmiş; Rites yaması uygulanamadı.');
  }
  s = s.replace(ESKI, YENI).replace('  // MARK: - Provider Parsing', EK_ISLEVLER);
  fs.writeFileSync(dosya, s);
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
      denetleyiciyiDuzelt(path.join(c.modRequest.platformProjectRoot, HEDEF, DENETLEYICI));
      return c;
    },
  ]);
  return config;
};
