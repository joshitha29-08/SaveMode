export type AuthGate = {
  loading: boolean;
  loggedIn: boolean;
  onboardingComplete: boolean;
  nextOnboardingStep: string;
};

export function useAuthGate(): AuthGate {
  return {
    loading: false,
    loggedIn: false,
    onboardingComplete: false,
    nextOnboardingStep: 'profile',
  };
}
