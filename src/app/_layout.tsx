import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useEffect } from 'react';

import { useSession } from '../lib/session';
import { ThemeProvider } from '../theme/theme-context';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const isLoggedIn = useSession((state) => state.isLoggedIn);
  const ready = useSession((state) => state.ready);
  const onboardingStep = useSession((state) => state.onboardingStep);

  useEffect(() => {
    if (!ready || (!fontsLoaded && !fontError)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    if (!isLoggedIn && inTabs) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (isLoggedIn && onboardingStep < 3 && !inOnboarding) {
      router.replace('/onboarding/name');
      return;
    }

    if (isLoggedIn && onboardingStep >= 3 && (inAuthGroup || inOnboarding)) {
      router.replace('/home');
    }
  }, [
    ready,
    fontsLoaded,
    fontError,
    isLoggedIn,
    onboardingStep,
    segments,
    router,
  ]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
