import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../theme/theme-context';
import { t } from '../../i18n';

type VerifyStatus = 'loading' | 'verified' | 'failed';

export default function VerifyEmail() {
  const params = useLocalSearchParams<{
    token_hash?: string | string[];
    token?: string | string[];
    type?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();

  const router = useRouter();
  const { colors } = useTheme();
  const verificationPromise = useRef<Promise<boolean> | null>(null);

  const rawTokenHash = params.token_hash ?? params.token;
  const tokenHash = Array.isArray(rawTokenHash)
    ? rawTokenHash[0]
    : rawTokenHash;

  const rawType = params.type;
  const typeParam = Array.isArray(rawType) ? rawType[0] : rawType;

  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function verifyEmail() {
      // 1. Check if an error was passed directly via query params
      const errorParam = Array.isArray(params.error)
        ? params.error[0]
        : params.error;
      const errorDesc = Array.isArray(params.error_description)
        ? params.error_description[0]
        : params.error_description;

      if (errorParam) {
        if (active) {
          setStatus('failed');
          setErrorMessage(
            errorDesc ? decodeURIComponent(errorDesc) : t('info.link.expired'),
          );
        }
        return;
      }

      // 2. Check for tokens or errors in URL hash on Web
      if (typeof window !== 'undefined' && window.location?.hash) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);

        const hashError = hashParams.get('error');
        const hashErrorDesc = hashParams.get('error_description');
        if (hashError) {
          if (active) {
            setStatus('failed');
            setErrorMessage(
              hashErrorDesc
                ? decodeURIComponent(hashErrorDesc)
                : t('info.link.expired'),
            );
          }
          return;
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!sessionError && active) {
              setStatus('verified');
              return;
            }
          } catch {
            // continue to token_hash check
          }
        }
      }

      // 3. If token_hash / token is present, validate type and call verifyOtp
      if (tokenHash) {
        // Validate type URL parameter: only 'email' and 'signup' are valid for this route
        if (typeParam && typeParam !== 'email' && typeParam !== 'signup') {
          if (active) {
            setStatus('failed');
            setErrorMessage(t('info.link.expired'));
          }
          return;
        }

        const otpType: EmailOtpType =
          typeParam === 'email' ? 'email' : 'signup';

        verificationPromise.current ??= (async () => {
          try {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: otpType,
            });

            if (!error) return true;

            // If signup failed and type was not explicit, try 'email' fallback
            if (!typeParam && otpType === 'signup') {
              const { error: fallbackError } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: 'email',
              });
              if (!fallbackError) return true;
              setErrorMessage(fallbackError.message ?? t('info.link.expired'));
              return false;
            }

            // Set Supabase error message
            setErrorMessage(error.message ?? t('info.link.expired'));
            return false;
          } catch (e: any) {
            // Unexpected error handling
            setErrorMessage(e?.message ?? t('verify.unexpected_error'));
            return false;
          }
        })();

        const verified = await verificationPromise.current;

        if (active) {
          setStatus(verified ? 'verified' : 'failed');
          if (!verified) {
            setErrorMessage(t('info.link.expired'));
          }
        }
        return;
      }

      // 4. Check if the user already has an active session
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && active) {
          setStatus('verified');
          return;
        }
      } catch {
        // Fall through to failed
      }

      // 5. No token or active session found
      if (active) {
        setStatus('failed');
        setErrorMessage(t('info.link.expired'));
      }
    }

    void verifyEmail();

    return () => {
      active = false;
    };
  }, [tokenHash, typeParam, params.error, params.error_description]);

  useEffect(() => {
    if (status !== 'verified') return;

    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {status === 'loading' && (
        <ActivityIndicator size="large" color={colors.primary} />
      )}

      <Text
        style={[styles.title, { color: colors.text }]}
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
      >
        {status === 'loading'
          ? t('verify.loading')
          : status === 'verified'
            ? t('info.verified')
            : t('verify.failed')}
      </Text>

      {status === 'failed' && (
        <>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {errorMessage || t('info.link.expired')}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('verify.go_to_login')}
            onPress={() => router.replace('/(auth)/login')}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              {t('verify.go_to_login')}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
