import { useMemo } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import Text from '../../components/AppText';
import { useSession } from '../../lib/session';
import { useTheme, type ThemeMode } from '../../theme/theme-context';
import type { ThemeColors } from '../../theme/colors';

const themeOptions: { label: string; description: string; value: ThemeMode }[] =
  [
    {
      label: 'System',
      description: 'Follow your device appearance',
      value: 'system',
    },
    {
      label: 'Light',
      description: 'Always use light appearance',
      value: 'light',
    },
    { label: 'Dark', description: 'Always use dark appearance', value: 'dark' },
  ];

export default function Settings() {
  const { mode, resolvedMode, colors, setMode, isReady } = useTheme();
  const logout = useSession((state) => state.logout);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.subtitle}>Manage your app preferences.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.description}>
          Choose how SaveMode looks on your device.
        </Text>

        {themeOptions.map((option) => {
          const selected = mode === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setMode(option.value)}
              style={[styles.option, selected && styles.selectedOption]}
            >
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
              <View style={[styles.radio, selected && styles.selectedRadio]}>
                {selected && <View style={styles.radioSelected} />}
              </View>
            </Pressable>
          );
        })}

        <View style={styles.status}>
          <Text style={styles.statusText}>
            {isReady
              ? `Selected: ${mode.charAt(0).toUpperCase() + mode.slice(1)} · Active appearance: ${resolvedMode}`
              : 'Loading saved appearance...'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, gap: 16, padding: 20 },
    heading: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    section: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    option: {
      minHeight: 68,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedOption: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.primary,
    },
    optionText: { flex: 1, marginRight: 12 },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: { fontSize: 13, color: colors.textSecondary },
    radio: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: colors.textMuted,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedRadio: { borderColor: colors.primary },
    radioSelected: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    status: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    statusText: { fontSize: 13, fontWeight: '500', color: colors.text },
    logoutButton: {
      minHeight: 52,
      justifyContent: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: 12,
    },
    logoutText: { fontSize: 16, color: colors.text },
  });
}
