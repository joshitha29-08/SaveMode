import { useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme, ThemeMode } from '../../lib/theme';
import { useSession } from '../../lib/session';
import ConfirmSheet from '../../components/ui/ConfirmSheet';
import { t } from '../../i18n';

export default function Settings() {
  const router = useRouter();
  const { logout } = useSession();

  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const { themeMode, setThemeMode, isDark } = useAppTheme();

  const textColor = isDark ? '#FFFFFF' : '#222222';
  const cardColor = isDark ? '#242424' : '#F2F2F2';

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError('');

    try {
      const error = await logout();

      if (error) {
        setLogoutError(t('err.logout.failed'));
        return;
      }

      setShowLogout(false);
      router.replace('/(auth)/welcome');
    } catch {
      setLogoutError(t('err.logout.failed'));
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#121212' : '#FFFFFF' },
        ]}
      >
        <Text style={[styles.heading, { color: textColor }]}>Settings</Text>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>Theme</Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Choose app appearance
            </Text>
          </View>

          <View style={styles.themeOptions}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={[
                  styles.themeButton,
                  themeMode === mode && styles.selected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: themeMode === mode }}
              >
                <Text
                  style={{
                    color: themeMode === mode ? '#FFFFFF' : textColor,
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>
              Notifications
            </Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Manage app notifications
            </Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>
              Offline Mode
            </Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Enable offline experience
            </Text>
          </View>
          <Switch value={offlineMode} onValueChange={setOfflineMode} />
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>
              About {t('app.name')}
            </Text>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>

        {logoutError ? (
          <Text
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {logoutError}
          </Text>
        ) : null}

        <Pressable
          style={[styles.card, styles.logoutCard]}
          onPress={() => {
            setLogoutError('');
            setShowLogout(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          accessibilityHint="Opens a confirmation before logging out"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Pressable
          style={[styles.card, styles.deleteAccountCard]}
          onPress={() => router.push('/(public)/delete-account')}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          accessibilityHint="Learn how to delete your account and personal data"
        >
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </Pressable>
      </ScrollView>

      <ConfirmSheet
        visible={showLogout}
        title={t('confirm.logout.title')}
        cancelLabel={t('confirm.logout.cancel')}
        confirmLabel={t('confirm.logout.confirm')}
        loading={loggingOut}
        onKeepEditing={() => {
          if (!loggingOut) setShowLogout(false);
        }}
        onDiscard={handleLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    gap: 14,
  },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 4 },
  themeOptions: { flexDirection: 'row', gap: 8 },
  themeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#888888',
  },
  selected: { backgroundColor: '#2457C5' },
  logoutCard: {
    borderWidth: 1,
    borderColor: '#D9534F',
    alignItems: 'center',
  },
  logoutText: {
    color: '#D9534F',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountCard: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    marginTop: 8,
  },
  deleteAccountText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#D92D20',
    marginBottom: 12,
    fontSize: 14,
  },
});
