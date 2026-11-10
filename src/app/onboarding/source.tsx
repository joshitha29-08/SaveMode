
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSession, SourceType } from '../../lib/session';

const sourceTypes: { label: string; value: SourceType }[] = [
  { label: 'Bank Account', value: 'bank' },
  { label: 'Cash', value: 'cash' },
  { label: 'Credit Card', value: 'credit_card' },
];

export default function SourceScreen() {
  const savedData = useSession(
    (state) => state.onboardingData
  );

  const updateOnboardingData = useSession(
    (state) => state.updateOnboardingData
  );

  const completeOnboarding = useSession(
    (state) => state.completeOnboarding
  );

  const [sourceName, setSourceName] = useState(savedData.sourceName);

  const [sourceType, setSourceType] = useState<SourceType>(
    savedData.sourceType === 'cash' ||
    savedData.sourceType === 'credit_card'
      ? savedData.sourceType
      : 'bank'
  );

  const [balance, setBalance] = useState(
    String(savedData.initialBalance ?? 0)
  );

  const [creditLimit, setCreditLimit] = useState(
    String(savedData.creditLimit ?? 0)
  );

  const [outstanding, setOutstanding] = useState(
    String(savedData.outstanding ?? 0)
  );

  const [error, setError] = useState('');

  const isCreditCard = sourceType === 'credit_card';

  const numericLimit = Number(creditLimit);
  const numericOutstanding = Number(outstanding);

  const availableCredit =
    numericLimit - numericOutstanding;

  const handleFinish = () => {
    const trimmedName = sourceName.trim();
    const numericBalance = Number(balance);

    if (!trimmedName) {
      setError('Please enter a source name.');
      return;
    }

    if (isCreditCard) {
      if (
        !creditLimit.trim() ||
        !Number.isFinite(numericLimit) ||
        numericLimit <= 0
      ) {
        setError('Please enter a valid credit limit greater than zero.');
        return;
      }

      if (
        !outstanding.trim() ||
        !Number.isFinite(numericOutstanding) ||
        numericOutstanding < 0
      ) {
        setError('Please enter a valid outstanding amount.');
        return;
      }

      if (numericOutstanding > numericLimit) {
        setError('Outstanding amount cannot exceed the credit limit.');
        return;
      }
    } else {
      if (
        !balance.trim() ||
        !Number.isFinite(numericBalance) ||
        numericBalance < 0
      ) {
        setError('Please enter a valid non-negative balance.');
        return;
      }
    }

    updateOnboardingData({
      sourceName: trimmedName,
      sourceType,
      initialBalance: isCreditCard ? 0 : numericBalance,
      creditLimit: isCreditCard ? numericLimit : 0,
      outstanding: isCreditCard ? numericOutstanding : 0,
    });

    completeOnboarding();
    router.replace('/home');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>STEP 3 OF 3</Text>

      <Text style={styles.title}>Add your first source</Text>

      <Text style={styles.description}>
        Add a bank account, cash account or credit card to start
        tracking your finances.
      </Text>

      <Text style={styles.label}>Source name</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. My Savings"
        value={sourceName}
        onChangeText={(value) => {
          setSourceName(value);
          setError('');
        }}
        maxLength={50}
      />

      <Text style={styles.label}>Source type</Text>

      {sourceTypes.map((item) => {
        const selected = sourceType === item.value;

        return (
          <Pressable
            key={item.value}
            style={[
              styles.option,
              selected && styles.selectedOption,
            ]}
            onPress={() => {
              setSourceType(item.value);
              setError('');
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={styles.optionText}>{item.label}</Text>

            <Text style={styles.check}>
              {selected ? '[x]' : '[ ]'}
            </Text>
          </Pressable>
        );
      })}

      {isCreditCard ? (
        <>
          <Text style={styles.label}>
            Credit limit ({savedData.currency})
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 50000"
            value={creditLimit}
            onChangeText={(value) => {
              setCreditLimit(value);
              setError('');
            }}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>
            Outstanding amount ({savedData.currency})
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 10000"
            value={outstanding}
            onChangeText={(value) => {
              setOutstanding(value);
              setError('');
            }}
            keyboardType="decimal-pad"
          />

          <View style={styles.creditBox}>
            <Text style={styles.creditLabel}>
              Available credit
            </Text>

            <Text style={styles.creditValue}>
              {savedData.currency}{' '}
              {Number.isFinite(availableCredit) && availableCredit >= 0
                ? availableCredit.toLocaleString('en-IN')
                : '—'}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>
            Initial balance ({savedData.currency})
          </Text>

          <TextInput
            style={styles.input}
            placeholder="0"
            value={balance}
            onChangeText={(value) => {
              setBalance(value);
              setError('');
            }}
            keyboardType="decimal-pad"
          />
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.button}
        onPress={handleFinish}
      >
        <Text style={styles.buttonText}>Finish setup</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  step: {
    color: '#0F6E56',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 16,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  description: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  option: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectedOption: {
    borderColor: '#0F6E56',
    borderWidth: 2,
    backgroundColor: '#E8F3EF',
  },
  optionText: {
    fontSize: 15,
    color: '#334155',
  },
  check: {
    color: '#0F6E56',
    fontSize: 18,
  },
  creditBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#E8F3EF',
    borderWidth: 1,
    borderColor: '#0F6E56',
  },
  creditLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  creditValue: {
    color: '#0F6E56',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  error: {
    color: '#DC2626',
    marginTop: 12,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#0F6E56',
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
