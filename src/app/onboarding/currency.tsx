
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSession } from '../../lib/session';

const currencies = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
];

export default function CurrencyScreen() {
  const currency = useSession(
    (state) => state.onboardingData.currency
  );
  const updateOnboardingData = useSession(
    (state) => state.updateOnboardingData
  );

  const handleContinue = () => {
    router.push('/onboarding/source');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.step}>STEP 2 OF 3</Text>
      <Text style={styles.title}>Choose your currency</Text>
      <Text style={styles.description}>
        Select the currency you want to use for tracking your finances.
      </Text>

      {currencies.map((item) => {
        const selected = currency === item.code;

        return (
          <Pressable
            key={item.code}
            onPress={() =>
              updateOnboardingData({ currency: item.code })
            }
            style={[
              styles.option,
              selected && styles.selectedOption,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={styles.currencyInfo}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <View>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.label}>{item.label}</Text>
              </View>
            </View>

            <Text style={styles.check}>
              {selected ? '●' : '○'}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        style={styles.button}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>Continue</Text>
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
    color: '#2563EB',
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
    fontSize: 15,
    color: '#64748B',
    lineHeight: 23,
    marginBottom: 28,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  symbol: {
    fontSize: 24,
    color: '#2563EB',
    width: 35,
  },
  code: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 3,
  },
  check: {
    color: '#2563EB',
    fontSize: 20,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
