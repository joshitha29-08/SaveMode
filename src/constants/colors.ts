import { brandColors, darkColors, lightColors } from '../theme/colors';

export const Colors = {
  ...brandColors,
  onPrimary: lightColors.onPrimary,
  light: {
    background: lightColors.background,
    text: lightColors.text,
    muted: lightColors.textMuted,
    border: lightColors.border,
  },
  dark: {
    background: darkColors.background,
    text: darkColors.text,
    muted: darkColors.textMuted,
    border: darkColors.border,
  },
} as const;
