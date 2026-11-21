import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { Link } from 'expo-router';
import { useSession } from '../../lib/session';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { useTheme } from '../../theme/theme-context';
import OfflineBanner from '../../components/ui/OfflineBanner';
import { t } from '../../i18n';

export default function ForgotPassword() {
  const { resetPassword } = useSession();
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  async function handleReset() {
    setMessage('');

    if (!isOnline) {
      setMessage(t('info.offline.reset'));
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setMessage(t('err.email.invalid'));
      return;
    }

    setLoading(true);

    try {
      // AUTH-21: The app always shows: "If an account exists for this email, we've sent a reset link."
      await resetPassword(normalizedEmail);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <OfflineBanner visible={!isOnline} />

      <Text style={[styles.title, { color: colors.text }]}>
        Forgot password?
      </Text>

      {message ? (
        <Text
          style={[
            styles.error,
            { backgroundColor: colors.error + '18', color: colors.error },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      ) : null}

      {submitted ? (
        <>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {t('info.reset.sent')}
          </Text>
          <Link
            href="/(auth)/login"
            style={[styles.link, { color: colors.primary }]}
          >
            Back to log in
          </Link>
        </>
      ) : (
        <>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Enter your email address and we&apos;ll send you a password reset
            link.
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            accessibilityLabel="Email address"
          />

          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              (!isOnline || loading) && styles.disabled,
            ]}
            onPress={handleReset}
            disabled={!isOnline || loading}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Text>
          </Pressable>

          <Link
            href="/(auth)/login"
            style={[styles.link, { color: colors.primary }]}
          >
            Back to log in
          </Link>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  error: {
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    fontWeight: '600',
  },
});
