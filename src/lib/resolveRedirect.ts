import type { AuthGate } from '../hooks/useAuthGate';

const ALWAYS_OPEN = new Set([
  '/verify',
  '/reset-password',
  '/privacy',
  '/terms',
  '/delete-account',
]);

const GUEST_ONLY = new Set([
  '/welcome',
  '/login',
  '/signup',
  '/forgot-password',
]);

const MAIN_PAGES = new Set([
  '/home',
  '/transactions',
  '/sources',
  '/settings',
]);

function cleanPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

export function resolveRedirect(
  pathname: string,
  gate: AuthGate,
): string | null {
  const path = cleanPath(pathname);

  if (gate.loading || ALWAYS_OPEN.has(path)) {
    return null;
  }

  if (path === '/') {
    if (!gate.loggedIn) return '/welcome';
    if (!gate.onboardingComplete) {
      return `/onboarding/${gate.nextOnboardingStep}`;
    }
    return '/home';
  }

  if (path.startsWith('/onboarding/')) {
    if (!gate.loggedIn) {
      return `/login?next=${encodeURIComponent(path)}`;
    }
    if (gate.onboardingComplete) return '/home';
    return null;
  }

  if (gate.loggedIn && !gate.onboardingComplete) {
    if (
      MAIN_PAGES.has(path) ||
      path === '/login' ||
      path === '/signup'
    ) {
      return `/onboarding/${gate.nextOnboardingStep}`;
    }
    return null;
  }

  if (gate.loggedIn && gate.onboardingComplete && GUEST_ONLY.has(path)) {
    return '/home';
  }

  if (!gate.loggedIn && MAIN_PAGES.has(path)) {
    return `/login?next=${encodeURIComponent(path)}`;
  }

  return null;
}