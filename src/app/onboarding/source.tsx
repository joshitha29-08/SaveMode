import { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

import { default as Text } from '../../components/AppText';
import { useSession, type SourceType } from '../../lib/session';
import { useTheme } from '../../theme/theme-context';
import type { ThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const sourceTypes: { label: string; value: SourceType }[] = [
  { label: 'Bank Account', value: 'bank' },
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
];

export default function SourceScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const savedData = useSession((state) => state.onboardingData);

  const updateOnboardingData = useSession(
    (state) => state.updateOnboardingData,
  );

  const completeOnboarding = useSession((state) => state.completeOnboarding);

  const [sourceName, setSourceName] = useState(savedData.sourceName);

  const [sourceType, setSourceType] = useState<SourceType>(
    savedData.sourceType === 'cash' || savedData.sourceType === 'credit_card'
      ? savedData.sourceType
      : 'bank',
  );

  const [balance, setBalance] = useState(String(savedData.initialBalance ?? 0));

  const [creditLimit, setCreditLimit] = useState(
    String(savedData.creditLimit ?? 0),
  );

  const [outstanding, setOutstanding] = useState(
    String(savedData.outstanding ?? 0),
  );

  const [error, setError] = useState('');

  const isCreditCard = sourceType === 'credit_card';

  const numericLimit = Number(creditLimit);
  const numericOutstanding = Number(outstanding);

  const availableCredit = numericLimit - numericOutstanding;

  const handleFinish = () => {
    const trimmedName = sourceName.trim();
    const numericBalance = Number(balance);

    if (!trimmedName) {
      setError('Please enter a source name.');
      return;
    }

    if (isCreditCard) {
      if (
        !creditLimit.trim() ||
        !Number.isFinite(numericLimit) ||
        numericLimit <= 0
      ) {
        setError('Please enter a valid credit limit greater than zero.');
        return;
      }

      if (
        !outstanding.trim() ||
        !Number.isFinite(numericOutstanding) ||
        numericOutstanding < 0
      ) {
        setError('Please enter a valid outstanding amount.');
        return;
      }

      if (numericOutstanding > numericLimit) {
        setError('Outstanding amount cannot exceed the credit limit.');
        return;
      }
    } else {
      if (
        !balance.trim() ||
        !Number.isFinite(numericBalance) ||
        numericBalance < 0
      ) {
        setError('Please enter a valid non-negative balance.');
        return;
      }
    }

    updateOnboardingData({
      sourceName: trimmedName,
      sourceType,
      initialBalance: isCreditCard ? 0 : numericBalance,
      creditLimit: isCreditCard ? numericLimit : 0,
      outstanding: isCreditCard ? numericOutstanding : 0,
    });

    completeOnboarding();
    router.replace('/home');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>STEP 3 OF 3</Text>

      <Text style={styles.title}>Add your first source</Text>

      <Text style={styles.description}>
        Add a bank account, cash account or credit card to start tracking your
        finances.
      </Text>

      <Text style={styles.label}>Source name</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. My Savings"
        placeholderTextColor={colors.textMuted}
        value={sourceName}
        onChangeText={(value) => {
          setSourceName(value);
          setError('');
        }}
        maxLength={50}
      />

      <Text style={styles.label}>Source type</Text>

      {sourceTypes.map((item) => {
        const selected = sourceType === item.value;

        return (
          <Pressable
            key={item.value}
            style={[styles.option, selected && styles.selectedOption]}
            onPress={() => {
              setSourceType(item.value);
              setError('');
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={styles.optionText}>{item.label}</Text>

            <Text style={styles.check}>{selected ? '[x]' : '[ ]'}</Text>
          </Pressable>
        );
      })}

      {isCreditCard ? (
        <>
          <Text style={styles.label}>Credit limit ({savedData.currency})</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 50000"
            placeholderTextColor={colors.textMuted}
            value={creditLimit}
            onChangeText={(value) => {
              setCreditLimit(value);
              setError('');
            }}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>
            Outstanding amount ({savedData.currency})
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 10000"
            placeholderTextColor={colors.textMuted}
            value={outstanding}
            onChangeText={(value) => {
              setOutstanding(value);
              setError('');
            }}
            keyboardType="decimal-pad"
          />

          <View style={styles.creditBox}>
            <Text style={styles.creditLabel}>Available credit</Text>

            <Text style={styles.creditValue}>
              {savedData.currency}{' '}
              {Number.isFinite(availableCredit) && availableCredit >= 0
                ? availableCredit.toLocaleString('en-IN')
                : '\u2014'}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>
            Initial balance ({savedData.currency})
          </Text>

          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={balance}
            onChangeText={(value) => {
              setBalance(value);
              setError('');
            }}
            keyboardType="decimal-pad"
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleFinish}>
        <Text style={styles.buttonText}>Finish setup</Text>
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
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 28,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 18,
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 16,
      fontFamily: typography.fontFamily.regular,
    },
    option: {
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    selectedOption: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.surfaceSecondary,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
    },
    check: {
      color: colors.primary,
      fontSize: 18,
    },
    creditBox: {
      marginTop: 20,
      padding: 16,
      borderRadius: 10,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    creditLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    creditValue: {
      color: colors.primary,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 8,
    },
    error: {
      color: colors.error,
      marginTop: 12,
      fontSize: 13,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 28,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
