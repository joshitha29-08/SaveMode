import { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

import { default as Text } from '../../components/AppText';
import { useSession } from '../../lib/session';
import { useTheme } from '../../theme/theme-context';
import type { ThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function NameScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const savedName = useSession((state) => state.onboardingData.name);

  const updateOnboardingData = useSession(
    (state) => state.updateOnboardingData,
  );

  const [name, setName] = useState(savedName);
  const [error, setError] = useState('');

  const handleContinue = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must contain at least 2 characters.');
      return;
    }

    updateOnboardingData({ name: trimmedName });
    router.push('/onboarding/currency');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.step}>STEP 1 OF 3</Text>

        <Text style={styles.title}>What&apos;s your name?</Text>

        <Text style={styles.description}>
          Welcome to SaveMode. Let&apos;s personalize your experience.
        </Text>

        <Text style={styles.label}>Your name</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError('');
          }}
          autoCapitalize="words"
          maxLength={50}
          accessibilityLabel="Your name"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: 24,
    },
    content: {
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },
    step: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    description: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 32,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      fontSize: 16,
      fontFamily: typography.fontFamily.regular,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    error: {
      color: colors.error,
      marginTop: 8,
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
