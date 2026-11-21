import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '../../lib/session';
import { supabase } from '../../lib/supabase';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { useTheme } from '../../theme/theme-context';
import OfflineBanner from '../../components/ui/OfflineBanner';
import { VERIFY_REDIRECT_URL } from '../../constants/urls';
import { t } from '../../i18n';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionExpired?: string }>();
  const { login } = useSession();
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();

  const submitting = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  async function handleLogin() {
    if (submitting.current) return;

    setMessage('');
    setIsUnverified(false);
    setResendMessage('');

    if (!isOnline) {
      setMessage(t('info.offline.login'));
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setMessage(t('err.login.required'));
      return;
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setMessage(t('err.email.invalid'));
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const errorCode = await login(cleanEmail, password);

      if (errorCode) {
        if (errorCode === 'unverified') {
          setIsUnverified(true);
          setMessage(t('err.login.unverified'));
        } else if (errorCode === 'ratelimit') {
          setMessage(t('err.login.ratelimit'));
        } else if (errorCode === 'network') {
          setMessage(t('err.signin.network'));
        } else {
          setMessage(t('err.login.failed'));
        }
        return;
      }

      router.replace('/');
    } catch {
      setMessage(t('err.login.failed'));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    const cleanEmail = email.trim();
    if (!cleanEmail || resending) return;

    setResending(true);
    setResendMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: VERIFY_REDIRECT_URL,
        },
      });

      if (error) {
        setResendMessage(t('err.generic'));
      } else {
        setResendMessage(t('info.resend.sent'));
      }
    } catch {
      setResendMessage(t('err.generic'));
    } finally {
      setResending(false);
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

      <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Log in to your {t('app.name')} account.
      </Text>

      {message || params.sessionExpired === '1' ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.error + '18', borderColor: colors.error },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={[styles.error, { color: colors.error }]}>
            {message || t('err.session.expired')}
          </Text>

          {isUnverified && (
            <Pressable
              onPress={handleResendEmail}
              disabled={resending}
              style={styles.resendBtn}
              accessibilityRole="button"
              accessibilityLabel={t('action.resend_email')}
            >
              {resending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  {t('action.resend_email')}
                </Text>
              )}
            </Pressable>
          )}

          {!!resendMessage && (
            <Text style={[styles.resendMessage, { color: colors.text }]}>
              {resendMessage}
            </Text>
          )}
        </View>
      ) : null}

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
        autoComplete="email"
        maxLength={254}
        accessibilityLabel="Email address"
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        maxLength={64}
        accessibilityLabel="Password"
      />

      <Link
        href="/(auth)/forgot-password"
        style={[styles.link, { color: colors.primary }]}
      >
        Forgot password?
      </Link>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          (!isOnline || loading) && styles.disabled,
        ]}
        onPress={handleLogin}
        disabled={!isOnline || loading}
        accessibilityRole="button"
        accessibilityState={{
          disabled: !isOnline || loading,
          busy: loading,
        }}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {loading ? 'Logging in...' : 'Log in'}
        </Text>
      </Pressable>

      <Text style={[styles.footer, { color: colors.textMuted }]}>
        Don&apos;t have an account?{' '}
        <Link
          href="/(auth)/signup"
          style={[styles.link, { color: colors.primary }]}
        >
          Create account
        </Link>
      </Text>
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
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  resendText: {
    fontWeight: '700',
    fontSize: 14,
  },
  resendMessage: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  link: { fontWeight: '600' },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center' },
});
