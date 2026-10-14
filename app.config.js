// Uygulama ayarları app.json'da. Bu dosya yalnız geliştirme derlemesini ayırır:
// APP_VARIANT=development iken (eas.json → development profili) uygulama
// "Rites Dev" adıyla, ayrı paket kimliği, ayrı adres şeması ve koyu simgeyle
// derlenir; böylece TestFlight'taki Rites ile aynı telefonda yan yana durur.

module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'development') return config;
  return {
    ...config,
    name: 'Rites Dev',
    scheme: 'rites-dev',
    icon: './assets/icon-dev.png',
    ios: { ...config.ios, bundleIdentifier: `${config.ios.bundleIdentifier}.dev` },
    android: { ...config.android, package: `${config.android.package}.dev` },
  };
};
