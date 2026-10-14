import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.avyracards.app',
  appName: 'AvyraCards',
  webDir: 'public',
  server: {
    url: 'https://avyracards.se'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
  // Endast Android. iOS läser aldrig `android`-nyckeln, så iOS-bygget påverkas
  // inte. Plugins som bara gäller Apple (Sign in with Apple, StoreKit-köp,
  // Apple Pay via Stripe-pluginen) byggs inte in i Android-appen — där finns
  // ingen kodväg som anropar dem (se src/lib/native-platform.ts).
  android: {
    // Svart bakom WebView:n så att det inte blinkar vitt vid start.
    backgroundColor: '#000000',
    includePlugins: [
      '@capacitor/app',
      '@capacitor/browser',
      '@capacitor/push-notifications',
      '@capacitor/share',
      '@capacitor/splash-screen',
      '@capacitor-community/fcm',
    ],
  },
};

export default config;
