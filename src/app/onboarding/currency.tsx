import { useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';

import { default as Text } from '../../components/AppText';
import { useSession } from '../../lib/session';
import { useTheme } from '../../theme/theme-context';
import type { ThemeColors } from '../../theme/colors';

const currencies = [
  { code: 'INR', label: 'Indian Rupee', symbol: '\u20B9' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '\u20AC' },
  { code: 'GBP', label: 'British Pound', symbol: '\u00A3' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '\u00A5' },
  { code: 'AED', label: 'UAE Dirham', symbol: '\u062F.\u0625' },
];

export default function CurrencyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currency = useSession((state) => state.onboardingData.currency);

  const updateOnboardingData = useSession(
    (state) => state.updateOnboardingData,
  );

  const handleContinue = () => {
    router.push('/onboarding/source');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.step}>STEP 2 OF 3</Text>

      <Text style={styles.title}>Choose your currency</Text>

      <Text style={styles.description}>
        Select the currency you want to use for tracking your finances.
      </Text>

      {currencies.map((item) => {
        const selected = currency === item.code;

        return (
          <Pressable
            key={item.code}
            onPress={() => updateOnboardingData({ currency: item.code })}
            style={[styles.option, selected && styles.selectedOption]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={styles.currencyInfo}>
              <Text style={styles.symbol}>{item.symbol}</Text>

              <View>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.label}>{item.label}</Text>
              </View>
            </View>

            <Text style={styles.check}>{selected ? '\u25C9' : '\u25CB'}</Text>
          </Pressable>
        );
      })}

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
      paddingTop: 60,
      paddingBottom: 40,
      maxWidth: 500,
      width: '100%',
      alignSelf: 'center',
    },
    step: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 16,
    },
    title: {
      fontSize: 27,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 23,
      marginBottom: 28,
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
    selectedOption: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.surfaceSecondary,
    },
    currencyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    symbol: {
      fontSize: 24,
      color: colors.primary,
      width: 35,
    },
    code: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    label: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },
    check: {
      color: colors.primary,
      fontSize: 20,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
