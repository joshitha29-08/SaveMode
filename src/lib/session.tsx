import { create } from 'zustand';

export const ONBOARDING_DONE = 3;

// DEVELOPMENT MOCK ONLY — replace with real Supabase authentication.

type SessionState = {
  ready: boolean;
  isLoggedIn: boolean;
  onboardingStep: number;
  login: (step: number) => void;
  finishOnboardingStep: () => void;
  logout: () => void;
};

export const useSession = create<SessionState>((set) => ({
  ready: true,
  isLoggedIn: false,
  onboardingStep: 0,

  login: (step) =>
    set({
      isLoggedIn: true,
      onboardingStep: Math.max(0, Math.min(step, ONBOARDING_DONE)),
    }),

  finishOnboardingStep: () =>
    set((state) => ({
      onboardingStep: Math.min(
        state.onboardingStep + 1,
        ONBOARDING_DONE,
      ),
    })),

  logout: () =>
    set({
      isLoggedIn: false,
      onboardingStep: 0,
    }),
}));