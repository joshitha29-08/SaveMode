import { router } from 'expo-router';
import { Button, Text, View, StyleSheet } from 'react-native';

export default function NameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What&apos;s your name?</Text>

      <Text style={styles.description}>
        Welcome to SaveMode. Let&apos;s set up your account.
      </Text>

      <Button
        title="Continue"
        onPress={() => router.push('/onboarding/currency')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
});