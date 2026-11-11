import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import Text from '../../components/AppText';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import { useSession } from '../../lib/session';
import { useTheme } from '../../theme/theme-context';

export default function Home() {
  const logout = useSession((state) => state.logout);
  const { colors } = useTheme();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <PlaceholderScreen title="Home">
      <Pressable
        style={[styles.button, { backgroundColor: colors.error }]}
        onPress={handleLogout}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          Logout
        </Text>
      </Pressable>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
