import { router } from 'expo-router';
import { Button, Text, View, StyleSheet } from 'react-native';

export default function CurrencyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your currency</Text>

      <Text style={styles.description}>
        Select the currency you want to use in SaveMode.
      </Text>

      <Button
        title="Continue"
        onPress={() => router.push('/onboarding/source')}
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