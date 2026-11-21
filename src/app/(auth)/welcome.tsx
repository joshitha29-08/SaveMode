import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme-context';
import { t } from '../../i18n';

export default function Welcome() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.primary }]}>
          {t('app.name')}
        </Text>
        <Text style={[styles.tagline, { color: colors.accent }]}>
          {t('welcome.tagline')}
        </Text>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('welcome.subtitle')}
      </Text>

      <View style={styles.actions}>
        <Link href="/(auth)/signup" asChild>
          <Pressable
            style={StyleSheet.flatten([
              styles.primaryButton,
              { backgroundColor: colors.primary },
            ])}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.create_account')}
          >
            <Text style={[styles.primaryText, { color: colors.onPrimary }]}>
              {t('welcome.create_account')}
            </Text>
          </Pressable>
        </Link>

        <Link href="/(auth)/login" asChild>
          <Pressable
            style={StyleSheet.flatten([
              styles.secondaryButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ])}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.login')}
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>
              {t('welcome.login')}
            </Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.consentContainer}>
        <Text style={[styles.consentText, { color: colors.textMuted }]}>
          {t('welcome.consent.prefix')}{' '}
          <Link
            href="/(public)/terms"
            style={StyleSheet.flatten([styles.link, { color: colors.primary }])}
          >
            {t('welcome.consent.terms')}
          </Link>{' '}
          {t('welcome.consent.and')}{' '}
          <Link
            href="/(public)/privacy"
            style={StyleSheet.flatten([styles.link, { color: colors.primary }])}
          >
            {t('welcome.consent.privacy')}
          </Link>
        </Text>
      </View>

      <Text style={[styles.credit, { color: colors.textMuted }]}>
        {t('welcome.credit')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    gap: 18,
  },
  header: {
    gap: 4,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1.5,
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  consentContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  consentText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  credit: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 'auto',
    paddingBottom: 12,
  },
});
