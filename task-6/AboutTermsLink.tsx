import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function AboutTermsLink() {
  return (
    <Pressable onPress={() => router.push('/terms')}>
      <Text>Terms & Conditions</Text>
    </Pressable>
  );
}
