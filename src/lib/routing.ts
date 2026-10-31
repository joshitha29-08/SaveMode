
/**
 * Shared routing helpers for authentication and onboarding.
 */

export const ONBOARDING_STEPS = [
  'name',
  'currency',
  'source',
] as const;

export const ONBOARDING_DONE = ONBOARDING_STEPS.length;

export function nextOnboardingHref(step: number): any {
  if (step < 0) {
    return '/onboarding/name';
  }

  if (step >= ONBOARDING_DONE) {
    return '/home';
  }

  return `/onboarding/${ONBOARDING_STEPS[step]}`;
}

export function safeRedirectPath(
  redirect?: string | string[],
): string {
  const path = Array.isArray(redirect) ? redirect[0] : redirect;

  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('://')
  ) {
    return '/home';
  }

  return path;
}

export function currentUrl(
  pathname: string,
  params: Record<string, string | string[] | undefined>,
): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value !== undefined) {
      query.set(key, value);
    }
  });

  const search = query.toString();

  return search ? `${pathname}?${search}` : pathname;
}
