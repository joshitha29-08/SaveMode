import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

export default function PlaceholderScreen({ title }: { title: string }) {
  const dark = useColorScheme() === 'dark';
  const theme = dark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
});