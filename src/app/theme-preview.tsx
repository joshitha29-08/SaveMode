import { ScrollView, StyleSheet, View } from 'react-native';

import Text from '../components/AppText';

import {
  lightColors,
  darkColors,
  typography,
  spacing,
  radius,
  lightTagColors,
  darkTagColors,
} from '../theme';

import type { ThemeColors, TagColorName } from '../theme';

type ThemePalette = {
  name: string;
  colors: ThemeColors;
  tags: Record<TagColorName, string>;
};

const palettes: ThemePalette[] = [
  {
    name: 'Light Theme',
    colors: lightColors,
    tags: lightTagColors,
  },
  {
    name: 'Dark Theme',
    colors: darkColors,
    tags: darkTagColors,
  },
];

export default function ThemePreviewScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>SaveMode Theme Preview</Text>

      <Text style={styles.description}>
        Preview of all shared design tokens.
      </Text>

      {palettes.map((palette) => (
        <View
          key={palette.name}
          style={[
            styles.palette,
            {
              backgroundColor: palette.colors.background,
              borderColor: palette.colors.border,
            },
          ]}
        >
          <Text style={[styles.paletteTitle, { color: palette.colors.text }]}>
            {palette.name}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.colors.text }]}>
            Main Colours
          </Text>

          {Object.entries(palette.colors).map(([name, value]) => (
            <View key={name} style={styles.tokenRow}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: value,
                    borderColor: palette.colors.border,
                  },
                ]}
              />

              <View style={styles.tokenInfo}>
                <Text style={{ color: palette.colors.text }}>{name}</Text>
                <Text style={{ color: palette.colors.textSecondary }}>
                  {value}
                </Text>
              </View>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: palette.colors.text }]}>
            16 Tag Colours
          </Text>

          <View style={styles.tagGrid}>
            {Object.entries(palette.tags).map(([name, value]) => (
              <View key={name} style={[styles.tag, { backgroundColor: value }]}>
                <Text style={{ color: palette.colors.text }}>{name}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: palette.colors.text }]}>
            Typography
          </Text>

          {Object.entries(typography.fontSize).map(([name, size]) => (
            <Text
              key={name}
              style={{
                color: palette.colors.text,
                fontSize: size,
                lineHeight:
                  typography.lineHeight[
                    name as keyof typeof typography.lineHeight
                  ],
                fontFamily: typography.fontFamily.regular,
                marginBottom: spacing.sm,
              }}
            >
              {name} — SaveMode
            </Text>
          ))}

          <Text style={[styles.sectionTitle, { color: palette.colors.text }]}>
            Font Weights
          </Text>

          {Object.entries(typography.fontFamily).map(([name, font]) => (
            <Text
              key={name}
              style={{
                color: palette.colors.text,
                fontFamily: font,
                fontSize: 16,
                marginBottom: spacing.sm,
              }}
            >
              {name} — Inter
            </Text>
          ))}

          <Text style={[styles.sectionTitle, { color: palette.colors.text }]}>
            Spacing & Radius
          </Text>

          <Text style={{ color: palette.colors.text }}>
            Spacing:{' '}
            {Object.entries(spacing)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ')}
          </Text>

          <Text
            style={{
              color: palette.colors.text,
              marginTop: spacing.sm,
            }}
          >
            Radius:{' '}
            {Object.entries(radius)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  heading: {
    fontSize: 26,
    fontFamily: typography.fontFamily.bold,
    padding: spacing.lg,
    color: lightColors.text,
  },
  description: {
    fontSize: typography.fontSize.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    color: lightColors.textSecondary,
  },
  palette: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.large,
    borderWidth: 1,
  },
  paletteTitle: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  swatch: {
    width: 44,
    height: 36,
    borderRadius: radius.small,
    borderWidth: 1,
  },
  tokenInfo: {
    flex: 1,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.medium,
  },
});
