import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../lib/session';
import { useTheme } from '../theme/theme-context';
import { NavigationText } from '../constants/navigation';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isLoggedIn } = useSession();

  // D4-NOT-FOUND-CTA: navigate to Welcome when logged-out, Home when logged-in
  const handleGoHome = () => {
    if (isLoggedIn) {
      router.replace('/home');
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {NavigationText.pageNotFound}
      </Text>

      <Pressable
        accessibilityRole="button"
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleGoHome}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {NavigationText.goToHome}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    fontWeight: '600',
  },
});
