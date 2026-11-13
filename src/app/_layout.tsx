import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthGate } from '../hooks/useAuthGate';
import { resolveRedirect } from '../lib/resolveRedirect';

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const gate = useAuthGate();
  const redirect = resolveRedirect(pathname, gate);

  useEffect(() => {
    if (!gate.loading && redirect) {
      router.replace(redirect as never);
    }
  }, [gate.loading, redirect, router]);

  if (gate.loading || redirect) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}