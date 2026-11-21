import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { useTheme } from '../../theme/theme-context';
import OfflineBanner from '../../components/ui/OfflineBanner';
import { VERIFY_REDIRECT_URL } from '../../constants/urls';
import { t } from '../../i18n';

export default function CheckEmail() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();
  const sendingRef = useRef(false);

  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setTimeout(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  async function resendEmail() {
    if (sendingRef.current || !email || seconds > 0) return;

    setMessage('');

    if (!isOnline) {
      setMessage(t('info.offline.save'));
      return;
    }

    sendingRef.current = true;
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: VERIFY_REDIRECT_URL,
        },
      });

      if (error) {
        setMessage(t('err.generic'));
      } else {
        setMessage(t('info.resend.sent'));
      }
    } catch {
      setMessage(t('err.generic'));
    } finally {
      sendingRef.current = false;
      setLoading(false);
      setSeconds(60);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner visible={!isOnline} />

      <Text style={[styles.icon, { color: colors.primary }]}>✉</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Check your email
      </Text>

      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {t('info.signup.check', { email: email || 'your email' })}
      </Text>

      {!!email && (
        <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
      )}

      {message ? (
        <Text
          style={[styles.feedback, { color: colors.primary }]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      ) : null}

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          (seconds > 0 || loading || !isOnline || !email) && styles.disabled,
        ]}
        onPress={resendEmail}
        disabled={seconds > 0 || loading || !isOnline || !email}
        accessibilityRole="button"
        accessibilityState={{
          disabled: seconds > 0 || loading || !isOnline || !email,
          busy: loading,
        }}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {loading
            ? 'Sending...'
            : seconds > 0
              ? `Resend email (${seconds}s)`
              : 'Resend email'}
        </Text>
      </Pressable>

      <Link
        href="/(auth)/signup"
        style={[styles.link, { color: colors.primary }]}
      >
        Use a different email
      </Link>

      <Link
        href="/(auth)/login"
        style={[styles.link, { color: colors.primary }]}
      >
        Go to log in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 20,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 30, fontWeight: '700' },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: { fontWeight: '700' },
  feedback: {
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  button: {
    padding: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  disabled: { opacity: 0.45 },
  buttonText: { fontWeight: '700', fontSize: 16 },
  link: { fontWeight: '600' },
});
