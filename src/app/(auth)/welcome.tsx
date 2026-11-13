import { View, StyleSheet } from 'react-native';
import PlaceholderScreen from '../../components/PlaceholderScreen';
import PrivacyPolicyLink from '../../components/PrivacyPolicyLink';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}><PlaceholderScreen title="Welcome" /></View>
      <PrivacyPolicyLink />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  placeholder: { flex: 1 },
});
