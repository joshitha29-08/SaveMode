import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { RESET_REDIRECT_URL, VERIFY_REDIRECT_URL } from '../constants/urls';

export const ONBOARDING_DONE = 3;
const ONBOARDING_KEY = 'app-onboarding-step';

type SessionValue = {
  ready: boolean;
  isLoggedIn: boolean;
  user: User | null;
  userName: string;
  currencyCode: string;
  onboardingStep: number;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  finishOnboardingStep: () => void;
  setOnboardingStep: (step: number) => void;
  setUserName: (name: string) => void;
  setCurrencyCode: (code: string) => void;
  refreshUserSettings: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('INR');
  const [onboardingStep, setOnboardingStepState] = useState(0);
  const [ready, setReady] = useState(false);

  const syncUserSettings = useCallback(
    async (userId: string, savedStep: string | null) => {
      try {
        try {
          await supabase.rpc('ensure_user_setup');
        } catch {
          // Continue if RPC is unavailable.
        }

        const { data, error } = await supabase
          .from('user_settings')
          .select('name, currency_code, onboarding_completed')
          .eq('user_id', userId)
          .maybeSingle();

        if (error || !data) {
          return;
        }

        if (data.name) {
          setUserName(data.name);
        }

        if (data.currency_code) {
          setCurrencyCode(data.currency_code);
        }

        if (data.onboarding_completed) {
          setOnboardingStepState(ONBOARDING_DONE);
          await AsyncStorage.setItem(ONBOARDING_KEY, String(ONBOARDING_DONE));
        } else if (!data.name || data.name.trim().length === 0) {
          // Missing name: step 1 (D9)
          setOnboardingStepState(0);
          await AsyncStorage.setItem(ONBOARDING_KEY, '0');
        } else if (!data.currency_code) {
          // Missing currency: step 2 (D9)
          setOnboardingStepState(1);
          await AsyncStorage.setItem(ONBOARDING_KEY, '1');
        } else {
          // Otherwise: step 3 (D9)
          setOnboardingStepState(2);
          await AsyncStorage.setItem(ONBOARDING_KEY, String(2));
        }
      } catch {
        // Keep app functioning with local state.
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user) {
          const metaName = (newSession.user.user_metadata?.full_name ||
            newSession.user.user_metadata?.name ||
            '') as string;

          if (metaName) {
            setUserName((prev) => prev || metaName);
          }

          void AsyncStorage.getItem(ONBOARDING_KEY).then((saved) => {
            if (mounted) {
              void syncUserSettings(newSession.user.id, saved);
            }
          });
        }
      },
    );

    async function initialize() {
      try {
        const [sessionResult, savedStep] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);

        if (!mounted) return;

        const currentSession = sessionResult.error
          ? null
          : sessionResult.data.session;

        setSession(currentSession);

        if (currentSession?.user) {
          const metaName = (currentSession.user.user_metadata?.full_name ||
            currentSession.user.user_metadata?.name ||
            '') as string;

          if (metaName) {
            setUserName(metaName);
          }

          await syncUserSettings(currentSession.user.id, savedStep);
        } else {
          const parsedStep = Number(savedStep);

          setOnboardingStepState(
            Number.isInteger(parsedStep) &&
              parsedStep >= 0 &&
              parsedStep <= ONBOARDING_DONE
              ? parsedStep
              : 0,
          );
        }
      } catch {
        if (mounted) {
          setSession(null);
          setOnboardingStepState(0);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    void initialize();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncUserSettings]);

  const refreshUserSettings = useCallback(async () => {
    if (!session?.user?.id) return;

    const saved = await AsyncStorage.getItem(ONBOARDING_KEY);
    await syncUserSettings(session.user.id, saved);
  }, [session, syncUserSettings]);

  const setOnboardingStep = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, ONBOARDING_DONE));

    setOnboardingStepState(clamped);
    void AsyncStorage.setItem(ONBOARDING_KEY, String(clamped)).catch(() => {});
  }, []);

  const finishOnboardingStep = useCallback(() => {
    setOnboardingStepState((currentStep) => {
      const next = Math.min(currentStep + 1, ONBOARDING_DONE);
      void AsyncStorage.setItem(ONBOARDING_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    setOnboardingStepState(ONBOARDING_DONE);

    await AsyncStorage.setItem(ONBOARDING_KEY, String(ONBOARDING_DONE)).catch(
      () => {},
    );

    if (session?.user?.id) {
      try {
        await supabase
          .from('user_settings')
          .update({ onboarding_completed: true })
          .eq('user_id', session.user.id);
      } catch {
        // Handled.
      }
    }
  }, [session]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string,
    ): Promise<string | null> => {
      try {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: fullName ? { full_name: fullName } : undefined,
            emailRedirectTo: VERIFY_REDIRECT_URL,
          },
        });

        return error?.message ?? null;
      } catch {
        return 'Unable to create your account. Please try again.';
      }
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!error) return null;

        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed') || msg.includes('unverified')) {
          return 'unverified';
        }
        if (
          msg.includes('rate') ||
          msg.includes('too many') ||
          msg.includes('attempts')
        ) {
          return 'ratelimit';
        }
        if (msg.includes('network') || msg.includes('failed to fetch')) {
          return 'network';
        }

        // Default (AUTH-09: wrong email or password always shows 'Email or password is incorrect.')
        return 'invalid_credentials';
      } catch {
        return 'network';
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<string | null> => {
    try {
      const { error } = await supabase.auth.signOut({
        scope: 'local',
      });

      await AsyncStorage.removeItem(ONBOARDING_KEY).catch(() => {});
      setSession(null);
      setUserName('');
      setOnboardingStepState(0);

      return error?.message ?? null;
    } catch {
      return 'Unable to log out. Please try again.';
    }
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<string | null> => {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: RESET_REDIRECT_URL,
          },
        );

        return error?.message ?? null;
      } catch {
        return 'Unable to send the reset link. Please try again.';
      }
    },
    [],
  );

  const updatePassword = useCallback(
    async (password: string): Promise<string | null> => {
      try {
        const { error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          return error.message ?? null;
        }

        // AUTH-23: After password update, sign out all other active sessions
        // so they cannot continue using old credentials on other devices.
        try {
          await supabase.auth.signOut({ scope: 'others' });
        } catch {
          // signOut 'others' is best-effort — do not fail password update if it errors.
        }

        return null;
      } catch {
        return 'Unable to update your password. Please try again.';
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      ready,
      isLoggedIn: !!session,
      user: session?.user ?? null,
      userName,
      currencyCode,
      onboardingStep,
      signUp,
      login,
      logout,
      resetPassword,
      updatePassword,
      finishOnboardingStep,
      setOnboardingStep,
      setUserName,
      setCurrencyCode,
      refreshUserSettings,
      markOnboardingComplete,
    }),
    [
      ready,
      session,
      userName,
      currencyCode,
      onboardingStep,
      signUp,
      login,
      logout,
      resetPassword,
      updatePassword,
      finishOnboardingStep,
      setOnboardingStep,
      refreshUserSettings,
      markOnboardingComplete,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error('useSession must be used inside SessionProvider');
  }

  return value;
}
