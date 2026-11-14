import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';
import { darkTagColors, lightTagColors, type TagColorName } from './tag-colors';

export type ThemeMode = 'system' | 'light' | 'dark';
export type TagColors = Record<TagColorName, string>;

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  tagColors: TagColors;
  setMode: (mode: ThemeMode) => void;
  isReady: boolean;
};

const STORAGE_KEY = '@savemode/theme-mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();

  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadThemeMode() {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEY);

        if (
          isActive &&
          (savedMode === 'system' ||
            savedMode === 'light' ||
            savedMode === 'dark')
        ) {
          setModeState(savedMode);
        }
      } catch (error) {
        console.warn('Could not load saved theme mode:', error);
      } finally {
        if (isActive) {
          setIsReady(true);
        }
      }
    }

    loadThemeMode();

    return () => {
      isActive = false;
    };
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);

    AsyncStorage.setItem(STORAGE_KEY, newMode).catch((error) => {
      console.warn('Could not save theme mode:', error);
    });
  }, []);

  const resolvedMode =
    mode === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  const colors = resolvedMode === 'dark' ? darkColors : lightColors;

  const tagColors: TagColors =
    resolvedMode === 'dark' ? darkTagColors : lightTagColors;

  const value = useMemo(
    () => ({
      mode,
      resolvedMode,
      colors,
      tagColors,
      setMode,
      isReady,
    }),
    [mode, resolvedMode, colors, tagColors, setMode, isReady],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
