import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useSession } from '../lib/session';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const isLoggedIn = useSession((state) => state.isLoggedIn);
  const ready = useSession((state) => state.ready);
  const onboardingStep = useSession((state) => state.onboardingStep);

  useEffect(() => {
    if (!ready) return;

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
  }, [ready, isLoggedIn, onboardingStep, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}