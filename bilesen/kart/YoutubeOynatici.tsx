// YouTube videosunu kartın içinde oynatır (pilot 16 Ekim).
//
// YouTube'un gömülü oynatıcısı bir WebView içinde, kendi sayfasıyla açılır.
// YouTube, uygulama içindeki oynatıcılardan bir "Referer" ister (yoksa "Hata 153");
// sayfanın adresi olarak uygulamanın paket kimliğiyle bir https adresi verilir.
// Oynatıcıdaki bağlantılar (YouTube'da izle vb.) YouTube uygulamasında açılır.
// Web'de (deneme ortamı) gömülü oynatıcı yok; dışarıda açan düğme kalır.

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Linking, Platform, StyleSheet, TurboModuleRegistry, View } from 'react-native';
import type { WebViewNavigation, WebViewProps } from 'react-native-webview';

import { olcu, renk } from '../tema';

const SAYFA_ADRESI = `https://${Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.behnanozturkmen.ritespilot'}`;

function sayfa(kimlik: string, baslangic: number): string {
  const ek = new URLSearchParams({ playsinline: '1', rel: '0', modestbranding: '1' });
  if (baslangic > 0) ek.set('start', String(baslangic));
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body>
<iframe src="https://www.youtube.com/embed/${kimlik}?${ek.toString()}" title="YouTube"
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
 referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</body></html>`;
}

// WebView yerel modülü yalnız 1.2.0 ve sonraki derlemelerde var. Eski derlemede
// (ya da Expo Go'da) modül yüklenmeye çalışılırsa uygulama çöker; bu yüzden önce
// varlığı sorulur, yoksa video eskisi gibi dışarıda açılır.
const WebView: ComponentType<WebViewProps> | null = (() => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  if (!TurboModuleRegistry.get('RNCWebViewModule')) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('react-native-webview') as typeof import('react-native-webview')).WebView;
})();

export const gomuluOynatmaVar = WebView !== null;

export function YoutubeOynatici({ kimlik, baslangic = 0 }: { kimlik: string; baslangic?: number }) {
  const gecis = (istek: WebViewNavigation & { isTopFrame?: boolean }) => {
    if (istek.isTopFrame === false) return true; // oynatıcının kendi çerçevesi
    if (istek.url.startsWith(SAYFA_ADRESI) || istek.url.startsWith('about:')) return true;
    void Linking.openURL(istek.url);
    return false;
  };
  if (!WebView) return null;
  return (
    <View style={stiller.kap} accessibilityLabel="YouTube videosu">
      <WebView
        source={{ html: sayfa(kimlik, baslangic), baseUrl: SAYFA_ADRESI }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={gecis}
        style={stiller.web}
      />
    </View>
  );
}

const stiller = StyleSheet.create({
  kap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: olcu.kose.kart,
    overflow: 'hidden',
    backgroundColor: renk.yazi,
  },
  web: { flex: 1, backgroundColor: '#000' },
});
