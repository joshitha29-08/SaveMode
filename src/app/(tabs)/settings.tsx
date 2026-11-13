import { View, StyleSheet } from 'react-native';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import PrivacyPolicyLink from '../../components/PrivacyPolicyLink';

export default function Settings() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}><PlaceholderScreen title="Settings" /></View>
      <PrivacyPolicyLink />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  placeholder: { flex: 1 },
});
