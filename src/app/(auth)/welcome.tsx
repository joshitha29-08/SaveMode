
import { router } from 'expo-router';
import {
  Button,
  Text,
  View,
  StyleSheet,
} from 'react-native';

import { useSession } from '../../lib/session';

export default function Welcome() {
  const startOnboarding = useSession(
    (state) => state.startOnboarding
  );

  const handleGetStarted = () => {
    startOnboarding();
    router.push('/onboarding/name');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome to SaveMode
      </Text>

      <Text style={styles.description}>
        Manage your finances in one place.
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Log in"
          onPress={handleLogin}
        />

        <View style={styles.spacing} />

        <Button
          title="Get started"
          onPress={handleGetStarted}
        />
      </View>
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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },

  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },

  spacing: {
    height: 16,
  },
});
