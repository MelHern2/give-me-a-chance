import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.givemeachance',
  appName: 'Give me a chance',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#075e54',
      showSpinner: true,
      spinnerColor: '#25d366'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#075e54'
    }
  },
  android: {
    backgroundColor: '#075e54'
  },
  ios: {
    backgroundColor: '#075e54'
  }
};

export default config;
