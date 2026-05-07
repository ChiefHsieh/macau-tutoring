import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astar.marketplace',
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
