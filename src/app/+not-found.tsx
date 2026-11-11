import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { NavigationText } from '../constants/navigation';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{NavigationText.pageNotFound}</Text>
      <Pressable
        accessibilityRole="button"
        style={styles.button}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.buttonText}>{NavigationText.goToHome}</Text>
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
    backgroundColor: Colors.light.background,
  },
  title: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
