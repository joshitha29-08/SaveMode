import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_DONE = 3;

// DEVELOPMENT MOCK ONLY.
// Replace with real Supabase authentication later.

type SessionState = {
  ready: boolean;
  isLoggedIn: boolean;
  onboardingStep: number;

  startOnboarding: () => void;
  login: (step?: number) => void;
  finishOnboardingStep: () => void;
  completeOnboarding: () => void;
  logout: () => void;
};

const appStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }

      return window.localStorage.getItem(name);
    }

    return AsyncStorage.getItem(name);
  },

  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.setItem(name, value);
      return;
    }

    await AsyncStorage.setItem(name, value);
  },

  removeItem: async (name: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.removeItem(name);
      return;
    }

    await AsyncStorage.removeItem(name);
  },
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ready: false,
      isLoggedIn: false,
      onboardingStep: 0,

      startOnboarding: () =>
        set({
          isLoggedIn: true,
          onboardingStep: 0,
        }),

      login: (step = ONBOARDING_DONE) =>
        set({
          isLoggedIn: true,
          onboardingStep: Math.max(
            0,
            Math.min(step, ONBOARDING_DONE),
          ),
        }),

      finishOnboardingStep: () =>
        set((state) => ({
          onboardingStep: Math.min(
            state.onboardingStep + 1,
            ONBOARDING_DONE,
          ),
        })),

      completeOnboarding: () =>
        set({
          isLoggedIn: true,
          onboardingStep: ONBOARDING_DONE,
        }),

      logout: () =>
        set({
          isLoggedIn: false,
          onboardingStep: 0,
        }),
    }),
    {
      name: 'savemode-session',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        onboardingStep: state.onboardingStep,
      }),
      onRehydrateStorage: () => () => {
        useSession.setState({ ready: true });
      },
    },
  ),
);
