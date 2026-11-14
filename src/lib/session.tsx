import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_DONE = 3;

// Keep wallet for compatibility with previously saved data.
export type SourceType = 'bank' | 'cash' | 'wallet' | 'credit_card';

export type OnboardingData = {
  name: string;
  currency: string;
  sourceName: string;
  sourceType: SourceType;
  initialBalance: number;
  creditLimit: number;
  outstanding: number;
};

export type Source = {
  id: string;
  name: string;
  type: SourceType;
  openingBalance: number;
  creditLimit: number;
  outstanding: number;
};

type NewSource = Omit<Source, 'id'>;

export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';

export type Transaction = {
  id: string;
  type: TransactionType;
  date: string;
  description?: string;
  amount: number;
  tag?: string;
  sourceId?: string;
  fromSourceId?: string;
  toSourceId?: string;
};

export type NewTransaction = Omit<Transaction, 'id'>;

type SessionState = {
  ready: boolean;
  isLoggedIn: boolean;
  onboardingStep: number;
  onboardingData: OnboardingData;
  sources: Source[];
  transactions: Transaction[];

  startOnboarding: () => void;
  login: (step?: number) => void;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  finishOnboardingStep: () => void;
  completeOnboarding: () => void;
  logout: () => void;

  addSource: (source: NewSource) => void;
  updateSource: (id: string, data: Partial<NewSource>) => void;
  deleteSource: (id: string) => boolean;
  addTransaction: (transaction: NewTransaction) => void;
};

const initialData: OnboardingData = {
  name: '',
  currency: 'INR',
  sourceName: '',
  sourceType: 'bank',
  initialBalance: 0,
  creditLimit: 0,
  outstanding: 0,
};

const createSource = (data: NewSource): Source => ({
  ...data,
  id: `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

const createTransaction = (data: NewTransaction): Transaction => ({
  ...data,
  id: `transaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

const appStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    }

    return AsyncStorage.getItem(name);
  },

  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(name, value);
      return;
    }

    await AsyncStorage.setItem(name, value);
  },

  removeItem: async (name: string) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(name);
      return;
    }

    await AsyncStorage.removeItem(name);
  },
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ready: false,
      isLoggedIn: false,
      onboardingStep: 0,
      onboardingData: initialData,
      sources: [],
      transactions: [],

      startOnboarding: () =>
        set({
          isLoggedIn: true,
          onboardingStep: 0,
          onboardingData: initialData,
        }),

      login: (step = ONBOARDING_DONE) =>
        set({
          isLoggedIn: true,
          onboardingStep: Math.max(0, Math.min(step, ONBOARDING_DONE)),
        }),

      updateOnboardingData: (data) =>
        set((state) => ({
          onboardingData: {
            ...state.onboardingData,
            ...data,
          },
        })),

      finishOnboardingStep: () =>
        set((state) => ({
          onboardingStep: Math.min(state.onboardingStep + 1, ONBOARDING_DONE),
        })),

      completeOnboarding: () =>
        set((state) => {
          const data = state.onboardingData;
          const sourceName = data.sourceName.trim();

          const alreadyExists = state.sources.some(
            (source) => source.name.toLowerCase() === sourceName.toLowerCase(),
          );

          const sources =
            sourceName && !alreadyExists
              ? [
                  ...state.sources,
                  createSource({
                    name: sourceName,
                    type: data.sourceType,
                    openingBalance:
                      data.sourceType === 'credit_card'
                        ? 0
                        : data.initialBalance,
                    creditLimit:
                      data.sourceType === 'credit_card'
                        ? (data.creditLimit ?? 0)
                        : 0,
                    outstanding:
                      data.sourceType === 'credit_card'
                        ? (data.outstanding ?? 0)
                        : 0,
                  }),
                ]
              : state.sources;

          return {
            isLoggedIn: true,
            onboardingStep: ONBOARDING_DONE,
            sources,
          };
        }),

      logout: () =>
        set({
          isLoggedIn: false,
          onboardingStep: 0,
          onboardingData: initialData,
        }),

      addSource: (source) =>
        set((state) => ({
          sources: [...state.sources, createSource(source)],
        })),

      updateSource: (id, data) =>
        set((state) => ({
          sources: state.sources.map((source) =>
            source.id === id ? { ...source, ...data } : source,
          ),
        })),

      deleteSource: (id) => {
        const state = get();

        const hasTransactions = state.transactions.some(
          (transaction) =>
            transaction.sourceId === id ||
            transaction.fromSourceId === id ||
            transaction.toSourceId === id,
        );

        if (hasTransactions) {
          return false;
        }

        set((currentState) => ({
          sources: currentState.sources.filter((source) => source.id !== id),
        }));

        return true;
      },

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [...state.transactions, createTransaction(transaction)],
        })),
    }),
    {
      name: 'savemode-session',
      storage: createJSONStorage(() => appStorage),

      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        onboardingStep: state.onboardingStep,
        onboardingData: state.onboardingData,
        sources: state.sources,
        transactions: state.transactions,
      }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const migratedSources: Source[] = Array.isArray(state.sources)
          ? state.sources
          : state.onboardingData?.sourceName?.trim()
            ? [
                createSource({
                  name: state.onboardingData.sourceName.trim(),
                  type: state.onboardingData.sourceType,
                  openingBalance: state.onboardingData.initialBalance ?? 0,
                  creditLimit: state.onboardingData.creditLimit ?? 0,
                  outstanding: state.onboardingData.outstanding ?? 0,
                }),
              ]
            : [];

        useSession.setState({
          sources: migratedSources,
          transactions: Array.isArray(state.transactions)
            ? state.transactions
            : [],
          ready: true,
        });
      },
    },
  ),
);
