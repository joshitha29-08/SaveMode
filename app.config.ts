import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'WPT 201 - A',
  slug: 'wpt-201-a',
  version: '1.0.0',
  scheme: 'wpt201a',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',

  ios: {
    bundleIdentifier: 'in.whitepixeltechnologies.wpt201a',
    icon: './assets/expo.icon',
    supportsTablet: false,
  },

  android: {
    package: 'in.whitepixeltechnologies.wpt201a',
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'server',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-font',
    'expo-image',
    'expo-status-bar',
    'expo-web-browser',
    ['expo-build-properties', { android: { minSdkVersion: 28 } }],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
