export const brandColors = {
  primary: '#0F6E56',
  accent: '#854F0B',
} as const;

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  inputBackground: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
  background: '#F7F8F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#EAF3EF',
  text: '#202B27',
  textSecondary: '#747C78',
  textMuted: '#929B96',
  border: '#E0E7E2',
  primary: '#0F6E56',
  onPrimary: '#FFFFFF',
  accent: '#854F0B',
  success: '#16834A',
  warning: '#A16207',
  error: '#C0392B',
  inputBackground: '#FFFFFF',
  overlay: '#00000080',
};

export const darkColors: ThemeColors = {
  background: '#121A17',
  surface: '#1B2722',
  surfaceSecondary: '#293A33',
  text: '#F2F6F3',
  textSecondary: '#B4C1B9',
  textMuted: '#87968D',
  border: '#394740',
  primary: '#65B99C',
  onPrimary: '#10251D',
  accent: '#E8BD70',
  success: '#69C58D',
  warning: '#F2C66D',
  error: '#F08A80',
  inputBackground: '#1B2722',
  overlay: '#00000099',
};
