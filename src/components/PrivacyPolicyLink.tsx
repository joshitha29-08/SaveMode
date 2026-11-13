import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/colors';

export default function PrivacyPolicyLink() {
  return (
    <Link href="/privacy" style={styles.link}>
      <Text style={styles.text}>Privacy Policy</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: 18, marginBottom: 18, alignSelf: 'center' },
  text: { color: Colors.primary, fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
});
