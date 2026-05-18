import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sa.bewathiq.app',
  appName: 'وسم الثقة',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow self-signed cert during development if needed; production uses cert chain
    allowNavigation: ['bewathiq.com', '*.bewathiq.com'],
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#FFFFFF',
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#FFFFFF',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#c49353',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'native',
      style: 'DARK',
    },
  },
};

export default config;
