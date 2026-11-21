import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import AppText from '../components/AppText';
import { useTheme } from '../theme/theme-context';
import { controls, radius, spacing, typography } from '../theme';

const modes = ['system', 'light', 'dark'] as const;

export default function ThemePreviewScreen() {
  const { mode, setMode, colors, tagColors } = useTheme();

  if (!__DEV__) {
    return <Redirect href="/+not-found" />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <AppText style={[styles.heading, { color: colors.text }]}>
        WPT 201 - A Theme Preview
      </AppText>

      <AppText style={[styles.description, { color: colors.textSecondary }]}>
        Preview of shared design tokens in the selected theme.
      </AppText>

      <View style={styles.modeRow}>
        {modes.map((item) => {
          const selected = mode === item;

          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setMode(item)}
              style={[
                styles.modeButton,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <AppText
                style={{ color: selected ? colors.onPrimary : colors.text }}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.panel,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <AppText style={[styles.panelTitle, { color: colors.text }]}>
          Color Tokens
        </AppText>

        {Object.entries(colors).map(([name, value]) => (
          <View key={name} style={styles.tokenRow}>
            <View style={[styles.colorSwatch, { backgroundColor: value }]} />
            <View style={styles.tokenInfo}>
              <AppText style={{ color: colors.text }}>{name}</AppText>
              <AppText style={{ color: colors.textSecondary }}>{value}</AppText>
            </View>
          </View>
        ))}

        <AppText style={[styles.sectionTitle, { color: colors.text }]}>
          16 Tag Colors
        </AppText>

        <View style={styles.tagGrid}>
          {Object.entries(tagColors).map(([name, value]) => (
            <View key={name} style={styles.tagItem}>
              <View style={[styles.tagSwatch, { backgroundColor: value }]} />
              <AppText style={{ color: colors.text }}>{name}</AppText>
            </View>
          ))}
        </View>

        <AppText style={[styles.sectionTitle, { color: colors.text }]}>
          Typography
        </AppText>

        {Object.entries(typography.fontSize).map(([name, size]) => (
          <AppText
            key={name}
            style={{
              color: colors.text,
              fontSize: size,
              lineHeight:
                typography.lineHeight[
                  name as keyof typeof typography.lineHeight
                ],
              marginBottom: spacing.sm,
            }}
          >
            {name} — WPT 201 - A
          </AppText>
        ))}

        <AppText style={[styles.sectionTitle, { color: colors.text }]}>
          Font Weights
        </AppText>

        {Object.entries(typography.fontFamily).map(([name, font]) => (
          <AppText
            key={name}
            style={{
              color: colors.text,
              fontFamily: font,
              fontSize: typography.fontSize.md,
              marginBottom: spacing.sm,
            }}
          >
            {name} — Inter
          </AppText>
        ))}

        <AppText style={[styles.sectionTitle, { color: colors.text }]}>
          Spacing, Radius, and Controls
        </AppText>

        <AppText style={{ color: colors.text }}>
          Spacing:{' '}
          {Object.entries(spacing)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ')}
        </AppText>
        <AppText style={[styles.metric, { color: colors.text }]}>
          Radius:{' '}
          {Object.entries(radius)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ')}
        </AppText>
        <AppText style={[styles.metric, { color: colors.text }]}>
          Minimum tap target: {controls.minTap} px
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  heading: {
    fontSize: typography.fontSize.xxl,
    lineHeight: typography.lineHeight.xxl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.md,
    marginBottom: spacing.lg,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modeButton: {
    flex: 1,
    minHeight: controls.minTap,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.medium,
    paddingHorizontal: spacing.sm,
  },
  panel: {
    borderWidth: 1,
    borderRadius: radius.large,
    padding: spacing.lg,
  },
  panelTitle: {
    fontSize: typography.fontSize.xxl,
    lineHeight: typography.lineHeight.xxl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontFamily: typography.fontFamily.semiBold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorSwatch: {
    width: controls.minTap,
    height: controls.minTap,
    borderRadius: radius.small,
  },
  tokenInfo: {
    flex: 1,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagSwatch: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radius.round,
  },
  metric: {
    marginTop: spacing.sm,
  },
});
