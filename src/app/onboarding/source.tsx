import { router } from 'expo-router';
import { Button, Text, View, StyleSheet } from 'react-native';

export default function SourceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add your first source</Text>

      <Text style={styles.description}>
        You can connect a source to start tracking your finances.
      </Text>

      <Button
        title="Finish setup"
        onPress={() => router.replace('/home')}
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