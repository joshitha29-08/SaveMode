
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import PlaceholderScreen from '../../components/PlaceholderScreen';
import { useSession } from '../../lib/session';

export default function Home() {
  const logout = useSession((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <PlaceholderScreen title="Home">
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
