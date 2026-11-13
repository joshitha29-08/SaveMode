import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '../../constants/colors';
import { NavigationText } from '../../constants/navigation';

export default function Settings() {
  const dark = useColorScheme() === 'dark';
  const theme = dark ? Colors.dark : Colors.light;

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        { backgroundColor: theme.background },
      ])}
    >
      <View style={styles.content}>
        <Text style={StyleSheet.flatten([styles.title, { color: theme.text }])}>
          {NavigationText.settings}
        </Text>

        <View
          style={StyleSheet.flatten([
            styles.row,
            { borderBottomColor: theme.border },
          ])}
        >
          <Text style={StyleSheet.flatten([styles.rowText, { color: theme.text }])}>
            {NavigationText.logOut}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 24,
    gap: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  rowText: {
    fontSize: 16,
  },
});