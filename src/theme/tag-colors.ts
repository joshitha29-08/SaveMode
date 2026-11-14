export const lightTagColors = {
  red: '#FEE2E2',
  orange: '#FFEDD5',
  amber: '#FEF3C7',
  yellow: '#FEF9C3',
  lime: '#ECFCCB',
  green: '#DCFCE7',
  emerald: '#D1FAE5',
  teal: '#CCFBF1',
  cyan: '#CFFAFE',
  sky: '#E0F2FE',
  blue: '#DBEAFE',
  indigo: '#E0E7FF',
  violet: '#EDE9FE',
  purple: '#F3E8FF',
  pink: '#FCE7F3',
  rose: '#FFE4E6',
} as const;

export const darkTagColors = {
  red: '#7F1D1D',
  orange: '#7C2D12',
  amber: '#78350F',
  yellow: '#713F12',
  lime: '#365314',
  green: '#14532D',
  emerald: '#064E3B',
  teal: '#134E4A',
  cyan: '#164E63',
  sky: '#0C4A6E',
  blue: '#1E3A8A',
  indigo: '#312E81',
  violet: '#4C1D95',
  purple: '#581C87',
  pink: '#831843',
  rose: '#881337',
} as const;

export type TagColorName = keyof typeof lightTagColors;
