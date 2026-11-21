import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { useTheme } from '../../theme/theme-context';
import OfflineBanner from '../../components/ui/OfflineBanner';
import { VERIFY_REDIRECT_URL } from '../../constants/urls';
import { t } from '../../i18n';

export default function Signup() {
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();
  const submitting = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const hasLength = password.length >= 8 && password.length <= 64;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // AUTH-03, EC-AUTH-10: spaces are allowed in passwords (\x20 to \x7E)
  const validCharacters = /^[\x20-\x7E]+$/.test(password);

  const validPassword = hasLength && hasLetter && hasNumber && validCharacters;

  async function handleSignup() {
    if (submitting.current) return;

    setMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!isOnline) {
      setMessage(t('info.offline.save'));
      return;
    }

    if (!cleanName || !cleanEmail || !password) {
      setMessage(t('err.required'));
      return;
    }

    if (cleanName.length > 40) {
      setMessage('Name must be 40 characters or fewer.');
      return;
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      setMessage(t('err.email.invalid'));
      return;
    }

    if (!validCharacters) {
      setMessage(t('err.password.chars'));
      return;
    }

    if (!validPassword) {
      setMessage(t('err.password.rule'));
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo: VERIFY_REDIRECT_URL,
        },
      });

      if (error) {
        setMessage(t('err.generic'));
        return;
      }

      router.replace({
        pathname: '/(auth)/check-email',
        params: { email: cleanEmail },
      });
    } catch {
      setMessage(t('err.generic'));
    } finally {
      submitting.current = false;
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
        Create your account
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Start managing your money with {t('app.name')}.
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

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Full name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        maxLength={40}
        accessibilityLabel="Full name"
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
        placeholder="Email address"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        maxLength={254}
        accessibilityLabel="Email address"
      />

      <View
        style={[
          styles.passwordRow,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          maxLength={64}
          accessibilityLabel="Password"
        />

        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Text style={[styles.showText, { color: colors.primary }]}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </Pressable>
      </View>

      <View
        style={[styles.checklist, { backgroundColor: colors.surfaceSecondary }]}
      >
        <Text style={[styles.checkTitle, { color: colors.text }]}>
          Password requirements
        </Text>
        <Text
          style={
            hasLength ? { color: colors.success } : { color: colors.textMuted }
          }
        >
          {hasLength ? '✓' : '○'} 8–64 characters
        </Text>
        <Text
          style={
            hasLetter ? { color: colors.success } : { color: colors.textMuted }
          }
        >
          {hasLetter ? '✓' : '○'} At least one letter
        </Text>
        <Text
          style={
            hasNumber ? { color: colors.success } : { color: colors.textMuted }
          }
        >
          {hasNumber ? '✓' : '○'} At least one number
        </Text>
        <Text
          style={
            validCharacters
              ? { color: colors.success }
              : { color: colors.textMuted }
          }
        >
          {validCharacters ? '✓' : '○'} English letters, numbers and symbols
        </Text>
      </View>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          (loading || !isOnline) && styles.disabled,
        ]}
        onPress={handleSignup}
        disabled={loading || !isOnline}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading || !isOnline, busy: loading }}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {loading ? 'Creating account...' : 'Sign up'}
        </Text>
      </Pressable>

      <Text style={[styles.footer, { color: colors.textMuted }]}>
        Already have an account?{' '}
        <Link
          href="/(auth)/login"
          style={[styles.link, { color: colors.primary }]}
        >
          Log in
        </Link>
      </Text>

      <View style={styles.legal}>
        <Link
          href="/(public)/terms"
          style={[styles.link, { color: colors.primary }]}
        >
          Terms
        </Link>
        <Text style={[styles.footer, { color: colors.textMuted }]}> · </Text>
        <Link
          href="/(public)/privacy"
          style={[styles.link, { color: colors.primary }]}
        >
          Privacy Policy
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { fontSize: 15 },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  showText: { fontWeight: '600' },
  checklist: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  checkTitle: { fontWeight: '700' },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center' },
  link: { fontWeight: '600' },
  legal: { flexDirection: 'row', justifyContent: 'center' },
});
