import { Text, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { typography } from '../theme/typography';

type AppTextProps = TextProps;

function getFontFamily(weight: TextStyle['fontWeight']) {
  switch (weight) {
    case 'bold':
    case '700':
      return typography.fontFamily.bold;

    case '600':
      return typography.fontFamily.semiBold;

    case '500':
      return typography.fontFamily.medium;

    default:
      return typography.fontFamily.regular;
  }
}

export default function AppText({ style, ...props }: AppTextProps) {
  const flattenedStyle = StyleSheet.flatten(style);

  const fontFamily =
    flattenedStyle?.fontFamily ?? getFontFamily(flattenedStyle?.fontWeight);

  return <Text {...props} style={[{ fontFamily }, style]} />;
}
