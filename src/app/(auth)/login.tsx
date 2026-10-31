import { router } from 'expo-router';
import { Button, Text, View, StyleSheet } from 'react-native';
import { useSession } from '../../lib/session';

export default function Login() {
  const login = useSession((state) => state.login);

  const handleLogin = () => {
    // Development mock only — no real authentication.
    login(3);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in to SaveMode</Text>

      <Text style={styles.description}>
        This is a temporary development login screen.
      </Text>

      <Button title="Continue" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});