import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.avyracards.app',
  appName: 'AvyraCards',
  webDir: 'public',
  server: {
    url: 'https://avyracards.se'
  }
};

export default config;