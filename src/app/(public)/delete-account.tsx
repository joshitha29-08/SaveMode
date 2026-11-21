import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function DeleteAccountInfo() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Delete Account' }} />

      <Text style={styles.title}>How to Delete Your WPT 201 - A Account</Text>
      <Text style={styles.subtitle}>
        In compliance with Google Play and privacy regulations, WPT 201 - A
        provides a simple and permanent way to delete your account and all
        associated data.
      </Text>

      <View style={styles.section}>
        <Text style={styles.heading}>Step-by-Step Instructions (In-App)</Text>
        <Text style={styles.step}>
          1. Open the WPT 201 - A app and log in to your account.
        </Text>
        <Text style={styles.step}>
          2. Tap the <Text style={styles.bold}>Settings</Text> tab in the bottom
          navigation bar.
        </Text>
        <Text style={styles.step}>
          3. Scroll to the bottom and select{' '}
          <Text style={styles.bold}>Delete Account</Text>.
        </Text>
        <Text style={styles.step}>
          4. Review the confirmation prompt and confirm permanent deletion.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>What Data is Deleted?</Text>
        <Text style={styles.body}>
          When you delete your account, all of your data is permanently removed
          from our database, including:
        </Text>
        <Text style={styles.bullet}>
          • Your user profile, name, and email address
        </Text>
        <Text style={styles.bullet}>
          • All financial sources (bank accounts, cash, credit cards)
        </Text>
        <Text style={styles.bullet}>
          • All transaction records and expense history
        </Text>
        <Text style={styles.bullet}>
          • All custom categories, tags, and preferences
        </Text>
        <Text style={styles.note}>
          This action is permanent and cannot be undone. We do not retain any
          copies of your financial data after account deletion.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Cannot Access the App?</Text>
        <Text style={styles.body}>
          If you have uninstalled the app or forgot your password, you can reset
          your password using our Forgot Password page, log in below, and
          proceed with deletion. Alternatively, you can email our support team
          with your registered email address to request manual account deletion
          within 30 days.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log in to delete account"
        onPress={() => router.push('/(auth)/login')}
        style={styles.loginButton}
      >
        <Text style={styles.loginButtonText}>Log In to Delete Account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },
  step: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 6,
  },
  bold: {
    fontWeight: '600',
    color: '#111111',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444444',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444444',
    marginLeft: 8,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B42318',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loginButton: {
    backgroundColor: '#2457C5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
