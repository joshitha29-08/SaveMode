
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../lib/session';

export default function NameScreen() {
  const savedName = useSession(
    (state) => state.onboardingData.name
  );
  const updateOnboardingData = useSession(
    (state) => state.updateOnboardingData
  );

  const [name, setName] = useState(savedName);
  const [error, setError] = useState('');

  const handleContinue = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must contain at least 2 characters.');
      return;
    }

    updateOnboardingData({ name: trimmedName });
    router.push('/onboarding/currency');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.step}>STEP 1 OF 3</Text>
        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.description}>
          Welcome to SaveMode. Let's personalize your experience.
        </Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError('');
          }}
          autoCapitalize="words"
          maxLength={50}
          accessibilityLabel="Your name"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  step: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  description: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  error: {
    color: '#DC2626',
    marginTop: 8,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
