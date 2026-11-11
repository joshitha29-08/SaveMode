import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/colors';
import { NavigationText } from '../constants/navigation';

export default function NotFoundScreen() {
  const router = useRouter();
  const dark = useColorScheme() === 'dark';
  const theme = dark ? Colors.dark : Colors.light;

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        { backgroundColor: theme.background },
      ])}
    >
      <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>
        {NavigationText.pageNotFound}
      </Text>

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
  },
  title: {
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
    color: Colors.onPrimary,
    fontWeight: '600',
  },
});