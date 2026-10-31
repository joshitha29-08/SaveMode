import { router } from 'expo-router';
import { Button, Text, View, StyleSheet } from 'react-native';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SaveMode</Text>

      <Text style={styles.description}>
        Manage your finances in one place.
      </Text>

      <Button
        title="Log in"
        onPress={() => router.push('/(auth)/login')}
      />

      <View style={styles.spacing} />

      <Button
        title="Get started"
        onPress={() => router.push('/onboarding/name')}
      />
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
  spacing: {
    height: 16,
  },
});