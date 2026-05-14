import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astarmarketplace.app',
  appName: 'Astar Marketplace',
  webDir: 'out',
  server: {
    url: 'https://astarmarktetplace.netlify.app',
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
